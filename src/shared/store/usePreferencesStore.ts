import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from '../lib/storage';
import { syncPreferences } from '../lib/sync';
import type { DietType, AllergenKey, PreferredStore } from '../../features/meal-plan/algorithm/types';

export type Locale = 'de' | 'en';

interface PreferencesState {
  hasCompletedSetup: boolean;
  locale: Locale;
  householdSize: number;
  dietType: DietType;
  allergens: AllergenKey[];
  maxCookingTimeMinutes: number | null;
  preferredStore: PreferredStore;
  setLocale: (locale: Locale) => void;
  setHouseholdSize: (n: number) => void;
  setDietType: (d: DietType) => void;
  toggleAllergen: (a: AllergenKey) => void;
  setMaxCookingTime: (m: number | null) => void;
  setPreferredStore: (s: PreferredStore) => void;
  completeSetup: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      hasCompletedSetup: false,
      locale: 'de',
      householdSize: 2,
      dietType: 'omnivor',
      allergens: [],
      maxCookingTimeMinutes: 45,
      preferredStore: 'REWE',

      setLocale: (locale: Locale) => set({ locale }),
      setHouseholdSize: (n: number) => set({ householdSize: Math.max(1, Math.min(8, n)) }),
      setDietType: (d: DietType) => set({ dietType: d }),
      toggleAllergen: (a: AllergenKey) => {
        const current = get().allergens;
        if (current.includes(a)) {
          set({ allergens: current.filter(x => x !== a) });
        } else {
          set({ allergens: [...current, a] });
        }
      },
      setMaxCookingTime: (m: number | null) => set({ maxCookingTimeMinutes: m }),
      setPreferredStore: (s: PreferredStore) => set({ preferredStore: s }),
      completeSetup: () => set({ hasCompletedSetup: true }),
    }),
    {
      name: 'smartkueche-preferences',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        hasCompletedSetup: state.hasCompletedSetup,
        locale: state.locale,
        householdSize: state.householdSize,
        dietType: state.dietType,
        allergens: state.allergens,
        maxCookingTimeMinutes: state.maxCookingTimeMinutes,
        preferredStore: state.preferredStore,
      }),
    }
  )
);

// Sync preferences to Supabase on changes (debounced)
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
usePreferencesStore.subscribe((state) => {
  if (!state.hasCompletedSetup) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncPreferences({
      dietType: state.dietType,
      allergens: state.allergens,
      maxCookingTimeMinutes: state.maxCookingTimeMinutes,
      preferredStore: state.preferredStore,
      householdSize: state.householdSize,
    });
  }, 1000);
});
