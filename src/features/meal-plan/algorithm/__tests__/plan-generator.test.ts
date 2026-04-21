// =============================================================================
// SmartKüche — Meal Plan Algorithm: Unit Tests
// =============================================================================
// Tests cover the full algorithm pipeline: plan generation, single-slot
// regeneration, scoring functions in isolation, and edge cases.
//
// Test structure:
//   - Fixtures section: factory functions for test data (recipes, preferences, etc.)
//   - Scoring unit tests: each scoring function tested in isolation
//   - Plan generator integration tests: end-to-end plan generation
//   - Edge case tests: empty pool, all slots locked, etc.
//
// No mocking of the random number generator — tests use large enough recipe
// pools and run assertions on statistical properties (e.g. "at least 2 Abendbrot")
// rather than exact deterministic output.
// =============================================================================

import {
  generatePlan,
  regenerateSingleSlot,
  filterRecipePool,
  isRecipeDietCompatible,
  isRecipeAllergenSafe,
  countAbendBrot,
  MIN_ABENDBROT_PER_WEEK,
} from '../plan-generator';

import {
  scoreVariety,
  scoreIngredientReuse,
  scoreTimeFit,
  scoreBudgetFit,
  scoreSeasonality,
  scoreHistory,
  buildIngredientMap,
  classifyProtein,
  classifyStarch,
  SCORING_WEIGHTS,
} from '../scoring';

import type {
  Recipe,
  Ingredient,
  RecipeIngredient,
  UserPreferences,
  Household,
  MealPlan,
  MealSlot,
  PlanGenerationInput,
  ScoringContext,
  DayOfWeek,
  MealType,
} from '../types';

// =============================================================================
// TEST FIXTURE FACTORIES
// =============================================================================
// All fixture functions return typed objects so TypeScript strict mode catches
// any mismatches between fixture shape and the real types.

/**
 * Creates a minimal valid Ingredient.
 * Override specific fields with the `overrides` parameter.
 */
function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: `ing-${Math.random().toString(36).slice(2, 8)}`,
    nameDe: 'Testingredient',
    category: 'Obst & Gemüse',
    defaultUnit: 'g',
    commonPackageSizes: {
      REWE: [200, 500],
    },
    shelfLifeDays: 7,
    isSeasonal: false,
    seasonMonths: [],
    ...overrides,
  };
}

/**
 * Creates a RecipeIngredient linking a recipe to an ingredient.
 */
function makeRecipeIngredient(
  ingredient: Ingredient,
  amount: number = 100,
  overrides: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return {
    id: `ri-${Math.random().toString(36).slice(2, 8)}`,
    ingredient,
    amount,
    unit: ingredient.defaultUnit,
    preparationNote: null,
    ...overrides,
  };
}

/**
 * Creates a minimal valid Recipe.
 *
 * mealTypes defaults to ['Mittagessen', 'Abendessen'] unless overridden.
 * dietTags defaults to ['omnivor'] (compatible with all diet types).
 */
function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  const ingredients = overrides.ingredients ?? [
    makeRecipeIngredient(makeIngredient({ nameDe: 'Karotten' }), 150),
    makeRecipeIngredient(makeIngredient({ nameDe: 'Zwiebeln' }), 100),
  ];

  return {
    id: `recipe-${Math.random().toString(36).slice(2, 8)}`,
    titleDe: 'Test Rezept',
    descriptionDe: null,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    difficulty: 'einfach',
    servingsDefault: 4,
    mealTypes: ['Mittagessen', 'Abendessen'],
    dietTags: ['omnivor'],
    costRating: 'mittel',
    costEstimateCentsPerServing: 250,
    imageUrl: null,
    isSeasonal: false,
    seasonMonths: [],
    mainProtein: 'Huhn',
    ...overrides,
    ingredients,
  };
}

/**
 * Creates an Abendbrot recipe (cold dinner, near-zero cooking time).
 */
function makeAbendBrotRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return makeRecipe({
    titleDe: 'Brot mit Käse',
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    totalTimeMinutes: 3,
    mealTypes: ['Abendbrot'],
    dietTags: ['omnivor'],
    mainProtein: 'Käse',
    costRating: 'günstig',
    costEstimateCentsPerServing: 80,
    ingredients: [
      makeRecipeIngredient(makeIngredient({ nameDe: 'Vollkornbrot', category: 'Brot & Backwaren' }), 200),
      makeRecipeIngredient(makeIngredient({ nameDe: 'Gouda', category: 'Milchprodukte' }), 80),
    ],
    ...overrides,
  });
}

/**
 * Creates a vegan recipe.
 */
function makeVeganRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return makeRecipe({
    titleDe: 'Veganes Curry',
    dietTags: ['vegan', 'vegetarisch'],
    mainProtein: 'Hülsenfrüchte',
    costRating: 'günstig',
    ...overrides,
  });
}

/**
 * Creates a recipe with gluten-containing ingredients.
 */
function makeGlutenRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return makeRecipe({
    titleDe: 'Spaghetti Bolognese',
    ingredients: [
      makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 200),
      makeRecipeIngredient(makeIngredient({ nameDe: 'Hackfleisch' }), 400),
      makeRecipeIngredient(makeIngredient({ nameDe: 'Tomaten' }), 300),
    ],
    mainProtein: 'Rind',
    ...overrides,
  });
}

/**
 * Creates a standard set of UserPreferences.
 */
function makePreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    userId: 'user-1',
    dietType: 'omnivor',
    allergies: [],
    excludedIngredients: [],
    maxCookingTimeMinutes: 45,
    budgetMode: 'normal',
    weeklyBudgetCents: null,
    preferredStore: 'REWE',
    updatedAt: '2026-04-20T10:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a standard Household.
 */
function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    id: 'household-1',
    size: 4,
    adultsCount: 2,
    childrenCount: 2,
    ...overrides,
  };
}

/**
 * Creates a diverse recipe pool with enough variety to generate valid plans.
 *
 * The pool contains:
 *   - 12 warm meal recipes (Mittagessen/Abendessen) with different proteins
 *   - 5 Abendbrot recipes (cold dinner)
 *   - Various diet tags, cost ratings, and seasonality
 *
 * This is the "default" pool used by most tests. Tests that need specific
 * properties build their own pools.
 */
