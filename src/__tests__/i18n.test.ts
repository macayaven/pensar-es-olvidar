import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import zh from '../i18n/locales/zh.json';
import hi from '../i18n/locales/hi.json';
import pt from '../i18n/locales/pt.json';

type LocaleBundle = typeof en;

const locales: Record<string, LocaleBundle> = { en, es, zh, hi, pt };

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc !== null && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
}

describe('i18n locale shape', () => {
  const enKeys = flatten(en).sort();

  it.each(Object.keys(locales).filter((l) => l !== 'en'))(
    'locale %s has the same key set as en',
    (lang) => {
      const langKeys = flatten(locales[lang]).sort();
      expect(langKeys).toEqual(enKeys);
    },
  );

  it.each(Object.keys(locales))('locale %s has no empty string values', (lang) => {
    const empties = flatten(locales[lang]).filter((path) => {
      const value = getByPath(locales[lang], path);
      return typeof value === 'string' && value.trim().length === 0;
    });
    expect(empties).toEqual([]);
  });
});

// V0 carries prompt templates inside locale bundles. GAP_ANALYSIS.md S1
// flagged that ZH/HI/PT shipped truncated stubs (e.g. literal text:
// "You are a memory with a fixed budget of 280 tokens..."). The fix
// path is to externalise prompts to src/prompts.ts as a single
// canonical English template — once that lands, this whole describe
// block can be deleted.
describe('legacy: prompt templates inside locale bundles', () => {
  const promptKeys = ['prompts.miras_retention', 'prompts.auditor_query', 'prompts.judge'] as const;

  const requiredTokens: Record<(typeof promptKeys)[number], string[]> = {
    'prompts.miras_retention': ['{{abstract}}', '{{event}}'],
    'prompts.auditor_query': ['{{question}}', '{{memory_dump}}', '{{language}}'],
    'prompts.judge': ['{{transcript}}', '{{language}}'],
  };

  // Locales whose prompts are real strings (passed manual review). EN
  // is canonical; ES is fully translated. These get the strict checks.
  const realPromptLocales = ['en', 'es'] as const;

  // Locales whose prompts are placeholder stubs awaiting GAP_ANALYSIS
  // S1 cleanup. Asserted-broken below so that when S1 fixes the stubs,
  // this block fails and forces its own deletion (a tripwire).
  const stubPromptLocales = ['zh', 'hi', 'pt'] as const;

  it.each(realPromptLocales.flatMap((lang) => promptKeys.map((key) => [lang, key] as const)))(
    'real-prompt locale %s key %s contains every required interpolation token',
    (lang, key) => {
      const template = getByPath(locales[lang], key);
      expect(typeof template).toBe('string');
      for (const token of requiredTokens[key]) {
        expect(template as string).toContain(token);
      }
    },
  );

  it.each(realPromptLocales.flatMap((lang) => promptKeys.map((key) => [lang, key] as const)))(
    'real-prompt locale %s key %s is at least 100 characters',
    (lang, key) => {
      const template = getByPath(locales[lang], key);
      expect(typeof template).toBe('string');
      expect((template as string).length).toBeGreaterThanOrEqual(100);
    },
  );

  // TRIPWIRE: these assertions document that ZH/HI/PT prompts are
  // currently broken. When S1 lands, the prompts will become real and
  // these tests will FAIL (because length will exceed 100). At that
  // moment, delete this entire `legacy:` describe — the prompts have
  // moved out of locale files and the structural guards above are no
  // longer relevant.
  it.each(stubPromptLocales.flatMap((lang) => promptKeys.map((key) => [lang, key] as const)))(
    'stub locale %s key %s is still stub-truncated (delete when S1 lands)',
    (lang, key) => {
      const template = getByPath(locales[lang], key);
      expect(typeof template).toBe('string');
      expect((template as string).length).toBeLessThan(100);
    },
  );
});
