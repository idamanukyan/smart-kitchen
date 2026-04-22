import { create } from 'zustand';
import { usePreferencesStore } from '../store/usePreferencesStore';

export type Locale = 'de' | 'en';

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: usePreferencesStore.getState().locale,
  setLocale: (locale: Locale) => {
    usePreferencesStore.getState().setLocale(locale);
    set({ locale });
  },
}));

// Sync from preferences → language store (handles hydration from AsyncStorage)
usePreferencesStore.subscribe((state) => {
  if (state.locale !== useLanguageStore.getState().locale) {
    useLanguageStore.setState({ locale: state.locale });
  }
});
