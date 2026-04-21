// =============================================================================
// src/features/shopping-list/derive-shopping-list.ts
// =============================================================================
// Shopping list derivation algorithm.
//
// Converts a MealPlan + Recipe catalogue + Ingredient catalogue into a fully
// deduplicated, unit-normalised, package-rounded, aisle-grouped DerivedShoppingList.
//
// Pipeline (matches architecture.md Section 2 → Module: shopping-list):
//
//   Step 1 — Aggregate
//     Collect every ingredient reference across all meal slots × servings.
//     Normalise each amount to the ingredient's default_unit before accumulating.
//
//   Step 2 — Unit normalisation (within Step 1)
//     Convert recipe-specified units to the ingredient's default_unit so that
//     "0.5 kg" and "300 g" of the same ingredient become "800 g".
//
//   Step 3 — Package rounding
//     Round each aggregated amount UP to the nearest available package size.
//     Pick the most economical package combination (fewest packages, prefer
//     larger packs). Calculate leftover.
//
//   Step 4 — Deduplication
//     Guaranteed by keying the accumulator on ingredient_id. "Zwiebeln" never
//     appears twice.
//
//   Step 5 — Display text generation
//     Build a German-language label per item following German grocery conventions.
//
//   Step 6 — Aisle grouping & sorting
//     Group items by aisle_category. Order groups by the canonical supermarket
//     walking order. Sort items within each group alphabetically by name.
//
//   Step 7 — Cost estimation
//     Sum package prices across all items to produce a total_estimated_cents.
// =============================================================================

import {
  AisleCategory,
  AisleGroup,
  DerivedShoppingList,
  Ingredient,
  IngredientAccumulator,
  MealPlan,
  MealSlot,
  Recipe,
  RecipeIngredient,
  ShoppingListItem,
  Unit,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical German supermarket walking order.
 *
 * Indices drive the sort key for aisle groups. Lower index = visited earlier
 * in a typical REWE / EDEKA layout. Groups not present in the derived list are
 * omitted entirely — no empty sections are shown.
 */
export const AISLE_ORDER: readonly AisleCategory[] = [
  'Obst & Gemüse',
  'Brot & Backwaren',
  'Kühlregal',
  'Milchprodukte',
  'Fleisch & Wurst',
  'Tiefkühl',
  'Konserven & Gläser',
  'Trockenwaren & Beilagen',
  'Backzutaten',
  'Gewürze & Öle',
  'Getränke',
  'Süßwaren & Snacks',
  'Sonstiges',
] as const;

/**
 * Conversion factors to a common base unit for each metric pair.
 * Key: `${fromUnit}->${toUnit}` — value is the multiplier.
 *
 * We only need within-pair conversions (g↔kg, ml↔l) because cross-pair
 * conversions (e.g. g→ml) are physically meaningless and indicate a data
 * error in the recipe database.
 */
const UNIT_CONVERSIONS: Readonly<Record<string, number>> = {
  'g->kg': 0.001,
  'kg->g': 1000,
  'ml->l': 0.001,
  'l->ml': 1000,
  // TL / EL are small fixed volumes; we do not convert them to ml because
  // the density varies per ingredient. They stay as-is (counted discretely).
  'TL->TL': 1,
  'EL->EL': 1,
};

// ---------------------------------------------------------------------------
// Step 1 & 2: Unit conversion helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to convert `amount` from `fromUnit` to `toUnit`.
 *
 * Returns the converted amount when a known conversion exists.
 * Throws an error when the units are incompatible (e.g. g → l) so that data
 * errors in the recipe database surface clearly during development and testing.
 *
 * Exported for unit testing.
 */
export function convertUnit(amount: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) {
    return amount;
  }

  const key = `${fromUnit}->${toUnit}`;
  const factor = UNIT_CONVERSIONS[key];

  if (factor === undefined) {
    throw new Error(
      `Einheitenkonvertierung nicht möglich: ${fromUnit} → ${toUnit}. ` +
        `Bitte Rezeptdaten prüfen.`
    );
  }

  return amount * factor;
}

/**
 * Normalises a recipe-ingredient amount to the ingredient's default_unit.
 *
 * Example: recipe says "500 ml" for an ingredient whose default_unit is "l"
 * → returns 0.5 (l).
 *
 * When `recipeUnit` equals `defaultUnit` no conversion is performed.
 * Exported for unit testing.
 */
