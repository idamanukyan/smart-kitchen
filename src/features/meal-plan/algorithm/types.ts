// =============================================================================
// SmartKüche — Meal Plan Algorithm: Type Definitions
// =============================================================================
// This file is the single source of truth for all types used by the meal plan
// generation algorithm. Types are derived from the PostgreSQL schema (see
// docs/database-schema.sql) and the domain model described in docs/architecture.md.
//
// Naming conventions:
//   - Enums use PascalCase string literal unions (not TypeScript enum keyword)
//     so they serialise cleanly to/from JSON and the DB without mapping layers.
//   - All monetary values are EUR cents as integers (e.g. 450 = €4,50).
//   - All times are in minutes.
//   - Day indices: 0 = Montag … 6 = Sonntag (ISO week convention).
// =============================================================================

// ---------------------------------------------------------------------------
// PRIMITIVE ENUMS — match database enum types 1-to-1
// ---------------------------------------------------------------------------

/**
 * Dietary lifestyle options, matching `diet_type_enum` in the DB.
 * The algorithm uses this for hard filtering: a recipe is only eligible for a
 * user if the recipe's `dietTags` includes a value compatible with the user's
 * diet. Compatibility is hierarchical:
 *   vegan ⊂ vegetarisch ⊂ pescetarisch ⊂ flexitarisch ⊂ omnivor
 */
export type DietType =
  | 'omnivor'       // alles
  | 'flexitarisch'  // wenig Fleisch — algorithm limits meat meals to 3/week
  | 'vegetarisch'   // kein Fleisch/Fisch
  | 'vegan'         // keine tierischen Produkte
  | 'pescetarisch'; // Fisch erlaubt, aber kein Fleisch

/**
 * Meal types within a day, matching `meal_slots.meal_type` in the DB.
 * NOTE: 'Abendbrot' is a first-class type (cold dinner), not a sub-type of
 * 'Abendessen'. The algorithm ensures at least 2 Abendbrot slots per week.
 */
export type MealType =
  | 'Frühstück'   // optional breakfast
  | 'Mittagessen' // lunch
  | 'Abendessen'  // warm dinner
  | 'Abendbrot';  // cold dinner — Brot, Aufschnitt, Käse, etc.

/**
 * Day of the week index, 0-based starting on Monday (ISO week).
 * Used in MealSlot.dayOfWeek and constraint logic.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Recipe difficulty, matching `difficulty_enum` in the DB.
 */
export type Difficulty = 'einfach' | 'mittel' | 'anspruchsvoll';

/**
 * Rough cost-per-serving classification, matching `cost_rating_enum` in the DB.
 * Used in Sparwoche mode: the algorithm heavily prefers 'günstig' recipes and
 * avoids 'gehoben' recipes entirely when budget is tight.
 */
export type CostRating = 'günstig' | 'mittel' | 'gehoben';

/**
 * German supermarket aisle categories, matching `ingredient_category_enum`.
 * These correspond to the physical aisle layout of REWE/EDEKA and are used
 * both by the shopping list derivation and indirectly by the algorithm
 * (package-size awareness maps ingredient categories to packaging norms).
 */
export type AisleCategory =
  | 'Obst & Gemüse'
  | 'Fleisch & Wurst'
  | 'Milchprodukte'
  | 'Kühlregal'
  | 'Tiefkühl'
  | 'Konserven & Gläser'
  | 'Backzutaten'
  | 'Gewürze & Öle'
  | 'Getränke'
  | 'Brot & Backwaren'
  | 'Süßwaren & Snacks'
  | 'Sonstiges';

/**
 * Standard metric and German packaging units, matching `unit_enum` in the DB.
 * The algorithm's package-size logic uses these to determine standard package
 * sizes and calculate waste from partial packages.
 */
export type UnitType =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'Stück'
  | 'Bund'
  | 'Packung'
  | 'Dose'
  | 'Becher'
  | 'Tüte';

