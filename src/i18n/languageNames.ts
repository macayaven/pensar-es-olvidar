/**
 * Map BCP 47 locale codes (what react-i18next exposes via `i18n.language`)
 * to unambiguous English language names suitable for "Respond in {{language}}"
 * prompt interpolation. The picker keeps native-script labels for the UI;
 * this conversion only happens at the prompt boundary.
 *
 * Regional variants ("en-US", "pt-BR", "zh-Hans") are stripped to the prefix
 * before the hyphen and re-resolved. Unknown codes fall back to English —
 * Gemini handling an unsupported language as English is more graceful than
 * sending it the literal locale code.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Mandarin Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
};

export function localeToLanguageName(code: string): string {
  const base = code.split('-')[0].toLowerCase();
  return LANGUAGE_NAMES[base] ?? 'English';
}