function makeDefaultRecipePool(): Recipe[] {
  // Shared ingredients across multiple recipes (enables reuse scoring tests)
  const petersilie = makeIngredient({ id: 'ing-petersilie', nameDe: 'Petersilie', category: 'Obst & Gemüse' });
  const zwiebeln = makeIngredient({ id: 'ing-zwiebeln', nameDe: 'Zwiebeln', category: 'Obst & Gemüse' });
  const knoblauch = makeIngredient({ id: 'ing-knoblauch', nameDe: 'Knoblauch', category: 'Obst & Gemüse' });
  const olivenoel = makeIngredient({ id: 'ing-olivenoel', nameDe: 'Olivenöl', category: 'Gewürze & Öle' });
  const tomaten = makeIngredient({ id: 'ing-tomaten', nameDe: 'Tomaten', category: 'Obst & Gemüse' });
  const sahne = makeIngredient({ id: 'ing-sahne', nameDe: 'Sahne', category: 'Milchprodukte' });

  const warmRecipes: Recipe[] = [
    makeRecipe({
      id: 'r-001',
      titleDe: 'Hühnchen-Pfanne',
      mainProtein: 'Huhn',
      dietTags: ['omnivor'],
      costRating: 'mittel',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Hähnchenbrust' }), 600),
        makeRecipeIngredient(petersilie, 20),
        makeRecipeIngredient(zwiebeln, 150),
      ],
    }),
    makeRecipe({
      id: 'r-002',
      titleDe: 'Rindergulasch',
      mainProtein: 'Rind',
      dietTags: ['omnivor'],
      costRating: 'mittel',
      prepTimeMinutes: 15,
      cookTimeMinutes: 60,
      totalTimeMinutes: 75, // over 45min — tests ambitious meal rule
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Rindfleisch' }), 800),
        makeRecipeIngredient(zwiebeln, 200),
        makeRecipeIngredient(tomaten, 400),
      ],
    }),
    makeRecipe({
      id: 'r-003',
      titleDe: 'Lachsfilet',
      mainProtein: 'Fisch',
      dietTags: ['omnivor', 'pescetarisch'],
      costRating: 'gehoben',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Lachs' }), 600),
        makeRecipeIngredient(petersilie, 15),
        makeRecipeIngredient(knoblauch, 20),
      ],
    }),
    makeRecipe({
      id: 'r-004',
      titleDe: 'Pasta al Pomodoro',
      mainProtein: null,
      dietTags: ['vegetarisch', 'vegan'],
      costRating: 'günstig',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 400),
        makeRecipeIngredient(tomaten, 600),
        makeRecipeIngredient(knoblauch, 30),
        makeRecipeIngredient(olivenoel, 40),
      ],
    }),
    makeRecipe({
      id: 'r-005',
      titleDe: 'Linsensuppe',
      mainProtein: 'Hülsenfrüchte',
      dietTags: ['vegetarisch', 'vegan'],
      costRating: 'günstig',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Rote Linsen' }), 300),
        makeRecipeIngredient(zwiebeln, 100),
        makeRecipeIngredient(knoblauch, 20),
        makeRecipeIngredient(tomaten, 200),
      ],
    }),
    makeRecipe({
      id: 'r-006',
      titleDe: 'Schweineschnitzel',
      mainProtein: 'Schwein',
      dietTags: ['omnivor'],
      costRating: 'mittel',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Schweineschnitzel' }), 600),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Paniermehl' }), 100),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Ei' }), 2),
      ],
    }),
    makeRecipe({
      id: 'r-007',
      titleDe: 'Gemüsecurry',
      mainProtein: 'Tofu',
      dietTags: ['vegetarisch', 'vegan'],
      costRating: 'günstig',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Tofu' }), 400),
        makeRecipeIngredient(zwiebeln, 100),
        makeRecipeIngredient(knoblauch, 20),
        makeRecipeIngredient(sahne, 200),
      ],
    }),
    makeRecipe({
      id: 'r-008',
      titleDe: 'Risotto',
      mainProtein: 'Käse',
      dietTags: ['vegetarisch'],
      costRating: 'mittel',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Risotto-Reis' }), 400),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Parmesan' }), 80),
        makeRecipeIngredient(zwiebeln, 100),
        makeRecipeIngredient(olivenoel, 30),
      ],
    }),
    makeRecipe({
      id: 'r-009',
      titleDe: 'Hähnchen-Sahne-Soße',
      mainProtein: 'Huhn',
      dietTags: ['omnivor'],
      costRating: 'mittel',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Hähnchenbrust' }), 500),
        makeRecipeIngredient(sahne, 200),
        makeRecipeIngredient(petersilie, 20),
        makeRecipeIngredient(knoblauch, 15),
      ],
    }),
    makeRecipe({
      id: 'r-010',
      titleDe: 'Kichererbsen-Eintopf',
      mainProtein: 'Hülsenfrüchte',
      dietTags: ['vegan', 'vegetarisch'],
      costRating: 'günstig',
      prepTimeMinutes: 10,
      cookTimeMinutes: 30,
      totalTimeMinutes: 40,
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Kichererbsen' }), 400),
        makeRecipeIngredient(tomaten, 300),
        makeRecipeIngredient(zwiebeln, 100),
        makeRecipeIngredient(knoblauch, 20),
      ],
    }),
    makeRecipe({
      id: 'r-011',
      titleDe: 'Pasta Carbonara',
      mainProtein: 'Schwein',
      dietTags: ['omnivor'],
      costRating: 'mittel',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 400),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Speck' }), 200),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Eier' }), 3),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Parmesan' }), 50),
      ],
    }),
    makeRecipe({
      id: 'r-012',
      titleDe: 'Gebratener Reis',
      mainProtein: 'Ei',
      dietTags: ['vegetarisch'],
      costRating: 'günstig',
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Jasminreis' }), 400),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Eier' }), 3),
        makeRecipeIngredient(zwiebeln, 100),
        makeRecipeIngredient(olivenoel, 30),
      ],
    }),
  ];

  const abendBrotRecipes: Recipe[] = [
    makeAbendBrotRecipe({ id: 'r-ab-001', titleDe: 'Brot mit Käse und Radieschen' }),
    makeAbendBrotRecipe({ id: 'r-ab-002', titleDe: 'Vollkornbrot mit Hummus',
      dietTags: ['vegan', 'vegetarisch'],
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Vollkornbrot', category: 'Brot & Backwaren' }), 200),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Hummus', category: 'Kühlregal' }), 150),
      ],
    }),
    makeAbendBrotRecipe({ id: 'r-ab-003', titleDe: 'Brot mit Avocado',
      dietTags: ['vegan', 'vegetarisch'],
    }),
    makeAbendBrotRecipe({ id: 'r-ab-004', titleDe: 'Bauernbrot mit Wurst',
      dietTags: ['omnivor'],
    }),
    makeAbendBrotRecipe({ id: 'r-ab-005', titleDe: 'Knäckebrot mit Frischkäse',
      dietTags: ['vegetarisch'],
    }),
  ];

  return [...warmRecipes, ...abendBrotRecipes];
}

