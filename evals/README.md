# Promptfoo evals

These evals exercise the artifact's three Gemini prompts (MIRAS retention, auditor, judge) against fixtures derived from the threshold deck. They are LLM evals — they cost money and time, so they do **not** run on every CI commit. They run when prompts change (gated by `paths:` filter in CI) or on a schedule.

## Running

The evals call Gemini directly. Set your API key in the shell, then:

```bash
export GOOGLE_API_KEY=sk-...           # promptfoo's google provider env var
npm run eval:miras                     # promptfoo single-shot baseline
npm run eval:chain                     # chained 12-event retention eval
npm run eval                           # both
```

Promptfoo opens a local HTML viewer at the end of the baseline. Pass `--no-table` for plain output.

## What's covered

### `promptfoo.miras.yaml` — single-shot sanity baseline

For each of three sample events (scenes 1, 5, 8), runs the canonical MIRAS retention prompt against an empty memory and asserts:

- Output is non-empty and ≤ ~1500 chars (loose token-budget proxy — Gemini's `countTokens` would be cleaner; left as a follow-up).
- Output does NOT begin with prompt-leakage phrases like "Here is the new memory" or "I have rewritten" — the spec prompt explicitly says "Return only the new memory. No explanation." If Gemini ignores that line, the trial rails will look broken.

These three tests catch prompt-obedience regressions, not retention behavior.

### `miras-chain.eval.ts` — chained retention eval

Runs the canonical MIRAS prompt over the 12-event threshold deck, threading each output forward as the next call's `{{abstract}}`. Then asserts two properties:

- **Continuity.** A spatial-threshold vocabulary cluster (`threshold`, `liminal`, `boundary`, `opening`, `crossing`, `passage`, `edge`, `portal`, `brink`, `verge`, `in-between`) surfaces in MIRAS's abstract by the back half of the chain — specifically, in **at least one of scenes 7–11** and **retained at scene 12**. This tests the artistic claim that the threshold theme emerges as MIRAS generalizes, without depending on the literal word `threshold` appearing at any specific scene. The cluster deliberately excludes temporal-continuous synonyms (`transition`, `flux`) that would widen acceptance toward impermanence-themed abstractions — the deck is built on spatial liminality (door, tide line, platform, stairwell), and the assertion vocabulary matches that axis.
- **Forgetting.** None of the forbidden surface-detail tokens from events 1–4 — specific positions (`32%`, `41%`, `78%`, `65%`, `15%`, `82%`) and ornamental nouns (`ajar`, `puddle`, `napkin`, `departures`) — survive in the event-12 abstract. The MIRAS prompt explicitly says "Discard: exact times, positions, colors, surface detail." Surviving tokens mean MIRAS is summarizing, not abstracting.

On failure the eval prints the abstracts at scenes 8 and 12, the missing theme word, and any surviving forbidden tokens. Red CI without explanation is hostile; red CI with a diff is teaching.

The fixture lives at `fixtures/threshold-deck-12-events.json`. To extend the eval (additional theme words, more forbidden tokens, alternative decks), edit the fixture; the script is fixture-driven.

#### Replay mode

`MIRAS_USE_FIXTURE=1 npm run eval:chain` replays the trace from `evals/output/miras-chain.trace.json` instead of calling Gemini. The trace file is regenerated on every live run and is gitignored — it is for local iteration on the assertions, not for CI. CI runs the chain live (path-gated to `evals/**`, `src/prompts.ts`, plus the workflow file itself, plus a weekly cron).

See `CHAINED_EVAL_DECISION.md` for why this is a sidecar Node script rather than a Promptfoo provider or a `transform` hack.

## Prompt source of truth

All three prompts live in `src/prompts.ts` as named string exports (`mirasRetention`, `auditorQuery`, `judge`) with `{{token}}` placeholders, plus thin `render*` functions that do `.replace()` interpolation. Promptfoo loads via the function-prompt adapter `mirasRetentionPrompt` exported from the same file (`file://../src/prompts.ts:mirasRetentionPrompt`). The chained eval imports `renderMirasRetention` directly.
