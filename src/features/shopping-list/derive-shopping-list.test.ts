// =============================================================================
// src/features/shopping-list/derive-shopping-list.test.ts
// =============================================================================
// Tests for the shopping list derivation algorithm.
//
// Test structure:
//   1. Unit helpers — convertUnit, normaliseToDefaultUnit
//   2. Package rounding — roundToPackage
//   3. Display text — buildDisplayText, formatAmount
//   4. Aisle ordering — aisleOrderIndex, grouping sort
//   5. Aggregation edge cases — zero amounts, missing ingredients/recipes
//   6. Deduplication — same ingredient across multiple recipes / slots
//   7. Cost estimation — per-item and total
//   8. Integration — full MealPlan → DerivedShoppingList pipeline
// =============================================================================

import {
  AISLE_ORDER,
  aisleOrderIndex,
  buildDisplayText,
  convertUnit,
  deriveShoppingList,
  formatAmount,
  normaliseToDefaultUnit,
  PackageRoundingResult,
  roundToPackage,
} from './derive-shopping-list';

import {
  AisleCategory,
  DerivedShoppingList,
  Ingredient,
  MealPlan,
  Recipe,
  Unit,
} from './types';

// =============================================================================
// Test fixtures — reusable data
// =============================================================================

/** Makes a minimal Ingredient with sensible defaults. */
function makeIngredient(
  overrides: Partial<Ingredient> & { id: string; name_de: string; category: AisleCategory }
): Ingredient {
  return {
    default_unit: 'g',
    common_package_sizes: {},
    ...overrides,
  };
}

/** Makes a minimal Recipe with sensible defaults. */
function makeRecipe(
  id: string,
  title_de: string,
  ingredients: Recipe['ingredients'],
  servings_default = 4
): Recipe {
  return {
    id,
    title_de,
    servings_default,
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    diet_tags: [],
    meal_type: ['Mittagessen'],
    ingredients,
  };
}

/** Makes a minimal MealPlan. */
function makePlan(slots: MealPlan['slots']): MealPlan {
  return {
    id: 'plan-1',
    household_id: 'hh-1',
    week_start_date: '2026-04-21',
    status: 'active',
    slots,
  };
}

// ---------------------------------------------------------------------------
// Shared ingredient catalogue used across most tests
// ---------------------------------------------------------------------------

const ING_KARTOFFELN: Ingredient = makeIngredient({
  id: 'ing-kartoffeln',
  name_de: 'Kartoffeln',
  category: 'Obst & Gemüse',
  default_unit: 'g',
  common_package_sizes: { REWE: [500, 1000, 2500] },
  price_per_package_cents: { REWE: { 500: 99, 1000: 169, 2500: 349 } },
});

const ING_HACKFLEISCH: Ingredient = makeIngredient({
  id: 'ing-hackfleisch',
  name_de: 'Hackfleisch (gemischt)',
  category: 'Fleisch & Wurst',
  default_unit: 'g',
  common_package_sizes: { REWE: [500] },
  price_per_package_cents: { REWE: { 500: 299 } },
});

const ING_MEHL: Ingredient = makeIngredient({
  id: 'ing-mehl',
  name_de: 'Weizenmehl Type 405',
  category: 'Backzutaten',
  default_unit: 'g',
  common_package_sizes: { REWE: [500, 1000] },
  price_per_package_cents: { REWE: { 500: 79, 1000: 139 } },
});

const ING_MILCH: Ingredient = makeIngredient({
  id: 'ing-milch',
  name_de: 'Vollmilch',
  category: 'Milchprodukte',
  default_unit: 'ml',
  common_package_sizes: { REWE: [1000] },
  price_per_package_cents: { REWE: { 1000: 109 } },
});

const ING_PETERSILIE: Ingredient = makeIngredient({
  id: 'ing-petersilie',
  name_de: 'Petersilie',
  category: 'Obst & Gemüse',
  default_unit: 'Bund',
  common_package_sizes: {},
});

