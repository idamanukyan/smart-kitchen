// =============================================================================
// SmartKüche — Meal Plan Algorithm: Scoring Functions
// =============================================================================
// Each scoring function is individually exported and accepts a ScoringContext
// so it can be unit-tested in isolation. All functions return a value in [0, 1]
// where 1.0 = perfect and 0.0 = worst possible.
//
// SCORING WEIGHT SUMMARY (must sum to 1.0):
//   Variety          30%  (scoreVariety)
//   Ingredient reuse 25%  (scoreIngredientReuse)
//   Time fit         15%  (scoreTimeFit)
//   Budget fit       15%  (scoreBudgetFit)
//   Seasonal bonus   10%  (scoreSeasonality)
//   History penalty   5%  (scoreHistory)
//
// The composite score is computed by computeCompositeScore().
// =============================================================================

import type {
  MealSlot,
  MealPlan,
  Recipe,
  ScoringContext,
  ScoreBreakdown,
  PlanIngredientMap,
  ProteinGroup,
  StarchCategory,
  UserPreferences,
  Ingredient,
} from './types';

// ---------------------------------------------------------------------------
// SCORING WEIGHTS — change here to re-tune the algorithm globally
// ---------------------------------------------------------------------------

export const SCORING_WEIGHTS = {
  variety: 0.30,
  ingredientReuse: 0.25,
  timeFit: 0.15,
  budgetFit: 0.15,
  seasonal: 0.10,
  history: 0.05,
} as const;

// Validate that weights sum to exactly 1.0 at module load time.
// TypeScript can't enforce this at compile time but a runtime check during
// development prevents silent bugs if weights are ever edited.
const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.0001) {
  throw new Error(`Scoring weights must sum to 1.0, but sum to ${weightSum}`);
}

// ---------------------------------------------------------------------------
// VARIETY CONSTANTS
// ---------------------------------------------------------------------------

/** Maximum number of pasta-based meals allowed in a single week */
const MAX_PASTA_PER_WEEK = 2;

/** Maximum number of rice-based meals allowed in a single week */
const MAX_RICE_PER_WEEK = 2;

// ---------------------------------------------------------------------------
// PROTEIN CLASSIFICATION
// ---------------------------------------------------------------------------

/**
 * Maps the free-text mainProtein field on a Recipe to a canonical ProteinGroup.
 * This normalises "Hähnchenbrust", "Hähnchengeschnetzeltes", "Putenfilet" etc.
 * all to 'Geflügel' so the consecutive-protein rule works across variants.
 *
 * If mainProtein is null or unrecognised, returns null (no dominant protein).
 */
export function classifyProtein(mainProtein: string | null): ProteinGroup {
  if (mainProtein === null) return null;

  const p = mainProtein.toLowerCase();

  if (p.includes('rind') || p.includes('beef') || p.includes('hack') && p.includes('rind')) {
    return 'Rind';
  }
  if (p.includes('schwein') || p.includes('speck') || p.includes('wurst')) {
    return 'Schwein';
  }
  if (
    p.includes('huhn') || p.includes('hähnchen') || p.includes('hühnchen') ||
    p.includes('pute') || p.includes('geflügel') || p.includes('chicken')
  ) {
    return 'Geflügel';
  }
  if (p.includes('fisch') || p.includes('lachs') || p.includes('thunfisch') ||
      p.includes('kabeljau') || p.includes('forelle')) {
    return 'Fisch';
  }
  if (p.includes('meeresfrüchte') || p.includes('garnele') || p.includes('shrimp') ||
      p.includes('muschel')) {
    return 'Meeresfrüchte';
  }
  if (p.includes('linsen') || p.includes('bohnen') || p.includes('kichererbsen') ||
      p.includes('hülsenfrüchte') || p.includes('erbsen')) {
    return 'Hülsenfrüchte';
  }
  if (p.includes('ei') || p.includes('omelett') || p.includes('frittata')) {
    return 'Ei';
  }
  if (p.includes('käse') || p.includes('mozzarella') || p.includes('feta') ||
      p.includes('ricotta')) {
    return 'Käse';
  }
  if (p.includes('tofu') || p.includes('tempeh') || p.includes('seitan')) {
    return 'Tofu';
  }

  return 'Sonstiges';
}

