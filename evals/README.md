# Promptfoo evals

These evals exercise the artifact's three Gemini prompts (MIRAS retention, auditor, judge) against fixtures derived from the threshold deck. They are LLM evals — they cost money and time, so they do **not** run on every CI commit. They run when prompts change (gated by `paths:` filter in CI) or on a schedule.

## Running

The evals call Gemini directly. Set your API key in the shell, then:

```bash
export GOOGLE_API_KEY=sk-...           # promptfoo's google provider env var
npm run eval:miras                     # MIRAS retention only
npm run eval                           # all evals (only :miras exists today)
```

Promptfoo opens a local HTML viewer at the end. Pass `--no-table` for plain output.

## What's covered today

**`promptfoo.miras.yaml` — single-shot sanity baseline.** For each of three sample events (scenes 1, 5, 8), runs the canonical MIRAS retention prompt against an empty memory and asserts:

- Output is non-empty and ≤ ~1500 chars (loose token-budget proxy — Gemini's `countTokens` would be cleaner; left as a follow-up).
- Output does NOT begin with prompt-leakage phrases like "Here is the new memory" or "I have rewritten" — the spec prompt explicitly says "Return only the new memory. No explanation." If Gemini ignores that line, the trial rails will look broken.

These three tests catch prompt-obedience regressions, not retention behavior.

## What's NOT covered yet — the meaningful eval

The artifact's load-bearing claim is that MIRAS, under retention pressure across 12 chained events, surfaces the latent theme (`thresholds`) by event 8. That can only be measured as a chained eval where each call's output becomes the next call's `{{abstract}}`. Promptfoo doesn't natively chain stateful prompts within a test — it needs either:

1. A **custom JS provider** that wraps `@google/genai` and threads state across the test array, OR
2. A **separate Node script** that runs the chain and writes its results to a JSON file Promptfoo asserts against, OR
3. Promptfoo's `transform` plus a stateful var (likely brittle — Promptfoo evaluates tests in parallel by default).

Designing this is the next step and needs a few prompt-engineering judgment calls. See the contribution request in the engineering-hygiene PR or the project memory `v1_fix_order_refinements.md` (Su1).

## When prompts move

GAP_ANALYSIS.md S1 will move all three prompts out of `src/i18n/locales/*.json` into `src/prompts.ts`. When that lands:

- Update `prompts:` in this config to `file://../src/prompts.ts:miras_retention` (or whatever export shape S1 picks).
- Delete `evals/prompts/miras-retention.txt`.
- The chained eval should also live as `evals/promptfoo.miras-chain.yaml`.