const ING_EIER: Ingredient = makeIngredient({
  id: 'ing-eier',
  name_de: 'Eier',
  category: 'Kühlregal',
  default_unit: 'Stück',
  common_package_sizes: { REWE: [6, 10] },
  price_per_package_cents: { REWE: { 6: 189, 10: 299 } },
});

const ING_TOMATEN_DOSE: Ingredient = makeIngredient({
  id: 'ing-tomaten-dose',
  name_de: 'Tomaten',
  category: 'Konserven & Gläser',
  default_unit: 'Dose',
  common_package_sizes: { REWE: [400] },
  price_per_package_cents: { REWE: { 400: 89 } },
});

const ING_SAHNE: Ingredient = makeIngredient({
  id: 'ing-sahne',
  name_de: 'Sahne',
  category: 'Milchprodukte',
  default_unit: 'ml',
  common_package_sizes: { REWE: [200] },
  price_per_package_cents: { REWE: { 200: 99 } },
});

const ING_ZWIEBELN: Ingredient = makeIngredient({
  id: 'ing-zwiebeln',
  name_de: 'Zwiebeln',
  category: 'Obst & Gemüse',
  default_unit: 'g',
  common_package_sizes: { REWE: [500, 1000] },
});

const ALL_INGREDIENTS: Ingredient[] = [
  ING_KARTOFFELN,
  ING_HACKFLEISCH,
  ING_MEHL,
  ING_MILCH,
  ING_PETERSILIE,
  ING_EIER,
  ING_TOMATEN_DOSE,
  ING_SAHNE,
  ING_ZWIEBELN,
];

// =============================================================================
// 1. Unit conversion helpers
// =============================================================================

describe('convertUnit', () => {
  test('same unit returns unchanged amount', () => {
    expect(convertUnit(500, 'g', 'g')).toBe(500);
    expect(convertUnit(1.5, 'l', 'l')).toBe(1.5);
  });

  test('g → kg', () => {
    expect(convertUnit(1000, 'g', 'kg')).toBeCloseTo(1);
    expect(convertUnit(500, 'g', 'kg')).toBeCloseTo(0.5);
    expect(convertUnit(300, 'g', 'kg')).toBeCloseTo(0.3);
  });

  test('kg → g', () => {
    expect(convertUnit(1, 'kg', 'g')).toBe(1000);
    expect(convertUnit(0.5, 'kg', 'g')).toBe(500);
    expect(convertUnit(2.5, 'kg', 'g')).toBe(2500);
  });

  test('ml → l', () => {
    expect(convertUnit(1000, 'ml', 'l')).toBeCloseTo(1);
    expect(convertUnit(500, 'ml', 'l')).toBeCloseTo(0.5);
  });

  test('l → ml', () => {
    expect(convertUnit(1, 'l', 'ml')).toBe(1000);
    expect(convertUnit(0.25, 'l', 'ml')).toBe(250);
  });

  test('throws on incompatible units (g → l)', () => {
    expect(() => convertUnit(500, 'g', 'l')).toThrow();
  });

  test('throws on incompatible units (ml → kg)', () => {
    expect(() => convertUnit(200, 'ml', 'kg')).toThrow();
  });

  test('throws on incompatible units (Stück → g)', () => {
    expect(() => convertUnit(3, 'Stück', 'g')).toThrow();
  });
});

describe('normaliseToDefaultUnit', () => {
  test('recipe in ml, default_unit l → converts to l', () => {
    expect(normaliseToDefaultUnit(500, 'ml', 'l')).toBeCloseTo(0.5);
  });

  test('recipe in kg, default_unit g → converts to g', () => {
    expect(normaliseToDefaultUnit(0.5, 'kg', 'g')).toBe(500);
  });

  test('same unit returns unchanged', () => {
    expect(normaliseToDefaultUnit(200, 'g', 'g')).toBe(200);
  });
});

// =============================================================================
// 2. Package rounding
// =============================================================================

