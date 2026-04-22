// =============================================================================
// SmartKüche — Algorithm Bridge
// =============================================================================
// Transforms between shopping-list types (snake_case, flat refs) used by the UI
// and algorithm types (camelCase, nested objects) used by generatePlan().
// =============================================================================

import type {
  Ingredient as ShopIngredient,
  Recipe as ShopRecipe,
  RecipeIngredient as ShopRecipeIngredient,
  MealPlan as ShopMealPlan,
  MealSlot as ShopMealSlot,
} from '../features/shopping-list/types';

import type {
  Ingredient as AlgoIngredient,
  Recipe as AlgoRecipe,
  RecipeIngredient as AlgoRecipeIngredient,
  MealPlan as AlgoMealPlan,
  MealSlot as AlgoMealSlot,
  PlanGenerationInput,
  UserPreferences,
  Household,
  UnitType,
  AisleCategory as AlgoAisleCategory,
  DietType,
  MealType,
  CostRating,
  Difficulty,
  DayOfWeek,
  PreferredStore,
  AllergenKey,
} from '../features/meal-plan/algorithm/types';

import { DEMO_RECIPES, DEMO_INGREDIENTS } from './demo-data';

// ---------------------------------------------------------------------------
// PreferencesSnapshot — matches usePreferencesStore state shape
// ---------------------------------------------------------------------------

export interface PreferencesSnapshot {
  householdSize: number;
  dietType: DietType;
  allergens: AllergenKey[];
  maxCookingTimeMinutes: number | null;
  preferredStore: PreferredStore;
}

// ---------------------------------------------------------------------------
// Shopping-list → Algorithm type transformers
// ---------------------------------------------------------------------------

/**
 * Transforms a shopping-list Ingredient to an algorithm Ingredient.
 *
 * Key mappings:
 *   name_de        → nameDe
 *   default_unit   → defaultUnit (cast to UnitType)
 *   category       → category (cast to AlgoAisleCategory)
 *   common_package_sizes → commonPackageSizes
 *   shelf_life_days → shelfLifeDays
 *   isSeasonal     → false (no data yet)
 *   seasonMonths   → [] (no data yet)
 */
function toAlgoIngredient(ing: ShopIngredient): AlgoIngredient {
  // Build commonPackageSizes as Partial<Record<PreferredStore, number[]>>
  const commonPackageSizes: Partial<Record<PreferredStore, number[]>> = {};
  for (const [store, sizes] of Object.entries(ing.common_package_sizes)) {
    commonPackageSizes[store as PreferredStore] = [...sizes];
  }

  return {
    id: ing.id,
    nameDe: ing.name_de,
    category: ing.category as AlgoAisleCategory,
    defaultUnit: ing.default_unit as UnitType,
    commonPackageSizes,
    shelfLifeDays: ing.shelf_life_days ?? null,
    isSeasonal: false,
    seasonMonths: [],
  };
}

/**
 * Transforms a shopping-list Recipe to an algorithm Recipe.
 *
 * Requires an ingredient map to resolve ingredient_id references to nested
 * AlgoIngredient objects (the algorithm expects pre-joined data).
 */