export function normaliseToDefaultUnit(
  amount: number,
  recipeUnit: Unit,
  defaultUnit: Unit
): number {
  return convertUnit(amount, recipeUnit, defaultUnit);
}

// ---------------------------------------------------------------------------
// Step 1: Aggregation
// ---------------------------------------------------------------------------

/**
 * Determines the effective servings for a meal slot.
 *
 * Uses `servings_override` when set, otherwise falls back to `recipe.servings_default`.
 */
function effectiveServings(slot: MealSlot, recipe: Recipe): number {
  return slot.servings_override ?? recipe.servings_default;
}

/**
 * Collects and sums all ingredients across every meal slot in the plan.
 *
 * Algorithm:
 *   For each slot with a recipe_id:
 *     Look up the Recipe → iterate its RecipeIngredients
 *       Scale amount by (effectiveServings / recipe.servings_default)
 *       Normalise to ingredient's default_unit
 *       Add to accumulator keyed by ingredient_id
 *
 * Missing recipes (slot.recipe_id not in `recipes` array) are silently skipped
 * — this handles the case where the app has a partial recipe cache.
 *
 * Missing ingredients (ingredient not in `ingredients` array) are also skipped
 * but a console.warn is emitted so the data gap is visible during development.
 */
function aggregateIngredients(
  plan: MealPlan,
  recipes: readonly Recipe[],
  ingredients: readonly Ingredient[]
): Map<string, IngredientAccumulator> {
  // Build fast-lookup maps so inner loops are O(1) not O(n).
  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
  const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

  const accumulator = new Map<string, IngredientAccumulator>();

  for (const slot of plan.slots) {
    // Skip empty slots (no recipe assigned).
    if (slot.recipe_id === null) {
      continue;
    }

    const recipe = recipeMap.get(slot.recipe_id);
    if (recipe === undefined) {
      // Recipe not found in the provided catalogue — skip silently.
      continue;
    }

    const servings = effectiveServings(slot, recipe);
    // Scaling factor: how many "recipe portions" are needed for this slot.
    const scalingFactor = recipe.servings_default > 0
      ? servings / recipe.servings_default
      : 1;

    for (const ri of recipe.ingredients) {
      const ingredient = ingredientMap.get(ri.ingredient_id);

      if (ingredient === undefined) {
        console.warn(
          `[deriveShoppingList] Zutat nicht gefunden: ingredient_id=${ri.ingredient_id} ` +
            `in Rezept "${recipe.title_de}". Übersprungen.`
        );
        continue;
      }

      // Scale the amount to the number of servings needed for this slot.
      const scaledAmount = ri.amount * scalingFactor;

      // Normalise to the ingredient's default_unit.
      // If conversion is impossible (data error), skip this ingredient and warn.
      let normalisedAmount: number;
      try {
        normalisedAmount = normaliseToDefaultUnit(
          scaledAmount,
          ri.unit,
          ingredient.default_unit
        );
      } catch (err) {
        console.warn(
          `[deriveShoppingList] Einheitenkonvertierung fehlgeschlagen für ` +
            `"${ingredient.name_de}" (${ri.unit} → ${ingredient.default_unit}): ` +
            String(err)
        );
        continue;
      }

      // Skip zero-amount entries (can happen when scaling down to very small portions).
      if (normalisedAmount <= 0) {
        continue;
      }

      const existing = accumulator.get(ri.ingredient_id);
      if (existing !== undefined) {
        // Accumulate into existing entry.
        existing.total_amount += normalisedAmount;
      } else {
        // First time we see this ingredient — create an accumulator entry.
        accumulator.set(ri.ingredient_id, {
          ingredient_id: ri.ingredient_id,
          ingredient_name: ingredient.name_de,
          total_amount: normalisedAmount,
          default_unit: ingredient.default_unit,
          aisle_category: ingredient.category,
          ingredient_ref: ingredient,
        });
      }
    }
  }

  return accumulator;
}

// ---------------------------------------------------------------------------
// Step 3: Package rounding
// ---------------------------------------------------------------------------

/**
 * Result of the package-rounding calculation for a single ingredient.
 */
export interface PackageRoundingResult {
  /** Number of packages to buy. */
  readonly package_count: number;
  /** Size of each package in `default_unit`. 0 = no package data available. */
  readonly package_size: number;
  /** Amount left over: (package_count × package_size) − amount_needed. */
  readonly leftover_amount: number;
  /** Total estimated cost in EUR cents for these packages. 0 if unknown. */
  readonly estimated_price_cents: number;
}