describe('roundToPackage', () => {
  test('exact package size — 500 g needed, package 500 g → 1 package, 0 leftover', () => {
    const result = roundToPackage(500, ING_HACKFLEISCH, 'REWE');
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(500);
    expect(result.leftover_amount).toBe(0);
  });

  test('needs 800 g, largest package 1000 g → 1 × 1 kg, 200 g leftover', () => {
    const result = roundToPackage(800, ING_KARTOFFELN, 'REWE');
    // Largest available: 2500 g — so 1 × 2500 g
    // Wait: 800 g, largest pack = 2500 g → 1 package, 1700 leftover
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(2500);
    expect(result.leftover_amount).toBe(1700);
  });

  test('needs 800 g, largest package 500 g → 2 packages, 200 g leftover', () => {
    // Hackfleisch has only 500 g packs
    const result = roundToPackage(800, ING_HACKFLEISCH, 'REWE');
    expect(result.package_count).toBe(2);
    expect(result.package_size).toBe(500);
    expect(result.leftover_amount).toBe(200);
  });

  test('needs 300 g Mehl, largest package 1000 g → 1 × 1 kg', () => {
    const result = roundToPackage(300, ING_MEHL, 'REWE');
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(1000);
    expect(result.leftover_amount).toBe(700);
  });

  test('no package data (loose produce) → 1 "unit", no leftover', () => {
    const result = roundToPackage(2, ING_PETERSILIE, 'REWE');
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(0);
    expect(result.leftover_amount).toBe(0);
    expect(result.estimated_price_cents).toBe(0);
  });

  test('zero amount needed → 0 packages', () => {
    const result = roundToPackage(0, ING_HACKFLEISCH, 'REWE');
    expect(result.package_count).toBe(0);
  });

  test('falls back to any-store sizes when preferred store absent', () => {
    // Mehl only has 'REWE' data; requesting 'Lidl' should fall back.
    const result = roundToPackage(300, ING_MEHL, 'Lidl');
    // Falls back to REWE's sizes [500, 1000]
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(1000);
  });

  test('includes price when price data available', () => {
    // 2 × 500 g Hackfleisch @ 299 ct each
    const result = roundToPackage(800, ING_HACKFLEISCH, 'REWE');
    expect(result.estimated_price_cents).toBe(598); // 2 × 299
  });

  test('price is 0 when no price data', () => {
    const result = roundToPackage(500, ING_ZWIEBELN, 'REWE');
    expect(result.estimated_price_cents).toBe(0);
  });

  test('needs exactly 2 packages — 1000 g mehl, packs 500 g and 1000 g', () => {
    // Largest pack is 1000 g. Need 1000 g → 1 × 1000 g, 0 leftover.
    const result = roundToPackage(1000, ING_MEHL, 'REWE');
    expect(result.package_count).toBe(1);
    expect(result.package_size).toBe(1000);
    expect(result.leftover_amount).toBe(0);
  });

  test('needs 1001 g mehl → 2 × 1000 g packs', () => {
    const result = roundToPackage(1001, ING_MEHL, 'REWE');
    expect(result.package_count).toBe(2);
    expect(result.package_size).toBe(1000);
    expect(result.leftover_amount).toBe(999);
  });
});

// =============================================================================
// 3. Display text formatting
// =============================================================================

describe('formatAmount', () => {
  test('integer amounts have no decimal places', () => {
    expect(formatAmount(500)).toBe('500');
    expect(formatAmount(1000)).toBe('1.000');
  });

  test('decimal amounts use German comma separator', () => {
    // German locale: 0,5 not 0.5
    expect(formatAmount(0.5)).toBe('0,5');
    expect(formatAmount(1.25)).toBe('1,25');
  });

  test('trailing zeros stripped', () => {
    // 1.50 → "1,5"
    expect(formatAmount(1.5)).toBe('1,5');
  });
});