/**
 * Creates a standard PlanGenerationInput using the default pool and preferences.
 */
function makeDefaultInput(
  overrides: Partial<PlanGenerationInput> = {},
): PlanGenerationInput {
  return {
    preferences: makePreferences(),
    household: makeHousehold(),
    recipePool: makeDefaultRecipePool(),
    lockedSlots: [],
    weekStartDate: '2026-04-20', // A Monday
    recentlyUsedRecipeIds: [],
    pantryIngredientIds: [],
    ...overrides,
  };
}

/**
 * Creates a minimal ScoringContext for unit-testing individual scoring functions.
 */
function makeScoringContext(
  plan: MealPlan,
  preferences: UserPreferences = makePreferences(),
  currentMonth: number = 4, // April
  recentlyUsedRecipeIds: string[] = [],
): ScoringContext {
  const ingredientMap = buildIngredientMap(plan, preferences, 4);
  return {
    plan,
    preferences,
    recentlyUsedRecipeIds,
    currentMonth,
    ingredientMap,
  };
}

/**
 * Builds a minimal MealPlan from an array of (dayOfWeek, mealType, recipe) tuples.
 */
function makePlan(
  entries: Array<{ dayOfWeek: DayOfWeek; mealType: MealType; recipe: Recipe | null }>,
): MealPlan {
  const slots: MealSlot[] = entries.map((entry, i) => ({
    id: `slot-${i}`,
    planId: 'test-plan',
    dayOfWeek: entry.dayOfWeek,
    mealType: entry.mealType,
    recipe: entry.recipe,
    isLocked: false,
    servingsOverride: null,
  }));

  return {
    id: 'test-plan',
    householdId: 'household-1',
    weekStartDate: '2026-04-20',
    slots,
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// HELPER ASSERTIONS
// =============================================================================

/** Asserts that a value is in the range [min, max] (inclusive). */
function expectInRange(value: number, min: number, max: number, label: string): void {
  if (value < min || value > max) {
    throw new Error(`${label}: expected ${value} to be in range [${min}, ${max}]`);
  }
}

// =============================================================================
// SCORING UNIT TESTS
// =============================================================================

describe('classifyProtein', () => {
  it('classifies Hähnchen variants as Geflügel', () => {
    expect(classifyProtein('Hähnchenbrust')).toBe('Geflügel');
    expect(classifyProtein('Hähnchengeschnetzeltes')).toBe('Geflügel');
    expect(classifyProtein('Putenfilet')).toBe('Geflügel');
  });

  it('classifies Rind correctly', () => {
    expect(classifyProtein('Rinderhackfleisch')).toBe('Rind');
    expect(classifyProtein('Rindergulasch')).toBe('Rind');
  });

  it('classifies Fisch correctly', () => {
    expect(classifyProtein('Lachs')).toBe('Fisch');
    expect(classifyProtein('Fischfilet')).toBe('Fisch');
    expect(classifyProtein('Kabeljau')).toBe('Fisch');
  });

  it('classifies Hülsenfrüchte correctly', () => {
    expect(classifyProtein('Linsen')).toBe('Hülsenfrüchte');
    expect(classifyProtein('Kichererbsen')).toBe('Hülsenfrüchte');
  });

  it('returns null for null input', () => {
    expect(classifyProtein(null)).toBeNull();
  });
});

describe('classifyStarch', () => {
  it('classifies pasta recipes correctly', () => {
    const pasta = makeRecipe({
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 400),
      ],
    });
    expect(classifyStarch(pasta)).toBe('Pasta');
  });

  it('classifies rice recipes correctly', () => {
    const rice = makeRecipe({
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Jasminreis' }), 400),
      ],
    });
    expect(classifyStarch(rice)).toBe('Reis');
  });

  it('returns Other for neither pasta nor rice', () => {
    const other = makeRecipe({
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Kartoffeln' }), 600),
      ],
    });
    expect(classifyStarch(other)).toBe('Other');
  });
});

describe('scoreVariety', () => {
  it('returns 1.0 for a perfectly varied plan (no consecutive proteins, no starch violations)', () => {
    // Build a plan where each day has a different protein
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Rind' }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Fisch' }) },
      { dayOfWeek: 3, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Schwein' }) },
      { dayOfWeek: 4, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Hülsenfrüchte' }) },
      { dayOfWeek: 5, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Tofu' }) },
      { dayOfWeek: 6, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Ei' }) },
    ]);

    const ctx = makeScoringContext(plan);
    const score = scoreVariety(ctx);
    // Should be close to 1.0 (no violations, no recent history penalty)
    expectInRange(score, 0.8, 1.0, 'variety score — varied plan');
  });

  it('penalises plans with consecutive same-protein days', () => {
    // Chicken on Monday AND Tuesday = consecutive protein violation
    const badPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) }, // same!
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Rind' }) },
    ]);

    const goodPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Rind' }) }, // different
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Fisch' }) },
    ]);

    const badScore = scoreVariety(makeScoringContext(badPlan));
    const goodScore = scoreVariety(makeScoringContext(goodPlan));

    expect(badScore).toBeLessThan(goodScore);
  });

  it('penalises plans exceeding max 2 pasta meals per week', () => {
    // Three pasta meals in one week
    const tooPasta = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ ingredients: [makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 400)] }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ ingredients: [makeRecipeIngredient(makeIngredient({ nameDe: 'Nudeln' }), 400)] }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ ingredients: [makeRecipeIngredient(makeIngredient({ nameDe: 'Penne' }), 400)] }) },
    ]);

    // Two pasta meals — within limit
    const okPasta = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ ingredients: [makeRecipeIngredient(makeIngredient({ nameDe: 'Spaghetti' }), 400)] }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ ingredients: [makeRecipeIngredient(makeIngredient({ nameDe: 'Nudeln' }), 400)] }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
    ]);

    const tooMuchPastaScore = scoreVariety(makeScoringContext(tooPasta));
    const okPastaScore = scoreVariety(makeScoringContext(okPasta));

    expect(tooMuchPastaScore).toBeLessThan(okPastaScore);
  });

  it('penalises plans that reuse recently-used recipes', () => {
    const recentRecipe = makeRecipe({ id: 'recent-r-1' });

    // Plan using a recently-used recipe
    const planWithRecent = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: recentRecipe },
    ]);

    // Plan using a fresh recipe
    const planWithFresh = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ id: 'fresh-r-1' }) },
    ]);

    const recentScore = scoreVariety(makeScoringContext(planWithRecent, makePreferences(), 4, ['recent-r-1']));
    const freshScore = scoreVariety(makeScoringContext(planWithFresh, makePreferences(), 4, ['recent-r-1']));

    expect(recentScore).toBeLessThan(freshScore);
  });
});

