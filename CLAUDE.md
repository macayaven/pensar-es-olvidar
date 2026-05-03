# Project conventions

This file collects load-bearing conventions for the artifact that aren't obvious from reading the code or git log. Keep entries short — one paragraph per convention, with the _why_ attached so a future maintainer (or agent) doesn't unwind a deliberate decision.

## Model pinning policy

V1 uses `gemini-flash-latest` to auto-track Google's current Flash. **Accepted risk:** this alias resolves to preview models (currently `gemini-3-flash-preview`, visible via the `modelVersion` field in API responses). The chained MIRAS eval (`evals/miras-chain.eval.ts`) is the canary — its weekly cron in `.github/workflows/llm-evals.yml` will fail loudly if a future Google update breaks the artifact's continuity or forgetting assertions. **Cron failures are the signal to investigate before iterating on prompts**, not the other way around: don't change prompts in response to a model change without first understanding what changed.

If you decide to pin to a stable explicit version (e.g. `gemini-2.5-flash`), update all five call sites in lockstep:

- `src/geminiService.ts` (rewriteMirasMemory, auditMemory, judgeMemories)
- `evals/promptfoo.miras.yaml` (provider id)
- `evals/miras-chain.eval.ts` (chain runner)
