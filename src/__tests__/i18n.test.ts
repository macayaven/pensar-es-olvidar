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
