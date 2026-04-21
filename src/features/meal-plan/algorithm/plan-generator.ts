// =============================================================================
// SmartKüche — Meal Plan Algorithm: Plan Generator
// =============================================================================
// This is the core IP of SmartKüche. The generator creates 7-day meal plans
// that respect hard dietary constraints, optimise ingredient reuse across meals,
// and score well on variety, time budget, budget mode, and seasonality.
//
// ALGORITHM OVERVIEW
// ------------------
// 1. Validate input: ensure recipePool is non-empty after hard-constraint filtering.
// 2. Pre-filter the recipe pool:
//    a. Remove recipes whose allergens conflict with user preferences (HARD).
//    b. Remove recipes incompatible with the user's diet type (HARD).
//    c. Remove recipes tagged with excluded ingredients (SOFT — still filtered pre-scoring
//       because ingredient exclusions are near-hard preferences).
// 3. Build the slot template: 7 days × (Mittagessen + Abendessen), optionally Frühstück.
//    Inject locked slots immediately — they don't participate in random assignment.
// 4. Generate CANDIDATE_COUNT candidate plans:
//    a. For each candidate, fill unlocked slots by sampling from the filtered pool.
//    b. Each slot has type-specific filtering (e.g. Abendbrot only gets Abendbrot-tagged
//       recipes; Frühstück only gets Frühstück-tagged recipes).
//    c. Ingredient-reuse-guided sampling: after the first few slots are filled,
//       subsequent slots prefer recipes that share ingredients with already-placed meals.
//       This is the key differentiator — standard random sampling would miss this.
// 5. Score each candidate using computeCompositeScore().
// 6. Return the best-scoring valid candidate (one that passes all hard constraint checks).
//
// SINGLE-SLOT REGENERATION
// -------------------------
// The regenerateSingleSlot() function generates candidates for just one slot,
// maintaining all locked constraints and avoiding recipes already in the plan.
// It uses the same scoring infrastructure but narrows the candidate pool.
//
// CONSTRAINTS ENFORCED
// ---------------------
// Hard (violations = candidate discarded):
//   • Allergen exclusion (dietType-incompatible recipes already filtered in pool)
//   • Dietary compliance (vegan/vegetarisch etc.)
//   • Abendbrot: never assigned to a Mittagessen or Abendessen slot and vice versa
//
// Soft (violations = score penalty):
//   • Variety (consecutive protein, starch limits)
//   • Time budget (with one ambitious-meal exception)
//   • Budget mode (Sparwoche: prefer günstig, enforce ceiling)
//   • Seasonality preference
//   • User history (recently used recipes)
//   • Ingredient reuse (the primary optimisation goal)
//   • Abendbrot minimum (at least 2 per week — enforced via slot construction)
// =============================================================================

import type {
  MealPlan,
  MealSlot,
  Recipe,
  PlanGenerationInput,
  PlanGenerationOutput,
  ScoredPlan,
  LockedSlotInput,
  DayOfWeek,
  MealType,
  UserPreferences,
  ScoringContext,
  AllergenKey,
  DietType,
} from './types';

import {
  buildIngredientMap,
  computeCompositeScore,
  classifyStarch,
  classifyProtein,
} from './scoring';

// ---------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// ---------------------------------------------------------------------------

/** Number of candidate plans generated and evaluated before picking the best. */
const CANDIDATE_COUNT = 75;

/**
 * Minimum number of Abendbrot (cold dinner) meals per week.
 * This is enforced structurally: the slot template always includes exactly
 * MIN_ABENDBROT_PER_WEEK Abendbrot slots.
 */
const MIN_ABENDBROT_PER_WEEK = 2;

/**
 * When filling a slot using ingredient-reuse-guided sampling, this is the
 * probability of picking from the "high-reuse" candidate subset vs. random.
 * Value 0.65 means 65% of the time we prefer a recipe that shares ingredients
 * with already-placed meals. This keeps the plan varied while still optimising reuse.
 */
const REUSE_GUIDED_SAMPLE_PROBABILITY = 0.65;

