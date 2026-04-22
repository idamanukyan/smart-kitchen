import type { MealPlan, MealSlot, MealType } from '../features/shopping-list/types';
import { DEMO_RECIPES } from './demo-data';

// Pick recipes by meal type for the demo plan.
function recipesByMealType(mealType: MealType) {
  return DEMO_RECIPES.filter(r => r.meal_type.includes(mealType));
}

function buildDemoPlan(): MealPlan {
  const mittagRecipes = recipesByMealType('Mittagessen');
  const abendRecipes = recipesByMealType('Abendessen');
  const abendbrotRecipes = recipesByMealType('Abendbrot');

  const slots: MealSlot[] = [];
  let slotIndex = 0;

  // Abendbrot on Wednesday (2) and Friday (4), Abendessen on other days.
  const abendbrotDays = new Set([2, 4]);

  for (let day = 0; day <= 6; day++) {
    // Mittagessen
    const mittagRecipe = mittagRecipes[day % mittagRecipes.length];
    if (mittagRecipe) {
      slots.push({
        id: `demo-slot-${slotIndex++}`,
        meal_plan_id: 'demo-plan-1',
        day_of_week: day as MealSlot['day_of_week'],
        meal_type: 'Mittagessen',
        recipe_id: mittagRecipe.id,
        is_locked: false,
        servings_override: null,
      });
    }

    // Evening meal
    if (abendbrotDays.has(day)) {
      const recipe = abendbrotRecipes[(day === 2 ? 0 : 1) % Math.max(abendbrotRecipes.length, 1)];
      if (recipe) {
        slots.push({
          id: `demo-slot-${slotIndex++}`,
          meal_plan_id: 'demo-plan-1',
          day_of_week: day as MealSlot['day_of_week'],
          meal_type: 'Abendbrot',
          recipe_id: recipe.id,
          is_locked: false,
          servings_override: null,
        });
      }
    } else {
      const recipe = abendRecipes[day % Math.max(abendRecipes.length, 1)];
      if (recipe) {
        slots.push({
          id: `demo-slot-${slotIndex++}`,
          meal_plan_id: 'demo-plan-1',
          day_of_week: day as MealSlot['day_of_week'],
          meal_type: 'Abendessen',
          recipe_id: recipe.id,
          is_locked: false,
          servings_override: null,
        });
      }
    }
  }

  // Calculate week start date (next Monday from today)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  const weekStart = monday.toISOString().split('T')[0];

  return {
    id: 'demo-plan-1',
    household_id: 'demo-household',
    week_start_date: weekStart,
    status: 'active',
    slots,
  };
}

export const DEMO_PLAN: MealPlan = buildDemoPlan();
