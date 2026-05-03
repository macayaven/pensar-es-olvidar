# Chained MIRAS retention eval — design decision

## Why this exists

The single-shot `promptfoo.miras.yaml` baseline runs each event against an **empty** memory. It catches prompt-obedience regressions (e.g. Gemini ignoring "Return only the new memory. No explanation.") but it does **not** measure the artifact's load-bearing claim:

> Under retention pressure across 12 chained events, MIRAS surfaces the latent theme (`thresholds`) by event 8 — and forgets the early surface detail by event 12.

That can only be measured as a **chained eval** where each call's output becomes the next call's `{{abstract}}`. Promptfoo doesn't natively chain stateful prompts within a test array (its tests run in parallel by default). So we have to pick one of three implementations.

This document is the side-by-side. Pick one and tell me; I'll build it next.

## The three options

### A. Custom JS provider (Promptfoo-native chaining)

A TypeScript file that implements Promptfoo's `ApiProvider` interface, wraps `@google/genai`, and threads memory through `context` between calls. Promptfoo discovers it via `providers: file://./providers/miras-chain.ts`.

```ts
// evals/providers/miras-chain.ts (sketch)
import type { ApiProvider, ProviderResponse, CallApiContextParams } from 'promptfoo';
import { GoogleGenAI } from '@google/genai';

export default class MirasChainProvider implements ApiProvider {
  id = () => 'miras-chain';
  private ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? '' });

  async callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse> {
    const memory = context?.vars?.priorMemory ?? '(nothing yet)';
    const filled = prompt.replace('{{abstract}}', memory as string);
    const r = await this.ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: filled,
    });
    return { output: r.text ?? '' };
  }
}
```

Tests would be authored as **one row per scene** with `priorMemory` threaded by a small driver script that updates the YAML between rows — or, more idiomatically, a single test with a `beforeAll` that runs the chain and stores the 12 outputs in a JSON file the assertions then read.

| Dimension                      | Rating                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complexity                     | **Medium.** ~80 LOC TypeScript + a thin shim to thread state. Need to reason about Promptfoo's parallelism (likely set `concurrency: 1` for this config).                                           |
| Fidelity to real session shape | **High.** Provider runs in-process, same SDK, same retry semantics, same model. Closest thing to what `App.tsx` does at runtime.                                                                    |
| CI without API keys            | **Hard.** Needs Promptfoo's `redteam`-style cache or a mock provider variant gated by env (`MIRAS_PROVIDER=cached` switches to fixture replay). Doable, but adds a second code path that can drift. |
| Best for                       | Demonstrating "I built a Promptfoo extension." Strong portfolio signal for a Promptfoo-fluent reviewer.                                                                                             |

**Risk:** Promptfoo's provider API surface has shifted across minor versions. Pinning `promptfoo@0.103.x` is essential; document in the YAML.

### B. Sidecar Node script (chain runs outside Promptfoo, results are asserted)

A standalone `evals/chain.ts` runs the 12-event chain end-to-end, writes `evals/output/miras-chain.json` with `[{ scene, abstract, tokens, ... }]`, and a separate `promptfoo.miras-chain.yaml` uses `providers: exec://node evals/replay.ts` (or just file-based assertions) to score the recorded outputs.

```ts
// evals/chain.ts (sketch)
import { GoogleGenAI } from '@google/genai';
import events from './fixtures/threshold-events.json';
import { writeFileSync } from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const prompt = readFileSync('./prompts/miras-retention.txt', 'utf8');

let abstract = '(nothing yet)';
const trace = [];
for (const ev of events) {
  const filled = prompt
    .replace('{{abstract}}', abstract)
    .replace('{{event}}', ev.event)
    .replace('{{language}}', 'English');
  const r = await ai.models.generateContent({ model: 'gemini-1.5-flash-latest', contents: filled });
  abstract = r.text!.trim();
  trace.push({ scene: ev.scene, digit: ev.digit, abstract, tokenEstimate: abstract.length / 4 });
}
writeFileSync('./output/miras-chain.json', JSON.stringify(trace, null, 2));
```

Then Promptfoo asserts against the JSON:

```yaml
# promptfoo.miras-chain.yaml — scores the trace, doesn't generate it
tests:
  - description: scene 8 surfaces 'threshold' theme
    vars:
      sceneIndex: 7 # zero-indexed
    assert:
      - type: javascript
        value: |
          const trace = require('./output/miras-chain.json');
          const abstract = trace[context.vars.sceneIndex].abstract.toLowerCase();
          return /threshold|umbral|liminal|edge|boundary/.test(abstract);
```

