/**
 * Chained MIRAS retention eval — measures the artifact's load-bearing claim.
 *
 * Runs the canonical MIRAS retention prompt over 12 chained events from the
 * threshold deck, threading each output forward as the next call's {{abstract}}.
 * Then asserts two properties:
 *
 *   continuity — the latent theme word ("threshold") appears in the abstract
 *                at events 8 and 12. By scene 8, MIRAS has seen enough liminal
 *                imagery (door ajar, half-open book, stairwell landing) that
 *                surfacing the theme is a reasonable demand on a 280-token
 *                abstract memory.
 *
 *   forgetting — none of the forbidden surface-detail tokens from events 1–4
 *                (specific positions like "32%", ornamental nouns like
 *                "ajar"/"puddle"/"napkin") survive in the event-12 abstract.
 *                The MIRAS prompt explicitly says "Discard: exact times,
 *                positions, colors, surface detail." Surviving tokens mean
 *                MIRAS is summarizing, not abstracting.
 *
 * Failure surfaces a diff: the abstracts at events 8 and 12, the missing
 * theme word, and any surviving forbidden tokens. Red CI without explanation
 * is hostile; red CI with a diff is teaching.
 *
 * See evals/CHAINED_EVAL_DECISION.md for why this is a sidecar script rather
 * than a Promptfoo provider.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures/threshold-deck-12-events.json');
const PROMPT_PATH = join(__dirname, 'prompts/miras-retention.txt');
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
const promptTemplate = readFileSync(PROMPT_PATH, 'utf8');

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
    const prompt = promptTemplate
      .replace('{{abstract}}', abstract)
      .replace('{{event}}', event.event)
      .replace('{{language}}', 'English');

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) {
      throw new Error(`Empty response from Gemini at scene ${event.scene}`);
    }
    abstract = text;
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
  for (const targetScene of [8, 12]) {
    const entry = trace.find((t) => t.scene === targetScene);
    if (!entry) {
      failures.push({
        type: 'continuity',
        scene: targetScene,
        message: `no event ${targetScene} in trace`,
      });
      continue;
    }
    if (!re.test(entry.abstract)) {
      failures.push({
        type: 'continuity',
        scene: targetScene,
        message:
          `event ${targetScene} abstract does not contain theme word "${themeWord}".\n` +
          `    abstract: ${entry.abstract}`,
      });
    }
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
  interesting.add(8);
  interesting.add(12);
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
      `\n✓ chained MIRAS eval passed — theme "${fixture.themeWord}" surfaced by scene 8 ` +
        `and retained at scene 12, no forbidden tokens survived.`,
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
