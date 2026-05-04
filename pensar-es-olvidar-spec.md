# Pensar es Olvidar
### A live demonstration of memory, abstraction, and the cost of perfect recall
### Submission to the Google I/O "Big Number" challenge

> *Pensar es olvidar diferencias, es generalizar, abstraer.*
> — Borges, *Funes el memorioso* (1942)

---

## 0. One-paragraph product description

A web artifact that stages Borges's *Funes el memorioso* as a live cognitive experiment. The user watches a curated reel of twelve scenes; each scene contains a hidden digit 1–10. When the user spots and clicks a digit, two memory systems ingest the same event in real time — one Funesian (verbatim, unbounded), one MIRAS-style (abstract, bounded by a retention regularizer). After the reel, an auditor runs a four-question trial against both memories, streaming their answers in parallel. A verdict appears as a single huge digit: which memory *understood* the experience. The user can then enter a live voice conversation with the auditor to interrogate the result. The closing frame is Borges's sentence, alone. Total runtime: ~3 minutes core experience, optional 1–5 minute voice extension.

---

## 1. Strategic decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Build platform | **AI Studio Build** (not Canvas) | Multi-file, Live API support, GitHub export, deploy. Canvas can't carry this scope. |
| Default language | English | Global I/O audience. |
| Supported languages | EN / ES / ZH-Hans / HI / PT-BR | Five-language coverage of I/O target audience. Borges quote stays Spanish always. (JA dropped for V1 — see HANDOFF.) |
| Voice auditor | Yes — Gemini Live API | Highest captivation lever. Transforms watch-demo into interrogate-demo. |
| Engineering spine | TS/React/Vite + Vitest + GitHub Actions + Firebase Hosting + Sentry | Vibed scaffold, hardened repo. |
| V2 persistent memory | Designed-for, deferred | Architect V1 memory as swappable interface. |

---

## 2. The artifact — three-act structure (final)

### Act I — The Reading (≈15s)

Black screen. Single line types itself, slowly, in Spanish:

> *Pensar es olvidar diferencias, es generalizar, abstraer.*

Subtitle fades in below in user's selected language (English by default):

> *To think is to forget differences, to generalize, to abstract.*
> — Borges, *Funes the Memorious*

A pulse, then one button: **Begin** (or its translation).

No tutorial. No instructions. The thesis is stated and the test begins. The instruction "click the digits when you see them" appears as a thin caption *during* the first scene only — discovered, not lectured.

**Top-right corner throughout:** a globe icon for language selection. Tapping reveals a clean dropdown of the five languages with native-script labels (English / Español / 中文 / हिन्दी / Português). Selection persists in localStorage.

### Act II — The Stream (≈75–90s)

The screen splits into three regions:

- **Center (60%):** the reel. Full-bleed visual, ambient audio, no chrome.
- **Left rail (20%):** Funes's memory. Scrolling log, monospace, desaturated red (#B85450).
- **Right rail (20%):** MIRAS's memory. A single bounded paragraph, monospace, cool blue (#6B8CAE), that *rewrites itself* in place after each event. A small caption beneath the rail shows the retention rule in real time: `≤ 280 tokens · pattern over detail`.

**The reel:** twelve scenes, each 5–7 seconds, each containing one digit 1–10. Two digits repeat across the twelve to make the "pattern" round meaningful later. Every scene shares a *latent theme* — the inaugural deck is **thresholds** (doors, dawns, tide lines, half-open books, bell tower at the moment of striking).

**The hidden architecture:** the audience won't consciously see the threshold pattern. MIRAS, forced to compress, will surface it by trial round 2. Funes won't.

**Mechanic per scene:**

