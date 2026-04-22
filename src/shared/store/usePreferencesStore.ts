import { create } from 'zustand';
import type { DietType, AllergenKey, PreferredStore } from '../../features/meal-plan/algorithm/types';

interface PreferencesState {
  hasCompletedSetup: boolean;
  householdSize: number;
  dietType: DietType;
  allergens: AllergenKey[];
  maxCookingTimeMinutes: number | null;
  preferredStore: PreferredStore;
  setHouseholdSize: (n: number) => void;
  setDietType: (d: DietType) => void;
  toggleAllergen: (a: AllergenKey) => void;
  setMaxCookingTime: (m: number | null) => void;
  setPreferredStore: (s: PreferredStore) => void;
  completeSetup: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hasCompletedSetup: false,
  householdSize: 2,
  dietType: 'omnivor',
  allergens: [],
  maxCookingTimeMinutes: 45,
  preferredStore: 'REWE',

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
}));