/**
 * Maximum number of recipes to include in the "high-reuse candidate subset"
 * when doing ingredient-reuse-guided sampling for a slot.
 */
const REUSE_CANDIDATE_POOL_SIZE = 10;

/**
 * After this many slot fills in a candidate, switch from pure random to
 * ingredient-reuse-guided sampling. This prevents the first few slots from
 * being biased by early reuse choices.
 */
const REUSE_GUIDANCE_START_AFTER_SLOTS = 3;

// ---------------------------------------------------------------------------
// DIET COMPATIBILITY — subset hierarchy
// ---------------------------------------------------------------------------

/**
 * Returns true if a recipe is compatible with the given diet type.
 *
 * Compatibility is hierarchical (not symmetric):
 *   - An 'omnivor' user can eat ANY recipe.
 *   - A 'flexitarisch' user can eat everything, but the algorithm limits meat
 *     meals to 3/week via variety scoring (not hard filtering here).
 *   - A 'vegetarisch' user can eat 'vegetarisch' and 'vegan' tagged recipes.
 *   - A 'vegan' user can ONLY eat 'vegan' tagged recipes.
 *   - A 'pescetarisch' user can eat 'pescetarisch', 'vegetarisch', and 'vegan'.
 *
 * A recipe is compatible if ANY of its diet_tags is >= the user's diet in strictness.
 */
function isRecipeDietCompatible(recipe: Recipe, dietType: DietType): boolean {
  const tags = recipe.dietTags;

  switch (dietType) {
    case 'omnivor':
    case 'flexitarisch':
      // Any recipe is structurally compatible; flexitarisch limits are soft.
      return true;

    case 'pescetarisch':
      // Can eat pescetarisch, vegetarisch, vegan — just not meat-only recipes.
      // A recipe is compatible if it doesn't require meat.
      return (
        tags.includes('vegan') ||
        tags.includes('vegetarisch') ||
        tags.includes('pescetarisch')
      );

    case 'vegetarisch':
      return tags.includes('vegan') || tags.includes('vegetarisch');

    case 'vegan':
      return tags.includes('vegan');
  }
}

/**
 * Returns true if the recipe is free of all user-specified allergens.
 *
 * The recipe's dietTags array is used here as a proxy for allergen information.
 * In the real data model, allergens are tracked separately in recipe_ingredients
 * at the ingredient level. For the algorithm, the caller pre-joins and surfaces
 * this as a flat array on the Recipe object (dietTags in the DB schema stores
 * allergen info as TEXT[] on the recipe row for fast filtering).
 *
 * NOTE: We check recipe.dietTags for allergen-free markers. In the actual DB,
 * allergen presence is tracked differently — the Edge Function should pass only
 * pre-filtered allergen-safe recipes in the recipe pool. This function is a
 * belt-and-suspenders safety check within the algorithm.
 *
 * The current implementation checks the recipe's ingredient list for allergen
 * keywords in ingredient names (German). This is robust for common allergens.
 */
