/**
 * Chained MIRAS retention eval — measures the artifact's load-bearing claim.
 *
 * Runs the canonical MIRAS retention prompt over 12 chained events from the
 * threshold deck, threading each output forward as the next call's {{abstract}}.
 * Then asserts two properties:
 *
 *   continuity — a spatial-threshold vocabulary cluster (threshold, liminal,
 *                boundary, opening, crossing, passage, edge, portal, brink,
 *                verge, in-between) surfaces in MIRAS's abstract by the back
 *                half of the chain. Specifically: present in at least one
 *                scene of 7–11, AND retained at scene 12. Tests the artistic
 *                claim that the threshold theme emerges as MIRAS generalizes,
 *                without requiring the literal word "threshold" at a specific
 *                scene. Vocabulary deliberately excludes temporal-continuous
 *                synonyms (transition, flux) that would widen toward
 *                impermanence-themed abstractions.
 *
 *   forgetting — none of the forbidden surface-detail tokens from events 1–4
 *                (specific positions like "32%", ornamental nouns like
 *                "ajar"/"puddle"/"napkin") survive in the event-12 abstract.
 *                The MIRAS prompt explicitly says "Discard: exact times,
 *                positions, colors, surface detail." Surviving tokens mean
 *                MIRAS is summarizing, not abstracting.
 *
 * Failure surfaces a diff: abstracts across the back half (scenes 7–12) and
 * any surviving forbidden tokens. Red CI without explanation is hostile;
 * red CI with a diff is teaching.
 *
 * See evals/CHAINED_EVAL_DECISION.md for why this is a sidecar script rather
 * than a Promptfoo provider.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { renderMirasRetention } from '../src/prompts';
import { withEmptyResponseRetry } from './withEmptyResponseRetry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures/threshold-deck-12-events.json');
const TRACE_PATH = join(__dirname, 'output/miras-chain.trace.json');

interface Event {
  scene: number;
  caption: string;
  digit: number;
  event: string;
}

interface Fixture {
  themeWord: string;
  themePattern: string;
  forbiddenTokensByEvent12: string[];
  events: Event[];
}

interface TraceEntry {
  scene: number;
  digit: number;
  abstract: string;
  charLength: number;
}

interface Failure {
  type: 'continuity' | 'forgetting';
  scene: number;
  message: string;
}

const fixture: Fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));

async function runChain(): Promise<TraceEntry[]> {
  const useFixture = process.env.MIRAS_USE_FIXTURE === '1';
  if (useFixture) {
    if (!existsSync(TRACE_PATH)) {
      throw new Error(
        `MIRAS_USE_FIXTURE=1 but no cached trace at ${TRACE_PATH}. ` +
          `Run once with GOOGLE_API_KEY set to seed the cache.`,
      );
    }
    console.log(`Replaying cached trace from ${TRACE_PATH}`);
    return JSON.parse(readFileSync(TRACE_PATH, 'utf8')) as TraceEntry[];
  }

  if (!process.env.GOOGLE_API_KEY) {
    throw new Error(
      'GOOGLE_API_KEY not set. Either provide it, or set MIRAS_USE_FIXTURE=1 to replay from cache.',
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  let abstract = '(nothing yet)';
  const trace: TraceEntry[] = [];

  for (const event of fixture.events) {
    const prompt = renderMirasRetention({
      abstract,
      event: event.event,
      language: 'English',
    });

    // Eval-only pin. The chained eval is this repo's canary for upstream
    // model drift, so it pins to a stable, GA-classified Flash and to a
    // low-but-non-zero temperature — failures here should be attributable
    // to local code, not to preview-model variance. Production
    // (src/geminiService.ts) deliberately keeps tracking
    // gemini-flash-latest with no explicit temperature; that channel
    // surfaces upstream drift via this canary, not via end-user output.
    abstract = await withEmptyResponseRetry(
      () =>
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.3 },
        }),
      event.scene,
    );
    trace.push({
      scene: event.scene,
      digit: event.digit,
      abstract,
      charLength: abstract.length,
    });
    process.stdout.write(
      `scene ${String(event.scene).padStart(2, ' ')}: ${abstract.length} chars\n`,
    );
  }

  mkdirSync(dirname(TRACE_PATH), { recursive: true });
  writeFileSync(TRACE_PATH, JSON.stringify(trace, null, 2));
  console.log(`Trace written to ${TRACE_PATH}`);
  return trace;
}

function assertContinuity(trace: TraceEntry[], pattern: string, themeWord: string): Failure[] {
  const re = new RegExp(pattern, 'i');
  const failures: Failure[] = [];

  // Scene 12 is mandatory — the artistic claim is that the threshold theme
  // is present in MIRAS's abstract by the end of the chain.
  const final = trace.find((t) => t.scene === 12);
  if (!final) {
    failures.push({ type: 'continuity', scene: 12, message: `no event 12 in trace` });
  } else if (!re.test(final.abstract)) {
    failures.push({
      type: 'continuity',
      scene: 12,
      message:
        `event 12 abstract does not contain ${themeWord}.\n` + `    abstract: ${final.abstract}`,
    });
  }

  // Back-half (scenes 7–11) must surface the theme in at least one scene —
  // catches "theme appeared at scene 12 only by coincidence" cases and
  // "model picked a different theme" runs.
  const backHalf = trace.filter((t) => t.scene >= 7 && t.scene <= 11);
  const surfaces = backHalf.some((t) => re.test(t.abstract));
  if (!surfaces) {
    failures.push({
      type: 'continuity',
      scene: 11,
      message:
        `${themeWord} did not surface in any back-half scene (7–11). MIRAS ` +
        `either failed to abstract by the end of the chain or abstracted the ` +
        `deck to a different theme.`,
    });
  }

  return failures;
}

function assertForgetting(trace: TraceEntry[], forbidden: string[]): Failure[] {
  const entry = trace.find((t) => t.scene === 12);
  if (!entry) {
    return [{ type: 'forgetting', scene: 12, message: 'no event 12 in trace' }];
  }
  const haystack = entry.abstract.toLowerCase();
  const survivors = forbidden.filter((token) => haystack.includes(token.toLowerCase()));
  if (survivors.length === 0) return [];
  return [
    {
      type: 'forgetting',
      scene: 12,
      message:
        `event 12 abstract retained ${survivors.length} surface-detail token(s) ` +
        `— MIRAS is summarizing, not abstracting.\n` +
        `    surviving: ${survivors.map((s) => `"${s}"`).join(', ')}\n` +
        `    abstract: ${entry.abstract}`,
    },
  ];
}

function printDiff(trace: TraceEntry[], failures: Failure[]): void {
  console.error('\n--- failure diff ---');
  const interesting = new Set(failures.map((f) => f.scene));
  // Always print the back half + final for context. The back-half assertion
  // looks across multiple scenes, so a diff on a single scene isn't enough.
  for (let s = 7; s <= 12; s++) interesting.add(s);
  for (const scene of [...interesting].sort((a, b) => a - b)) {
    const entry = trace.find((t) => t.scene === scene);
    if (!entry) continue;
    console.error(`  scene ${scene} (${entry.charLength} chars):`);
    console.error(`    ${entry.abstract}`);
  }
  console.error('\n--- assertions ---');
  for (const f of failures) {
    console.error(`  ✗ [${f.type}] scene ${f.scene}: ${f.message}`);
  }
}

async function main(): Promise<void> {
  const trace = await runChain();
  const failures = [
    ...assertContinuity(trace, fixture.themePattern, fixture.themeWord),
    ...assertForgetting(trace, fixture.forbiddenTokensByEvent12),
  ];

  if (failures.length === 0) {
    console.log(
      `\n✓ chained MIRAS eval passed — ${fixture.themeWord} surfaced in the ` +
        `back half (7–11) and retained at scene 12, no forbidden tokens survived.`,
    );
    return;
  }

  printDiff(trace, failures);
  console.error(`\n✗ chained MIRAS eval failed (${failures.length} assertion(s))`);
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