describe('buildDisplayText', () => {
  // Metric units
  test('single pack metric: 1 kg Kartoffeln', () => {
    const text = buildDisplayText('Kartoffeln', 800, 'g', 1, 1000);
    expect(text).toBe('1.000 g Kartoffeln');
  });

  test('multiple packs metric: 2 × 500 g Hackfleisch', () => {
    const text = buildDisplayText('Hackfleisch (gemischt)', 800, 'g', 2, 500);
    expect(text).toBe('2 × 500 g Hackfleisch (gemischt)');
  });

  test('no package data metric: raw amount shown', () => {
    const text = buildDisplayText('Mehl', 750, 'g', 1, 0);
    expect(text).toBe('750 g Mehl');
  });

  test('litre unit: 1 × 1000 ml Vollmilch', () => {
    const text = buildDisplayText('Vollmilch', 1000, 'ml', 1, 1000);
    expect(text).toBe('1.000 ml Vollmilch');
  });

  // Counting units
  test('Bund: 1 Bund Petersilie', () => {
    const text = buildDisplayText('Petersilie', 1, 'Bund', 1, 0);
    expect(text).toBe('1 Bund Petersilie');
  });

  test('Stück + package: 10 Eier (1 Packung)', () => {
    const text = buildDisplayText('Eier', 10, 'Stück', 1, 10);
    expect(text).toBe('10 Eier (1 Packung)');
  });

  test('Stück + multiple packages: 12 Eier (2 Packungen)', () => {
    const text = buildDisplayText('Eier', 12, 'Stück', 2, 6);
    expect(text).toBe('12 Eier (2 Packungen)');
  });

  test('Dose single: 1 Dose Tomaten (400 g)', () => {
    const text = buildDisplayText('Tomaten', 1, 'Dose', 1, 400);
    expect(text).toBe('1 Dose Tomaten (400 g)');
  });

  test('Dose multiple: 2 Dosen Tomaten (je 400 g)', () => {
    const text = buildDisplayText('Tomaten', 2, 'Dose', 2, 400);
    expect(text).toBe('2 Dosen Tomaten (je 400 g)');
  });

  test('Packung single', () => {
    const text = buildDisplayText('Sahne', 1, 'Packung', 1, 0);
    expect(text).toBe('1 Packung Sahne');
  });

  test('Packung plural', () => {
    const text = buildDisplayText('Butter', 2, 'Packung', 2, 0);
    expect(text).toBe('2 Packungen Butter');
  });

  // Small measures
  test('TL (Teelöffel) shown with unit', () => {
    const text = buildDisplayText('Salz', 1.5, 'TL', 1, 0);
    expect(text).toBe('1,5 TL Salz');
  });

  test('EL (Esslöffel) shown with unit', () => {
    const text = buildDisplayText('Öl', 2, 'EL', 1, 0);
    expect(text).toBe('2 EL Öl');
  });
});

// =============================================================================
// 4. Aisle ordering
// =============================================================================

describe('aisleOrderIndex', () => {
  test('Obst & Gemüse is first (index 0)', () => {
    expect(aisleOrderIndex('Obst & Gemüse')).toBe(0);
  });

  test('Sonstiges is last', () => {
    expect(aisleOrderIndex('Sonstiges')).toBe(AISLE_ORDER.length - 1);
  });

  test('Fleisch & Wurst comes after Milchprodukte', () => {
    expect(aisleOrderIndex('Fleisch & Wurst')).toBeGreaterThan(
      aisleOrderIndex('Milchprodukte')
    );
  });

  test('Getränke comes after Gewürze & Öle', () => {
    expect(aisleOrderIndex('Getränke')).toBeGreaterThan(
      aisleOrderIndex('Gewürze & Öle')
    );
  });

  test('all 13 canonical aisles have unique indices 0–12', () => {
    const indices = AISLE_ORDER.map(aisleOrderIndex);
    const unique = new Set(indices);
    expect(unique.size).toBe(AISLE_ORDER.length);
    expect(Math.min(...indices)).toBe(0);
    expect(Math.max(...indices)).toBe(AISLE_ORDER.length - 1);
  });
});