/**
 * Rounds the needed amount up to the most economical combination of package
 * sizes available for `preferredStore`.
 *
 * Strategy:
 *   1. Collect available package sizes for the preferred store (fall back to
 *      any store's sizes if the preferred store has no data).
 *   2. Sort sizes ascending.
 *   3. Use the largest available size to minimise the number of packages
 *      (fewest items to carry, and large packs are usually cheaper per unit).
 *   4. Calculate package_count = ceil(amount_needed / package_size).
 *   5. leftover = (package_count × package_size) − amount_needed.
 *
 * When no package sizes are available (e.g. loose produce like Petersilie):
 *   package_count = 1, package_size = 0, leftover = 0.
 *
 * Exported for unit testing.
 */
export function roundToPackage(
  amountNeeded: number,
  ingredient: Ingredient,
  preferredStore: string = 'REWE'
): PackageRoundingResult {
  // Gather package sizes: try preferred store first, then union across all stores.
  let sizes: number[] = ingredient.common_package_sizes[preferredStore]
    ? [...ingredient.common_package_sizes[preferredStore]]
    : [];

  if (sizes.length === 0) {
    // Fallback: use any available store's sizes.
    for (const storeSizes of Object.values(ingredient.common_package_sizes)) {
      sizes.push(...storeSizes);
    }
  }

  // Remove duplicates and sort ascending.
  sizes = [...new Set(sizes)].sort((a, b) => a - b);

  if (sizes.length === 0 || amountNeeded <= 0) {
    // No package data — report as 1 "unit" with no rounding.
    return {
      package_count: amountNeeded > 0 ? 1 : 0,
      package_size: 0,
      leftover_amount: 0,
      estimated_price_cents: 0,
    };
  }

  // Use the largest pack size to minimise package count (most economical).
  const largestSize = sizes[sizes.length - 1];
  const package_count = Math.ceil(amountNeeded / largestSize);
  const leftover_amount = package_count * largestSize - amountNeeded;

  // Look up price if available.
  const priceMap = ingredient.price_per_package_cents?.[preferredStore];
  const price = priceMap?.[largestSize] ?? 0;
  const estimated_price_cents = price * package_count;

  return {
    package_count,
    package_size: largestSize,
    leftover_amount,
    estimated_price_cents,
  };
}

// ---------------------------------------------------------------------------
// Step 5: Display text generation
// ---------------------------------------------------------------------------

/**
 * Formats a numeric amount for German display.
 *
 * Rules:
 *   - Integer amounts: no decimal places ("500 g", "2 Stück").
 *   - Non-integer amounts: up to 2 decimal places, trailing zeros stripped.
 *   - Values < 1 remain as decimals ("0,5 kg").
 *   - Decimal separator: German comma (",").
 *
 * Exported for unit testing.
 */
export function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return amount.toLocaleString('de-DE');
  }
  // Up to 2 decimal places, German locale (uses comma).
  return amount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Builds the German display text for a shopping list item.
 *
 * Format rules:
 *
 *   Metric weight/volume with package info:
 *     "1 kg Kartoffeln"
 *     "500 g Hackfleisch (gemischt)"
 *     "2 × 500 g Mehl"
 *
 *   Counted units (Stück, Packung, Dose, Bund, Becher, Tüte):
 *     "1 Bund Petersilie"
 *     "2 Dosen Tomaten (je 400 g)"
 *     "10 Eier (1 Packung)"  — when package_count > 1 and unit is Stück
 *
 *   When package data is available and package_count > 1:
 *     "2 × 500 g Mehl"
 *
 *   When amount is fractional and unit is kg/l, simplify if possible:
 *     0.5 kg → "500 g Hackfleisch"  (only when < 1 kg to avoid confusing "0,5 kg")
 *     — NOTE: this simplification is intentionally NOT applied here to keep
 *       display consistent with what was purchased (e.g. "1 × 500 g Packung").
 *
 * Exported for unit testing.
 */
