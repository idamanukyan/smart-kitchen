/**
 * Combined seed recipes — all 50 German recipes for SmartKüche.
 *
 * Split into two files for maintainability:
 * - batch1a: German classics, modern staples, quick weeknight meals
 * - batch1b: Abendbrot/cold meals, vegetarian/vegan, family-friendly
 */

export type { RecipeData, RecipeIngredientData } from './seed-recipes-batch1a';

import { SEED_RECIPES_BATCH1A } from './seed-recipes-batch1a';
import { SEED_RECIPES_BATCH1B } from './seed-recipes-batch1b';

export const SEED_RECIPES: typeof SEED_RECIPES_BATCH1A = [
  ...SEED_RECIPES_BATCH1A,
  ...SEED_RECIPES_BATCH1B,
];

export { SEED_RECIPES_BATCH1A, SEED_RECIPES_BATCH1B };
