import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DerivedShoppingList,
  MealPlan,
  AisleGroup,
} from '../types';
import { deriveShoppingList } from '../derive-shopping-list';
import { DEMO_RECIPES, DEMO_INGREDIENTS } from '../../../data/demo-data';
import { useMealPlanStore } from '../../meal-plan/store/useMealPlanStore';

interface ShoppingListState {
  shoppingList: DerivedShoppingList | null;
  checkedItemIds: string[];
  deriveFromPlan: (plan: MealPlan) => void;
  toggleItem: (itemId: string) => void;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      shoppingList: null,
      checkedItemIds: [],

      deriveFromPlan: (plan: MealPlan) => {
        const derived = deriveShoppingList(plan, DEMO_RECIPES, DEMO_INGREDIENTS, 'REWE');
        // Reapply checked state from persisted IDs
        const checked = new Set(get().checkedItemIds);
        const groupsWithChecks: AisleGroup[] = derived.groups.map(group => ({
          ...group,
          items: group.items.map(item =>
            checked.has(item.id) ? { ...item, is_checked: true } : item
          ),
        }));
        set({
          shoppingList: {
            ...derived,
            groups: groupsWithChecks,
          },
        });
      },

      toggleItem: (itemId: string) => {
        const current = get().shoppingList;
        if (!current) return;

        const currentChecked = new Set(get().checkedItemIds);
        if (currentChecked.has(itemId)) {
          currentChecked.delete(itemId);
        } else {
          currentChecked.add(itemId);
        }

        const updatedGroups: AisleGroup[] = current.groups.map(group => ({
          ...group,
          items: group.items.map(item =>
            item.id === itemId
              ? { ...item, is_checked: !item.is_checked }
              : item
          ),
        }));

        set({
          checkedItemIds: [...currentChecked],
          shoppingList: {
            ...current,
            groups: updatedGroups,
          },
        });
      },
    }),
    {
      name: 'smartkueche-shoppinglist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        checkedItemIds: state.checkedItemIds,
      }),
    }
  )
);

// Subscribe to meal plan changes and re-derive the shopping list.
let previousPlan = useMealPlanStore.getState().activePlan;
useMealPlanStore.subscribe((state) => {
  if (state.activePlan !== previousPlan) {
    previousPlan = state.activePlan;
    // Clear checked items when plan changes (new plan = new shopping list)
    useShoppingListStore.setState({ checkedItemIds: [] });
    useShoppingListStore.getState().deriveFromPlan(state.activePlan);
  }
});

// Derive initial shopping list from the current plan.
useShoppingListStore.getState().deriveFromPlan(useMealPlanStore.getState().activePlan);