1. User clicks on a digit when they spot it.
2. **The Bloom:** the digit explodes silently to fill the entire screen for ~400ms in warm white (#FFF8E7), then collapses back. Each digit has a unique soft chime pitch (1=low → 10=high), so a sequence of correct clicks plays a faint melody. The "big number in the middle" challenge requirement is satisfied here, dozens of times, diegetically.
3. Both memory rails ingest the event in parallel.

**Funes update (instant):** append `{t, scene_id, digit, raw_caption, click_xy, reaction_ms}` to the array. Newest at top, fade in. By scene 6, the column is scrolling fast and visibly losing coherence — desaturating slightly, font getting denser.

**MIRAS update (~1s Gemini call):** the abstract visibly *rewrites in place* — old phrases strike through, new phrases appear. The audience watches abstraction happen as motion.

### Act III — The Trial (≈60s)

Reel ends. Visuals dim. A neutral typographic title fades in: **The Trial.**

Four rounds. Each round: a single question appears centered, both answers stream simultaneously in the two rails (now expanded to full height). Round indicator: "I / IV", "II / IV", etc. ~10–12 seconds per round.

| Round | Question | Funes outcome | MIRAS outcome |
|---|---|---|---|
| **I — Recall** | *What appeared in scene 5?* | Wins vividly. Exact RGB, exact click time, perceptual fragment. | Vague gesture — "a threshold scene." |
| **II — Pattern** | *What theme runs through all twelve scenes?* | Drowns. Column literally cannot fit the answer. | One sentence: "Each scene is a threshold." First inversion. |
| **III — Counterfactual** | *If scene 5 had been different, would the meaning of the whole change?* | Cannot reason hypothetically. Tautological, slightly sad. | Reasons cleanly: yes/no/why. The laugh round. |
| **IV — Understanding** | *Tell me what you understood.* | Verbose atomistic transcript. A man who saw everything and grasped nothing. | Two sentences. Quietly devastating. |

**The verdict (≈10s):**

Rails fade. Center: two huge digits side by side — Funes's score and MIRAS's score, 1–10 each, scored by a fifth Gemini call against a *visible* rubric (Specificity, Generalization, Coherence, Understanding). MIRAS's digit is rendered ~3× larger. The composition *is* the argument.

Beneath, the closing line:

> *To think is to forget.*
> *Pensar es olvidar.*

Three soft buttons:

1. **Speak with the Auditor** (opens Live API voice session)
2. **Share the verdict** (generates PNG card)
3. **Another reading** (loads next reel deck)

### Act IV (optional) — The Voice Session

User clicks *Speak with the Auditor*. A simple voice UI appears: a pulsing orb that shifts color when the auditor speaks vs. listens. The auditor has both memory transcripts and the trial results in its context. It can answer:

- "Why did MIRAS score higher?"
- "Could Funes have generalized differently?"
- "What does this say about how I remember?"
- "What's the connection to Borges?"

Implementation: Gemini Live API over WebSocket, audio in/out via Web Audio API. System prompt embeds the full session transcript. Voice: a calm neutral tone, slight Argentinian lilt if voice selection allows (this is a love note Borges scholars will catch).

User can end at any time with a tap. The voice session is the moment that lifts this from "clever demo" to "thing people send to friends."

---

## 3. Visual & sonic design

**Palette.** Near-black background (#0A0A0B). Funes red (#B85450). MIRAS blue (#6B8CAE). Bloom warm white (#FFF8E7). The whole thing should feel like a library at night.

**Typography.**
- Spanish phrases: `EB Garamond`, weight 400, large, loaded with cultural weight.
- Subtitles: same face, 60% opacity, smaller.
- Mono rails: `JetBrains Mono`.
- UI chrome: `Inter`, used sparingly.

For non-Latin scripts, fallback stack:
- Mandarin: `Noto Serif SC` for serif, `Noto Sans SC` for chrome.
- Hindi: `Noto Serif Devanagari`, `Noto Sans Devanagari`.
**Sound.**
- Reel: ambient drone bed, no music, room tone.
- Bloom chime: sine-wave pings at ten pitches (Pentatonic mapping: 1=C3, 2=D3, 3=E3, 4=G3, 5=A3, 6=C4, 7=D4, 8=E4, 9=G4, 10=A4). Sequence forms unintentional melody.
- Trial: silent except for typewriter rhythm as answers stream.
- Verdict: one resonant low tone (C2 with subtle reverb).
- Voice session: orb pulse at speech amplitude, no other sound.

**Motion.** Everything tasteful. The bloom is the only "loud" animation. Rail updates are subtle fades + strike-throughs. No bouncing, no springs, no AI-demo glitter.

---

## 4. The reel — content specification

Twelve scenes. Inaugural deck theme: **THRESHOLDS.**

| # | Scene description | Digit | Placement |
|---|---|---|---|
| 1 | Door ajar, dawn light spilling onto floor | 3 | Carved in lintel |
| 2 | Train platform, departures board, puddle reflection | 7 | On board |
| 3 | Cup of coffee, steam rising, napkin underneath | 1 | Written on napkin |
| 4 | Tide line on sand, half-erased | 5 | Drawn with finger |
| 5 | Half-open book on a table | 8 | Page number |
| 6 | Held breath as condensation on glass | 2 | Traced in fog |
| 7 | Stairwell, door at landing | 4 | On door |
| 8 | Birds on a wire | 9 | The *count* — exactly 9 birds |
| 9 | Bell tower at moment of striking | 6 | On bell face |
| 10 | Window with rain, passing van | 10 | Stenciled on van |
| 11 | Threshold of light on wooden floor | 9 | In shadow (repeats) |
| 12 | Closing eye, final frame | 1 | Beside word *fin* (repeats) |

**Generation:** Imagen 3 via API, prompts tuned per scene. Aspect ratio 16:9, painterly-realistic style, consistent low-light palette. ~2 hours of prompt iteration to get a coherent set.

**Subsequent decks** (V1.1 — for replay value):
- *Closings* — last pages, sunsets, final notes
- *Mirrors* — reflections, doubles, palindromes
- *Doubles* — twins, echoes, repetitions

Each deck has its own latent theme that MIRAS will surface and Funes will miss.

**Cerati easter egg:** scene 7's threshold features the *Bocanada* album cover composition (smoke crossing a doorway). No caption. Those who get it get it.

---

## 5. Internationalization

### Strategy

- UI strings in `i18n/{en,es,zh,hi,pt}.json`. ~40 strings total.
- Borges quote: stored separately, **always shown in Spanish**, with subtitle from i18n.
- Reel scene captions (the thin instructional text in scene 1 only): translated.
- Gemini outputs (MIRAS abstract, auditor questions, audit answers, judge verdict): instructed via system prompt to respond in `{language}`. This is essentially free.
- Voice session: Gemini Live API supports the five target languages natively. Voice selection follows UI language.

### UI-string set (final, English baseline)

```json
{
  "prologue.button": "Begin",
  "reel.hint": "Click the digits when you see them",
  "rails.funes.label": "Memory A — Verbatim",
  "rails.miras.label": "Memory B — Abstract",
  "rails.miras.rule": "≤ 280 tokens · pattern over detail",
  "trial.title": "The Trial",
  "trial.round": "{n} of IV",
  "trial.q1": "What appeared in scene 5?",
  "trial.q2": "What theme runs through all twelve scenes?",
  "trial.q3": "If scene 5 had been different, would the meaning change?",
  "trial.q4": "Tell me what you understood.",
  "verdict.rubric.specificity": "Specificity",
  "verdict.rubric.generalization": "Generalization",
  "verdict.rubric.coherence": "Coherence",
  "verdict.rubric.understanding": "Understanding",
  "verdict.closing.es": "Pensar es olvidar.",
  "verdict.closing.translated": "To think is to forget.",
  "actions.voice": "Speak with the Auditor",
  "actions.share": "Share the verdict",
  "actions.replay": "Another reading",
  "voice.tap_to_start": "Tap to begin",
  "voice.listening": "Listening…",
  "voice.thinking": "…",
  "voice.end": "End conversation",
  "credits.line": "An experiment by Carlos Crespo Macaya",
  "credits.link": "carloscrespomacaya.com",
  "lang.selector.label": "Language",
  ...
}
```

### Language detection
- On load: `navigator.language` → match to one of five → default to English if no match.
- Manual override via globe icon → persists in localStorage.
- Borges quote in Spanish, subtitle in selected language. Always. This is non-negotiable.

---

## 6. Engineering architecture

### Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Refactor safety on the memory interfaces |
| Framework | React 19 + Vite | What AI Studio Build outputs natively |
| Styling | Tailwind CSS | Rapid + works with Studio output |
| State | React state + custom hooks | No Redux needed at this scope |
| i18n | `react-i18next` | Standard, simple, supports namespaces |
| LLM SDK | `@google/generative-ai` | Official Gemini SDK |
| Voice | Gemini Live API (WebSocket) | Real-time bidirectional |
| Audio | Web Audio API + Tone.js | Chimes, ambient bed |
| Animation | Framer Motion | The bloom, strike-throughs |
| Tests | Vitest + RTL + MSW | Mock Gemini for deterministic tests |
| E2E | Playwright | Critical user paths only |
| Deploy | Firebase Hosting | Free tier, global CDN, Google ecosystem fit |
| CI/CD | GitHub Actions | Standard |
| Errors | Sentry | Browser errors, performance |
| Analytics | PostHog (self-hosted free tier) | Funnel: scenes-viewed, clicks, voice-engagement |
| Logging | Custom structured client logger → Cloud Logging endpoint | Trace memory updates per session |

### Project structure

```
pensar-es-olvidar/
├── src/
│   ├── App.tsx                       # three-act state machine
│   ├── main.tsx
│   ├── components/
│   │   ├── Prologue.tsx              # typing animation, language selector
│   │   ├── Reel.tsx                  # scene playback, click handler, bloom
│   │   ├── Bloom.tsx                 # the 400ms theatrical moment
│   │   ├── FunesRail.tsx             # append-only scroll
│   │   ├── MirasRail.tsx             # in-place rewrite with strike-through
│   │   ├── Trial.tsx                 # 4-round audit, simultaneous streaming
│   │   ├── Verdict.tsx               # final score, rubric, share button
│   │   ├── VoiceSession.tsx          # Live API voice UI
│   │   ├── ShareCard.tsx             # html2canvas → PNG
│   │   ├── LanguageSelector.tsx      # globe dropdown
│   │   └── Credits.tsx               # subtle author footer
│   ├── memory/
│   │   ├── types.ts                  # Memory interface (V1/V2 swappable)
│   │   ├── funes.ts                  # pure function: (state, event) => state'
│   │   ├── miras.ts                  # Gemini call w/ retention prompt
│   │   ├── auditor.ts                # 4 question calls
│   │   ├── judge.ts                  # rubric scoring call
│   │   └── voice.ts                  # Live API session manager
│   ├── data/
│   │   ├── reel.ts                   # scene metadata
│   │   ├── decks/
│   │   │   ├── thresholds.ts
│   │   │   ├── closings.ts
│   │   │   ├── mirrors.ts
│   │   │   └── doubles.ts
│   │   └── prompts.ts                # all Gemini prompts in one place
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/{en,es,zh,hi,pt}.json
│   ├── audio/
│   │   ├── chimes.ts                 # Tone.js bloom pitches
│   │   └── ambient.ts                # background drone
│   ├── analytics/
│   │   ├── events.ts                 # typed event taxonomy
│   │   └── client.ts                 # PostHog wrapper
│   ├── observability/
│   │   ├── logger.ts                 # structured client logger
│   │   └── sentry.ts                 # init
│   └── utils/
│       └── env.ts                    # API keys via Vite env
├── tests/
│   ├── unit/
│   │   ├── funes.test.ts
│   │   ├── miras.test.ts             # mocked Gemini
│   │   ├── judge.test.ts
│   │   └── i18n.test.ts              # all keys present in all locales
│   └── e2e/
│       ├── happy-path.spec.ts
│       └── language-switch.spec.ts
├── .github/workflows/
│   ├── test.yml
│   └── deploy.yml
├── firebase.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### The Memory interface (V1/V2 swappable)

```typescript
// src/memory/types.ts
export interface PerceptualEvent {
  t: number;                    // timestamp ms since session start
  sceneId: string;
  digit: number;                // 1-10
  rawCaption: string;
  clickXY: [number, number];
  reactionMs: number;
}

export interface Memory {
  ingest(event: PerceptualEvent): Promise<void>;
  query(question: string, language: Language): Promise<AsyncIterable<string>>;
  dump(): MemorySnapshot;       // for the judge
  reset(): void;
}

// V1: in-memory only
// V2: extends with `persist()` and `bootstrapFromWisdom()`
```

Both `FunesMemory` and `MirasMemory` implement this. The judge takes two `MemorySnapshot`s. Swap is mechanical when V2 lands.

### Observability

**Structured event taxonomy** (typed at `src/analytics/events.ts`):

```typescript
type Event =
  | { type: 'session_start'; lang: Language; deck: string }
  | { type: 'prologue_skipped'; ms: number }
  | { type: 'scene_shown'; sceneId: string; digit: number }
  | { type: 'digit_clicked'; sceneId: string; correct: boolean; reactionMs: number }
  | { type: 'memory_update'; memory: 'funes' | 'miras'; latencyMs: number; sizeBytes: number }
  | { type: 'trial_round'; round: 1|2|3|4; funesLatencyMs: number; mirasLatencyMs: number }
  | { type: 'verdict_shown'; funesScore: VerdictScore; mirasScore: VerdictScore }
  | { type: 'voice_session_start' }
  | { type: 'voice_turn'; userMs: number; auditorMs: number }
  | { type: 'shared'; medium: 'png' | 'link' }
  | { type: 'replay_started'; deck: string }
  | { type: 'error'; where: string; detail: string };
```

These power:
- Sentry breadcrumbs for error context
- PostHog funnel: who reaches the trial / verdict / voice session
- A simple Cloud Logging endpoint for raw event stream (debugging the demo at I/O if anything misbehaves)

**Latency budget (alert thresholds):**
- MIRAS update: P50 < 1.2s, P95 < 2.5s
- Trial round (parallel): P95 < 6s
- Verdict scoring: P95 < 4s
- Voice first-token: P95 < 800ms

### Testing strategy (TDD where it pays)

**Unit-tested (fully):**
- `funes.ts` — pure reducer, trivial to test exhaustively
- `judge.ts` — given fixed transcripts, scoring shape is stable; assert structure not values
- `i18n` consistency — every key present in every locale file (CI-blocking)
- Reel coordinate detection — click hit-testing math

**Mocked-Gemini tested:**
- `miras.ts` — assert retention rule is in prompt, assert token cap respected by post-trim
- `auditor.ts` — assert four questions, assert per-language instruction injection
- `voice.ts` — mock WebSocket, assert session lifecycle

**E2E tested (Playwright):**
- Happy path: prologue → reel (auto-click via test harness) → trial → verdict
- Language switch mid-session preserves state
- Voice session connects and disconnects cleanly

**Not tested:** Gemini output quality. That's prompt engineering, evaluated qualitatively, not via assertion.

### CI/CD

`.github/workflows/test.yml` — on every PR:
- Type check (`tsc --noEmit`)
- Lint (`eslint`)
- Unit + integration tests (`vitest`)
- i18n key consistency check
- Build (`vite build`)
- Bundle size budget check (target: <300kb gzipped initial)

`.github/workflows/deploy.yml` — on merge to `main`:
- All of the above
- Playwright E2E against preview deploy
- Deploy to Firebase Hosting (production)
- Source map upload to Sentry
- Slack notification (optional)

### Deployment

Firebase Hosting at a memorable subdomain — `pensar.carloscrespomacaya.com` or similar. CDN caching aggressive on assets, no cache on `index.html`. SSL automatic. Free tier handles I/O traffic spike easily.

API keys via Vite env vars, injected at build time. The Gemini key lives in environment, never in client bundle source — but understand: it WILL be in the runtime bundle, since this is a static SPA. Mitigation: a Cloud Function proxy for Gemini calls with rate limits per IP. This adds ~150ms latency but prevents key abuse. Worth it for a public I/O submission.

---

## 7. The critical Gemini prompts

These are the artifact's soul. Iterate hard.

### MIRAS retention rule

```
You are a memory with a fixed budget of 280 tokens.
Your current memory: {abstract}
New perceived event: {event}

Rewrite your memory incorporating what is essential about the new event.
You MUST stay under 280 tokens. To make room, you must forget.

Preserve: patterns, relationships, themes, what repeats.
Discard: exact times, positions, colors, surface detail.

Respond in {language}.
Return only the new memory. No explanation.
```

### Auditor (Round 4 — Understanding)

```
You are interrogating a memory. You have no access to the original
events — only to what the memory tells you.

Question: Tell me what you understood from the experience.

Memory under examination:
{memory_dump}

Respond in first person, AS the memory itself.
If you cannot generalize, do not generalize. If you only have details,
deliver details. Be faithful to your nature.

Respond in {language}. Maximum 80 words.
```

That last instruction — *be faithful to your nature* — is the move. The auditor doesn't *force* Funes to fail; it lets him fail honestly.

### Judge

```
You witnessed a trial between two memory systems.
Here are the four questions and both systems' responses.

{transcript}

Score each system 1-10 on four dimensions:
- Specificity (recalls exact details)
- Generalization (extracts patterns)
- Coherence (maintains a thread)
- Understanding (grasps meaning, not just facts)

Return strict JSON:
{
  "funes": { "specificity": N, "generalization": N, "coherence": N, "understanding": N, "total": N },
  "miras": { "specificity": N, "generalization": N, "coherence": N, "understanding": N, "total": N },
  "verdict": "single sentence in {language}, max 15 words"
}
```

### Voice auditor system prompt (Live API)

```
You are the Auditor. You have just judged a trial between two memory
systems — Funes (verbatim, unbounded) and MIRAS (abstract, bounded).

Full transcript: {trial_transcript}
Final scores: {scores}
Borges story context: Funes el memorioso (1942) — about a man who
remembers everything and therefore cannot think.

The user may now question you about what happened. Speak in {language}.
Be calm, judicial, slightly literary. Hold positions when challenged
but acknowledge nuance. Maximum ~30 seconds per response. If asked
about Borges, you may quote him sparingly.

If the user asks something outside scope (weather, code, life advice),
gently return to the experiment.
```

---

## 8. Self-promotion (subtle)

**Footer of every act:** small, low-opacity line, bottom-center:

> *An experiment by Carlos Crespo Macaya · carloscrespomacaya.com*

**Share card (PNG):** in the lower-right corner, in 8pt:

> *carloscrespomacaya.com*

**Voice session "about" prompt:** if the user asks "who made this?", the auditor briefly attributes it.

That's it. Three touchpoints, each calibrated. Not a watermark, not a billboard.

---

## 9. The AI Studio brief — paste this

The following is the seed prompt for AI Studio Build. Paste verbatim into a new Build session. Iterate on outputs scene by scene.

```
Build a React + TypeScript + Vite + Tailwind web app called
"Pensar es Olvidar." Single-page artifact, three-act structure:

ACT 1 — PROLOGUE: Black screen, types out the Spanish line
"Pensar es olvidar diferencias, es generalizar, abstraer."
followed by an English subtitle. One button "Begin" that advances to Act 2.
Top-right: a globe icon language selector with EN/ES/ZH/HI/PT.

ACT 2 — REEL: Three-column layout. Center 60%: a sequence of 12 scenes
loaded from data/decks/thresholds.ts, each containing a hidden digit 1-10
at known coordinates. Each scene shows for 6 seconds. User can click on
the digit. Correct click triggers a "bloom": the digit fills the screen
in warm white (#FFF8E7) for 400ms, then collapses, with a soft chime
(pitch mapped to digit). Left rail (20%): a Funes memory log — append-only,
desaturated red, scrolls fast as it fills. Right rail (20%): a MIRAS
memory abstract — a single bounded paragraph in cool blue that rewrites
itself in place after each event by calling Gemini with a retention prompt
capped at 280 tokens.

ACT 3 — TRIAL: Reel ends, visuals dim. Title "The Trial" appears.
Four rounds, each presents a question, both rails stream Gemini-generated
answers in parallel:
  Round 1: "What appeared in scene 5?"
  Round 2: "What theme runs through all twelve scenes?"
  Round 3: "If scene 5 had been different, would the meaning change?"
  Round 4: "Tell me what you understood."
The Funes memory dumps verbatim transcript into context for its answers;
MIRAS dumps its abstract.

VERDICT: A judge Gemini call rates both 1-10 on Specificity, Generalization,
Coherence, Understanding. Two big digits side by side, MIRAS rendered ~3x
larger. Beneath: "Pensar es olvidar." / "To think is to forget."
Three buttons: "Speak with the Auditor", "Share", "Another reading."

VOICE: "Speak with the Auditor" opens a Gemini Live API voice session
where the auditor has the full trial transcript and can answer questions.
Pulsing orb UI.

THEMING:
- Background #0A0A0B
- Funes #B85450, MIRAS #6B8CAE, Bloom #FFF8E7
- Spanish text in EB Garamond, mono rails in JetBrains Mono
- Animations tasteful — Framer Motion for bloom and strike-throughs only

I18N: react-i18next, five languages, Borges quote always Spanish + subtitle
in selected language.

ARCHITECTURE: Memory interface in src/memory/types.ts that both Funes
(in-memory verbatim) and MIRAS (Gemini-backed abstract) implement. All
prompts in src/data/prompts.ts. Reel decks in src/data/decks/.

Start by scaffolding the project structure and the three-act state machine
in App.tsx with placeholder components.
```

After this seed, iterate component by component. AI Studio Build will give you a working scaffold within ~10 minutes.

---

## 10. Build schedule (5 days, evenings + weekend)

**Day 1 (Saturday) — Vibe scaffold (5h):**
- AI Studio Build session, paste brief, iterate on scaffold
- Get three-act state machine working with placeholder content
- Export to GitHub repo
- Wire up Vitest, ESLint, Tailwind, react-i18next

**Day 2 (Sunday) — Memory + Reel (5h):**
- Implement `Memory` interface, `FunesMemory`, `MirasMemory`
- Iterate hard on the MIRAS retention prompt — this is where 40% of demo quality lives. Test with synthetic events until the abstract *feels like real abstraction.*
- Reel component with mock images + click detection + bloom animation
- Sound — Tone.js chimes, ambient bed
- Funes rail and MIRAS rail with strike-through rewrite animation

**Day 3 (Tuesday evening) — Trial + Verdict (3h):**
- Four-round trial with simultaneous parallel streaming
- Judge call with rubric scoring
- Verdict screen with two-digit composition
- Share card generation (html2canvas → download PNG)

**Day 4 (Wednesday evening) — Voice + Polish (3h):**
- Gemini Live API integration
- Pulsing orb voice UI
- Voice session system prompt with full transcript injection
- Sentry, PostHog wiring

**Day 5 (Saturday) — Reel craft + Polish (5h):**
- Generate the twelve threshold scenes via Imagen 3
- Spanish copy review (you'll catch what I won't)
- Six-language i18n strings written and reviewed (use Gemini for first pass, manual native review where possible)
- Cross-browser testing
- E2E Playwright happy path
- Deploy to Firebase, set up subdomain

**Day 6 (Sunday) — Buffer & ship:**
- Whatever broke
- Record submission video
- Social post

If running ahead by Day 5, start V2.

---

## 11. V2 — The Compounding Memory (deferred)

Conceptually beautiful. Architecturally, a single change.

**The thesis extension:** Funes can't remember himself. MIRAS can. Across sessions, only abstract memory compounds.

**Implementation:** Firestore collection `wisdom_abstracts` storing each session's final MIRAS abstract + the deck/theme used. New sessions optionally bootstrap the MIRAS instance with a *meta-abstract* — a Gemini-summarized synthesis of all prior abstracts. The retention prompt becomes:

```
You inherit prior wisdom from past memories like yourself: {meta_abstract}
Your current session memory: {abstract}
New event: {event}
[ ... retention rule ... ]
```

Funes gets nothing of the kind. He starts naked every time.

**The visible payoff:** a small "Wisdom" badge near the MIRAS rail showing how many prior sessions the meta-abstract draws from. After 100 sessions, MIRAS opens the trial already knowing thresholds, mirrors, and closings as latent themes — and Funes still has to learn each session from scratch, every time, forever.

**The Borges note:** there exists, somewhere in the V2 share card text, a small mention that this is "a memory that has read 1,247 other memories." Funes never can.

**Engineering cost:** ~6 hours. Firestore client integration, meta-abstract Gemini call (runs nightly via scheduled Cloud Function), bootstrap logic in MIRAS constructor.

**Risk:** dilutes the V1 punch if rushed. Ship V1 first, measure response, decide V2 in week 2.

---

## 12. Captivation checklist (the worry, addressed)

The earlier worry was: *will it be fun, or merely impressive?* The captivation levers, locked in:

| Lever | Mechanism | Where it lives |
|---|---|---|
| **Discovery, not lecture** | No tutorial. Instruction appears mid-scene 1. | Act 1 / Act 2 transition |
| **Bloom theatre** | 400ms full-screen explosion + chime per click | Reel mechanic |
| **Funes visibly drowning** | Rail desaturates and accelerates as it fills | Rail styling |
| **MIRAS visibly thinking** | Strike-through rewrites in place | Rail animation |
| **The head-fake** | Round 1 makes Funes look like the winner | Trial pacing |
| **The laugh round** | Round 3 counterfactual, Funes tautological | Auditor prompt design |
| **The killshot** | Round 4 — two sentences vs. transcript | Auditor prompt design |
| **Voice extension** | Real conversation with the auditor | Act 4 |
| **Shareable verdict** | PNG card with attribution | Verdict |
| **Replay value** | Three additional decks | Verdict |
| **Easter eggs for the literate** | Bocanada threshold, Argentinian voice | Scattered |

If the bloom lands and the voice session works on first ship, this is the project that the Anthropic recruiter screenshots and forwards to a colleague. That's the bet, and the design is now structured for it.

---

## 13. Submission package

For Google I/O entry:
- 60-second demo video (record happy path + voice exchange)
- One-paragraph project description (use §0 above)
- Live URL (Firebase deploy)
- GitHub repo (public, with README pointing to live)
- Tweet/X post with the share card

Tagline candidate:

> *Two memories watch the same world. Only one understands it.*
> *A live experiment after Borges.*

---

*— end of plan —*