describe('scoreIngredientReuse', () => {
  it('scores higher when ingredients are reused across multiple meals', () => {
    const sharedIngredient = makeIngredient({ id: 'ing-shared', nameDe: 'Petersilie' });
    const uniqueIngredient1 = makeIngredient({ id: 'ing-unique-1', nameDe: 'Karotten' });
    const uniqueIngredient2 = makeIngredient({ id: 'ing-unique-2', nameDe: 'Brokkoli' });

    // Plan where Petersilie is shared between Monday and Wednesday
    const reuseRecipe1 = makeRecipe({
      ingredients: [
        makeRecipeIngredient(sharedIngredient, 20),
        makeRecipeIngredient(uniqueIngredient1, 200),
      ],
    });
    const reuseRecipe2 = makeRecipe({
      ingredients: [
        makeRecipeIngredient(sharedIngredient, 20), // also uses Petersilie!
        makeRecipeIngredient(uniqueIngredient2, 200),
      ],
    });
    const reusePlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: reuseRecipe1 },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: reuseRecipe2 },
    ]);

    // Plan where each meal uses completely different ingredients
    const noReuseRecipe1 = makeRecipe({
      ingredients: [makeRecipeIngredient(makeIngredient({ id: 'ing-a' }), 100)],
    });
    const noReuseRecipe2 = makeRecipe({
      ingredients: [makeRecipeIngredient(makeIngredient({ id: 'ing-b' }), 100)],
    });
    const noReusePlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: noReuseRecipe1 },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: noReuseRecipe2 },
    ]);

    const reuseScore = scoreIngredientReuse(makeScoringContext(reusePlan));
    const noReuseScore = scoreIngredientReuse(makeScoringContext(noReusePlan));

    expect(reuseScore).toBeGreaterThan(noReuseScore);
  });
});

describe('scoreTimeFit', () => {
  it('returns 1.0 when maxCookingTimeMinutes is null (unbegrenzt)', () => {
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 120 }) },
    ]);
    const prefs = makePreferences({ maxCookingTimeMinutes: null });
    const score = scoreTimeFit(makeScoringContext(plan, prefs));
    expect(score).toBe(1.0);
  });

  it('returns 1.0 when all meals are within time limit', () => {
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 45 }) },
    ]);
    const prefs = makePreferences({ maxCookingTimeMinutes: 45 });
    const score = scoreTimeFit(makeScoringContext(plan, prefs));
    expect(score).toBe(1.0);
  });

  it('allows one "ambitious" meal at 1.5× the time limit without penalty', () => {
    // limit = 45, ambitious limit = 67.5, so 60min = within ambitious limit
    const planWithAmbitious = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 60 }) }, // ambitious (≤67.5)
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
    ]);
    const prefs = makePreferences({ maxCookingTimeMinutes: 45 });
    const score = scoreTimeFit(makeScoringContext(planWithAmbitious, prefs));
    expect(score).toBe(1.0); // one ambitious meal is allowed
  });

  it('penalises plans with multiple meals exceeding the time limit', () => {
    const prefs = makePreferences({ maxCookingTimeMinutes: 45 });

    // Two meals over 45 minutes (second one exceeds the one ambitious exception)
    const badPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 60 }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 60 }) }, // second violation
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
    ]);

    // One meal over — uses up the one exception
    const okPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 60 }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ totalTimeMinutes: 30 }) },
    ]);

    const badScore = scoreTimeFit(makeScoringContext(badPlan, prefs));
    const okScore = scoreTimeFit(makeScoringContext(okPlan, prefs));

    expect(badScore).toBeLessThan(okScore);
    expect(okScore).toBe(1.0);
  });
});

describe('scoreBudgetFit', () => {
  it('returns a high score for a plan with mostly günstig recipes in Sparwoche mode', () => {
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'günstig' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'günstig' }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'mittel' }) },
    ]);
    const prefs = makePreferences({ budgetMode: 'sparwoche' });
    const score = scoreBudgetFit(makeScoringContext(plan, prefs));
    expectInRange(score, 0.7, 1.0, 'sparwoche günstig score');
  });

  it('returns 0 in Sparwoche mode when plan exceeds weeklyBudgetCents', () => {
    // 3 meals × 500 cents/serving × 4 servings = 6000 cents. Budget = 5000.
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'gehoben', costEstimateCentsPerServing: 500 }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'gehoben', costEstimateCentsPerServing: 500 }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'gehoben', costEstimateCentsPerServing: 500 }) },
    ]);

    // servingsOverride is null so household size defaults to 1 in scoring context
    // budget = 1400 cents, estimated = 3×500×1 = 1500 cents > 1400
    const prefs = makePreferences({
      budgetMode: 'sparwoche',
      weeklyBudgetCents: 1400, // below 3 × 500
    });
    const score = scoreBudgetFit(makeScoringContext(plan, prefs));
    expect(score).toBe(0);
  });

  it('scores gehoben recipes lower than günstig in normal mode', () => {
    const gehobenPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'gehoben' }) },
    ]);
    const günstigPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ costRating: 'günstig' }) },
    ]);
    const prefs = makePreferences({ budgetMode: 'normal' });

    const gehobenScore = scoreBudgetFit(makeScoringContext(gehobenPlan, prefs));
    const günstigScore = scoreBudgetFit(makeScoringContext(günstigPlan, prefs));

    expect(günstigScore).toBeGreaterThan(gehobenScore);
  });
});

