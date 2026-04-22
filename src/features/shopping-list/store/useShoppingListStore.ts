import { create } from 'zustand';
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
  deriveFromPlan: (plan: MealPlan) => void;
  toggleItem: (itemId: string) => void;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  shoppingList: null,

  deriveFromPlan: (plan: MealPlan) => {
    const derived = deriveShoppingList(plan, DEMO_RECIPES, DEMO_INGREDIENTS, 'REWE');
    set({ shoppingList: derived });
  },

  toggleItem: (itemId: string) => {
    const current = get().shoppingList;
    if (!current) return;

    const updatedGroups: AisleGroup[] = current.groups.map(group => ({
      ...group,
      items: group.items.map(item =>
        item.id === itemId
          ? { ...item, is_checked: !item.is_checked }
          : item
      ),
    }));

    set({
      shoppingList: {
        ...current,
        groups: updatedGroups,
      },
    });
  },
}));

// Subscribe to meal plan changes and re-derive the shopping list.
useMealPlanStore.subscribe(
  (state) => {
    useShoppingListStore.getState().deriveFromPlan(state.activePlan);
  }
);

// Derive initial shopping list from the demo plan.
useShoppingListStore.getState().deriveFromPlan(useMealPlanStore.getState().activePlan);