/**
 * Determines the starch category of a recipe based on its ingredient list.
 * Used by the "max 2 pasta / max 2 rice per week" variety rule.
 *
 * The function checks ingredient names (German) for pasta/rice keywords rather
 * than relying on a recipe tag, making it more robust to data inconsistencies.
 */
export function classifyStarch(recipe: Recipe): StarchCategory {
  const ingredientNames = recipe.ingredients.map(ri =>
    ri.ingredient.nameDe.toLowerCase()
  );

  // Check for pasta keywords (German supermarket naming conventions)
  const pastaKeywords = [
    'spaghetti', 'nudeln', 'pasta', 'penne', 'farfalle', 'rigatoni',
    'tagliatelle', 'linguine', 'fettuccine', 'lasagne', 'gnocchi',
    'spätzle', 'makkaroni', 'tortellini', 'ravioli',
  ];
  if (pastaKeywords.some(kw => ingredientNames.some(n => n.includes(kw)))) {
    return 'Pasta';
  }

  // Check for rice keywords
  const riceKeywords = ['reis', 'risotto', 'basmati', 'jasminreis', 'vollkornreis'];
  if (riceKeywords.some(kw => ingredientNames.some(n => n.includes(kw)))) {
    return 'Reis';
  }

  return 'Other';
}

// ---------------------------------------------------------------------------
// 1. VARIETY SCORE (weight: 30%)
// ---------------------------------------------------------------------------

/**
 * Scores a plan on how varied the meals are across the week.
 *
 * Three sub-rules, each contributing to the final score:
 *
 * (a) No same-protein on consecutive days (weight within variety: 50%)
 *     We compare day N and day N+1. If the main protein group is the same on
 *     both days (in Mittagessen or Abendessen slots), the plan loses points.
 *     Day 6 wraps around to day 0 (Sunday dinner → Monday lunch of next week)
 *     is intentionally NOT checked — we don't plan the next week.
 *
 * (b) No recipe repeated within the last 2 weeks (weight: 30%)
 *     Recipes that appear in recentlyUsedRecipeIds are penalised.
 *     The more recently used, the bigger the penalty.
 *
 * (c) Starch limits: max 2 pasta, max 2 rice per week (weight: 20%)
 *     Counts how many Pasta and Reis meals appear; deducts proportionally
 *     for violations.
 */
