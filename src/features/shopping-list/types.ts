// =============================================================================
// src/features/shopping-list/types.ts
// =============================================================================
// Type definitions for the shopping list derivation pipeline.
//
// These types mirror the Supabase `shopping_list_items` table structure while
// adding client-side fields needed for display, grouping, and cost estimation.
//
// Aisle categories follow the German supermarket walking order defined in
// architecture.md. The order here is the canonical sort order used throughout
// the app.
// =============================================================================

// ---------------------------------------------------------------------------
// Re-exported domain types from the meal-plan feature.
// Defined inline here so this module is self-contained; once the meal-plan
// types file exists these can be replaced with a re-export.
// ---------------------------------------------------------------------------

/** Which meal within a day this slot covers. Abendbrot is first-class. */
export type MealType = 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Abendbrot';

/** Dietary lifestyle options, matching the `diet_type_enum` in the DB. */
export type DietType =
  | 'omnivor'
  | 'flexitarisch'
  | 'vegetarisch'
  | 'vegan'
  | 'pescetarisch';

/**
 * German supermarket aisle categories in physical walking order.
 *
 * The order of values in this union is intentional — it matches the typical
 * REWE / EDEKA store layout. The `AISLE_ORDER` constant below uses this to
 * produce a stable sort index. When `preferred_store` is Aldi or Lidl, the
 * sort order may be adjusted at render time, but the categories themselves
 * remain the same so the user always sees familiar German aisle names.
 */
export type AisleCategory =
  | 'Obst & Gemüse'
  | 'Brot & Backwaren'
  | 'Kühlregal'
  | 'Milchprodukte'
  | 'Fleisch & Wurst'
  | 'Tiefkühl'
  | 'Konserven & Gläser'
  | 'Trockenwaren & Beilagen'
  | 'Backzutaten'
  | 'Gewürze & Öle'
  | 'Getränke'
  | 'Süßwaren & Snacks'
  | 'Sonstiges';

/** Metric + German packaging units, matching the `unit_enum` DB enum. */
export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'Stück'
  | 'Bund'
  | 'Packung'
  | 'Dose'
  | 'Becher'
  | 'Tüte'
  | 'Prise'
  | 'EL'   // Esslöffel
  | 'TL';  // Teelöffel

/**
 * A purchasable ingredient from the `ingredients` table.
 *
 * `common_package_sizes` is a map from store name to an array of available
 * package sizes expressed in the ingredient's `default_unit`.
 *
 * Example:
 *   { "REWE": [500, 1000], "Lidl": [1000] }  — sizes in grams for Mehl
 *   { "REWE": [250, 500],  "Lidl": [250]  }  — sizes in ml   for Sahne
 */
export interface Ingredient {
  readonly id: string;
  readonly name_de: string;
  readonly category: AisleCategory;
  readonly default_unit: Unit;
  /** Package sizes keyed by store name. Values are in `default_unit`. */
  readonly common_package_sizes: Readonly<Record<string, readonly number[]>>;
  /** Estimated price per package in EUR cents, keyed by store then package size.
   *  e.g. { "REWE": { 500: 149, 1000: 249 } }
   */
  readonly price_per_package_cents?: Readonly<
    Record<string, Readonly<Record<number, number>>>
  >;
  readonly shelf_life_days?: number;
  readonly storage_type?: 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur';
}

/**
 * A single ingredient entry within a recipe, from `recipe_ingredients`.
 * The `unit` may differ from `Ingredient.default_unit` (e.g. a recipe uses
 * ml where the default_unit is l). Unit conversion happens during derivation.
 */
export interface RecipeIngredient {
  readonly id: string;
  readonly recipe_id: string;
  readonly ingredient_id: string;
  readonly amount: number;
  readonly unit: Unit;
  /** Optional preparation note in German, e.g. "fein gehackt". */
  readonly preparation_note?: string;
}

/** A recipe from the `recipes` table. */
export interface Recipe {
  readonly id: string;
  readonly title_de: string;
  readonly description_de?: string;
  readonly servings_default: number;
  readonly prep_time_minutes: number;
  readonly cook_time_minutes: number;
  readonly diet_tags: readonly string[];
  readonly meal_type: readonly MealType[];
  readonly cost_estimate_cents_per_serving?: number;
  readonly image_url?: string;
  /** Ingredients for this recipe. Populated via JOIN with `recipe_ingredients`. */
  readonly ingredients: readonly RecipeIngredient[];
}

