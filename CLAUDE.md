# Project conventions

This file collects load-bearing conventions for the artifact that aren't obvious from reading the code or git log. Keep entries short — one paragraph per convention, with the _why_ attached so a future maintainer (or agent) doesn't unwind a deliberate decision.

## Model pinning policy

V1 uses `gemini-flash-latest` to auto-track Google's current Flash. **Accepted risk:** this alias resolves to preview models (currently `gemini-3-flash-preview`, visible via the `modelVersion` field in API responses). The chained MIRAS eval (`evals/miras-chain.eval.ts`) is the canary — its weekly cron in `.github/workflows/llm-evals.yml` will fail loudly if a future Google update breaks the artifact's continuity or forgetting assertions. **Cron failures are the signal to investigate before iterating on prompts**, not the other way around: don't change prompts in response to a model change without first understanding what changed.

If you decide to pin to a stable explicit version (e.g. `gemini-2.5-flash`), update all five call sites in lockstep:

- `src/geminiService.ts` (rewriteMirasMemory, auditMemory, judgeMemories)
- `evals/promptfoo.miras.yaml` (provider id)
- `evals/miras-chain.eval.ts` (chain runner)

## Eval and merge discipline

These four policies emerged across PR #5 / #4 / #3 and govern how the chained MIRAS eval interacts with merges. They are inter-dependent: the prod/eval split is foundational, and the override and rerun doctrines below only make sense once prod and eval run different models by construction.

### Prod/eval model split

Production (`src/geminiService.ts`) calls a current-frontier model. The chained eval (`evals/miras-chain.eval.ts`) and the Promptfoo suite (`evals/promptfoo.miras.yaml`) pin to a stable Gemini Flash, currently `gemini-2.5-flash`, at temperature 0.3. Rationale: prod surfs the frontier so the canary detects upstream drift in the model the user actually experiences; eval pins to a known-stable Flash so the canary measures _our_ prompt and code regressions rather than Google's rollouts. The eval and prod model identifiers should be different by construction. Document the split with a comment at each call site so a future maintainer doesn't "fix" the divergence.

### Concurrency-scope split

The LLM Evals workflow (`.github/workflows/llm-evals.yml`) sets `cancel-in-progress: true` only when `github.event_name == 'pull_request'`, with `workflow_dispatch` runs scoped into unique groups by `run_id`. Rationale: PR-spam protection on auto-runs is correct (no point evaluating a stale commit). Manual stability-sampling runs and the weekly cron must accumulate, not cancel each other; without the scope, back-to-back manual triggers silently destroy prior samples and you lose the data that justified running them.

### Override-on-mode-3 with issue reference

When the chained eval fails on a structural mode-3 (the model abstracts to a coherent but different theme: parity-family, finality-family, etc.) on a PR whose changes are unrelated to the failure mode (model pin updates, concurrency tweaks, locale-name fixes, retry hardening, model swaps, and similar), the PR may be merged with an override that explicitly references issue #6 in the merge commit. Rationale: the failure is the canary correctly surfacing a pre-existing artifact-level concern, not a regression caused by the PR. Override discipline requires that the issue exists and is referenced; undocumented overrides are the anti-pattern that erodes the canary's signal value. Consecutive overrides do not auto-block, but if drift accelerates, route polish work (issue #6) before further infrastructure work.

### Rerun-vs-resampling distinction

Reruns of probabilistic evals are not always the rerun anti-pattern. The anti-pattern is sampling around a verdict the canary already gave you, e.g. resampling assertion failures until you get a pass. Reruns of _infra_ failures (empty Gemini responses, runner OOM, network blips, anything that prevented the canary from running at all) are legitimate diagnostic moves. The retry hardening committed in PR #3 narrowly retries only on empty Gemini responses, with one retry, ~2s backoff, and visible logging. If both attempts return empty, that is stable-signal territory and counts as a real run, not an infra blip.