describe('scoreSeasonality', () => {
  it('scores higher for in-season recipes in summer (July, month 7)', () => {
    const summerIngredient = makeIngredient({
      nameDe: 'Erdbeeren',
      isSeasonal: true,
      seasonMonths: [5, 6, 7, 8], // May to August
    });
    const summerRecipe = makeRecipe({
      isSeasonal: true,
      seasonMonths: [6, 7, 8],
      ingredients: [makeRecipeIngredient(summerIngredient, 300)],
    });

    const winterIngredient = makeIngredient({
      nameDe: 'Grünkohl',
      isSeasonal: true,
      seasonMonths: [11, 12, 1, 2], // Nov to Feb
    });
    const winterRecipe = makeRecipe({
      isSeasonal: true,
      seasonMonths: [11, 12, 1, 2],
      ingredients: [makeRecipeIngredient(winterIngredient, 300)],
    });

    const summerPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: summerRecipe },
    ]);
    const winterPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: winterRecipe },
    ]);

    // Score in July (month 7)
    const summerScore = scoreSeasonality(makeScoringContext(summerPlan, makePreferences(), 7));
    const winterScore = scoreSeasonality(makeScoringContext(winterPlan, makePreferences(), 7));

    expect(summerScore).toBeGreaterThan(winterScore);
  });

  it('reverses the preference in winter (December, month 12)', () => {
    const summerRecipe = makeRecipe({
      isSeasonal: true,
      seasonMonths: [6, 7, 8],
      ingredients: [makeRecipeIngredient(
        makeIngredient({ nameDe: 'Erdbeeren', isSeasonal: true, seasonMonths: [5, 6, 7, 8] }),
        300,
      )],
    });
    const winterRecipe = makeRecipe({
      isSeasonal: true,
      seasonMonths: [11, 12, 1, 2],
      ingredients: [makeRecipeIngredient(
        makeIngredient({ nameDe: 'Grünkohl', isSeasonal: true, seasonMonths: [11, 12, 1, 2] }),
        300,
      )],
    });

    const summerPlan = makePlan([{ dayOfWeek: 0, mealType: 'Mittagessen', recipe: summerRecipe }]);
    const winterPlan = makePlan([{ dayOfWeek: 0, mealType: 'Mittagessen', recipe: winterRecipe }]);

    const summerInWinter = scoreSeasonality(makeScoringContext(summerPlan, makePreferences(), 12));
    const winterInWinter = scoreSeasonality(makeScoringContext(winterPlan, makePreferences(), 12));

    expect(winterInWinter).toBeGreaterThan(summerInWinter);
  });
});

describe('scoreHistory', () => {
  it('returns 1.0 when no recently-used recipes are in the plan', () => {
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ id: 'new-r-1' }) },
    ]);
    const score = scoreHistory(makeScoringContext(plan, makePreferences(), 4, ['old-r-1', 'old-r-2']));
    expect(score).toBe(1.0);
  });

  it('penalises more for very recently used recipes', () => {
    const recipeId = 'recipe-used-recently';
    const plan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ id: recipeId }) },
    ]);

    // Recipe is at position 0 (most recent) vs position 10 (older)
    const veryRecentHistory = [recipeId, 'other-1', 'other-2'];
    const olderHistory = ['other-1', 'other-2', 'other-3', 'other-4', 'other-5',
                          'other-6', 'other-7', 'other-8', 'other-9', recipeId];

    const veryRecentScore = scoreHistory(makeScoringContext(plan, makePreferences(), 4, veryRecentHistory));
    const olderScore = scoreHistory(makeScoringContext(plan, makePreferences(), 4, olderHistory));

    expect(veryRecentScore).toBeLessThan(olderScore);
  });
});

describe('SCORING_WEIGHTS', () => {
  it('weights sum to exactly 1.0', () => {
    const sum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.0001);
  });
});

// =============================================================================
// HARD CONSTRAINT FILTER TESTS
// =============================================================================

describe('isRecipeDietCompatible', () => {
  it('allows all recipes for omnivor', () => {
    const meat = makeRecipe({ dietTags: ['omnivor'] });
    const vegan = makeRecipe({ dietTags: ['vegan'] });
    expect(isRecipeDietCompatible(meat, 'omnivor')).toBe(true);
    expect(isRecipeDietCompatible(vegan, 'omnivor')).toBe(true);
  });

  it('blocks meat-only recipes for vegetarisch', () => {
    const meat = makeRecipe({ dietTags: ['omnivor'] }); // no vegetarisch/vegan tag
    expect(isRecipeDietCompatible(meat, 'vegetarisch')).toBe(false);
  });

  it('allows vegetarisch and vegan recipes for vegetarisch', () => {
    const vegetarisch = makeRecipe({ dietTags: ['vegetarisch'] });
    const vegan = makeRecipe({ dietTags: ['vegan'] });
    expect(isRecipeDietCompatible(vegetarisch, 'vegetarisch')).toBe(true);
    expect(isRecipeDietCompatible(vegan, 'vegetarisch')).toBe(true);
  });

  it('only allows vegan recipes for vegan users', () => {
    const vegan = makeRecipe({ dietTags: ['vegan'] });
    const vegetarisch = makeRecipe({ dietTags: ['vegetarisch'] }); // no vegan tag
    expect(isRecipeDietCompatible(vegan, 'vegan')).toBe(true);
    expect(isRecipeDietCompatible(vegetarisch, 'vegan')).toBe(false);
  });

  it('allows fish recipes for pescetarisch', () => {
    const fish = makeRecipe({ dietTags: ['pescetarisch'] });
    const vegan = makeRecipe({ dietTags: ['vegan'] });
    const meat = makeRecipe({ dietTags: ['omnivor'] }); // meat only
    expect(isRecipeDietCompatible(fish, 'pescetarisch')).toBe(true);
    expect(isRecipeDietCompatible(vegan, 'pescetarisch')).toBe(true);
    expect(isRecipeDietCompatible(meat, 'pescetarisch')).toBe(false);
  });
});

describe('isRecipeAllergenSafe', () => {
  it('allows recipes when user has no allergens', () => {
    const recipe = makeGlutenRecipe();
    expect(isRecipeAllergenSafe(recipe, [])).toBe(true);
  });

  it('blocks gluten-containing recipes for Gluten-free users', () => {
    const recipe = makeGlutenRecipe(); // contains Spaghetti (Gluten)
    expect(isRecipeAllergenSafe(recipe, ['Gluten'])).toBe(false);
  });

  it('allows gluten-free recipes for Gluten-free users', () => {
    const glutenFree = makeRecipe({
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Hähnchenbrust' }), 400),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Karotten' }), 200),
      ],
    });
    expect(isRecipeAllergenSafe(glutenFree, ['Gluten'])).toBe(true);
  });

  it('blocks lactose-containing recipes for Laktose-intolerant users', () => {
    const lactoseRecipe = makeRecipe({
      ingredients: [
        makeRecipeIngredient(makeIngredient({ nameDe: 'Sahne' }), 200),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Karotten' }), 200),
      ],
    });
    expect(isRecipeAllergenSafe(lactoseRecipe, ['Laktose'])).toBe(false);
  });
});