| Dimension                      | Rating                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complexity                     | **Low.** ~50 LOC plain TypeScript. No Promptfoo provider API to wrestle with. The chain is a `for` loop.                                                                                                                                                                                                |
| Fidelity to real session shape | **High.** Same SDK, same model, same prompt template. Runs end-to-end in one process.                                                                                                                                                                                                                   |
| CI without API keys            | **Easy.** The chain script can read from a recorded fixture (`evals/output/miras-chain.cached.json`) when `MIRAS_USE_FIXTURE=1`. PRs that don't touch prompts replay from cache; the weekly cron runs against live Gemini and updates the fixture if outputs drift acceptably (or fails loudly if not). |
| Best for                       | Engineering legibility. The chain is a script you can read top-to-bottom in 60 seconds. The assertion layer is decoupled and replaceable.                                                                                                                                                               |

**Risk:** Two-file separation means the eval and the chain can drift (e.g. fixture references scene 8 but chain only ran 7 scenes). Easy to add a structural sanity check at the top of the YAML.

### C. Promptfoo `transform` + stateful var

Promptfoo's `transform` hook can mutate the test context after each call, in principle threading memory across rows. A `transform: file://./transforms/thread-memory.js` would store the output in a shared file and pull it back as `{{priorMemory}}` for the next test.

| Dimension                      | Rating                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complexity                     | **High in disguise.** Looks small, but Promptfoo evaluates tests in parallel by default; serial chaining via filesystem state is fighting the framework. Requires `concurrency: 1`, careful file-locking, and tests that read from a state file written by previous rows. |
| Fidelity to real session shape | **Medium.** Each row is a fresh provider call; state lives in the filesystem between rows. The "session" is reconstructed across process boundaries.                                                                                                                      |
| CI without API keys            | **Hard.** Same concerns as A, plus the filesystem state coupling makes caching ambiguous (which run's state are we replaying?).                                                                                                                                           |
| Best for                       | Nothing, in this context. The mechanism exists but it's the wrong tool for ordered chaining.                                                                                                                                                                              |

**Recommendation: skip C.** Documented for completeness — if a reviewer asks "why not transforms," this is the answer.

## Side-by-side

|                       | A · Custom provider                          | B · Sidecar script                    | C · transform                         |
| --------------------- | -------------------------------------------- | ------------------------------------- | ------------------------------------- |
| LOC                   | ~80                                          | ~50                                   | ~30 + framework wrestling             |
| Fits Promptfoo idioms | Yes (provider API)                           | Loose coupling (assertions read JSON) | No (fights parallelism)               |
| Fidelity              | High                                         | High                                  | Medium                                |
| CI without keys       | Hard                                         | **Easy (replay fixture)**             | Hard                                  |
| Failure modes         | Provider API drift across Promptfoo versions | Two-file drift (fixture vs chain)     | Race conditions, state-file ambiguity |
| Demonstrates          | Promptfoo expertise                          | Eng. simplicity + disciplined caching | (don't)                               |

## My recommendation: B

Three reasons:

1. **CI hygiene is non-negotiable.** Carlos's whole stance on this artifact is signal-to-noise discipline (see the GitHub Actions PR description). A weekly LLM eval that sometimes 401s because the secret is missing is the opposite of that. B's fixture-replay path means PRs run deterministically and weekly cron catches drift — exactly the right loop.
2. **The chain is the artifact, not the framework.** A 50-line script that loops over 12 events and writes a trace is something a reader can verify in one sitting. Promptfoo becomes a thin scoring layer that you could swap for `vitest` if you ever wanted to.
3. **Portfolio legibility.** A reviewer at a top AI lab will spend 30 seconds looking at `evals/`. They will read `chain.ts` end-to-end. They will not read a Promptfoo provider class plus its YAML wiring.

A is a good answer if the goal is "show Promptfoo proficiency." B is a better answer if the goal is "show this person can build an LLM eval harness with their eyes closed and ship it without paging me at 2am."

## Open questions for you

1. **Pick A, B, or push back.** B is my recommendation; I'll build whichever you say.
2. **Continuity scoring.** The spec's claim is "MIRAS surfaces `threshold` by scene 8." Do we score that as: (a) regex match on a hand-written keyword set (`threshold|umbral|liminal|edge|boundary`), (b) a small classifier prompt run as a Promptfoo `model-graded` assert, or (c) cosine similarity against a reference vector? My instinct is (a) for the first iteration — keyword regex with the 5 acceptable lemmas — and add (b) as a follow-up if (a) is too brittle.
3. **Forgetting assertion.** The other half of the claim is that early surface detail (scene 1 colors, scene 3 reaction times) is **gone** by scene 12. Should the eval also assert _non_-presence of e.g. `(32%, 41%)` in `trace[11].abstract`? I think yes — forgetting is the soul of MIRAS — but it complicates the keyword set.
4. **Failure semantics.** When the eval fails (continuity didn't surface OR forgetting didn't happen), should it block the PR or just upload the trace artifact and mark the run yellow? My instinct is yellow — LLM eval flakiness shouldn't block engineering PRs — with a hard-fail only for prompt-obedience regressions (the existing single-shot baseline).

Once you pick on (1) and weigh in on (2)–(4), I'll build it as a separate commit on this branch (or a follow-up branch — your call).