export function buildDisplayText(
  ingredientName: string,
  amountNeeded: number,
  unit: Unit,
  packageCount: number,
  packageSize: number
): string {
  const metricUnits: readonly Unit[] = ['g', 'kg', 'ml', 'l'];
  const countingUnits: readonly Unit[] = ['Stück', 'Bund', 'Packung', 'Dose', 'Becher', 'Tüte'];

  const isMetric = (metricUnits as readonly string[]).includes(unit);
  const isCounting = (countingUnits as readonly string[]).includes(unit);

  // --- Metric units (g, kg, ml, l) ---
  if (isMetric) {
    if (packageSize > 0 && packageCount > 1) {
      // "2 × 500 g Mehl"
      return `${packageCount} × ${formatAmount(packageSize)} ${unit} ${ingredientName}`;
    }
    // "500 g Mehl" or "1 kg Kartoffeln"
    const displayAmount = packageSize > 0 ? packageSize * packageCount : amountNeeded;
    return `${formatAmount(displayAmount)} ${unit} ${ingredientName}`;
  }

  // --- Counting units ---
  if (isCounting) {
    if (unit === 'Stück') {
      // When we have package info: "10 Eier (1 Packung à 10)"
      if (packageSize > 0 && packageCount >= 1) {
        const totalStück = Math.ceil(amountNeeded);
        if (packageSize === amountNeeded) {
          // Exactly one package
          return `${formatAmount(totalStück)} ${ingredientName} (1 Packung)`;
        }
        if (packageCount > 1) {
          return `${formatAmount(totalStück)} ${ingredientName} (${packageCount} Packungen)`;
        }
        // Single package covers it
        return `${formatAmount(totalStück)} ${ingredientName} (1 Packung)`;
      }
      // No package info — just show amount
      return `${formatAmount(Math.ceil(amountNeeded))} ${ingredientName}`;
    }

    if (unit === 'Dose') {
      if (packageSize > 0) {
        // "2 Dosen Tomaten (je 400 g)"
        const perDoseLabel = `je ${formatAmount(packageSize)} g`;
        if (packageCount > 1) {
          return `${packageCount} Dosen ${ingredientName} (${perDoseLabel})`;
        }
        return `1 Dose ${ingredientName} (${formatAmount(packageSize)} g)`;
      }
      const count = Math.ceil(amountNeeded);
      return `${count} ${count === 1 ? 'Dose' : 'Dosen'} ${ingredientName}`;
    }

    if (unit === 'Bund') {
      const count = Math.ceil(amountNeeded);
      return `${count} ${count === 1 ? 'Bund' : 'Bund'} ${ingredientName}`;
    }

    if (unit === 'Packung') {
      const count = Math.ceil(amountNeeded);
      return `${count} ${count === 1 ? 'Packung' : 'Packungen'} ${ingredientName}`;
    }

    if (unit === 'Becher') {
      const count = Math.ceil(amountNeeded);
      return `${count} ${count === 1 ? 'Becher' : 'Becher'} ${ingredientName}`;
    }

    if (unit === 'Tüte') {
      const count = Math.ceil(amountNeeded);
      return `${count} ${count === 1 ? 'Tüte' : 'Tüten'} ${ingredientName}`;
    }
  }

  // --- Small spoon measures (TL, EL, Prise) — show as-is ---
  if (unit === 'Prise') {
    const count = Math.ceil(amountNeeded);
    return `${count} Prise ${ingredientName}`;
  }

  if (unit === 'TL' || unit === 'EL') {
    return `${formatAmount(amountNeeded)} ${unit} ${ingredientName}`;
  }

  // --- Fallback: should not normally be reached ---
  return `${formatAmount(amountNeeded)} ${unit} ${ingredientName}`;
}

// ---------------------------------------------------------------------------
// Step 6: Aisle grouping and sorting
// ---------------------------------------------------------------------------

/**
 * Returns the sort index for an `AisleCategory` based on the canonical German
 * supermarket walking order. Categories not in `AISLE_ORDER` get a high index
 * so they appear at the end (treated as 'Sonstiges').
 *
 * Exported for unit testing.
 */
export function aisleOrderIndex(category: AisleCategory): number {
  const index = AISLE_ORDER.indexOf(category);
  return index === -1 ? AISLE_ORDER.length : index;
}

/**
 * Groups an array of `ShoppingListItem`s into `AisleGroup`s, sorted by
 * canonical supermarket walking order.
 *
 * Items within each group are sorted alphabetically by `ingredient_name`
 * so the list is predictable and easy to scan within an aisle.
 *
 * Empty aisles are not included in the output.
 */