function isRecipeAllergenSafe(recipe: Recipe, allergens: AllergenKey[]): boolean {
  if (allergens.length === 0) return true;

  // Map allergen keys to German ingredient name keywords
  const allergenKeywords: Record<AllergenKey, string[]> = {
    Laktose: ['milch', 'sahne', 'butter', 'käse', 'joghurt', 'quark', 'mozzarella',
               'parmesan', 'cheddar', 'feta', 'ricotta', 'crème fraîche', 'schmand'],
    Gluten: ['mehl', 'weizen', 'dinkel', 'roggen', 'gerste', 'brot', 'nudeln', 'pasta',
              'semmel', 'sojasauce', 'paniermehl', 'couscous', 'bulgur'],
    Nüsse: ['nüsse', 'mandeln', 'cashews', 'walnüsse', 'haselnüsse', 'pistazien',
             'paranüsse', 'pekannüsse', 'macadamia'],
    Erdnüsse: ['erdnuss', 'erdnüsse', 'erdnussbutter', 'arachide'],
    Ei: ['ei', 'eier', 'eigelb', 'eiweiß', 'mayonnaise'],
    Soja: ['soja', 'tofu', 'tempeh', 'edamame', 'sojasauce', 'sojadrink'],
    Fisch: ['fisch', 'lachs', 'thunfisch', 'kabeljau', 'forelle', 'hering', 'sardine',
             'makrele', 'worcestershire'],
    Meeresfrüchte: ['garnelen', 'shrimps', 'muscheln', 'tintenfisch', 'meeresfrüchte',
                     'hummer', 'languste', 'krabben'],
    Sellerie: ['sellerie', 'staudensellerie', 'knollensellerie'],
    Senf: ['senf', 'dijon', 'mostrich'],
  };

  for (const allergen of allergens) {
    const keywords = allergenKeywords[allergen];
    for (const ri of recipe.ingredients) {
      const name = ri.ingredient.nameDe.toLowerCase();
      if (keywords.some(kw => name.includes(kw))) {
        return false; // Allergen found — recipe is not safe
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// SLOT TEMPLATE BUILDER
// ---------------------------------------------------------------------------

/**
 * A SlotTemplate defines which (day, mealType) combinations need to be filled.
 * Locked slots are excluded from this list — they're injected directly.
 */
interface SlotTemplate {
  dayOfWeek: DayOfWeek;
  mealType: MealType;
}

/**
 * Builds the list of slot positions that need to be filled by the algorithm.
 *
 * Week structure:
 *   Mon–Sun × {Mittagessen, Abendessen or Abendbrot}
 *   Frühstück is intentionally omitted (user handles breakfast independently).
 *
 * Abendbrot distribution:
 *   We distribute MIN_ABENDBROT_PER_WEEK Abendbrot slots across the week.
 *   The default distribution puts Abendbrot on Wednesday and Friday evenings —
 *   typical German household pattern (mid-week and pre-weekend cold dinner).
 *   Remaining evenings get 'Abendessen'.
 *
 * Locked slots are excluded from the template: they're pre-filled and the
 * algorithm never touches them.
 */
function buildSlotTemplates(
  lockedSlots: LockedSlotInput[],
): SlotTemplate[] {
  const lockedSet = new Set(
    lockedSlots.map(ls => `${ls.dayOfWeek}:${ls.mealType}`)
  );

  const templates: SlotTemplate[] = [];

  // Days of the week: 0=Montag to 6=Sonntag
  for (let day = 0; day <= 6; day++) {
    const d = day as DayOfWeek;

    // Mittagessen every day
    const mittKey = `${d}:Mittagessen`;
    if (!lockedSet.has(mittKey)) {
      templates.push({ dayOfWeek: d, mealType: 'Mittagessen' });
    }

    // Abendessen vs Abendbrot
    // Abendbrot on Wednesday (2) and Friday (4) by default
    const isAbendBrotDay = d === 2 || d === 4;
    const eveningType: MealType = isAbendBrotDay ? 'Abendbrot' : 'Abendessen';
    const eveningKey = `${d}:${eveningType}`;
    if (!lockedSet.has(eveningKey)) {
      templates.push({ dayOfWeek: d, mealType: eveningType });
    }
  }

  return templates;
}

// ---------------------------------------------------------------------------
// RECIPE POOL FILTERING
// ---------------------------------------------------------------------------

/**
 * Applies hard filters to the recipe pool before candidate generation begins.
 *
 * Hard filters (violations mean recipe is excluded entirely):
 *   1. Diet compatibility — recipe must have a compatible diet tag.
 *   2. Allergen safety — recipe must not contain any user allergen.
 *   3. Excluded ingredients — recipe must not use any user-excluded ingredient.
 *
 * Returns the filtered pool. If the filtered pool is empty after all filters,
 * the generator will throw a descriptive error.
 */
function filterRecipePool(
  pool: Recipe[],
  preferences: UserPreferences,
): Recipe[] {
  return pool.filter(recipe => {
    // Hard: diet compatibility
    if (!isRecipeDietCompatible(recipe, preferences.dietType)) {
      return false;
    }

    // Hard: allergen safety
    if (!isRecipeAllergenSafe(recipe, preferences.allergies)) {
      return false;
    }

    // Hard: excluded ingredients (user's blacklist beyond allergens)
    if (preferences.excludedIngredients.length > 0) {
      const ingredientNames = recipe.ingredients.map(ri =>
        ri.ingredient.nameDe.toLowerCase()
      );
      for (const excluded of preferences.excludedIngredients) {
        const excludedLower = excluded.toLowerCase();
        if (ingredientNames.some(n => n.includes(excludedLower))) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Filters the recipe pool to only include recipes eligible for a specific MealType.
 *
 * IMPORTANT: Abendbrot is strictly filtered — only recipes tagged 'Abendbrot'
 * are eligible for Abendbrot slots. This prevents the algorithm from placing
 * a full warm dinner recipe in a cold-dinner slot.
 *
 * Conversely, Abendbrot-tagged recipes are NOT eligible for Mittagessen or
 * Abendessen slots (they wouldn't constitute a proper warm meal).
 */
function filterByMealType(
  pool: Recipe[],
  mealType: MealType,
  excludeRecipeIds?: Set<string>,
): Recipe[] {
  return pool.filter(recipe => {
    // Respect exclusion list (used in regenerateSingleSlot to avoid plan duplicates)
    if (excludeRecipeIds?.has(recipe.id)) return false;

    // Abendbrot recipes only go in Abendbrot slots
    if (recipe.mealTypes.includes('Abendbrot') &&
        !recipe.mealTypes.includes('Mittagessen') &&
        !recipe.mealTypes.includes('Abendessen') &&
        mealType !== 'Abendbrot') {
      return false;
    }

    // Abendbrot slots only accept Abendbrot recipes
    if (mealType === 'Abendbrot' && !recipe.mealTypes.includes('Abendbrot')) {
      return false;
    }

    // Frühstück slots only accept Frühstück recipes
    if (mealType === 'Frühstück' && !recipe.mealTypes.includes('Frühstück')) {
      return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// RANDOM SAMPLING UTILITIES
// ---------------------------------------------------------------------------

/**
 * Returns a cryptographically-insecure pseudo-random integer in [0, max).
 * Using Math.random() is fine here — this is not a security-sensitive context.
 */
function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Returns a random element from an array.
 * Returns undefined if the array is empty.
 */
function randomPick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[randomInt(arr.length)];
}

/**
 * Performs ingredient-reuse-guided sampling: from the given `eligible` recipe pool,
 * returns a subset that shares the most ingredients with `alreadyUsedIngredientIds`.
 *
 * This is the key mechanism for ingredient reuse optimisation:
 *   - After some slots are filled, we know which ingredients are already "in play".
 *   - For the next slot, we preferentially pick recipes that also use those ingredients
 *     (e.g. if Petersilie was bought for Monday's recipe, prefer a Wednesday recipe
 *     that also uses Petersilie so the bunch isn't wasted).
 *
 * Returns up to REUSE_CANDIDATE_POOL_SIZE recipes sorted by overlap count (desc).
 * If no recipes overlap, returns the full eligible pool for normal random selection.
 */
function buildReuseGuidedCandidates(
  eligible: Recipe[],
  alreadyUsedIngredientIds: Set<string>,
): Recipe[] {
  if (alreadyUsedIngredientIds.size === 0) return eligible;

  // Score each recipe by ingredient overlap count
  const scored = eligible.map(recipe => {
    const overlap = recipe.ingredients.filter(ri =>
      alreadyUsedIngredientIds.has(ri.ingredient.id)
    ).length;
    return { recipe, overlap };
  });

  // Sort by overlap descending, then take top REUSE_CANDIDATE_POOL_SIZE
  scored.sort((a, b) => b.overlap - a.overlap);

  // Only include recipes that actually overlap (overlap > 0)
  const withOverlap = scored.filter(s => s.overlap > 0);

  if (withOverlap.length === 0) return eligible; // no overlap possible — fall back

  return withOverlap.slice(0, REUSE_CANDIDATE_POOL_SIZE).map(s => s.recipe);
}

// ---------------------------------------------------------------------------
// CANDIDATE PLAN BUILDER
// ---------------------------------------------------------------------------

/**
 * Builds a single candidate plan by filling all unlocked slots.
 *
 * The filling strategy:
 *   1. Inject all locked slots first (their recipes are fixed).
 *   2. For each unlocked slot template, select a recipe from the eligible pool.
 *   3. After REUSE_GUIDANCE_START_AFTER_SLOTS slots are filled, switch to
 *      ingredient-reuse-guided sampling with probability REUSE_GUIDED_SAMPLE_PROBABILITY.
 *   4. Avoid assigning the same recipe to multiple slots in the same plan.
 *
 * Returns null if it's impossible to fill all slots (e.g. filtered pool is empty
 * for a specific meal type). The caller should handle this gracefully.
 */
function buildCandidatePlan(
  planId: string,
  weekStartDate: string,
  householdId: string,
  lockedSlots: LockedSlotInput[],
  slotTemplates: SlotTemplate[],
  filteredPool: Recipe[],
  householdSize: number,
): MealPlan | null {
  // Track assigned recipe IDs to avoid duplicates within a plan
  const assignedRecipeIds = new Set<string>();

  // Track all ingredient IDs placed so far (for reuse-guided sampling)
  const placedIngredientIds = new Set<string>();

  const slots: MealSlot[] = [];
  let slotIdCounter = 0;

  // Inject locked slots first
  for (const locked of lockedSlots) {
    // Note: the caller ensures that locked recipes exist in filteredPool.
    // We create a minimal MealSlot with recipe: null and mark as locked.
    // The actual Recipe object must be resolved by the caller before scoring.
    // For candidate building, we track the locked recipe's ID to avoid
    // assigning it to other slots.
    assignedRecipeIds.add(locked.recipeId);
    // Locked slots are added as stubs — they'll be resolved to full Recipe objects
    // after buildCandidatePlan returns (see generatePlan).
    slots.push({
      id: `stub-locked-${slotIdCounter++}`,
      planId,
      dayOfWeek: locked.dayOfWeek,
      mealType: locked.mealType,
      recipe: null, // resolved after return
      isLocked: true,
      servingsOverride: null,
    });
  }

  // Fill unlocked slots
  let slotsFilled = 0;

  for (const template of slotTemplates) {
    // Filter eligible recipes for this slot's meal type
    const eligible = filterByMealType(
      filteredPool,
      template.mealType,
      assignedRecipeIds, // avoid re-using recipes already placed
    );

    if (eligible.length === 0) {
      // Cannot fill this slot — candidate is invalid
      return null;
    }

    // Choose sampling strategy
    let chosenRecipe: Recipe | undefined;

    if (
      slotsFilled >= REUSE_GUIDANCE_START_AFTER_SLOTS &&
      Math.random() < REUSE_GUIDED_SAMPLE_PROBABILITY
    ) {
      // Ingredient-reuse-guided sampling
      const reuseCandidates = buildReuseGuidedCandidates(eligible, placedIngredientIds);
      chosenRecipe = randomPick(reuseCandidates);
    }

    // Fallback to pure random if reuse guidance found nothing
    if (chosenRecipe === undefined) {
      chosenRecipe = randomPick(eligible);
    }

    if (chosenRecipe === undefined) {
      // Should not happen (eligible.length > 0 checked above), but guard anyway
      return null;
    }

    // Register recipe and its ingredients as placed
    assignedRecipeIds.add(chosenRecipe.id);
    for (const ri of chosenRecipe.ingredients) {
      placedIngredientIds.add(ri.ingredient.id);
    }

    slots.push({
      id: `slot-${slotIdCounter++}`,
      planId,
      dayOfWeek: template.dayOfWeek,
      mealType: template.mealType,
      recipe: chosenRecipe,
      isLocked: false,
      servingsOverride: null, // household size used by scoring context
    });

    slotsFilled++;
  }

  return {
    id: planId,
    householdId,
    weekStartDate,
    slots,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// ABENDBROT COUNT ENFORCEMENT
// ---------------------------------------------------------------------------

/**
 * Counts the number of Abendbrot slots in a plan.
 * Used as a final validation check after candidate selection.
 */
function countAbendBrot(plan: MealPlan): number {
  return plan.slots.filter(s => s.mealType === 'Abendbrot').length;
}

// ---------------------------------------------------------------------------
// LOCKED SLOT RESOLVER
// ---------------------------------------------------------------------------

/**
 * Resolves locked slot stubs to full MealSlot objects with the correct Recipe.
 *
 * After buildCandidatePlan(), locked slots have recipe: null. This function
 * looks up the actual Recipe object from the pool and injects it.
 *
 * This two-step approach is necessary because buildCandidatePlan() returns null
 * when a slot can't be filled — we want to avoid expensive Recipe lookups until
 * we know the candidate is valid.
 */
function resolveLockedSlots(
  plan: MealPlan,
  lockedSlots: LockedSlotInput[],
  recipePool: Recipe[],
): MealPlan {
  const recipeById = new Map<string, Recipe>(
    recipePool.map(r => [r.id, r])
  );

  const resolvedSlots = plan.slots.map(slot => {
    if (!slot.isLocked) return slot;

    // Find the locked slot input for this position
    const lockedInput = lockedSlots.find(
      ls => ls.dayOfWeek === slot.dayOfWeek && ls.mealType === slot.mealType
    );
    if (!lockedInput) return slot;

    const recipe = recipeById.get(lockedInput.recipeId) ?? null;
    return { ...slot, recipe };
  });

  return { ...plan, slots: resolvedSlots };
}

// ---------------------------------------------------------------------------
// MAIN PLAN GENERATOR
// ---------------------------------------------------------------------------

/**
 * Generates a 7-day meal plan.
 *
 * This is the primary entry point for the meal plan algorithm.
 *
 * The function:
 *   1. Validates the input (non-empty pool, at least one eligible recipe per slot type).
 *   2. Filters the recipe pool using hard constraints.
 *   3. Generates CANDIDATE_COUNT candidate plans.
 *   4. Scores each candidate using the weighted scoring system.
 *   5. Returns the best-scoring valid candidate.
 *
 * @throws Error if the recipe pool is empty after filtering (descriptive message
 *         so the Edge Function can return a meaningful 404 response to the client).
 */
export function generatePlan(input: PlanGenerationInput): PlanGenerationOutput {
  const {
    preferences,
    household,
    recipePool,
    lockedSlots,
    weekStartDate,
    recentlyUsedRecipeIds,
    pantryIngredientIds = [],
  } = input;

  // ------------------------------------------------------------------
  // Step 1: Filter the recipe pool (hard constraints)
  // ------------------------------------------------------------------
  const filteredPool = filterRecipePool(recipePool, preferences);

  if (filteredPool.length === 0) {
    throw new Error(
      'Keine Rezepte verfügbar, die den Einstellungen entsprechen. ' +
      'Bitte passe deine Ernährungsweise, Allergien oder andere Einstellungen an.'
    );
  }

  // Validate that we have Abendbrot recipes in the pool (required for structural enforcement)
  const hasAbendBrot = filteredPool.some(r => r.mealTypes.includes('Abendbrot'));
  if (!hasAbendBrot) {
    throw new Error(
      'Keine Abendbrot-Rezepte im Pool. Der Wochenplan benötigt mindestens ' +
      `${MIN_ABENDBROT_PER_WEEK} Abendbrot-Mahlzeiten.`
    );
  }

  // ------------------------------------------------------------------
  // Step 2: Build the plan ID and slot templates
  // ------------------------------------------------------------------
  const planId = `plan-${weekStartDate}-${household.id}`;
  const slotTemplates = buildSlotTemplates(lockedSlots);

  // ------------------------------------------------------------------
  // Step 3: Derive scoring context metadata
  // ------------------------------------------------------------------
  // Extract current month (1–12) from weekStartDate for seasonal scoring
  const weekDate = new Date(weekStartDate);
  const currentMonth = weekDate.getMonth() + 1; // getMonth() returns 0-11

  // ------------------------------------------------------------------
  // Step 4: Generate and score CANDIDATE_COUNT candidate plans
  // ------------------------------------------------------------------
  const candidates: ScoredPlan[] = [];
  let generationAttempts = 0;

  // We attempt up to CANDIDATE_COUNT * 2 times to account for null returns
  // from buildCandidatePlan (which can happen if the pool is very small).
  const maxAttempts = CANDIDATE_COUNT * 2;

  while (candidates.length < CANDIDATE_COUNT && generationAttempts < maxAttempts) {
    generationAttempts++;

    const rawPlan = buildCandidatePlan(
      planId,
      weekStartDate,
      household.id,
      lockedSlots,
      slotTemplates,
      filteredPool,
      household.size,
    );

    if (rawPlan === null) continue; // slot couldn't be filled — try again

    // Resolve locked slot stubs to full Recipe objects
    const plan = resolveLockedSlots(rawPlan, lockedSlots, filteredPool);

    // Build the ingredient map once (used by multiple scoring functions)
    const ingredientMap = buildIngredientMap(plan, preferences, household.size);

    // Build the scoring context
    const ctx: ScoringContext = {
      plan,
      preferences,
      recentlyUsedRecipeIds,
      currentMonth,
      ingredientMap,
    };

    // Compute the composite score
    const { totalScore, breakdown } = computeCompositeScore(ctx);

    // Validate hard structural constraint: minimum Abendbrot count
    // (This should always pass given buildSlotTemplates, but guard anyway)
    if (countAbendBrot(plan) < MIN_ABENDBROT_PER_WEEK) continue;

    candidates.push({
      plan,
      totalScore,
      scoreBreakdown: breakdown,
    });
  }

  if (candidates.length === 0) {
    throw new Error(
      'Es konnten keine gültigen Wochenpläne generiert werden. ' +
      'Der Rezept-Pool ist möglicherweise zu klein für die gewählten Einstellungen.'
    );
  }

  // ------------------------------------------------------------------
  // Step 5: Select the best-scoring candidate
  // ------------------------------------------------------------------
  const best = candidates.reduce((prev, curr) =>
    curr.totalScore > prev.totalScore ? curr : prev
  );

  return {
    plan: best.plan,
    scoreBreakdown: best.scoreBreakdown,
    candidatesEvaluated: candidates.length,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// SINGLE-SLOT REGENERATION
// ---------------------------------------------------------------------------

/**
 * Input for single-slot regeneration.
 */
export interface RegenerateSlotInput {
  /** The existing plan that contains the slot to regenerate */
  existingPlan: MealPlan;
  /** Day index of the slot to regenerate */
  dayOfWeek: DayOfWeek;
  /** Meal type of the slot to regenerate */
  mealType: MealType;
  /** User preferences (same as generation) */
  preferences: UserPreferences;
  /** Household size for ingredient map building */
  householdSize: number;
  /** Available recipe pool (pre-filtered for diet/allergens by caller) */
  recipePool: Recipe[];
  /** IDs of recipes already in the plan — avoid repeating these */
  excludeRecipeIds: string[];
  /** ISO date string of the week (for seasonal scoring) */
  weekStartDate: string;
  /** Recently used recipe IDs across past weeks */
  recentlyUsedRecipeIds: string[];
}

/**
 * Output of single-slot regeneration.
 */
export interface RegenerateSlotOutput {
  /** The updated meal slot with its new recipe */
  updatedSlot: MealSlot;
  /** The updated full plan (with the slot replaced) */
  updatedPlan: MealPlan;
  /** Score of the updated plan */
  scoreBreakdown: ReturnType<typeof computeCompositeScore>['breakdown'];
  /** Total score of the updated plan */
  totalScore: number;
}

/**
 * Regenerates a single meal slot within an existing plan.
 *
 * This function respects all locked slots in the existing plan and avoids
 * assigning any recipe already present in the plan (per excludeRecipeIds).
 *
 * The algorithm:
 *   1. Filter the pool by meal type and exclusions.
 *   2. Generate CANDIDATE_COUNT alternative recipes for this slot.
 *   3. For each candidate recipe, build a provisional plan with the recipe in the slot.
 *   4. Score each provisional plan.
 *   5. Return the slot assignment that produces the highest-scoring plan.
 *
 * This approach (score the whole plan, not just the slot) ensures the chosen
 * replacement maintains the plan-wide ingredient reuse and variety properties.
 *
 * @throws Error if no eligible recipe can be found for the slot.
 */
export function regenerateSingleSlot(input: RegenerateSlotInput): RegenerateSlotOutput {
  const {
    existingPlan,
    dayOfWeek,
    mealType,
    preferences,
    householdSize,
    recipePool,
    excludeRecipeIds,
    weekStartDate,
    recentlyUsedRecipeIds,
  } = input;

  // Hard-filter the pool
  const filteredPool = filterRecipePool(recipePool, preferences);

  // Further filter for this specific slot
  const exclusionSet = new Set(excludeRecipeIds);
  const eligible = filterByMealType(filteredPool, mealType, exclusionSet);

  if (eligible.length === 0) {
    throw new Error(
      `Keine Ersatzrezepte für ${mealType} am Tag ${dayOfWeek} verfügbar. ` +
      'Bitte entsperre mehr Rezepte oder erweitere die Einstellungen.'
    );
  }

  const currentMonth = new Date(weekStartDate).getMonth() + 1;

  // Generate candidates by trying different recipes in the target slot
  let bestPlan: MealPlan | null = null;
  let bestScore = -1;
  let bestBreakdown: ScoredPlan['scoreBreakdown'] | null = null;

  // Use up to CANDIDATE_COUNT recipes (or all eligible if fewer available)
  const candidateRecipes = eligible.slice(0, CANDIDATE_COUNT);

  for (const candidateRecipe of candidateRecipes) {
    // Build a provisional plan with this recipe in the target slot
    const updatedSlots = existingPlan.slots.map(slot => {
      if (slot.dayOfWeek === dayOfWeek && slot.mealType === mealType) {
        return { ...slot, recipe: candidateRecipe };
      }
      return slot;
    });

    // If the slot doesn't exist yet in the plan, add it
    const slotExists = existingPlan.slots.some(
      s => s.dayOfWeek === dayOfWeek && s.mealType === mealType
    );
    if (!slotExists) {
      updatedSlots.push({
        id: `slot-new-${dayOfWeek}-${mealType}`,
        planId: existingPlan.id,
        dayOfWeek,
        mealType,
        recipe: candidateRecipe,
        isLocked: false,
        servingsOverride: null,
      });
    }

    const provisionalPlan: MealPlan = { ...existingPlan, slots: updatedSlots };

    const ingredientMap = buildIngredientMap(provisionalPlan, preferences, householdSize);
    const ctx: ScoringContext = {
      plan: provisionalPlan,
      preferences,
      recentlyUsedRecipeIds,
      currentMonth,
      ingredientMap,
    };

    const { totalScore, breakdown } = computeCompositeScore(ctx);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestPlan = provisionalPlan;
      bestBreakdown = breakdown;
    }
  }

  if (bestPlan === null || bestBreakdown === null) {
    // Should not happen given eligible.length > 0 check, but guard for type safety
    throw new Error('Fehler bei der Slot-Regenerierung: kein Kandidat gefunden.');
  }

  // Find the updated slot in the best plan
  const updatedSlot = bestPlan.slots.find(
    s => s.dayOfWeek === dayOfWeek && s.mealType === mealType
  );

  if (!updatedSlot) {
    throw new Error(`Slot ${dayOfWeek}:${mealType} nicht im Plan gefunden.`);
  }

  return {
    updatedSlot,
    updatedPlan: bestPlan,
    scoreBreakdown: bestBreakdown,
    totalScore: bestScore,
  };
}

// ---------------------------------------------------------------------------
// EXPORTED UTILITIES (for testing and Edge Function use)
// ---------------------------------------------------------------------------

export {
  filterRecipePool,
  filterByMealType,
  isRecipeDietCompatible,
  isRecipeAllergenSafe,
  buildSlotTemplates,
  buildReuseGuidedCandidates,
  countAbendBrot,
  CANDIDATE_COUNT,
  MIN_ABENDBROT_PER_WEEK,
};
