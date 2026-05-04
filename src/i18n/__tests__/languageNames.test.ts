import { describe, expect, it } from 'vitest';
import { localeToLanguageName } from '../languageNames';

// `i18n.language` from react-i18next is a BCP 47 locale code ("en", "zh",
// occasionally "en-US"), not a human-readable language name. The Gemini
// prompts ask "Respond in {{language}}" — passing "zh" produces "Respond
// in zh", which is genuinely ambiguous to the model. This module is the
// boundary that converts locale codes to unambiguous English names.
describe('localeToLanguageName', () => {
  it.each([
    ['en', 'English'],
    ['es', 'Spanish'],
    ['zh', 'Mandarin Chinese'],
    ['hi', 'Hindi'],
    ['pt', 'Portuguese'],
  ])('maps supported locale %s to %s', (code, expected) => {
    expect(localeToLanguageName(code)).toBe(expected);
  });

  it('strips regional variant before mapping (en-US → English)', () => {
    expect(localeToLanguageName('en-US')).toBe('English');
    expect(localeToLanguageName('pt-BR')).toBe('Portuguese');
    expect(localeToLanguageName('zh-Hans')).toBe('Mandarin Chinese');
  });

  it('falls back to English for unknown codes', () => {
    expect(localeToLanguageName('fr')).toBe('English');
    expect(localeToLanguageName('xx-YY')).toBe('English');
    expect(localeToLanguageName('')).toBe('English');
  });
});