/**
 * Budget/shopping mode, matching `budget_mode_enum` in the DB.
 * 'sparwoche' triggers cost-optimised planning: prefer günstig recipes,
 * maximise ingredient reuse, and enforce the weekly_budget_cents ceiling.
 */
export type BudgetMode = 'normal' | 'sparwoche';

/**
 * Known German allergen keys (maps to `user_preferences.allergies` TEXT[]).
 * These are used for STRICT hard filtering — no allergen violation is ever
 * permitted, regardless of scoring.
 */
export type AllergenKey =
  | 'Laktose'
  | 'Gluten'
  | 'Nüsse'
  | 'Erdnüsse'
  | 'Ei'
  | 'Soja'
  | 'Fisch'
  | 'Meeresfrüchte'
  | 'Sellerie'
  | 'Senf';

/**
 * Preferred German supermarket chain, matching `preferred_store_enum` in the DB.
 * Affects package-size rounding (each chain has its own common_package_sizes).
 */
export type PreferredStore = 'REWE' | 'EDEKA' | 'Lidl' | 'Aldi' | 'Kaufland' | 'Other';

// ---------------------------------------------------------------------------
// DOMAIN ENTITIES — mirror DB tables as plain TypeScript objects
// ---------------------------------------------------------------------------

/**
 * Ingredient from the `ingredients` table.
 * The algorithm uses ingredients primarily for:
 *   1. Overlap scoring (which other recipes also use this ingredient?)
 *   2. Package-size waste calculation
 *   3. Seasonal bonus (is_seasonal + season_months)
 */
export interface Ingredient {
  /** UUID primary key */
  id: string;
  /** German ingredient name, e.g. "Vollmilch", "Hackfleisch (gemischt)" */
  nameDe: string;
  /** Supermarket aisle, used for shopping list grouping */
  category: AisleCategory;
  /** The standard unit for this ingredient */
  defaultUnit: UnitType;
  /**
   * Standard package sizes per store (in the ingredient's default_unit).
   * e.g. { "REWE": [500, 1000], "Lidl": [1000] }
   * Used by package-size waste minimisation logic.
   */
  commonPackageSizes: Partial<Record<PreferredStore, number[]>>;
  /** Typical shelf life in days. null if highly variable. */
  shelfLifeDays: number | null;
  /** Whether this ingredient has notable seasonal availability (e.g. Spargel) */
  isSeasonal: boolean;
  /**
   * Months (1–12) when this ingredient is in season.
   * Empty array if isSeasonal = false.
   */
  seasonMonths: number[];
}

/**
 * A single ingredient entry in a recipe (from `recipe_ingredients` table).
 * Carries the amount and unit as used in this specific recipe — these may
 * differ from the ingredient's default_unit (e.g. recipe uses ml, default is l).
 */
export interface RecipeIngredient {
  /** UUID primary key of the recipe_ingredients row */
  id: string;
  /** The full ingredient object (pre-joined for algorithm convenience) */
  ingredient: Ingredient;
  /** Amount needed for this recipe at its default serving count */
  amount: number;
  /** Unit for this specific recipe-ingredient combination */
  unit: UnitType;
  /** Optional German preparation note, e.g. "fein gehackt" */
  preparationNote: string | null;
}

/**
 * A recipe from the `recipes` table, fully hydrated with its ingredients.
 * This is the object the algorithm works with — it should be pre-fetched with
 * a JOIN on recipe_ingredients + ingredients before being passed to the generator.
 */