export function scoreVariety(ctx: ScoringContext): number {
  const { plan, recentlyUsedRecipeIds } = ctx;

  // --- Sub-rule (a): No consecutive same-protein ---
  // Build a map: day → dominant protein (from warm meals only: Mittagessen + Abendessen)
  const proteinByDay = new Map<number, ProteinGroup>();
  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;
    if (slot.mealType !== 'Mittagessen' && slot.mealType !== 'Abendessen') continue;

    const protein = classifyProtein(slot.recipe.mainProtein);
    if (protein === null) continue; // vegetable-only meals don't count as a "protein day"

    // If a day has multiple warm meals (e.g. both Mittagessen and Abendessen),
    // we record the later one (Abendessen wins for the comparison).
    proteinByDay.set(slot.dayOfWeek, protein);
  }

  let consecutiveViolations = 0;
  for (let day = 0; day < 6; day++) {
    const today = proteinByDay.get(day);
    const tomorrow = proteinByDay.get(day + 1);
    if (today !== undefined && tomorrow !== undefined && today !== null && tomorrow !== null) {
      if (today === tomorrow) {
        consecutiveViolations++;
      }
    }
  }
  // Max possible violations in a 7-day plan = 6 (every consecutive pair)
  const consecutiveScore = 1 - consecutiveViolations / 6;

  // --- Sub-rule (b): No recently-used recipes ---
  // Build a penalty weight: the first item in the array is most recent.
  // Penalty decays linearly: position 0 = 1.0, position N-1 = ~0.1
  const recentSet = new Map<string, number>();
  recentlyUsedRecipeIds.forEach((id, index) => {
    // Decay factor: most-recent recipes get penalty weight 1.0, older ones decay
    const weight = Math.max(0.1, 1.0 - (index / recentlyUsedRecipeIds.length) * 0.9);
    recentSet.set(id, weight);
  });

  const planRecipeIds = plan.slots
    .filter(s => s.recipe !== null)
    .map(s => (s.recipe as Recipe).id);

  let totalRecentPenalty = 0;
  for (const id of planRecipeIds) {
    const penalty = recentSet.get(id) ?? 0;
    totalRecentPenalty += penalty;
  }
  // Normalise: if every recipe had max penalty, totalRecentPenalty = planRecipeIds.length
  const recentScore = planRecipeIds.length > 0
    ? Math.max(0, 1 - totalRecentPenalty / planRecipeIds.length)
    : 1;

  // --- Sub-rule (c): Starch limits ---
  let pastaCount = 0;
  let riceCount = 0;
  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;
    const starch = classifyStarch(slot.recipe);
    if (starch === 'Pasta') pastaCount++;
    if (starch === 'Reis') riceCount++;
  }

  // Each excess unit of pasta/rice beyond the max reduces the score proportionally.
  // With 14 warm meals max in a week, the worst case is ~14 pasta meals.
  const pastaViolation = Math.max(0, pastaCount - MAX_PASTA_PER_WEEK);
  const riceViolation = Math.max(0, riceCount - MAX_RICE_PER_WEEK);
  // Each violation represents ~7% of meals being "wrong" (1/14)
  const starchPenalty = (pastaViolation + riceViolation) * (1 / 14);
  const starchScore = Math.max(0, 1 - starchPenalty);

  // Combine sub-scores with intra-variety weights
  const varietyScore = (
    consecutiveScore * 0.50 +
    recentScore * 0.30 +
    starchScore * 0.20
  );

  return Math.max(0, Math.min(1, varietyScore));
}

// ---------------------------------------------------------------------------
// 2. INGREDIENT REUSE SCORE (weight: 25%)
// ---------------------------------------------------------------------------

/**
 * Scores how efficiently the plan reuses ingredients across meals.
 *
 * This is the core differentiator of SmartKüche — a good plan minimises the
 * number of distinct ingredients on the shopping list (fewer items to buy) and
 * especially minimises partial-package waste (e.g. buying a 200g bag of Petersilie
 * when only 10g is needed for one recipe is wasteful; using it in two or three
 * recipes the same week eliminates most of the waste).
 *
 * Scoring approach:
 *   1. Count the number of ingredients used in more than one meal (reuse density).
 *   2. Estimate total packaging waste: for each ingredient, round up to the nearest
 *      standard package size and compute the unused remainder.
 *   3. Combine into a 0–1 score.
 *
 * Higher score = more ingredient sharing = less waste = better plan.
 */
export function scoreIngredientReuse(ctx: ScoringContext): number {
  const { ingredientMap } = ctx;

  const totalIngredients = ingredientMap.totalAmounts.size;
  if (totalIngredients === 0) return 0;

  // --- Component 1: Reuse density ---
  // Count how many distinct ingredients appear in 2+ slots.
  let reusedCount = 0;
  for (const slots of ingredientMap.usedInSlots.values()) {
    if (slots.size >= 2) {
      reusedCount++;
    }
  }
  // Normalise: what fraction of ingredients are reused?
  const reuseDensity = reusedCount / totalIngredients;

  // --- Component 2: Package waste ---
  // estimatedWaste is the total "leftover" amount across all ingredients
  // after rounding up to the nearest standard package.
  //
  // To normalise this, we compute the total amount purchased (rounded up),
  // then waste / purchased = waste fraction.
  let totalPurchased = 0;
  for (const [ingredientId, packagesNeeded] of ingredientMap.packagesNeeded.entries()) {
    // We don't have the package sizes here, but packagesNeeded already encodes
    // ceil(needed/packageSize) * packageSize effectively.
    // Use the total amounts as a proxy for "what was actually needed".
    const totalNeeded = ingredientMap.totalAmounts.get(ingredientId) ?? 0;
    // packagesNeeded is the count of packages; we use it as a proxy for
    // purchased amount (higher packagesNeeded relative to needed = more waste).
    totalPurchased += packagesNeeded * (totalNeeded / packagesNeeded || totalNeeded);
  }

  // Waste fraction: 0 = no waste (perfect), 1 = all purchased is waste
  const wasteFraction = totalPurchased > 0
    ? Math.min(1, ingredientMap.estimatedWaste / totalPurchased)
    : 0;
  const wasteScore = 1 - wasteFraction;

  // Combined ingredient reuse score (reuse density matters more than waste)
  const reuseScore = reuseDensity * 0.60 + wasteScore * 0.40;

  return Math.max(0, Math.min(1, reuseScore));
}

