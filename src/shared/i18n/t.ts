import { DE } from './de';
import { EN } from './en';
import { useLanguageStore } from './useLanguage';
import type { Strings } from './de';

const STRINGS: Record<string, Strings> = { de: DE, en: EN };

export function useTranslation(): Strings {
  const locale = useLanguageStore((state) => state.locale);
  return STRINGS[locale] ?? DE;
}
