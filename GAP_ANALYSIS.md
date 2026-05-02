# V0 → V1 Gap Analysis

Comparison of the AI Studio Build output against `pensar-es-olvidar-spec.md`. Organized per `HANDOFF.md` into **Soul** (the artifact's voice and artistic logic), **Structure** (architecture, state machine, engineering hygiene), and **Surface** (typography, motion, polish).

Severity legend: **🔴 critical** (artifact is broken or misrepresenting itself) · **🟡 important** (visible regression from spec) · **🟢 minor** (polish, easy fix). File:line citations are against the V0 commit at the time of writing.

---

## What V0 actually delivers (read this first)

Before listing problems, the things V0 got right and should not be touched:

- Three-act state machine (`prologue → reel → trial → verdict`) is in place and routes cleanly via `AppPhase` in `src/App.tsx:23`.
- Color tokens match spec exactly (`src/index.css:9-12`): `funes-red #B85450`, `miras-blue #6B8CAE`, `bloom-white #FFF8E7`, `background #0A0A0B`.
- Typography uses the spec stack (`EB Garamond`, `JetBrains Mono`, `Inter`) loaded via Google Fonts in `src/index.css:1`.
- The bloom triggers from a per-scene click hit-test in `src/components/Reel.tsx:42-58` and the chime is synthesized via Web Audio in `src/hooks/useAudio.ts`.
- Trial Funes/MIRAS calls *within a round* are parallelized via `Promise.all` (`src/App.tsx:73-76`); rounds are sequenced by a `for` loop (✅ matches spec pacing).
- `react-i18next` is wired with querystring → localStorage → navigator detection (`src/i18n/config.ts:26-29`), so `?lang=es` deep-linking works.
- The verdict screen lays out a side-by-side score composition with the MIRAS digit larger than the Funes digit (`src/components/Verdict.tsx:70-86`), and `html2canvas` exports it as PNG.
- Three soft, low-key buttons on the verdict (Share, Restart) match the spec aesthetic of "no AI-demo glitter." Voice is correctly absent (V1.5).

V0 is roughly the 70% the handoff promised. Everything below is what the remaining 30% looks like.

---

## SOUL — fix first, before anything visual

### S1. 🔴 MIRAS, auditor, and judge prompts are stub-truncated in 3 of 5 locales

`src/i18n/locales/zh.json:6`, `hi.json:6`, `pt.json:6` all contain literal placeholders:

```json
"miras_retention": "You are a memory with a fixed budget of 280 tokens...",
"auditor_query":   "You are interrogating a memory...",
"judge":           "You have witnessed a trial between two memories..."
```

The trailing `...` is not an ellipsis indicating "more elsewhere" — it is the entire prompt. For any user whose language resolves to ZH / HI / PT, MIRAS receives a 13-word stub with no retention rule, no token cap, no language directive. Gemini will produce something fluent and irrelevant. **The artifact is functionally broken in three languages.** Spec §5 explicitly anticipated this: prompts should be in English, with `{{language}}` injected as an instruction parameter and Gemini handling response language — not translated per-locale.

**Fix path:** externalize all prompts to `src/prompts.ts` per the CLAUDE.md rule in HANDOFF, with a single canonical English prompt that takes `{{language}}` as an interpolation. Delete `prompts.*` from every locale JSON. Trial *questions* (`trial.questions.r{1..4}`) can remain localized (they are user-facing).

### S2. 🔴 Funes's memory dump is reduced to 30 characters per event before going to Gemini

`src/App.tsx:71`:

```ts
const funesDump = funesMemory.map(e =>
  `Time ${e.timestamp}: Saw ${e.digit} in scene ${e.scene_id}`
).join(', ');
```

The Funes column on screen displays rich detail (`scene`, `digit`, `pos`, `react`) — see `Reel.tsx:77` — but when Funes is *interrogated*, only `timestamp + digit + scene_id` reach the model. The rich `caption`, `click_xy`, and `reaction_ms` fields stored on the entry (`src/types.ts:12-18`) are dropped on the floor.

The Round-1 head-fake (*"Funes wins vividly with exact RGB, exact click time, perceptual fragment"*) **cannot land**, because the model is never given the perceptual fragment. The Round-4 contrast (*"Verbose atomistic transcript. A man who saw everything and grasped nothing."*) also collapses, because Funes has nothing atomistic to be verbose about. This is the artifact's central head-fake and V0 silently disables it.

**Fix path:** Funes `dump()` must serialize the full `PerceptualEvent` per spec §6, including `rawCaption`. Worth a Vitest unit test asserting structural fidelity.

### S3. 🔴 The Borges quote is shown in translation, not in Spanish, for 4 of 5 locales

Spec §0, §1, §5: *"Borges quote stays Spanish always"* — non-negotiable. The Spanish line is the *typed-out title*, the localized translation is the *subtitle below*.

V0 inverts this. `src/i18n/locales/en.json:3`:

```json
"quote": "To think is to forget differences, to generalize, to abstract."
```

That string is what `Prologue.tsx:14` types out in Garamond as the headline. The Spanish original appears only as a small italic line below, gated on `i18n.language !== 'es'` (`Prologue.tsx:42`). For an EN/ZH/HI/PT user, the artifact opens with Borges in *their* language — the cultural weight evaporates. Borges in Mandarin is just a sentence; in Spanish, in Garamond, slowly typed, it is the thesis.

**Fix path:** `prologue.quote` is a single Spanish constant (not an i18n key). The localized subtitle below is the i18n string. Same applies to `verdict.closing` — V0 already gets this right (closing is `"Pensar es olvidar."` in every locale, with `"To think is to forget."` shown only when `lang !== 'es'`, see `Verdict.tsx:94-97`). Apply the same pattern to the prologue.

### S4. 🟡 The MIRAS retention prompt does not pass `{{language}}` at all

`App.tsx:50-54` calls `rewriteMirasMemory(template, abstract, event)` with no language argument. The EN prompt template (`en.json:33`) does not contain `{{language}}`. Result: MIRAS will respond in whatever language Gemini picks — usually English for English instructions, regardless of UI language. So even when ES users see the Spanish-translated prompt template, the language directive isn't structurally present.

The auditor and judge prompts *do* take `{{language}}` (`auditMemory`, `judgeMemories` in `geminiService.ts`), but it's still injected via per-locale string templates. Once S1 is fixed (single canonical prompt), this becomes one shared mechanism.

### S5. 🟡 Spec-required prompt clauses are missing or weakened

Comparing `en.json:33-35` to spec §7:

| Clause | Spec | V0 |
|---|---|---|
| Auditor "Maximum 80 words." | present | **missing** |
| Judge "single sentence in {language}, **max 15 words**" | present | "<one final sentence in {{language}}>" — no length cap |
| Judge JSON schema includes `total: N` per memory | yes | **missing** (`{"specificity": N, ..., "understanding": N}` only — no total) |
| MIRAS "Respond in {language}." | present | missing (see S4) |

The 80-word and 15-word caps are not stylistic suggestions — they're how the verdict feels devastating instead of merely descriptive. A 50-word verdict is a paragraph; a 12-word verdict is a sentence you remember.

### S6. 🟡 The 280-token MIRAS budget is unenforced at runtime

The prompt asks Gemini to stay under 280 tokens. There is no post-trim, no token count, no truncation, no fallback. Gemini Flash routinely overshoots constraints under pressure. The retention regularizer is the single most important load-bearing constraint in the artifact — V0 trusts the model to enforce it on itself.

**Fix path:** post-trim by token count (use `@google/genai`'s `countTokens` or a `tiktoken` equivalent) after the call returns. If over budget, re-call with `"You overran the 280-token budget. Compress further."` as a follow-up. Promptfoo eval should fail the prompt if the abstract exceeds the cap.

### S7. 🟡 Trial answers are not streamed; they pop in fully formed after a 12s pad

`App.tsx:73-83`:

```ts
const [funesAns, mirasAns] = await Promise.all([ ... ]);
setTrialRounds(prev => [...prev, round]);
await new Promise(r => setTimeout(r, 12000));
```

Both rails complete generation, both render in full simultaneously, then the user stares at completed answers for 12 seconds of dead air before the next round. Spec §2 explicitly: *"both answers stream simultaneously in the two rails"*, and §3 mentions *"typewriter rhythm as answers stream"* as the only sound during the trial.

**Fix path:** switch `geminiService` to streaming responses (`generateContentStream`). Pace round-to-round on stream completion plus a short fixed pad (~2s), not a fixed 12s wall regardless of latency. Add the typewriter sound once streaming is live.

### S8. 🟢 Bloom chime palette doesn't match spec

Spec §3: pentatonic mapping from `1=C3` to `10=A4`. V0 in `src/hooks/useAudio.ts:3-14`: chromatic-ish `1=C4 → 10=E5` — one octave higher and not pentatonic. A correct sequence of clicks is supposed to *form an unintentional melody* — that requires the pentatonic constraint. V0's mapping plays as a near-chromatic scale, which sounds like a tuning piano, not a melody. Replace with the spec's pentatonic intervals.

---

## STRUCTURE — fix before deploying

### St1. 🔴 The Gemini API key is in the browser bundle

`vite.config.ts:11`:

```ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
},
```

Vite inlines this at build time as a literal string in the JS bundle. `src/geminiService.ts:3` then constructs `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` — fully client-side. Anyone visiting the deployed site can extract the key from devtools in three clicks.

Spec §6: *"a Cloud Function proxy for Gemini calls with rate limits per IP. This adds ~150ms latency but prevents key abuse. Worth it for a public I/O submission."* HANDOFF agrees: *"keep this pattern, do not move calls to the browser."*

V0 has `express`, `tsx`, `dotenv` in `package.json` deps but no server file exists, no `dev:server` script, nothing imports Express. Build mode pulled the libraries and stopped.

**Fix path:** either (a) add `server/index.ts` running Express with `/api/gemini/*` POST endpoints that proxy `@google/genai`, plus a `concurrently`-driven `npm run dev` that runs Vite + server, OR (b) switch to a Firebase Cloud Function / Cloud Run sidecar at deploy time and serve the static SPA from Firebase Hosting. Either way, `geminiService.ts` becomes a thin `fetch('/api/...')` client. Must ship before the artifact is publicly linkable.

### St2. 🔴 Japanese is missing entirely

Spec §1, §5: six languages — EN / ES / ZH-Hans / HI / PT-BR / **JA**. V0 ships five: `App.tsx:30-36` and `src/i18n/config.ts:5-9` have no Japanese entry, and `src/i18n/locales/` has no `ja.json`. (HANDOFF said five — but the spec is the authority and lists six. Worth confirming with Carlos before adding, since the handoff implicitly endorsed dropping it.)

### St3. 🔴 No `Memory` interface, no per-language prompts module, no decks directory

V0's architecture compared to spec §6:

| Spec module | V0 |
|---|---|
| `src/memory/types.ts` (`Memory` interface) | absent — Funes is a `useState<FunesEntry[]>`, MIRAS is a `useState<string>`, both inline in `App.tsx` |
| `src/memory/funes.ts` (pure reducer) | absent — `setFunesMemory(prev => [entry, ...prev])` inline at `App.tsx:47` |
| `src/memory/miras.ts` | merged into `geminiService.ts` |
| `src/memory/auditor.ts` | merged into `geminiService.ts` |
| `src/memory/judge.ts` | merged into `geminiService.ts` |
| `src/data/prompts.ts` | absent — prompts live in i18n locale files |
| `src/data/decks/{thresholds,closings,mirrors,doubles}.ts` | only `src/data/reel-thresholds.json` exists |

The `Memory` interface is what makes the V2 persistent-memory swap mechanical. Without it, V2 becomes a rewrite. The deck directory is what makes the *Another reading* button non-trivial.

**Fix path:** introduce the structure incrementally. `src/memory/types.ts` and a pure `funes.ts` reducer first (HANDOFF step 2 already calls this out as the first Vitest target). Then `src/data/prompts.ts`. Decks can wait until after V1 ships.

### St4. 🟡 `index.html` is boilerplate; `<html lang>` doesn't track i18n

`index.html`:
- `<title>` is `"My Google AI Studio App"`
- `<html lang="en">` is hardcoded — never updates when i18n changes
- No favicon, no theme-color, no Open Graph tags, no description meta

Accessibility regression: a Hindi user with a screen reader gets English pronunciation rules applied to Devanagari text.

**Fix path:** static fixes to title/meta/favicon/og at the same time, then a small `useEffect` in `App.tsx` that does `document.documentElement.lang = i18n.language` on language change.

### St5. 🟡 No tests, no lint config, no CI

`package.json:11`'s `lint` script is `tsc --noEmit` — that's a typecheck, not a lint. No ESLint config, no Prettier, no `.editorconfig`, no `lint-staged`, no Husky, no Vitest, no Playwright, no Promptfoo, no GitHub Actions, no branch protection. HANDOFF step 2 lays out exactly what to add and in what order — this is the rails before any feature work.

### St6. 🟡 Reel duration violates spec

Spec §2: scenes are 5-7 seconds each, 12 scenes → ≈ 75-90 seconds total reel. V0 scene durations in `src/data/reel-thresholds.json` average ~6.3s, which fits — but `prologue.instruction` in `en.json:6` reads *"Click any number 1–10 you see during the next 90 seconds."* That hardcodes a duration into a user-facing string. If reel length ever changes (different deck, fewer scenes), this string lies. Should be derivable, or the wording should not commit to a number.

### St7. 🟢 Reel scene metadata diverges from the spec's threshold deck

Spec §4 specifies a precise threshold deck: door / train platform / coffee cup / tide line / book / breath on glass / stairwell / birds on wire / bell tower / rain window / threshold of light / closing eye, with specific digit assignments and explicit repeats (9 in scenes 8 and 11, 1 in scenes 3 and 12). V0's `reel-thresholds.json` keeps the threshold motif but uses different scenes (key-in-lock, candle, spider web) and different digit placements (no repeats). The repeats matter for Round 2 ("what theme runs through all twelve") because they're the breadcrumb MIRAS will pick up.

Not blocking, but worth aligning when Imagen-generated scenes replace the gradient placeholders.

---

## SURFACE — polish, but the visible kind

### Su1. 🟡 The MIRAS rail does not strike-through; it cross-fades

`Reel.tsx:138-147`:

```tsx
<motion.div key={mirasMemory} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
  {mirasMemory || '...'}
</motion.div>
```

`AnimatePresence mode="wait"` on a `key={mirasMemory}` will unmount the old text and mount the new. The visible motion is an opacity cross-fade — smooth, but it loses the spec's central artistic move: *"old phrases strike through, new phrases appear. The audience watches abstraction happen as motion."* The strike-through is what makes "abstraction" *visible* as an action, not a result.

**Fix path:** diff old vs new abstract at the word level (cheap, since both are short), render the deleted spans with `text-decoration: line-through` and a fade-out, render new spans with a typewriter-style fade-in. This is one of the highest-leverage surface fixes — it's the difference between "MIRAS is updating" and "MIRAS is *thinking*."

### Su2. 🟡 The Funes column does not visibly degrade

Spec §2: *"by scene 6, the column is scrolling fast and visibly losing coherence — desaturating slightly, font getting denser."* V0 fades older entries slightly (`Reel.tsx:74`: `opacity: 1 - i*0.05`) but the column itself doesn't desaturate, the font doesn't densify, the scroll doesn't accelerate uncomfortably. The artistic point — *Funes is drowning in his own perfect recall* — needs to be felt, not described.

**Fix path:** progressively reduce `letter-spacing`, increase line-density, and desaturate `text-funes-red/X` opacity from 80% toward 30% as `funesMemory.length` crosses 6.

### Su3. 🟡 Scene captions show on every scene; the discovery instruction never appears

`Reel.tsx:110-112` shows `currentScene.caption` in every scene, dimmed. Spec §2: *"The instruction 'click the digits when you see them' appears as a thin caption *during* the first scene only — discovered, not lectured."* V0 currently lectures via the prologue (`prologue.instruction` reads *"Click any number 1–10 you see during the next 90 seconds."*) and then narrates each scene with a poetic caption that no one asked for.

**Fix path:** delete the prologue instruction. In scene 1 only, render a thin instructional caption in the localized language. Remove per-scene captions from rendered output (keep them in the data for accessibility / dev only).

### Su4. 🟡 Footer placement and copy

Spec §8: *"An experiment by Carlos Crespo Macaya · carloscrespomacaya.com"* — small, low-opacity, **bottom-center**, present in every act except hidden during bloom and trial. V0 in `App.tsx:174-183`: text is *"A literary AI artifact by Carlos Crespo Macaya · carloscrespomacaya.com"* — different copy — placed bottom-right, shown only on prologue and verdict (hidden during entire reel and trial).

Easy alignment to spec wording and placement.

### Su5. 🟢 No Noto fallback fonts for non-Latin scripts

`src/index.css:5-7` declares Inter / EB Garamond / JetBrains Mono only. Hindi and Chinese will degrade to whatever the OS picks. Spec §3 explicitly lists `Noto Serif SC`, `Noto Serif Devanagari`, `Noto Serif JP` as fallbacks. Add to the Google Fonts import line and to the Tailwind font stack.

### Su6. 🟢 The verdict's MIRAS digit uses CSS `scale: 3` which html2canvas may render blurry

`Verdict.tsx:80`: `transition={{...}} scale: 3`. `html2canvas` reads computed styles and replays them, but a `transform: scale(3)` on rasterized text combined with `scale: 2` export oversampling produces sub-pixel artifacts on some browsers. Worth testing on the actual share-card export and switching to `font-size: 18rem` if the export looks soft.

### Su7. 🟢 No share-card watermark

Spec §8: PNG share card includes `carloscrespomacaya.com` in the lower-right at 8pt. V0 has a hidden `QR / CORE` placeholder div (`Verdict.tsx:101-104`) gated on a non-existent `group-export` class. The footer link from `App.tsx` is *outside* the `cardRef`, so it doesn't appear in the export. Add a real watermark inside the card.

### Su8. 🟢 Ambient drone, low-resonance verdict tone, typewriter sound — all missing

Spec §3 sound design beyond the chime is absent in V0. Acceptable for V1 if time-boxed; ship the chime + bloom and add ambient as polish.

---

## What V0 mostly got right (don't refactor for refactoring's sake)

- `AppPhase` state machine — clean, switch on a single string. Resist any urge to bring in XState until phases multiply.
- `useAudio` hook with a single ref-held `AudioContext` — correct pattern; just needs the chime palette correction.
- `motion/react` `AnimatePresence` for phase transitions — works as-is.
- Tailwind tokens for color — keep the discipline of never using raw hex.
- `i18next-browser-languagedetector` ordering (`querystring → localStorage → navigator`) — exactly what a deep-linked share card needs.

---

## Suggested fix order (mapping to HANDOFF.md step 3)

The HANDOFF.md mandates **Soul → Structure → Surface**, with TDD/eval coverage on each change. Walking that with the gaps above:

1. **Engineering rails first** (HANDOFF step 2): ESLint, Vitest, Playwright, Promptfoo, GH Actions, prettier, lint-staged. No feature work until this is green.
2. **St1 — Express proxy.** Until the API key is server-side, nothing else is shippable.
3. **S1 — externalize prompts to `src/prompts.ts`.** Single canonical English prompt, `{{language}}` injected. Promptfoo eval against the spec MIRAS prompt as the contract test.
4. **S2 — restore Funes verbatim dump.** Vitest unit test on the dump shape first, then make it pass. This restores the head-fake.
5. **S3 — Borges quote in Spanish always.** Tiny change, big artistic restoration.
6. **S5 — restore missing prompt clauses** (80-word auditor cap, 15-word judge verdict, `total` field).
7. **S6 — token enforcement on MIRAS abstract.** Promptfoo eval fails if abstract exceeds 280 tokens.
8. **St3 — `Memory` interface + Funes reducer extraction.** Pure-function refactor, tested.
9. **St4 — `index.html` cleanup, dynamic `<html lang>`.**
10. **S7 — streaming trial responses + typewriter audio.**
11. **Su1 — MIRAS strike-through animation.** The single highest-leverage visual fix.
12. **Su2, Su3, Su4 — Funes degradation, scene-1 instruction, footer alignment.**
13. **Surface polish** — Noto fonts, share-card watermark, ambient drone, scene-deck alignment to spec.

V1 is **not** Voice Auditor (spec §6 V1.5), persistent memory (V2), or Imagen-generated scenes (post-V1 polish pass).

---

## Open questions for Carlos before code changes

1. **Japanese in or out?** Spec §1 says yes, HANDOFF lists 5 languages. Pick one and update both docs.
2. **Express proxy or Cloud Function?** Both work. Express is simpler in dev, Cloud Function is closer to the eventual Firebase deploy. Bias: Express now, swap to Cloud Function during St1's deploy step.
3. **Reel deck — keep V0 scenes or restore the spec's threshold deck (with explicit repeats)?** V0's deck is fine artistically but loses the breadcrumbs MIRAS uses to surface the theme in Round 2. Suggest restoring spec deck.
4. **Footer copy:** "experiment" (spec) or "literary AI artifact" (V0)?

Once these are settled, the order above is mechanical.