// ---------------------------------------------------------------------------
// 3. TIME FIT SCORE (weight: 15%)
// ---------------------------------------------------------------------------

/**
 * Scores how well the plan respects the user's cooking time budget.
 *
 * Rules:
 *   - Every meal must be within maxCookingTimeMinutes, EXCEPT for one
 *     "ambitious" meal per week which is allowed to be up to 1.5× the limit.
 *   - If maxCookingTimeMinutes is null, every meal gets a perfect time score.
 *   - Abendbrot meals are expected to have near-zero cooking time (≤5 min);
 *     if they exceed this, a small penalty is applied.
 *
 * Scoring:
 *   - Count violations (meals exceeding limit, or exceeding 1.5× after the
 *     one allowed ambitious meal is consumed).
 *   - Each violation proportionally reduces the score.
 */
export function scoreTimeFit(ctx: ScoringContext): number {
  const { plan, preferences } = ctx;

  // No time preference → perfect score
  if (preferences.maxCookingTimeMinutes === null) return 1.0;

  const limit = preferences.maxCookingTimeMinutes;
  const ambitiousLimit = limit * 1.5;

  let ambitiousMealUsed = false;
  let violations = 0;
  let abendBrotTimeViolations = 0;
  let totalMeals = 0;

  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;
    totalMeals++;

    const time = slot.recipe.totalTimeMinutes;

    if (slot.mealType === 'Abendbrot') {
      // Abendbrot is a cold meal — anything over 5 minutes is unusual
      if (time > 5) {
        abendBrotTimeViolations++;
      }
      continue;
    }

    if (time <= limit) {
      // Within normal budget — fine
      continue;
    }

    if (!ambitiousMealUsed && time <= ambitiousLimit) {
      // Use up the one "ambitious" exception
      ambitiousMealUsed = true;
      continue;
    }

    // Any meal over the limit (or over 1.5× once the exception is used) = violation
    violations++;
  }

  if (totalMeals === 0) return 1.0;

  // Each violation deducts from the score proportionally
  const violationPenalty = (violations / totalMeals) * 0.90; // hard violations weight 90%
  const abendBrotPenalty = (abendBrotTimeViolations / totalMeals) * 0.10; // soft weight 10%

  return Math.max(0, 1 - violationPenalty - abendBrotPenalty);
}

// ---------------------------------------------------------------------------
// 4. BUDGET FIT SCORE (weight: 15%)
// ---------------------------------------------------------------------------

/**
 * Scores how well the plan fits within the user's budget.
 *
 * Behaviour differs significantly between modes:
 *
 * NORMAL MODE:
 *   - Gentle preference for 'günstig' and 'mittel' recipes.
 *   - Small penalty for 'gehoben' recipes (>3 in a week).
 *   - No hard budget ceiling.
 *
 * SPARWOCHE MODE:
 *   - Strongly prefer 'günstig' recipes.
 *   - 'gehoben' recipes in this mode = severe penalty (score near 0 for the plan).
 *   - If weeklyBudgetCents is set AND estimable, enforce as a hard ceiling:
 *     any plan over budget receives a score of 0.
 */