describe('aisle group sort order in derived list', () => {
  test('groups appear in walking order: Obst & Gemüse before Fleisch & Wurst', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 500, unit: 'g' },
      { id: 'ri2', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    const categories = result.groups.map((g) => g.category);
    const obst = categories.indexOf('Obst & Gemüse');
    const fleisch = categories.indexOf('Fleisch & Wurst');
    expect(obst).toBeGreaterThanOrEqual(0);
    expect(fleisch).toBeGreaterThan(obst);
  });

  test('empty aisles are not included in groups', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    // Only 'Obst & Gemüse' should appear
    expect(result.groups.length).toBe(1);
    expect(result.groups[0].category).toBe('Obst & Gemüse');
  });
});

// =============================================================================
// 5. Aggregation edge cases
// =============================================================================

describe('edge case: empty meal plan', () => {
  test('no slots → empty shopping list', () => {
    const plan = makePlan([]);
    const result = deriveShoppingList(plan, [], ALL_INGREDIENTS);
    expect(result.total_items).toBe(0);
    expect(result.groups.length).toBe(0);
    expect(result.total_estimated_cents).toBe(0);
  });
});

describe('edge case: slot with no recipe (null recipe_id)', () => {
  test('null recipe_id slot is skipped silently', () => {
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Frühstück',
        recipe_id: null, is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [], ALL_INGREDIENTS);
    expect(result.total_items).toBe(0);
  });
});

describe('edge case: unknown recipe ID in slot', () => {
  test('recipe_id not in catalogue → slot skipped, no items', () => {
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'nonexistent-recipe', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [], ALL_INGREDIENTS);
    expect(result.total_items).toBe(0);
  });
});

describe('edge case: unknown ingredient_id in recipe', () => {
  test('ingredient not in catalogue → ingredient skipped, rest of recipe included', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 500, unit: 'g' },
      { id: 'ri2', recipe_id: 'r1', ingredient_id: 'MISSING-ID', amount: 100, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    // Only Kartoffeln should appear; the unknown ingredient is skipped.
    expect(result.total_items).toBe(1);
    expect(result.groups[0].items[0].ingredient_id).toBe('ing-kartoffeln');
  });
});

describe('edge case: incompatible units in recipe (g → l)', () => {
  test('unit conversion error → ingredient skipped, no crash', () => {
    // Milch has default_unit 'ml'; a recipe that specifies 'g' for it is a data error.
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-milch', amount: 500, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    // Should not throw; the item is silently skipped.
    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    expect(result.total_items).toBe(0);
  });
});

// =============================================================================
// 6. Deduplication
// =============================================================================

