import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from '../../../shared/lib/storage';
import { syncMealPlan } from '../../../shared/lib/sync';
import type { MealPlan } from '../../shopping-list/types';
import { DEMO_PLAN } from '../../../data/demo-plan';
import { generatePlan } from '../algorithm/plan-generator';
import { buildPlanInput, toShopMealPlan } from '../../../data/algorithm-bridge';
import { usePreferencesStore } from '../../../shared/store/usePreferencesStore';
import { usePantryStore } from '../../pantry/store/usePantryStore';

interface MealPlanState {
  activePlan: MealPlan;
  isGenerating: boolean;
  generationError: string | null;
  regeneratePlan: () => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set) => ({
      activePlan: DEMO_PLAN,
      isGenerating: false,
      generationError: null,

      regeneratePlan: () => {
        set({ isGenerating: true, generationError: null });

        setTimeout(() => {
          try {
            const prefs = usePreferencesStore.getState();
            const pantryState = usePantryStore.getState();
            const pantryItemsForAlgo = pantryState.items.map((pi) => {
              let daysUntilExpiry: number | null = null;
              if (pi.expiresAt) {
                const diffMs = new Date(pi.expiresAt).getTime() - Date.now();
                daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              }
              return {
                ingredientId: pi.ingredientId,
                amount: pi.amount,
                daysUntilExpiry,
              };
            });

            const input = buildPlanInput({
              householdSize: prefs.householdSize,
              dietType: prefs.dietType,
              allergens: prefs.allergens,
              maxCookingTimeMinutes: prefs.maxCookingTimeMinutes,
              preferredStore: prefs.preferredStore,
            });

            // Add pantry items for algorithm scoring
            (input as any).pantryItems = pantryItemsForAlgo;

            const result = generatePlan(input);
            const shopPlan = toShopMealPlan(result.plan);

            set({
              activePlan: shopPlan,
              isGenerating: false,
              generationError: null,
            });

            // Sync to Supabase (fire-and-forget)
            syncMealPlan(shopPlan);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Plan generation failed';
            console.error('Plan generation error:', msg);
            set({
              isGenerating: false,
              generationError: msg,
            });
          }
        }, 50);
      },
    }),
    {
      name: 'smartkueche-mealplan',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        activePlan: state.activePlan,
      }),
    }
  )
);