export function scoreBudgetFit(ctx: ScoringContext): number {
  const { plan, preferences } = ctx;

  const isSparwoche = preferences.budgetMode === 'sparwoche';

  // Count cost-rating distribution across all meals
  let günstigCount = 0;
  let mittelCount = 0;
  let gehobenCount = 0;
  let estimatedTotalCents = 0;
  let totalMeals = 0;

  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;
    totalMeals++;

    const recipe = slot.recipe;
    const servings = slot.servingsOverride ?? 1; // household size applied at call site

    if (recipe.costRating === 'günstig') günstigCount++;
    else if (recipe.costRating === 'mittel') mittelCount++;
    else if (recipe.costRating === 'gehoben') gehobenCount++;

    if (recipe.costEstimateCentsPerServing !== null) {
      estimatedTotalCents += recipe.costEstimateCentsPerServing * servings;
    }
  }

  if (totalMeals === 0) return 1.0;

  // --- Hard budget ceiling check (Sparwoche only) ---
  if (
    isSparwoche &&
    preferences.weeklyBudgetCents !== null &&
    estimatedTotalCents > 0 // only enforce if we have enough cost data
  ) {
    if (estimatedTotalCents > preferences.weeklyBudgetCents) {
      // Over budget → score 0. This is a hard constraint in Sparwoche mode.
      return 0;
    }
  }

  // --- Cost distribution scoring ---
  if (isSparwoche) {
    // In Sparwoche: every gehoben meal is a severe violation
    // Reward: günstig meals score 1.0, mittel score 0.5, gehoben score 0.0
    const weightedScore = (
      günstigCount * 1.0 +
      mittelCount * 0.5 +
      gehobenCount * 0.0
    ) / totalMeals;
    return Math.max(0, Math.min(1, weightedScore));
  } else {
    // Normal mode: all recipes are acceptable, but prefer a balance.
    // Score: günstig=1.0, mittel=0.85, gehoben=0.65 (still good, just slightly lower)
    // Penalty if more than 3 gehoben in a week (becomes unrealistically expensive)
    const baseWeightedScore = (
      günstigCount * 1.0 +
      mittelCount * 0.85 +
      gehobenCount * 0.65
    ) / totalMeals;
    const gehobenExcess = Math.max(0, gehobenCount - 3);
    const excessPenalty = gehobenExcess * 0.05; // 5% per excess gehoben meal
    return Math.max(0, Math.min(1, baseWeightedScore - excessPenalty));
  }
}

// ---------------------------------------------------------------------------
// 5. SEASONAL SCORE (weight: 10%)
// ---------------------------------------------------------------------------

/**
 * Scores how seasonal the plan's recipes are for the current month.
 *
 * Two levels of seasonality:
 *   1. Recipe-level: the recipe itself is marked is_seasonal with season_months.
 *      In-season recipes get a bonus; out-of-season get a small penalty.
 *      Non-seasonal recipes are neutral.
 *   2. Ingredient-level: individual ingredients (e.g. Spargel, Erdbeeren) also
 *      have is_seasonal flags. An otherwise non-seasonal recipe can still score
 *      a seasonal bonus if it uses currently-in-season ingredients.
 *
 * Note: This is a soft preference, not a hard constraint. Out-of-season recipes
 * are still eligible; they just score lower.
 */
export function scoreSeasonality(ctx: ScoringContext): number {
  const { plan, currentMonth } = ctx;

  let seasonalBonus = 0;
  let seasonalPenalty = 0;
  let inSeasonIngredientBonus = 0;
  let totalMeals = 0;

  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;
    totalMeals++;

    const recipe = slot.recipe;

    // Recipe-level seasonality
    if (recipe.isSeasonal) {
      if (recipe.seasonMonths.includes(currentMonth)) {
        seasonalBonus += 1; // in-season recipe = full bonus
      } else {
        seasonalPenalty += 0.5; // out-of-season seasonal recipe = penalty
        // (non-seasonal recipes are neutral — no penalty)
      }
    }

    // Ingredient-level: any seasonal ingredient currently in season adds a small bonus
    for (const ri of recipe.ingredients) {
      if (ri.ingredient.isSeasonal && ri.ingredient.seasonMonths.includes(currentMonth)) {
        inSeasonIngredientBonus += 0.1; // small bonus per in-season ingredient
      }
    }
  }

  if (totalMeals === 0) return 1.0;

  // Normalise: if all meals were in-season seasonal recipes, seasonalBonus = totalMeals
  const recipeLevelScore = Math.max(0, Math.min(1,
    0.5 + (seasonalBonus - seasonalPenalty) / totalMeals * 0.5
  ));
  // Ingredient bonus is capped — even a few in-season ingredients is a nice reward
  const ingredientLevelBonus = Math.min(0.2, inSeasonIngredientBonus / totalMeals);

  return Math.max(0, Math.min(1, recipeLevelScore + ingredientLevelBonus));
}