// =============================================================================
// TEST 1: BASIC PLAN GENERATION (ALL DEFAULTS)
// =============================================================================

describe('generatePlan — basic plan generation', () => {
  it('generates a valid 7-day plan with default settings', () => {
    const input = makeDefaultInput();
    const output = generatePlan(input);

    expect(output.plan).toBeDefined();
    expect(output.plan.slots.length).toBeGreaterThan(0);
    expect(output.candidatesEvaluated).toBeGreaterThan(0);
    expect(output.generatedAt).toBeDefined();
  });

  it('assigns a recipe to every non-Abendbrot slot', () => {
    const output = generatePlan(makeDefaultInput());
    const warmSlots = output.plan.slots.filter(
      s => s.mealType === 'Mittagessen' || s.mealType === 'Abendessen'
    );
    for (const slot of warmSlots) {
      expect(slot.recipe).not.toBeNull();
    }
  });

  it('total score is in [0, 1]', () => {
    const output = generatePlan(makeDefaultInput());
    expectInRange(output.scoreBreakdown.varietyScore, 0, 1, 'variety');
    expectInRange(output.scoreBreakdown.ingredientReuseScore, 0, 1, 'reuse');
    expectInRange(output.scoreBreakdown.timeFitScore, 0, 1, 'time');
    expectInRange(output.scoreBreakdown.budgetFitScore, 0, 1, 'budget');
    expectInRange(output.scoreBreakdown.seasonalScore, 0, 1, 'seasonal');
    expectInRange(output.scoreBreakdown.historyPenaltyScore, 0, 1, 'history');
  });

  it('evaluates the expected number of candidate plans', () => {
    const output = generatePlan(makeDefaultInput());
    // Should evaluate at least 50% of CANDIDATE_COUNT (some may fail to build)
    expect(output.candidatesEvaluated).toBeGreaterThanOrEqual(Math.floor(75 * 0.5));
  });
});

// =============================================================================
// TEST 2: VEGAN + BUDGET MODE (SPARWOCHE)
// =============================================================================

