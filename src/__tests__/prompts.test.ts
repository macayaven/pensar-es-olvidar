import { describe, expect, it } from 'vitest';
import {
  mirasRetention,
  auditorQuery,
  judge,
  renderMirasRetention,
  renderAuditorQuery,
  renderJudge,
} from '../prompts';

// Spec §5: one canonical English template per prompt, with {{language}}
// interpolated at call time. GAP_ANALYSIS S1 + S4 — S4 (MIRAS lacks
// {{language}}) is subsumed here as a structural consequence of the move
// out of locale bundles.
describe('canonical prompt templates', () => {
  const templates = { mirasRetention, auditorQuery, judge } as const;

  const requiredTokens: Record<keyof typeof templates, readonly string[]> = {
    mirasRetention: ['{{abstract}}', '{{event}}', '{{language}}'],
    auditorQuery: ['{{question}}', '{{memory_dump}}', '{{language}}'],
    judge: ['{{transcript}}', '{{language}}'],
  };

  it.each(Object.keys(templates) as (keyof typeof templates)[])(
    'template %s is a non-trivial string (≥100 chars, no stubs)',
    (name) => {
      expect(typeof templates[name]).toBe('string');
      expect(templates[name].length).toBeGreaterThanOrEqual(100);
    },
  );

  it.each(Object.keys(templates) as (keyof typeof templates)[])(
    'template %s contains every required interpolation token',
    (name) => {
      for (const token of requiredTokens[name]) {
        expect(templates[name]).toContain(token);
      }
    },
  );
});

describe('prompt render functions', () => {
  it('renderMirasRetention substitutes abstract, event, language', () => {
    const out = renderMirasRetention({
      abstract: 'ABSTRACT_VAL',
      event: 'EVENT_VAL',
      language: 'LANG_VAL',
    });
    expect(out).toContain('ABSTRACT_VAL');
    expect(out).toContain('EVENT_VAL');
    expect(out).toContain('LANG_VAL');
    expect(out).not.toContain('{{abstract}}');
    expect(out).not.toContain('{{event}}');
    expect(out).not.toContain('{{language}}');
  });

  it('renderAuditorQuery substitutes question, memory_dump, language', () => {
    const out = renderAuditorQuery({
      question: 'Q_VAL',
      memory_dump: 'DUMP_VAL',
      language: 'LANG_VAL',
    });
    expect(out).toContain('Q_VAL');
    expect(out).toContain('DUMP_VAL');
    expect(out).toContain('LANG_VAL');
    expect(out).not.toContain('{{question}}');
    expect(out).not.toContain('{{memory_dump}}');
    expect(out).not.toContain('{{language}}');
  });

  it('renderJudge substitutes transcript and language', () => {
    const out = renderJudge({
      transcript: 'TRANSCRIPT_VAL',
      language: 'LANG_VAL',
    });
    expect(out).toContain('TRANSCRIPT_VAL');
    expect(out).toContain('LANG_VAL');
    expect(out).not.toContain('{{transcript}}');
    expect(out).not.toContain('{{language}}');
  });
});