// ---------------------------------------------------------------------------
// 6. HISTORY PENALTY SCORE (weight: 5%)
// ---------------------------------------------------------------------------

/**
 * Penalises plans that reuse recipes from the recent history.
 *
 * The recentlyUsedRecipeIds array is ordered most-recent-first. The penalty
 * is proportional to how recently the recipe was used:
 *   - Used in the last 7 days (first ~7 entries assuming daily meals): heavy penalty
 *   - Used in days 8–14: lighter penalty
 *   - Older than 14 days: no penalty
 *
 * This function is intentionally separate from the variety score even though
 * there's conceptual overlap. The history penalty is about *inter-week* variety
 * (not repeating across weeks), while the variety score handles *intra-week* variety.
 */
export function scoreHistory(ctx: ScoringContext): number {
  const { plan, recentlyUsedRecipeIds } = ctx;

  if (recentlyUsedRecipeIds.length === 0) return 1.0;

  // Build penalty map: recipe ID → penalty weight (0.0 to 1.0)
  // Assumes ~14 recent recipes are passed (2 weeks × ~7 unique meals/week)
  const penaltyMap = new Map<string, number>();
  recentlyUsedRecipeIds.forEach((id, index) => {
    // Linear decay from 1.0 at index 0 to ~0.0 at index 13+
    const penalty = Math.max(0, 1.0 - (index / 14));
    penaltyMap.set(id, penalty);
  });

  const planRecipes = plan.slots
    .filter(s => s.recipe !== null)
    .map(s => s.recipe as Recipe);

  if (planRecipes.length === 0) return 1.0;

  let totalPenalty = 0;
  for (const recipe of planRecipes) {
    totalPenalty += penaltyMap.get(recipe.id) ?? 0;
  }

  // Average penalty across all meals (0 = no repeats, 1 = all recently used)
  const avgPenalty = totalPenalty / planRecipes.length;
  return Math.max(0, 1 - avgPenalty);
}

// ---------------------------------------------------------------------------
// COMPOSITE SCORE COMPUTATION
// ---------------------------------------------------------------------------

/**
 * Computes the final weighted composite score for a candidate plan.
 *
 * Runs all six scoring functions and applies their weights to produce a
 * single score in [0, 1] for ranking candidates.
 *
 * Returns both the total score and the full breakdown for debugging.
 */
export function computeCompositeScore(ctx: ScoringContext): {
  totalScore: number;
  breakdown: ScoreBreakdown;
} {
  const varietyScore = scoreVariety(ctx);
  const ingredientReuseScore = scoreIngredientReuse(ctx);
  const timeFitScore = scoreTimeFit(ctx);
  const budgetFitScore = scoreBudgetFit(ctx);
  const seasonalScore = scoreSeasonality(ctx);
  const historyPenaltyScore = scoreHistory(ctx);

  const totalScore =
    varietyScore * SCORING_WEIGHTS.variety +
    ingredientReuseScore * SCORING_WEIGHTS.ingredientReuse +
    timeFitScore * SCORING_WEIGHTS.timeFit +
    budgetFitScore * SCORING_WEIGHTS.budgetFit +
    seasonalScore * SCORING_WEIGHTS.seasonal +
    historyPenaltyScore * SCORING_WEIGHTS.history;

  return {
    totalScore: Math.max(0, Math.min(1, totalScore)),
    breakdown: {
      varietyScore,
      ingredientReuseScore,
      timeFitScore,
      budgetFitScore,
      seasonalScore,
      historyPenaltyScore,
    },
  };
}

// ---------------------------------------------------------------------------
// INGREDIENT MAP BUILDER
// ---------------------------------------------------------------------------

