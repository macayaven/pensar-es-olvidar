/**
 * Canonical Gemini prompt templates for MIRAS retention, the auditor, and the
 * judge. Spec §5: one English template per prompt with {{language}}
 * interpolated at call time — the model handles language switching natively
 * rather than maintaining N translated copies.
 *
 * Wording sourced from spec §7. The chained MIRAS eval's existing trace was
 * recorded against this exact MIRAS retention wording, so replay-mode
 * assertions still hold post-S1.
 */

export const mirasRetention = `You are a memory with a fixed budget of 280 tokens.
Your current memory: {{abstract}}
New perceived event: {{event}}

Rewrite your memory incorporating what is essential about the new event.
You MUST stay under 280 tokens. To make room, you must forget.

Preserve: patterns, relationships, themes, what repeats.
Discard: exact times, positions, colors, surface detail.

Respond in {{language}}.
Return only the new memory. No explanation.`;

export const auditorQuery = `You are interrogating a memory. You do not know the original events, only what the memory responds.

Question: {{question}}

Memory being interrogated (this is all you have to work with):
{{memory_dump}}

Respond in first person, as if you were the memory itself.
If you cannot generalize, do not generalize. If you only have details, give details.
Be faithful to your nature.

Respond in {{language}}.`;

export const judge = `You have witnessed a trial between two memories. Here are the four questions and the four answers from each.

{{transcript}}

Score each memory from 1 to 10 on four dimensions:
- specificity (remembers exact details)
- generalization (extracts patterns)
- coherence (maintains a thread)
- understanding (understands, not just remembers)

Return strict JSON in this exact shape:
{
  "funes": { "specificity": <int>, "generalization": <int>, "coherence": <int>, "understanding": <int> },
  "miras": { "specificity": <int>, "generalization": <int>, "coherence": <int>, "understanding": <int> },
  "verdict": "<one final sentence in {{language}}>"
}`;

export function renderMirasRetention(vars: {
  abstract: string;
  event: string;
  language: string;
}): string {
  return mirasRetention
    .replace('{{abstract}}', vars.abstract)
    .replace('{{event}}', vars.event)
    .replace('{{language}}', vars.language);
}

export function renderAuditorQuery(vars: {
  question: string;
  memory_dump: string;
  language: string;
}): string {
  return auditorQuery
    .replace('{{question}}', vars.question)
    .replace('{{memory_dump}}', vars.memory_dump)
    .replace('{{language}}', vars.language);
}

export function renderJudge(vars: { transcript: string; language: string }): string {
  return judge.replace('{{transcript}}', vars.transcript).replace('{{language}}', vars.language);
}

// Promptfoo function-prompt loader convention: receives `{ vars }` and must
// return a string. Single-purpose adapter for evals/promptfoo.miras.yaml; the
// app code calls renderMirasRetention directly with flat args.
export function mirasRetentionPrompt({
  vars,
}: {
  vars: { abstract: string; event: string; language: string };
}): string {
  return renderMirasRetention(vars);
}