/** A single meal slot within a meal plan, from `meal_slots`. */
export interface MealSlot {
  readonly id: string;
  readonly meal_plan_id: string;
  readonly day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly meal_type: MealType;
  readonly recipe_id: string | null;
  readonly is_locked: boolean;
  /**
   * Servings for this specific slot. When null the household size from
   * UserPreferences is used.
   */
  readonly servings_override: number | null;
}

/** A 7-day meal plan from `meal_plans`. */
export interface MealPlan {
  readonly id: string;
  readonly household_id: string;
  readonly week_start_date: string; // ISO date string, always a Monday
  readonly status: 'draft' | 'active' | 'completed';
  readonly slots: readonly MealSlot[];
}

// ---------------------------------------------------------------------------
// Shopping list derivation types
// ---------------------------------------------------------------------------

/**
 * A fully-derived line item ready to be written to `shopping_list_items` and
 * displayed in the Einkaufsliste screen.
 *
 * `amount_needed` is the raw aggregated amount before package rounding.
 * `package_count` × `package_size` >= `amount_needed`, so the leftover is
 * (package_count × package_size) − amount_needed.
 */
export interface ShoppingListItem {
  readonly id: string;

  /** FK to `ingredients.id`. May be empty string for manually-added items. */
  readonly ingredient_id: string;

  /** German ingredient name, e.g. "Vollmilch", "Hackfleisch (gemischt)". */
  readonly ingredient_name: string;

  /**
   * Aggregated amount needed across all recipes, expressed in `unit`.
   * This is the raw sum after unit normalisation, before package rounding.
   */
  readonly amount_needed: number;

  /**
   * Unit for `amount_needed`. Always the ingredient's `default_unit` after
   * the normalisation step, so comparison and summing are safe.
   */
  readonly unit: Unit;

  /**
   * Human-readable German label shown in the app.
   * Examples:
   *   "1 kg Kartoffeln"
   *   "500 g Hackfleisch (gemischt)"
   *   "1 Bund Petersilie"
   *   "2 Dosen Tomaten (je 400 g)"
   *   "10 Eier (1 Packung)"
   */
  readonly display_text: string;

  /** Supermarket aisle this item lives in. Drives grouping and sort order. */
  readonly aisle_category: AisleCategory;

  /** Number of packages to buy (rounded up to cover `amount_needed`). */
  readonly package_count: number;

  /**
   * Size of each package in `unit`.
   * 0 means no package-size data is available (e.g. for loose produce).
   */
  readonly package_size: number;

  /**
   * Amount left over after buying `package_count` packages.
   * leftover = (package_count × package_size) − amount_needed
   * 0 when package sizes are exact or unknown.
   */
  readonly leftover_amount: number;

  /**
   * Estimated total cost in EUR cents for the packages to buy.
   * 0 when price data is not available.
   */
  readonly estimated_price_cents: number;

  /** Whether the user has checked this item off in the store. */
  readonly is_checked: boolean;
}

/**
 * A group of `ShoppingListItem`s belonging to the same supermarket aisle.
 * Used to render a section (with a sticky header) in `ShoppingListScreen`.
 */
export interface AisleGroup {
  /** German aisle name, e.g. "Obst & Gemüse". */
  readonly category: AisleCategory;

  /** Items belonging to this aisle, sorted alphabetically by ingredient name. */
  readonly items: readonly ShoppingListItem[];

  /** Total number of items in this group. Convenience field for the UI badge. */
  readonly item_count: number;
}

/**
 * The fully-derived Einkaufsliste produced by `deriveShoppingList()`.
 *
 * This is the top-level value stored in Zustand and cached in SQLite after the
 * GET /shopping-list/:planId Edge Function returns.
 */
export interface DerivedShoppingList {
  /** Aisle groups in physical supermarket walking order. Empty groups omitted. */
  readonly groups: readonly AisleGroup[];

  /**
   * Sum of `estimated_price_cents` across all items.
   * 0 when no price data is available at all.
   */
  readonly total_estimated_cents: number;

  /** Total number of distinct shopping items across all aisles. */
  readonly total_items: number;
}

// ---------------------------------------------------------------------------
// Internal types used only inside derive-shopping-list.ts
// ---------------------------------------------------------------------------

/**
 * Intermediate accumulator keyed by `ingredient_id`.
 * Amounts are already normalised to `default_unit` when stored here.
 *
 * Not exported — implementation detail of the derivation algorithm.
 */
export interface IngredientAccumulator {
  ingredient_id: string;
  ingredient_name: string;
  /** Running total in `default_unit`. */
  total_amount: number;
  default_unit: Unit;
  aisle_category: AisleCategory;
  ingredient_ref: Ingredient;
}