/**
 * Pre-computes the PlanIngredientMap for a candidate plan.
 *
 * This is called once per candidate before scoring begins. Building it up-front
 * avoids redundant iteration across the multiple scoring functions that need
 * ingredient information.
 *
 * Package-size rounding logic:
 *   For each ingredient, we look up the standard package sizes for the user's
 *   preferred store. If none are found (e.g. store = 'Other'), we fall back to
 *   a set of universal defaults. We then round the total needed amount up to the
 *   nearest available package size (greedy: pick the smallest package that covers
 *   the needed amount without going under).
 *
 *   Waste = (packages_needed × package_size) - total_needed
 */
export function buildIngredientMap(
  plan: MealPlan,
  preferences: UserPreferences,
  householdSize: number,
): PlanIngredientMap {
  const totalAmounts = new Map<string, number>();
  const usedInSlots = new Map<string, Set<string>>();
  const ingredientObjects = new Map<string, Ingredient>();

  // First pass: accumulate total amounts and track which slots each ingredient appears in
  for (const slot of plan.slots) {
    if (slot.recipe === null) continue;

    const servings = slot.servingsOverride ?? householdSize;
    const servingRatio = servings / (slot.recipe.servingsDefault || 1);
    const slotKey = `${slot.dayOfWeek}:${slot.mealType}`;

    for (const ri of slot.recipe.ingredients) {
      const ingredientId = ri.ingredient.id;

      // Track the full ingredient object for package-size lookup
      if (!ingredientObjects.has(ingredientId)) {
        ingredientObjects.set(ingredientId, ri.ingredient);
      }

      // Normalise amount to ingredient's default unit for aggregation.
      // For simplicity in Phase 1, we assume recipe units are compatible with
      // the default unit (e.g. both in 'g'). Full unit conversion is a Phase 2 concern.
      const scaledAmount = ri.amount * servingRatio;
      const current = totalAmounts.get(ingredientId) ?? 0;
      totalAmounts.set(ingredientId, current + scaledAmount);

      // Track slot usage
      if (!usedInSlots.has(ingredientId)) {
        usedInSlots.set(ingredientId, new Set());
      }
      (usedInSlots.get(ingredientId) as Set<string>).add(slotKey);
    }
  }

  // Second pass: compute packages needed and estimated waste
  const packagesNeeded = new Map<string, number>();
  let estimatedWaste = 0;

  for (const [ingredientId, totalNeeded] of totalAmounts.entries()) {
    const ingredient = ingredientObjects.get(ingredientId);
    if (!ingredient) continue;

    // Find the available package sizes for the preferred store, with fallback
    const storeSizes = ingredient.commonPackageSizes[preferences.preferredStore]
      ?? ingredient.commonPackageSizes['REWE']
      ?? null;

    if (storeSizes === null || storeSizes.length === 0) {
      // No package size data — assume 1 package needed, no waste calculable
      packagesNeeded.set(ingredientId, 1);
      continue;
    }

    // Sort package sizes ascending
    const sortedSizes = [...storeSizes].sort((a, b) => a - b);

    // Find the smallest package that covers the needed amount.
    // If the needed amount exceeds the largest package, use multiple of the largest.
    const largestPack = sortedSizes[sortedSizes.length - 1];
    let packages = 0;
    let covered = 0;

    if (totalNeeded <= largestPack) {
      // Find the smallest package that covers the need in a single unit
      const fitsInOne = sortedSizes.find(size => size >= totalNeeded);
      if (fitsInOne !== undefined) {
        packages = 1;
        covered = fitsInOne;
      } else {
        // More than the largest single pack needed
        packages = Math.ceil(totalNeeded / largestPack);
        covered = packages * largestPack;
      }
    } else {
      // Need multiple packages — use the largest available to minimise count
      packages = Math.ceil(totalNeeded / largestPack);
      covered = packages * largestPack;
    }

    packagesNeeded.set(ingredientId, packages);
    estimatedWaste += covered - totalNeeded;
  }

  return {
    totalAmounts,
    usedInSlots,
    packagesNeeded,
    estimatedWaste,
  };
}
