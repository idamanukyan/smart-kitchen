import { create } from 'zustand';

export type Locale = 'de' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'de',
  setLocale: (locale: Locale) => set({ locale }),
}));