function toAlgoRecipe(
  recipe: ShopRecipe,
  ingredientMap: Map<string, AlgoIngredient>,
): AlgoRecipe {
  const ingredients: AlgoRecipeIngredient[] = recipe.ingredients.map(ri => {
    const algoIngredient = ingredientMap.get(ri.ingredient_id);
    if (!algoIngredient) {
      throw new Error(
        `Ingredient ${ri.ingredient_id} not found in ingredient map for recipe "${recipe.title_de}"`,
      );
    }
    return {
      id: ri.id,
      ingredient: algoIngredient,
      amount: ri.amount,
      unit: ri.unit as UnitType,
      preparationNote: ri.preparation_note ?? null,
    };
  });

  const prepTime = recipe.prep_time_minutes;
  const cookTime = recipe.cook_time_minutes;

  return {
    id: recipe.id,
    titleDe: recipe.title_de,
    descriptionDe: recipe.description_de ?? null,
    prepTimeMinutes: prepTime,
    cookTimeMinutes: cookTime,
    totalTimeMinutes: prepTime + cookTime,
    difficulty: (recipe.difficulty ?? 'mittel') as Difficulty,
    servingsDefault: recipe.servings_default,
    mealTypes: [...recipe.meal_type] as MealType[],
    dietTags: [...recipe.diet_tags] as DietType[],
    costRating: (recipe.cost_rating ?? 'mittel') as CostRating,
    costEstimateCentsPerServing: recipe.cost_estimate_cents_per_serving ?? null,
    isSeasonal: false,
    seasonMonths: [],
    ingredients,
    mainProtein: null,
    imageUrl: recipe.image_url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Algorithm → Shopping-list type transformers
// ---------------------------------------------------------------------------

/**
 * Transforms an algorithm MealPlan back to a shopping-list MealPlan for UI stores.
 *
 * Key mappings:
 *   dayOfWeek       → day_of_week
 *   mealType        → meal_type
 *   recipe (nested) → recipe_id (flat)
 *   isLocked        → is_locked
 *   servingsOverride → servings_override
 *   planId          → meal_plan_id
 *   householdId     → household_id
 *   weekStartDate   → week_start_date
 */
export function toShopMealPlan(algoPlan: AlgoMealPlan): ShopMealPlan {
  const slots: ShopMealSlot[] = algoPlan.slots.map(slot => ({
    id: slot.id,
    meal_plan_id: slot.planId,
    day_of_week: slot.dayOfWeek,
    meal_type: slot.mealType,
    recipe_id: slot.recipe?.id ?? null,
    is_locked: slot.isLocked,
    servings_override: slot.servingsOverride,
  }));

  return {
    id: algoPlan.id,
    household_id: algoPlan.householdId,
    week_start_date: algoPlan.weekStartDate,
    status: 'active' as const,
    slots,
  };
}

// ---------------------------------------------------------------------------
// Pool builders
// ---------------------------------------------------------------------------

/**
 * Builds the full algorithm recipe pool from DEMO data.
 *
 * Transforms all DEMO_INGREDIENTS to algorithm Ingredients, then transforms
 * all DEMO_RECIPES to algorithm Recipes with nested ingredient objects.
 */
export function buildAlgoRecipePool(): AlgoRecipe[] {
  // Build ingredient lookup map
  const ingredientMap = new Map<string, AlgoIngredient>();
  for (const shopIng of DEMO_INGREDIENTS) {
    ingredientMap.set(shopIng.id, toAlgoIngredient(shopIng));
  }

  // Transform recipes, skipping any with missing ingredients
  const algoRecipes: AlgoRecipe[] = [];
  for (const shopRecipe of DEMO_RECIPES) {
    try {
      algoRecipes.push(toAlgoRecipe(shopRecipe, ingredientMap));
    } catch {
      // Skip recipes with unresolved ingredients — this can happen when
      // seed data has ingredients not in the catalogue.
      console.warn(`Skipping recipe "${shopRecipe.title_de}" due to missing ingredient reference.`);
    }
  }

  return algoRecipes;
}

// ---------------------------------------------------------------------------
// Input builder
// ---------------------------------------------------------------------------

/**
 * Computes the ISO date string for the next Monday from today.
 * If today is Monday, returns today.
 */
function getNextMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  const yyyy = nextMonday.getFullYear();
  const mm = String(nextMonday.getMonth() + 1).padStart(2, '0');
  const dd = String(nextMonday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Builds a PlanGenerationInput from the preferences store snapshot.
 *
 * Assembles all inputs the algorithm needs:
 *   - UserPreferences with demo defaults for fields we don't track yet
 *   - Household with size from preferences
 *   - Recipe pool from DEMO data
 *   - Empty locked slots, recently used IDs, and pantry
 *   - Next Monday as the week start date
 */
export function buildPlanInput(prefs: PreferencesSnapshot): PlanGenerationInput {
  const preferences: UserPreferences = {
    userId: 'demo-user',
    dietType: prefs.dietType,
    allergies: prefs.allergens,
    excludedIngredients: [],
    maxCookingTimeMinutes: prefs.maxCookingTimeMinutes,
    budgetMode: 'normal',
    weeklyBudgetCents: null,
    preferredStore: prefs.preferredStore,
    updatedAt: new Date().toISOString(),
  };

  const household: Household = {
    id: 'demo-household',
    size: prefs.householdSize,
    adultsCount: prefs.householdSize,
    childrenCount: 0,
  };

  const recipePool = buildAlgoRecipePool();

  return {
    preferences,
    household,
    recipePool,
    lockedSlots: [],
    weekStartDate: getNextMonday(),
    recentlyUsedRecipeIds: [],
    pantryIngredientIds: [],
  };
}