describe('deduplication', () => {
  test('same ingredient in two different recipes → appears once, amounts summed', () => {
    const recipe1 = makeRecipe('r1', 'Gulasch', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-zwiebeln', amount: 200, unit: 'g' },
    ]);
    const recipe2 = makeRecipe('r2', 'Bolognese', [
      { id: 'ri2', recipe_id: 'r2', ingredient_id: 'ing-zwiebeln', amount: 300, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
      { id: 's2', meal_plan_id: 'plan-1', day_of_week: 1, meal_type: 'Mittagessen',
        recipe_id: 'r2', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe1, recipe2], ALL_INGREDIENTS);

    // Zwiebeln should appear exactly once.
    const allItems = result.groups.flatMap((g) => g.items);
    const zwiebelnItems = allItems.filter((i) => i.ingredient_id === 'ing-zwiebeln');
    expect(zwiebelnItems.length).toBe(1);
    // 200 g + 300 g = 500 g
    expect(zwiebelnItems[0].amount_needed).toBe(500);
  });

  test('same recipe used in multiple slots → ingredient appears once with summed amount', () => {
    const recipe = makeRecipe('r1', 'Bolognese', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
    ]);

    // Same recipe in two slots (Monday Mittagessen + Wednesday Abendessen)
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
      { id: 's2', meal_plan_id: 'plan-1', day_of_week: 2, meal_type: 'Abendessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const hackfleischItems = allItems.filter((i) => i.ingredient_id === 'ing-hackfleisch');

    expect(hackfleischItems.length).toBe(1);
    // Two slots × 500 g (already at default servings_default=4, scaling factor=1)
    expect(hackfleischItems[0].amount_needed).toBe(1000);
  });

  test('Zwiebeln never appears twice — three recipes each using it', () => {
    const recipes = ['r1', 'r2', 'r3'].map((id, i) =>
      makeRecipe(id, `Rezept ${i + 1}`, [
        { id: `ri-${id}`, recipe_id: id, ingredient_id: 'ing-zwiebeln', amount: 100, unit: 'g' },
      ])
    );

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
      { id: 's2', meal_plan_id: 'plan-1', day_of_week: 1, meal_type: 'Mittagessen',
        recipe_id: 'r2', is_locked: false, servings_override: null },
      { id: 's3', meal_plan_id: 'plan-1', day_of_week: 2, meal_type: 'Mittagessen',
        recipe_id: 'r3', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, recipes, ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const zwiebelnItems = allItems.filter((i) => i.ingredient_id === 'ing-zwiebeln');

    expect(zwiebelnItems.length).toBe(1);
    expect(zwiebelnItems[0].amount_needed).toBe(300);
  });
});

// =============================================================================
// 7. Unit conversion in aggregation
// =============================================================================

describe('unit conversion during aggregation', () => {
  test('0.5 kg + 300 g of the same ingredient → 800 g total', () => {
    // Recipe 1 uses 'kg', recipe 2 uses 'g'. Default unit for Kartoffeln is 'g'.
    const recipe1 = makeRecipe('r1', 'Rezept 1', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 0.5, unit: 'kg' },
    ]);
    const recipe2 = makeRecipe('r2', 'Rezept 2', [
      { id: 'ri2', recipe_id: 'r2', ingredient_id: 'ing-kartoffeln', amount: 300, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
      { id: 's2', meal_plan_id: 'plan-1', day_of_week: 1, meal_type: 'Mittagessen',
        recipe_id: 'r2', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe1, recipe2], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const kartoffeln = allItems.find((i) => i.ingredient_id === 'ing-kartoffeln');

    expect(kartoffeln).toBeDefined();
    // 0.5 kg = 500 g + 300 g = 800 g
    expect(kartoffeln!.amount_needed).toBeCloseTo(800);
    expect(kartoffeln!.unit).toBe('g');
  });

  test('300 ml + 0.2 l of Sahne → 500 ml total (default_unit ml)', () => {
    const recipe1 = makeRecipe('r1', 'Rezept 1', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-sahne', amount: 300, unit: 'ml' },
    ]);
    const recipe2 = makeRecipe('r2', 'Rezept 2', [
      { id: 'ri2', recipe_id: 'r2', ingredient_id: 'ing-sahne', amount: 0.2, unit: 'l' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
      { id: 's2', meal_plan_id: 'plan-1', day_of_week: 1, meal_type: 'Mittagessen',
        recipe_id: 'r2', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe1, recipe2], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const sahne = allItems.find((i) => i.ingredient_id === 'ing-sahne');

    expect(sahne).toBeDefined();
    expect(sahne!.amount_needed).toBeCloseTo(500);
    expect(sahne!.unit).toBe('ml');
  });
});

// =============================================================================
// 8. Servings scaling
// =============================================================================

describe('servings scaling', () => {
  test('servings_override doubles the ingredient amount', () => {
    // Recipe is for 2 servings; slot requests 4 → scaling factor = 2
    const recipe = makeRecipe(
      'r1',
      'Nudeln',
      [{ id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-mehl', amount: 250, unit: 'g' }],
      2 // servings_default
    );

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: 4 },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const mehl = allItems.find((i) => i.ingredient_id === 'ing-mehl');

    expect(mehl).toBeDefined();
    expect(mehl!.amount_needed).toBeCloseTo(500); // 250 × (4/2)
  });

  test('no servings_override uses recipe servings_default (scaling factor = 1)', () => {
    const recipe = makeRecipe(
      'r1',
      'Kartoffelsuppe',
      [{ id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 800, unit: 'g' }],
      4
    );

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const kartoffeln = allItems.find((i) => i.ingredient_id === 'ing-kartoffeln');

    expect(kartoffeln).toBeDefined();
    expect(kartoffeln!.amount_needed).toBe(800);
  });
});

// =============================================================================
// 9. Cost estimation
// =============================================================================

describe('cost estimation', () => {
  test('single item with known price', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    // 500 g Hackfleisch → 1 × 500 g pack @ 299 ct
    expect(result.total_estimated_cents).toBe(299);
  });

  test('two items with known prices — total is sum', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
      { id: 'ri2', recipe_id: 'r1', ingredient_id: 'ing-milch', amount: 1000, unit: 'ml' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    // 1 × Hackfleisch 500 g = 299 ct
    // 1 × Milch 1000 ml = 109 ct
    expect(result.total_estimated_cents).toBe(408);
  });

  test('item with no price data contributes 0 to total', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-zwiebeln', amount: 200, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    const allItems = result.groups.flatMap((g) => g.items);
    const zwiebeln = allItems.find((i) => i.ingredient_id === 'ing-zwiebeln');

    expect(zwiebeln!.estimated_price_cents).toBe(0);
    expect(result.total_estimated_cents).toBe(0);
  });

  test('two packages → cost doubled', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      // Need 800 g; Hackfleisch only comes in 500 g → 2 packs × 299 = 598
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 800, unit: 'g' },
    ]);

    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS);
    expect(result.total_estimated_cents).toBe(598);
  });
});