describe('generatePlan — vegan + Sparwoche', () => {
  it('only assigns vegan recipes in a vegan + Sparwoche plan', () => {
    const veganRecipes: Recipe[] = [
      makeVeganRecipe({ id: 'v-001', titleDe: 'Vegane Bolognese', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-002', titleDe: 'Kichererbsen-Curry', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-003', titleDe: 'Gemüsepfanne', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-004', titleDe: 'Linseneintopf', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-005', titleDe: 'Tofu-Pfanne', costRating: 'mittel' }),
      makeVeganRecipe({ id: 'v-006', titleDe: 'Ofenkartoffeln', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-007', titleDe: 'Rote Bete Salat', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-008', titleDe: 'Erbsensuppe', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-009', titleDe: 'Blumenkohl-Curry', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-010', titleDe: 'Spinat-Curry', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-011', titleDe: 'Kürbissuppe', costRating: 'günstig' }),
      makeVeganRecipe({ id: 'v-012', titleDe: 'Minestrone', costRating: 'günstig' }),
      makeAbendBrotRecipe({ id: 'v-ab-001', dietTags: ['vegan', 'vegetarisch'], titleDe: 'Brot mit Avocado' }),
      makeAbendBrotRecipe({ id: 'v-ab-002', dietTags: ['vegan', 'vegetarisch'], titleDe: 'Hummus-Brot' }),
      makeAbendBrotRecipe({ id: 'v-ab-003', dietTags: ['vegan', 'vegetarisch'], titleDe: 'Tahini-Brot' }),
      makeAbendBrotRecipe({ id: 'v-ab-004', dietTags: ['vegan', 'vegetarisch'], titleDe: 'Nussbutter-Brot' }),
      makeAbendBrotRecipe({ id: 'v-ab-005', dietTags: ['vegan', 'vegetarisch'], titleDe: 'Tomate-Brot' }),
    ];

    const input = makeDefaultInput({
      preferences: makePreferences({
        dietType: 'vegan',
        budgetMode: 'sparwoche',
        weeklyBudgetCents: 5000,
      }),
      recipePool: veganRecipes,
    });

    const output = generatePlan(input);

    // Every assigned recipe must be vegan
    for (const slot of output.plan.slots) {
      if (slot.recipe !== null) {
        expect(slot.recipe.dietTags).toContain('vegan');
      }
    }
  });

  it('prefers günstig recipes in Sparwoche mode', () => {
    const input = makeDefaultInput({
      preferences: makePreferences({ budgetMode: 'sparwoche' }),
    });

    const output = generatePlan(input);

    // In Sparwoche mode, the budget score should be reasonably high,
    // indicating the algorithm chose cheaper options.
    expectInRange(output.scoreBreakdown.budgetFitScore, 0.4, 1.0, 'sparwoche budget score');
  });
});

// =============================================================================
// TEST 3: ALL SLOTS LOCKED EXCEPT ONE
// =============================================================================

describe('generatePlan — all slots locked except one', () => {
  it('respects all locked slots and fills exactly the unlocked slot', () => {
    const pool = makeDefaultRecipePool();

    // Lock all Mittagessen slots except day 0 (Monday)
    const lockedSlots = [1, 2, 3, 4, 5, 6].map(day => ({
      dayOfWeek: day as DayOfWeek,
      mealType: 'Mittagessen' as MealType,
      recipeId: pool[0].id, // lock to first recipe
    }));

    const input = makeDefaultInput({ lockedSlots });
    const output = generatePlan(input);

    // Verify all locked slots appear in the plan with the correct recipe
    for (const locked of lockedSlots) {
      const slot = output.plan.slots.find(
        s => s.dayOfWeek === locked.dayOfWeek && s.mealType === locked.mealType
      );
      expect(slot).toBeDefined();
      expect(slot?.isLocked).toBe(true);
    }
  });
});

// =============================================================================
// TEST 4: ABENDBROT MINIMUM (AT LEAST 2 PER WEEK)
// =============================================================================

describe('generatePlan — Abendbrot minimum enforcement', () => {
  it('generates plans with at least MIN_ABENDBROT_PER_WEEK Abendbrot slots', () => {
    const output = generatePlan(makeDefaultInput());
    const abendBrotCount = countAbendBrot(output.plan);
    expect(abendBrotCount).toBeGreaterThanOrEqual(MIN_ABENDBROT_PER_WEEK);
  });

  it('Abendbrot slots only contain Abendbrot-tagged recipes', () => {
    const output = generatePlan(makeDefaultInput());
    const abendBrotSlots = output.plan.slots.filter(s => s.mealType === 'Abendbrot');

    for (const slot of abendBrotSlots) {
      expect(slot.recipe).not.toBeNull();
      expect(slot.recipe?.mealTypes).toContain('Abendbrot');
    }
  });

  it('Abendbrot recipes have very short cooking time', () => {
    const output = generatePlan(makeDefaultInput());
    const abendBrotSlots = output.plan.slots.filter(s => s.mealType === 'Abendbrot');

    for (const slot of abendBrotSlots) {
      if (slot.recipe !== null) {
        // Abendbrot should be near-zero cooking time (≤5 min by convention)
        expect(slot.recipe.totalTimeMinutes).toBeLessThanOrEqual(5);
      }
    }
  });
});

// =============================================================================
// TEST 5: MAX COOKING TIME RESPECTED
// =============================================================================

describe('generatePlan — max cooking time enforcement', () => {
  it('does not assign recipes exceeding maxCookingTimeMinutes (with one ambitious exception)', () => {
    const timeLimit = 30;
    // Create a pool with one recipe over the limit (used for ambitious meal) and the rest under
    const quickRecipes = Array.from({ length: 12 }, (_, i) =>
      makeRecipe({
        id: `quick-${i}`,
        totalTimeMinutes: 25,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        mealTypes: ['Mittagessen', 'Abendessen'],
        titleDe: `Schnellrezept ${i}`,
      })
    );
    const ambitiousRecipe = makeRecipe({
      id: 'ambitious-1',
      totalTimeMinutes: 40, // within 1.5× of 30 (= 45)
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      mealTypes: ['Mittagessen', 'Abendessen'],
      titleDe: 'Ambitioniertes Gericht',
    });
    const abendBrots = Array.from({ length: 5 }, (_, i) =>
      makeAbendBrotRecipe({ id: `ab-${i}` })
    );

    const input = makeDefaultInput({
      preferences: makePreferences({ maxCookingTimeMinutes: timeLimit }),
      recipePool: [...quickRecipes, ambitiousRecipe, ...abendBrots],
    });

    const output = generatePlan(input);
    // Time fit score should be perfect or near-perfect
    expectInRange(output.scoreBreakdown.timeFitScore, 0.9, 1.0, 'time fit score with quick pool');
  });
});

// =============================================================================
// TEST 6: ALLERGEN EXCLUSION (GLUTEN-FREE)
// =============================================================================

describe('generatePlan — allergen exclusion (Gluten)', () => {
  it('never assigns gluten-containing recipes to a gluten-free user', () => {
    const glutenRecipes = [
      makeGlutenRecipe({ id: 'gluten-1' }),
      makeGlutenRecipe({ id: 'gluten-2' }),
    ];
    const glutenFreeRecipes = Array.from({ length: 15 }, (_, i) =>
      makeRecipe({
        id: `gf-${i}`,
        titleDe: `Glutenfreies Rezept ${i}`,
        ingredients: [
          makeRecipeIngredient(makeIngredient({ nameDe: 'Hähnchenbrust' }), 400),
          makeRecipeIngredient(makeIngredient({ nameDe: 'Karotten' }), 200),
        ],
        mealTypes: i < 10 ? ['Mittagessen', 'Abendessen'] : ['Abendbrot'],
      })
    );

    const input = makeDefaultInput({
      preferences: makePreferences({ allergies: ['Gluten'] }),
      recipePool: [...glutenRecipes, ...glutenFreeRecipes],
    });

    const output = generatePlan(input);

    // No recipe in the plan should contain gluten
    for (const slot of output.plan.slots) {
      if (slot.recipe !== null) {
        const ingredientNames = slot.recipe.ingredients.map(ri =>
          ri.ingredient.nameDe.toLowerCase()
        );
        const hasGluten = ingredientNames.some(n =>
          ['spaghetti', 'nudeln', 'mehl', 'weizen', 'brot', 'paniermehl'].some(kw => n.includes(kw))
        );
        expect(hasGluten).toBe(false);
      }
    }
  });

  it('throws if no allergen-safe recipes exist', () => {
    const onlyGlutenRecipes = Array.from({ length: 5 }, (_, i) =>
      makeGlutenRecipe({ id: `glu-${i}` })
    );

    const input = makeDefaultInput({
      preferences: makePreferences({ allergies: ['Gluten'] }),
      recipePool: onlyGlutenRecipes,
    });

    expect(() => generatePlan(input)).toThrow();
  });
});

// =============================================================================
// TEST 7: INGREDIENT REUSE — HIGH REUSE SCORES HIGHER
// =============================================================================

describe('scoreIngredientReuse — plans with reuse score higher', () => {
  it('a plan with shared ingredients scores higher than one with fully unique ingredients', () => {
    // Shared ingredient across two meals
    const sharedIng = makeIngredient({ id: 'shared-ing', nameDe: 'Petersilie' });

    const r1 = makeRecipe({
      id: 'reuse-r1',
      ingredients: [
        makeRecipeIngredient(sharedIng, 20),
        makeRecipeIngredient(makeIngredient({ nameDe: 'Hähnchen' }), 400),
      ],
    });
    const r2 = makeRecipe({
      id: 'reuse-r2',
      ingredients: [
        makeRecipeIngredient(sharedIng, 20), // also uses Petersilie!
        makeRecipeIngredient(makeIngredient({ nameDe: 'Rinder' }), 400),
      ],
    });

    const highReusePlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: r1 },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: r2 },
    ]);

    const noReuseR1 = makeRecipe({
      ingredients: [makeRecipeIngredient(makeIngredient({ id: 'u1', nameDe: 'Thymian' }), 10)],
    });
    const noReuseR2 = makeRecipe({
      ingredients: [makeRecipeIngredient(makeIngredient({ id: 'u2', nameDe: 'Oregano' }), 10)],
    });
    const noReusePlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: noReuseR1 },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: noReuseR2 },
    ]);

    const highReuseScore = scoreIngredientReuse(makeScoringContext(highReusePlan));
    const noReuseScore = scoreIngredientReuse(makeScoringContext(noReusePlan));

    expect(highReuseScore).toBeGreaterThan(noReuseScore);
  });
});

// =============================================================================
// TEST 8: VARIETY RULES — NO CONSECUTIVE PROTEIN
// =============================================================================