export interface Recipe {
  /** UUID primary key */
  id: string;
  /** German recipe title, e.g. "Spaghetti Carbonara", "Linseneintopf" */
  titleDe: string;
  /** Optional short German description */
  descriptionDe: string | null;
  /** Prep time in minutes */
  prepTimeMinutes: number;
  /** Active cooking time in minutes */
  cookTimeMinutes: number;
  /**
   * Total time convenience getter.
   * NOTE: Not stored in DB — callers must compute: prepTimeMinutes + cookTimeMinutes.
   */
  totalTimeMinutes: number;
  /** Recipe difficulty */
  difficulty: Difficulty;
  /** Default number of servings this recipe yields */
  servingsDefault: number;
  /**
   * Which meal types this recipe suits.
   * A recipe tagged 'Abendbrot' should have near-zero cooking time and be
   * composed of cold/pre-packaged ingredients.
   */
  mealTypes: MealType[];
  /**
   * Diet compatibility tags, e.g. ['vegetarisch', 'vegan'].
   * The algorithm checks that at least one tag is compatible with the user's
   * diet_type (using the subset hierarchy).
   */
  dietTags: DietType[];
  /** Cost classification per serving */
  costRating: CostRating;
  /**
   * Optional precise cost estimate in EUR cents per serving.
   * Used in Sparwoche budget accumulation checks.
   */
  costEstimateCentsPerServing: number | null;
  /** Whether this recipe is seasonally constrained */
  isSeasonal: boolean;
  /**
   * Months (1–12) when this recipe is in season / most appropriate.
   * Empty array if isSeasonal = false.
   */
  seasonMonths: number[];
  /**
   * Full list of ingredients with amounts. Pre-joined from recipe_ingredients.
   * This is what enables overlap scoring without additional DB queries.
   */
  ingredients: RecipeIngredient[];
  /**
   * The protein category of the main protein in this recipe, used for the
   * "no consecutive protein repeat" variety rule.
   * Derived at data-ingestion time and stored as a free text tag on the recipe.
   * e.g. 'Rind', 'Schwein', 'Huhn', 'Fisch', 'Hülsenfrüchte', 'Ei', 'Käse', 'Tofu', null
   */
  mainProtein: string | null;
  /** Optional CDN image URL */
  imageUrl: string | null;
}

/**
 * A single meal slot within a 7-day plan (from `meal_slots` table).
 * A slot is the fundamental unit the algorithm fills.
 */
export interface MealSlot {
  /** UUID primary key */
  id: string;
  /** The plan this slot belongs to */
  planId: string;
  /** Day index: 0 = Montag, 6 = Sonntag */
  dayOfWeek: DayOfWeek;
  /** Which meal of the day this slot represents */
  mealType: MealType;
  /**
   * The assigned recipe, or null if the slot is intentionally empty
   * (e.g. user skips Frühstück).
   */
  recipe: Recipe | null;
  /**
   * When true, the algorithm must not change this slot during regeneration.
   * Locked slots represent user choices that must be respected.
   */
  isLocked: boolean;
  /**
   * Overrides the recipe's servingsDefault for this slot.
   * null = use household size from UserPreferences.
   */
  servingsOverride: number | null;
}

/**
 * A complete 7-day meal plan (from `meal_plans` table + joined meal_slots).
 */
export interface MealPlan {
  /** UUID primary key */
  id: string;
  /** The household this plan belongs to */
  householdId: string;
  /**
   * ISO date string of the Monday that starts this week.
   * e.g. "2026-04-20"
   */
  weekStartDate: string;
  /**
   * All meal slots for this plan.
   * A full week has up to 21 slots (7 days × 3 meal types), but Frühstück is
   * optional and not always generated.
   */
  slots: MealSlot[];
  /** ISO timestamp of when this plan was generated */
  generatedAt: string;
}

/**
 * User dietary and budget preferences (from `user_preferences` table).
 * This drives all hard constraints in the algorithm.
 */
