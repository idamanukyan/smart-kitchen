import { SEED_INGREDIENTS } from '../../data/seed-ingredients';
import { SEED_RECIPES } from '../../data/seed-recipes-batch1';
import type {
  Ingredient,
  Recipe,
  RecipeIngredient,
  Unit,
  AisleCategory,
} from '../features/shopping-list/types';

// Transform seed ingredients into the shopping-list Ingredient type.
// Each ingredient gets a stable ID derived from its name.
function makeIngredientId(name: string): string {
  return `ing-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-äöüß]/g, '')}`;
}

function transformIngredient(raw: typeof SEED_INGREDIENTS[number]): Ingredient {
  const id = makeIngredientId(raw.name_de);

  // Transform package sizes from array of {size, unit, price_cents} to
  // the Record<string, number[]> format the shopping-list types expect.
  // Seed data doesn't have per-store sizes, so we assign all to 'REWE'.
  const packageSizeValues = raw.common_package_sizes.map(ps => ps.size);
  const priceLookup: Record<number, number> = {};
  for (const ps of raw.common_package_sizes) {
    priceLookup[ps.size] = ps.price_cents;
  }

  return {
    id,
    name_de: raw.name_de,
    category: raw.category as AisleCategory,
    default_unit: raw.default_unit as Unit,
    common_package_sizes: packageSizeValues.length > 0 ? { REWE: packageSizeValues } : {},
    price_per_package_cents: Object.keys(priceLookup).length > 0
      ? { REWE: priceLookup }
      : undefined,
    shelf_life_days: raw.shelf_life_days,
    storage_type: raw.storage_type,
  };
}

// Build the ingredient catalogue — transformed once at import time.
export const DEMO_INGREDIENTS: Ingredient[] = SEED_INGREDIENTS.map(transformIngredient);

// Lookup map: ingredient name (lowercase) → Ingredient
const ingredientByName = new Map<string, Ingredient>(
  DEMO_INGREDIENTS.map(i => [i.name_de.toLowerCase(), i])
);

// Helper: find ingredient by German name (case-insensitive)
function findIngredient(nameDe: string): Ingredient | undefined {
  return ingredientByName.get(nameDe.toLowerCase());
}

function makeRecipeId(title: string, index: number): string {
  return `rec-${index}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-äöüß]/g, '')}`;
}

function transformRecipe(raw: typeof SEED_RECIPES[number], index: number): Recipe {
  const id = makeRecipeId(raw.title_de, index);

  const ingredients: RecipeIngredient[] = [];
  raw.ingredients.forEach((ri, riIndex) => {
    const ingredient = findIngredient(ri.ingredient_name_de);
    if (!ingredient) {
      // Skip ingredients not in our catalogue — this can happen for
      // spices/garnishes that weren't included in seed-ingredients.
      return;
    }
    const entry: RecipeIngredient = {
      id: `${id}-ri-${riIndex}`,
      recipe_id: id,
      ingredient_id: ingredient.id,
      amount: ri.amount,
      unit: ri.unit as Unit,
      ...(ri.preparation_note !== undefined ? { preparation_note: ri.preparation_note } : {}),
    };
    ingredients.push(entry);
  });

  return {
    id,
    title_de: raw.title_de,
    description_de: raw.description_de,
    servings_default: raw.servings_default,
    prep_time_minutes: raw.prep_time_minutes,
    cook_time_minutes: raw.cook_time_minutes,
    diet_tags: raw.diet_tags,
    meal_type: raw.meal_type.filter(
      (mt): mt is Recipe['meal_type'][number] =>
        mt === 'Frühstück' || mt === 'Mittagessen' || mt === 'Abendessen' || mt === 'Abendbrot'
    ),
    cost_estimate_cents_per_serving: raw.cost_estimate_cents_per_serving,
    image_url: raw.image_url ?? undefined,
    ingredients,
  };
}

// Build the recipe catalogue.
export const DEMO_RECIPES: Recipe[] = SEED_RECIPES.map(transformRecipe);

// Quick lookup: recipe ID → Recipe
export const RECIPE_BY_ID = new Map<string, Recipe>(
  DEMO_RECIPES.map(r => [r.id, r])
);