function groupByAisle(items: readonly ShoppingListItem[]): readonly AisleGroup[] {
  // Bucket items by aisle category.
  const buckets = new Map<AisleCategory, ShoppingListItem[]>();

  for (const item of items) {
    const bucket = buckets.get(item.aisle_category);
    if (bucket !== undefined) {
      bucket.push(item);
    } else {
      buckets.set(item.aisle_category, [item]);
    }
  }

  // Build AisleGroup array, sort groups by walking order.
  const groups: AisleGroup[] = [];

  for (const [category, groupItems] of buckets) {
    // Sort items within each aisle alphabetically.
    const sortedItems = [...groupItems].sort((a, b) =>
      a.ingredient_name.localeCompare(b.ingredient_name, 'de')
    );

    groups.push({
      category,
      items: sortedItems,
      item_count: sortedItems.length,
    });
  }

  // Sort groups by canonical aisle walking order.
  groups.sort((a, b) => aisleOrderIndex(a.category) - aisleOrderIndex(b.category));

  return groups;
}

// ---------------------------------------------------------------------------
// Step 7: ID generation helper
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic, URL-safe ID for a shopping list item from its
 * `ingredient_id`. Uses a simple prefix so IDs are recognisable in logs.
 *
 * In production these IDs are replaced by the UUID assigned by Supabase when
 * the derived items are written to `shopping_list_items`.
 */
function itemId(ingredientId: string): string {
  return `sli-${ingredientId}`;
}

// ---------------------------------------------------------------------------
// Main export: deriveShoppingList
// ---------------------------------------------------------------------------

/**
 * Derives a fully-processed `DerivedShoppingList` from a `MealPlan`.
 *
 * @param plan        The active meal plan whose slots drive the derivation.
 * @param recipes     Full recipe catalogue (must include ingredients arrays).
 * @param ingredients Full ingredient catalogue.
 * @param preferredStore  The household's preferred supermarket (for package sizes).
 *                    Defaults to 'REWE'.
 *
 * @returns A `DerivedShoppingList` with deduplicated, rounded, grouped items.
 *
 * This function is pure — it has no side effects and can safely be called
 * multiple times with the same inputs (idempotent). The result is stable for
 * identical inputs, making it safe to diff against a previously-derived list.
 *
 * Exported as the primary entry point consumed by:
 *   - The GET /shopping-list/:planId Edge Function
 *   - `useShoppingListStore` when re-deriving after a slot swap
 *
 * Example:
 * ```typescript
 * const list = deriveShoppingList(plan, recipes, ingredients, 'REWE');
 * // list.groups[0].category === 'Obst & Gemüse'
 * // list.total_estimated_cents === 3450
 * ```
 */
export function deriveShoppingList(
  plan: MealPlan,
  recipes: readonly Recipe[],
  ingredients: readonly Ingredient[],
  preferredStore: string = 'REWE'
): DerivedShoppingList {
  // ── Step 1 & 2: Aggregate and normalise ──────────────────────────────────
  const accumulated = aggregateIngredients(plan, recipes, ingredients);

  // ── Steps 3, 4, 5: Package rounding + deduplication + display text ───────
  // Deduplication is guaranteed because `accumulated` is already keyed by
  // ingredient_id (Step 1 merged all slots). No additional pass needed.
  const items: ShoppingListItem[] = [];

  for (const acc of accumulated.values()) {
    const rounding = roundToPackage(acc.total_amount, acc.ingredient_ref, preferredStore);

    const displayText = buildDisplayText(
      acc.ingredient_name,
      acc.total_amount,
      acc.default_unit,
      rounding.package_count,
      rounding.package_size
    );

    items.push({
      id: itemId(acc.ingredient_id),
      ingredient_id: acc.ingredient_id,
      ingredient_name: acc.ingredient_name,
      amount_needed: acc.total_amount,
      unit: acc.default_unit,
      display_text: displayText,
      aisle_category: acc.aisle_category,
      package_count: rounding.package_count,
      package_size: rounding.package_size,
      leftover_amount: rounding.leftover_amount,
      estimated_price_cents: rounding.estimated_price_cents,
      is_checked: false,
    });
  }

  // ── Step 6: Aisle grouping and sorting ───────────────────────────────────
  const groups = groupByAisle(items);

  // ── Step 7: Cost estimation ───────────────────────────────────────────────
  const totalEstimatedCents = items.reduce(
    (sum, item) => sum + item.estimated_price_cents,
    0
  );

  return {
    groups,
    total_estimated_cents: totalEstimatedCents,
    total_items: items.length,
  };
}