export interface UserPreferences {
  /** The user_id this preference row belongs to */
  userId: string;
  /** Dietary lifestyle — drives recipe eligibility filtering */
  dietType: DietType;
  /**
   * Allergens to strictly exclude.
   * The algorithm must NEVER assign a recipe whose ingredients contain any
   * of these allergens. This is a hard constraint — not a soft preference.
   */
  allergies: AllergenKey[];
  /**
   * Free-text ingredient names the user wants to avoid beyond allergens.
   * Applied as a soft constraint (penalise, but don't necessarily exclude).
   */
  excludedIngredients: string[];
  /**
   * Maximum total cooking time the user is willing to spend per day (minutes).
   * null = unbegrenzt (no time limit).
   * One "ambitious" meal per week is allowed at 1.5× this limit.
   */
  maxCookingTimeMinutes: number | null;
  /** Whether the user is in cost-saving mode */
  budgetMode: BudgetMode;
  /**
   * Optional weekly grocery budget ceiling in EUR cents.
   * Only enforced when budgetMode = 'sparwoche'.
   * null = no budget set.
   */
  weeklyBudgetCents: number | null;
  /** Preferred supermarket, used for package-size rounding */
  preferredStore: PreferredStore;
  /** When these preferences were last updated */
  updatedAt: string;
}

/**
 * Household context needed by the algorithm.
 * The algorithm uses this for portion scaling and, in Phase 2, pantry-aware
 * ingredient reuse.
 */
export interface Household {
  /** UUID primary key */
  id: string;
  /** Total number of people (drives portion / servings scaling) */
  size: number;
  /** Number of adults (for portioning purposes) */
  adultsCount: number;
  /** Number of children */
  childrenCount: number;
}

// ---------------------------------------------------------------------------
// ALGORITHM INPUT / OUTPUT TYPES
// ---------------------------------------------------------------------------

/**
 * A locked slot provided as input to the algorithm.
 * Locked slots are slots the user has pinned — the algorithm must place the
 * specified recipe in exactly this position and must not move or replace it.
 */
export interface LockedSlotInput {
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  /** The recipe that must occupy this slot */
  recipeId: string;
}

/**
 * The full input bundle passed to the plan generator.
 */
export interface PlanGenerationInput {
  /** User dietary and budget constraints */
  preferences: UserPreferences;
  /** Household size for portion scaling */
  household: Household;
  /**
   * Pool of eligible recipes to draw from.
   * IMPORTANT: The caller is responsible for pre-filtering this pool by:
   *   - Diet compatibility (dietTags ∩ preferences.dietType)
   *   - Allergen exclusion (no allergen in preferences.allergies)
   * The algorithm applies further scoring and constraint checks on top of this.
   */
  recipePool: Recipe[];
  /**
   * Slots that must remain unchanged. The algorithm fills around these.
   * The corresponding Recipe objects must also be present in recipePool.
   */
  lockedSlots: LockedSlotInput[];
  /**
   * ISO date string of the Monday that starts the week being planned.
   * Used to determine the current month for seasonal scoring.
   */
  weekStartDate: string;
  /**
   * IDs of recipes used in recent past plans (last ~2 weeks).
   * Used by the user-history penalty scoring function.
   * More recent = higher penalty. Ordering: index 0 = most recent.
   */
  recentlyUsedRecipeIds: string[];
  /**
   * Phase 2 extension: pantry items the household currently has.
   * When provided, the algorithm prefers recipes that use these ingredients
   * (especially those near expiry).
   * Optional — omit or pass empty array for Phase 1 behaviour.
   */
  pantryIngredientIds?: string[];
}

/**
 * A scored candidate meal plan produced internally by the algorithm.
 * The generator produces CANDIDATE_COUNT of these and returns the best.
 */