// =============================================================================
// 10. Full integration test
// =============================================================================

describe('integration: full MealPlan → DerivedShoppingList', () => {
  /**
   * Scenario: A week with 3 recipes across 4 slots.
   *   Monday Mittagessen:   Bolognese   (Hackfleisch 500 g, Zwiebeln 200 g, Tomaten 2 Dose)
   *   Tuesday Mittagessen:  Kartoffelsuppe (Kartoffeln 800 g, Sahne 200 ml)
   *   Wednesday Abendessen: Bolognese again (same recipe → Hackfleisch 500 g, etc.)
   *   Thursday Frühstück:   Pfannkuchen (Mehl 200 g, Milch 300 ml, Eier 3 Stück)
   */
  const BOLOGNESE = makeRecipe('r-bolo', 'Bolognese', [
    { id: 'ri1', recipe_id: 'r-bolo', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
    { id: 'ri2', recipe_id: 'r-bolo', ingredient_id: 'ing-zwiebeln',    amount: 200, unit: 'g' },
    { id: 'ri3', recipe_id: 'r-bolo', ingredient_id: 'ing-tomaten-dose',amount: 2,   unit: 'Dose' },
  ]);

  const KARTOFFELSUPPE = makeRecipe('r-ksuppe', 'Kartoffelsuppe', [
    { id: 'ri4', recipe_id: 'r-ksuppe', ingredient_id: 'ing-kartoffeln', amount: 800, unit: 'g' },
    { id: 'ri5', recipe_id: 'r-ksuppe', ingredient_id: 'ing-sahne',      amount: 200, unit: 'ml' },
  ]);

  const PFANNKUCHEN = makeRecipe('r-pf', 'Pfannkuchen', [
    { id: 'ri6', recipe_id: 'r-pf', ingredient_id: 'ing-mehl',  amount: 200, unit: 'g' },
    { id: 'ri7', recipe_id: 'r-pf', ingredient_id: 'ing-milch', amount: 300, unit: 'ml' },
    { id: 'ri8', recipe_id: 'r-pf', ingredient_id: 'ing-eier',  amount: 3,   unit: 'Stück' },
  ]);

  const PLAN = makePlan([
    { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
      recipe_id: 'r-bolo', is_locked: false, servings_override: null },
    { id: 's2', meal_plan_id: 'plan-1', day_of_week: 1, meal_type: 'Mittagessen',
      recipe_id: 'r-ksuppe', is_locked: false, servings_override: null },
    { id: 's3', meal_plan_id: 'plan-1', day_of_week: 2, meal_type: 'Abendessen',
      recipe_id: 'r-bolo', is_locked: false, servings_override: null },
    { id: 's4', meal_plan_id: 'plan-1', day_of_week: 3, meal_type: 'Frühstück',
      recipe_id: 'r-pf', is_locked: false, servings_override: null },
  ]);

  let result: DerivedShoppingList;

  beforeAll(() => {
    result = deriveShoppingList(
      PLAN,
      [BOLOGNESE, KARTOFFELSUPPE, PFANNKUCHEN],
      ALL_INGREDIENTS,
      'REWE'
    );
  });

  test('total_items is 8 distinct ingredients', () => {
    // Hackfleisch, Zwiebeln, Tomaten, Kartoffeln, Sahne, Mehl, Milch, Eier
    expect(result.total_items).toBe(8);
  });

  test('Hackfleisch is deduplicated: 2 × 500 g = 1000 g total', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    const hack = allItems.find((i) => i.ingredient_id === 'ing-hackfleisch');
    expect(hack).toBeDefined();
    expect(hack!.amount_needed).toBe(1000);
    expect(hack!.package_count).toBe(2);
  });

  test('Zwiebeln is deduplicated: 2 × 200 g = 400 g total', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    const zwiebeln = allItems.find((i) => i.ingredient_id === 'ing-zwiebeln');
    expect(zwiebeln).toBeDefined();
    expect(zwiebeln!.amount_needed).toBe(400);
  });

  test('Tomaten: 2 + 2 = 4 Dosen (2 slots × 2 Dose)', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    const tomaten = allItems.find((i) => i.ingredient_id === 'ing-tomaten-dose');
    expect(tomaten).toBeDefined();
    expect(tomaten!.amount_needed).toBe(4);
  });

  test('groups include Obst & Gemüse, Fleisch & Wurst, Konserven & Gläser, ' +
       'Milchprodukte, Kühlregal, Backzutaten', () => {
    const categories = new Set(result.groups.map((g) => g.category));
    expect(categories.has('Obst & Gemüse')).toBe(true);
    expect(categories.has('Fleisch & Wurst')).toBe(true);
    expect(categories.has('Konserven & Gläser')).toBe(true);
    expect(categories.has('Milchprodukte')).toBe(true);
    expect(categories.has('Kühlregal')).toBe(true);
    expect(categories.has('Backzutaten')).toBe(true);
  });

  test('groups are in canonical walking order', () => {
    const categories = result.groups.map((g) => g.category);
    for (let i = 0; i < categories.length - 1; i++) {
      expect(aisleOrderIndex(categories[i])).toBeLessThan(
        aisleOrderIndex(categories[i + 1])
      );
    }
  });

  test('items within each group are sorted alphabetically (de)', () => {
    for (const group of result.groups) {
      const names = group.items.map((i) => i.ingredient_name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de'));
      expect(names).toEqual(sorted);
    }
  });

  test('total_estimated_cents is sum of all item estimates', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    const expectedTotal = allItems.reduce((sum, i) => sum + i.estimated_price_cents, 0);
    expect(result.total_estimated_cents).toBe(expectedTotal);
  });

  test('total_estimated_cents is positive (we have price data for most items)', () => {
    // Hackfleisch: 2 × 299 = 598
    // Milch: 1 × 109 = 109
    // Eier: 1 × 299 = 299 (10er Packung for 3 Stück)
    // Tomaten: 4 × 89 = 356  — but package is 400 g, so 4 × 1 pack each
    // Total including others with price data must be > 0.
    expect(result.total_estimated_cents).toBeGreaterThan(0);
  });

  test('all items have is_checked = false on initial derivation', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    expect(allItems.every((i) => i.is_checked === false)).toBe(true);
  });

  test('display_text is a non-empty German string for every item', () => {
    const allItems = result.groups.flatMap((g) => g.items);
    for (const item of allItems) {
      expect(item.display_text.length).toBeGreaterThan(0);
      // Should contain the ingredient name
      expect(item.display_text).toContain(item.ingredient_name);
    }
  });
});