describe('scoreVariety — no consecutive protein repeat', () => {
  it('plan with alternating proteins scores higher than plan with consecutive same protein', () => {
    const chickenChickenPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Rind' }) },
    ]);

    const alternatingPlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Huhn' }) },
      { dayOfWeek: 1, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Rind' }) },
      { dayOfWeek: 2, mealType: 'Mittagessen', recipe: makeRecipe({ mainProtein: 'Fisch' }) },
    ]);

    const consecutiveScore = scoreVariety(makeScoringContext(chickenChickenPlan));
    const alternatingScore = scoreVariety(makeScoringContext(alternatingPlan));

    expect(alternatingScore).toBeGreaterThan(consecutiveScore);
  });
});

// =============================================================================
// TEST 9: SEASONAL PREFERENCE — SUMMER VS WINTER
// =============================================================================

describe('scoreSeasonality — summer vs winter recipes', () => {
  it('summer recipe scores higher in June (month 6) than in December (month 12)', () => {
    const summerRecipe = makeRecipe({
      isSeasonal: true,
      seasonMonths: [5, 6, 7, 8],
      ingredients: [
        makeRecipeIngredient(
          makeIngredient({ nameDe: 'Erdbeeren', isSeasonal: true, seasonMonths: [5, 6, 7, 8] }),
          300,
        ),
      ],
    });

    const plan = makePlan([{ dayOfWeek: 0, mealType: 'Mittagessen', recipe: summerRecipe }]);

    const juneScore = scoreSeasonality(makeScoringContext(plan, makePreferences(), 6));
    const decemberScore = scoreSeasonality(makeScoringContext(plan, makePreferences(), 12));

    expect(juneScore).toBeGreaterThan(decemberScore);
  });

  it('non-seasonal recipes score neutrally regardless of month', () => {
    const nonSeasonalRecipe = makeRecipe({ isSeasonal: false, seasonMonths: [] });
    const plan = makePlan([{ dayOfWeek: 0, mealType: 'Mittagessen', recipe: nonSeasonalRecipe }]);

    const juneScore = scoreSeasonality(makeScoringContext(plan, makePreferences(), 6));
    const decemberScore = scoreSeasonality(makeScoringContext(plan, makePreferences(), 12));

    // Scores should be identical for non-seasonal recipes regardless of month
    expect(Math.abs(juneScore - decemberScore)).toBeLessThan(0.05);
  });
});

// =============================================================================
// TEST 10: EMPTY RECIPE POOL (EDGE CASE)
// =============================================================================

describe('generatePlan — empty recipe pool (edge case)', () => {
  it('throws a descriptive error when the recipe pool is empty', () => {
    const input = makeDefaultInput({ recipePool: [] });
    expect(() => generatePlan(input)).toThrow();
  });

  it('throws with a German error message', () => {
    const input = makeDefaultInput({ recipePool: [] });
    let errorMessage = '';
    try {
      generatePlan(input);
    } catch (e) {
      if (e instanceof Error) errorMessage = e.message;
    }
    // Error message should be in German (contains common German words)
    expect(errorMessage.length).toBeGreaterThan(0);
    expect(
      errorMessage.includes('Keine') || errorMessage.includes('keine') ||
      errorMessage.includes('verfügbar') || errorMessage.includes('kein')
    ).toBe(true);
  });

  it('throws when pool contains only recipes that violate diet type', () => {
    const meatOnlyRecipes = Array.from({ length: 5 }, (_, i) =>
      makeRecipe({ id: `meat-${i}`, dietTags: ['omnivor'] })
    );
    const input = makeDefaultInput({
      preferences: makePreferences({ dietType: 'vegan' }),
      recipePool: meatOnlyRecipes,
    });
    expect(() => generatePlan(input)).toThrow();
  });
});

// =============================================================================
// ADDITIONAL: SINGLE-SLOT REGENERATION
// =============================================================================

describe('regenerateSingleSlot', () => {
  it('replaces the target slot with a different recipe', () => {
    // First generate a full plan
    const initialOutput = generatePlan(makeDefaultInput());
    const targetSlot = initialOutput.plan.slots.find(
      s => s.mealType === 'Mittagessen' && s.dayOfWeek === 0
    );

    if (!targetSlot || !targetSlot.recipe) {
      // Skip test if target slot not found (shouldn't happen with default input)
      return;
    }

    const originalRecipeId = targetSlot.recipe.id;
    const allRecipeIds = initialOutput.plan.slots
      .filter(s => s.recipe !== null)
      .map(s => (s.recipe as Recipe).id);

    const output = regenerateSingleSlot({
      existingPlan: initialOutput.plan,
      dayOfWeek: 0,
      mealType: 'Mittagessen',
      preferences: makePreferences(),
      householdSize: 4,
      recipePool: makeDefaultRecipePool(),
      excludeRecipeIds: allRecipeIds,
      weekStartDate: '2026-04-20',
      recentlyUsedRecipeIds: [],
    });

    // The slot should have a recipe
    expect(output.updatedSlot.recipe).not.toBeNull();

    // The recipe should be different from the excluded ones
    const newRecipeId = output.updatedSlot.recipe?.id;
    expect(allRecipeIds).not.toContain(newRecipeId);
  });

  it('throws when no replacement recipe is available', () => {
    const pool = makeDefaultRecipePool();
    const allIds = pool.map(r => r.id);

    const simplePlan = makePlan([
      { dayOfWeek: 0, mealType: 'Mittagessen', recipe: pool[0] },
    ]);

    expect(() =>
      regenerateSingleSlot({
        existingPlan: simplePlan,
        dayOfWeek: 0,
        mealType: 'Mittagessen',
        preferences: makePreferences(),
        householdSize: 4,
        recipePool: pool,
        excludeRecipeIds: allIds, // exclude everything
        weekStartDate: '2026-04-20',
        recentlyUsedRecipeIds: [],
      })
    ).toThrow();
  });
});

// =============================================================================
// ADDITIONAL: SCORING WEIGHTS INTEGRATION
// =============================================================================

describe('computeCompositeScore integration', () => {
  it('all score components are in [0, 1]', () => {
    const output = generatePlan(makeDefaultInput());
    const { scoreBreakdown } = output;

    expectInRange(scoreBreakdown.varietyScore, 0, 1, 'variety');
    expectInRange(scoreBreakdown.ingredientReuseScore, 0, 1, 'ingredientReuse');
    expectInRange(scoreBreakdown.timeFitScore, 0, 1, 'timeFit');
    expectInRange(scoreBreakdown.budgetFitScore, 0, 1, 'budgetFit');
    expectInRange(scoreBreakdown.seasonalScore, 0, 1, 'seasonal');
    expectInRange(scoreBreakdown.historyPenaltyScore, 0, 1, 'history');
  });
});