export interface ScoredPlan {
  /** The candidate plan */
  plan: MealPlan;
  /** Total composite score (0–1, higher is better) */
  totalScore: number;
  /** Breakdown of each scoring component for debugging / transparency */
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Detailed breakdown of a plan's score across all weighted components.
 * Exposed on ScoredPlan for testability and potential "explain this plan" UI.
 */
export interface ScoreBreakdown {
  /**
   * Variety score (weight: 30%).
   * Penalises consecutive same-protein days, repeated recipes within 2 weeks,
   * and excess pasta/rice in a single week.
   */
  varietyScore: number;
  /**
   * Ingredient reuse score (weight: 25%).
   * Rewards plans where ingredients are shared across multiple meals,
   * reducing the number of distinct items on the shopping list and minimising
   * partial-package waste.
   */
  ingredientReuseScore: number;
  /**
   * Time fit score (weight: 15%).
   * Rewards plans that stay within the user's daily time budget.
   * One "ambitious" meal at 1.5× the limit is permitted per week.
   */
  timeFitScore: number;
  /**
   * Budget fit score (weight: 15%).
   * In Sparwoche mode: strongly rewards günstig recipes, penalises gehoben
   * ones, and enforces the weeklyBudgetCents ceiling.
   * In normal mode: still provides a gentle preference for cost balance.
   */
  budgetFitScore: number;
  /**
   * Seasonal bonus (weight: 10%).
   * Rewards recipes whose ingredients (and the recipe itself) are in season
   * for the current month.
   */
  seasonalScore: number;
  /**
   * User history penalty (weight: 5%).
   * Penalises plans that reuse recipes from the last ~2 weeks.
   * Helps ensure variety across multiple consecutive weeks.
   */
  historyPenaltyScore: number;
}

/**
 * The output of a successful plan generation.
 */
export interface PlanGenerationOutput {
  /** The best-scoring candidate plan */
  plan: MealPlan;
  /** Score details for the winning plan */
  scoreBreakdown: ScoreBreakdown;
  /** Total number of candidate plans evaluated */
  candidatesEvaluated: number;
  /** ISO timestamp of when generation completed */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// INTERNAL SCORING HELPERS
// ---------------------------------------------------------------------------

/**
 * Aggregated ingredient usage across a candidate plan.
 * Built once per candidate by the scoring engine and reused across multiple
 * scoring functions to avoid redundant iteration.
 */
export interface PlanIngredientMap {
  /**
   * Map from ingredient ID → total amount needed (in the ingredient's default unit)
   * across all meals in the plan.
   */
  totalAmounts: Map<string, number>;
  /**
   * Map from ingredient ID → set of slot keys (e.g. "2:Mittagessen") that use it.
   * Used to compute reuse density: ingredients used in 3+ meals score higher.
   */
  usedInSlots: Map<string, Set<string>>;
  /**
   * Map from ingredient ID → number of standard packages needed
   * (rounded up to nearest package size for the user's preferred store).
   * Used for waste calculation.
   */
  packagesNeeded: Map<string, number>;
  /**
   * Estimated total waste (in default units) from partial packages across the plan.
   * Lower waste → higher ingredient reuse score.
   */
  estimatedWaste: number;
}

/**
 * Protein category groupings used by the variety-scoring "no consecutive protein
 * repeat" rule.
 *
 * The algorithm maps Recipe.mainProtein strings to these canonical groups so that
 * "Hähnchenbrust" and "Hähnchenschenkel" both count as the same protein type.
 */
export type ProteinGroup =
  | 'Rind'
  | 'Schwein'
  | 'Geflügel'
  | 'Fisch'
  | 'Meeresfrüchte'
  | 'Hülsenfrüchte'
  | 'Ei'
  | 'Käse'
  | 'Tofu'
  | 'Sonstiges'
  | null; // null = no dominant protein (e.g. salad, pasta with just vegetables)

/**
 * Starch category used by the "max 2 pasta / max 2 rice per week" variety rule.
 */
export type StarchCategory = 'Pasta' | 'Reis' | 'Other' | null;

/**
 * Context object passed between internal scoring functions.
 * Pre-computed once per candidate plan to avoid recalculating common values.
 */
export interface ScoringContext {
  /** The candidate plan being scored */
  plan: MealPlan;
  /** The user's preferences */
  preferences: UserPreferences;
  /** IDs of recipes used in recent plans (for history penalty) */
  recentlyUsedRecipeIds: string[];
  /**
   * The current month (1–12) derived from weekStartDate.
   * Used by seasonal scoring.
   */
  currentMonth: number;
  /**
   * Pre-built ingredient map for this candidate (computed before scoring).
   * Passed in to avoid redundant re-computation across scoring functions.
   */
  ingredientMap: PlanIngredientMap;
}
