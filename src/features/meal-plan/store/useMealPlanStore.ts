import { create } from 'zustand';
import type { MealPlan } from '../../shopping-list/types';
import { DEMO_PLAN } from '../../../data/demo-plan';

interface MealPlanState {
  activePlan: MealPlan;
  isGenerating: boolean;
  regeneratePlan: () => void;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  activePlan: DEMO_PLAN,
  isGenerating: false,

  regeneratePlan: () => {
    set({ isGenerating: true });

    // Use setTimeout to avoid blocking the UI thread during generation.
    setTimeout(() => {
      try {
        // For now, shuffle the demo plan slots to simulate regeneration.
        // Full algorithm integration requires transforming to camelCase types
        // which is deferred to a future task.
        const currentPlan = useMealPlanStore.getState().activePlan;
        const shuffledSlots = [...currentPlan.slots].sort(() => Math.random() - 0.5);

        // Reassign slot IDs and day_of_week to maintain structure
        const mittagSlots = shuffledSlots.filter(s => s.meal_type === 'Mittagessen');
        const eveningSlots = shuffledSlots.filter(s => s.meal_type !== 'Mittagessen');

        const newSlots: MealPlan['slots'][number][] = [];
        let slotIndex = 0;
        const abendbrotDays = new Set([2, 4]);

        for (let day = 0; day <= 6; day++) {
          // Mittagessen
          const mittagSource = mittagSlots[day % mittagSlots.length];
          if (mittagSource) {
            newSlots.push({
              ...mittagSource,
              id: `regen-slot-${slotIndex++}`,
              day_of_week: day as MealPlan['slots'][number]['day_of_week'],
              meal_type: 'Mittagessen' as const,
            });
          }

          // Evening
          const eveningSource = eveningSlots[day % eveningSlots.length];
          if (eveningSource) {
            newSlots.push({
              ...eveningSource,
              id: `regen-slot-${slotIndex++}`,
              day_of_week: day as MealPlan['slots'][number]['day_of_week'],
              meal_type: abendbrotDays.has(day) ? 'Abendbrot' as const : 'Abendessen' as const,
            });
          }
        }

        set({
          activePlan: {
            ...currentPlan,
            slots: newSlots,
          },
          isGenerating: false,
        });
      } catch {
        set({ isGenerating: false });
      }
    }, 100);
  },
}));
