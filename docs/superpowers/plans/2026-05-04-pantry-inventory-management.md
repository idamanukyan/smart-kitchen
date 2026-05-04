# Pantry/Inventory Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pantry tracking as a 5th tab that integrates with the shopping list derivation and meal plan scoring algorithm.

**Architecture:** New `src/features/pantry/` feature module with a Zustand store (persisted to localStorage, synced to Supabase). The shopping list derivation function gains an optional `pantryItems` parameter. The scoring algorithm gains a `pantryUtilization` sub-signal within the existing ingredient reuse dimension. New UI components for the Vorräte tab, shopping import sheet, and cooking consumption confirmation.

**Tech Stack:** React Native, Expo, TypeScript (strict), Zustand v4, Nativewind, Supabase, expo-haptics

---

### Task 1: PantryItem Type + Pantry Store (Foundation)

**Files:**
- Create: `src/features/pantry/types.ts`
- Create: `src/features/pantry/store/usePantryStore.ts`
- Create: `src/features/pantry/store/__tests__/usePantryStore.test.ts`

- [ ] **Step 1: Write PantryItem type**

```typescript
// src/features/pantry/types.ts

export type StorageType = 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur';

export interface PantryItem {
  readonly id: string;
  readonly householdId: string;
  readonly ingredientId: string;
  readonly ingredientName: string;
  readonly amount: number;
  readonly unit: string;
  readonly storageType: StorageType;
  readonly expiresAt: string | null; // ISO date string
  readonly addedAt: string;          // ISO date string
  readonly addedByUserId: string;
}

export interface IngredientDeduction {
  readonly ingredientId: string;
  readonly amount: number;
  readonly unit: string;
}
```

- [ ] **Step 2: Write failing tests for the pantry store**

```typescript
// src/features/pantry/store/__tests__/usePantryStore.test.ts

import { usePantryStore } from '../usePantryStore';
import type { PantryItem } from '../../types';

// Reset store between tests
beforeEach(() => {
  usePantryStore.setState({ items: [] });
});

const makeItem = (overrides: Partial<PantryItem> = {}): Omit<PantryItem, 'id' | 'addedAt'> => ({
  householdId: 'hh-1',
  ingredientId: 'ing-kartoffeln',
  ingredientName: 'Kartoffeln',
  amount: 1000,
  unit: 'g',
  storageType: 'Vorratskammer',
  expiresAt: null,
  addedByUserId: 'user-1',
  ...overrides,
});

describe('addItem', () => {
  test('adds a new item to the store', () => {
    usePantryStore.getState().addItem(makeItem());
    const items = usePantryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].ingredientId).toBe('ing-kartoffeln');
    expect(items[0].amount).toBe(1000);
    expect(items[0].id).toBeTruthy();
    expect(items[0].addedAt).toBeTruthy();
  });

  test('merges amounts when adding same ingredientId', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().addItem(makeItem({ amount: 300 }));
    const items = usePantryStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(800);
  });

  test('keeps earlier expiry date when merging', () => {
    usePantryStore.getState().addItem(makeItem({
      amount: 500,
      expiresAt: '2026-05-10',
    }));
    usePantryStore.getState().addItem(makeItem({
      amount: 300,
      expiresAt: '2026-05-15',
    }));
    const items = usePantryStore.getState().items;
    expect(items[0].expiresAt).toBe('2026-05-10');
  });
});

describe('addItems (bulk)', () => {
  test('adds multiple items at once', () => {
    usePantryStore.getState().addItems([
      makeItem({ ingredientId: 'ing-kartoffeln', ingredientName: 'Kartoffeln' }),
      makeItem({ ingredientId: 'ing-mehl', ingredientName: 'Mehl', amount: 500 }),
    ]);
    expect(usePantryStore.getState().items).toHaveLength(2);
  });
});

describe('updateItem', () => {
  test('updates amount of existing item', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().updateItem(id, { amount: 750 });
    expect(usePantryStore.getState().items[0].amount).toBe(750);
  });

  test('updates expiresAt of existing item', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().updateItem(id, { expiresAt: '2026-06-01' });
    expect(usePantryStore.getState().items[0].expiresAt).toBe('2026-06-01');
  });
});

describe('removeItem', () => {
  test('removes item by id', () => {
    usePantryStore.getState().addItem(makeItem());
    const id = usePantryStore.getState().items[0].id;
    usePantryStore.getState().removeItem(id);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });
});

describe('deductIngredients', () => {
  test('subtracts amount from matching pantry item', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 1000 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 400, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items[0].amount).toBe(600);
  });

  test('removes item when deduction reaches zero', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });

  test('caps at zero — never goes negative', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 200 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(0);
  });

  test('skips ingredients not in pantry', () => {
    usePantryStore.getState().addItem(makeItem({ amount: 500 }));
    usePantryStore.getState().deductIngredients([
      { ingredientId: 'ing-missing', amount: 200, unit: 'g' },
    ]);
    expect(usePantryStore.getState().items).toHaveLength(1);
    expect(usePantryStore.getState().items[0].amount).toBe(500);
  });
});

describe('getExpiringItems', () => {
  test('returns items expiring within N days', () => {
    const today = new Date();
    const in2Days = new Date(today);
    in2Days.setDate(today.getDate() + 2);
    const in10Days = new Date(today);
    in10Days.setDate(today.getDate() + 10);

    usePantryStore.getState().addItem(makeItem({
      ingredientId: 'ing-sahne',
      ingredientName: 'Sahne',
      expiresAt: in2Days.toISOString().slice(0, 10),
    }));
    usePantryStore.getState().addItem(makeItem({
      ingredientId: 'ing-mehl',
      ingredientName: 'Mehl',
      expiresAt: in10Days.toISOString().slice(0, 10),
    }));

    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(1);
    expect(expiring[0].ingredientId).toBe('ing-sahne');
  });

  test('includes already-expired items', () => {
    usePantryStore.getState().addItem(makeItem({
      expiresAt: '2026-01-01', // past date
    }));
    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(1);
  });

  test('excludes items with no expiry date', () => {
    usePantryStore.getState().addItem(makeItem({ expiresAt: null }));
    const expiring = usePantryStore.getState().getExpiringItems(3);
    expect(expiring).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest src/features/pantry/store/__tests__/usePantryStore.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 4: Implement the pantry store**

```typescript
// src/features/pantry/store/usePantryStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from '../../../shared/lib/storage';
import type { PantryItem, IngredientDeduction } from '../types';

interface PantryState {
  items: PantryItem[];
  addItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;
  addItems: (items: Omit<PantryItem, 'id' | 'addedAt'>[]) => void;
  updateItem: (id: string, patch: Partial<Pick<PantryItem, 'amount' | 'unit' | 'expiresAt'>>) => void;
  removeItem: (id: string) => void;
  deductIngredients: (deductions: IngredientDeduction[]) => void;
  getExpiringItems: (withinDays: number) => PantryItem[];
}

let idCounter = 0;
function generateId(): string {
  return `pantry-${Date.now()}-${++idCounter}`;
}

function pickEarlierExpiry(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a <= b ? a : b;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.ingredientId === input.ingredientId
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? {
                      ...i,
                      amount: i.amount + input.amount,
                      expiresAt: pickEarlierExpiry(i.expiresAt, input.expiresAt),
                    }
                  : i
              ),
            };
          }

          const newItem: PantryItem = {
            ...input,
            id: generateId(),
            addedAt: new Date().toISOString(),
          };
          return { items: [...state.items, newItem] };
        });
      },

      addItems: (inputs) => {
        for (const input of inputs) {
          get().addItem(input);
        }
      },

      updateItem: (id, patch) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      deductIngredients: (deductions) => {
        set((state) => {
          let updated = [...state.items];

          for (const deduction of deductions) {
            const idx = updated.findIndex(
              (i) => i.ingredientId === deduction.ingredientId
            );
            if (idx === -1) continue;

            const item = updated[idx];
            const newAmount = item.amount - deduction.amount;

            if (newAmount <= 0) {
              updated = updated.filter((_, i) => i !== idx);
            } else {
              updated[idx] = { ...item, amount: newAmount };
            }
          }

          return { items: updated };
        });
      },

      getExpiringItems: (withinDays) => {
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() + withinDays);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        return get().items.filter((item) => {
          if (item.expiresAt === null) return false;
          return item.expiresAt <= cutoffStr;
        });
      },
    }),
    {
      name: 'smartkueche-pantry',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/features/pantry/store/__tests__/usePantryStore.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/pantry/types.ts src/features/pantry/store/usePantryStore.ts src/features/pantry/store/__tests__/usePantryStore.test.ts
git commit -m "feat: add PantryItem type and Zustand store with tests"
```

---

### Task 2: Shopping List Pantry Subtraction

**Files:**
- Modify: `src/features/shopping-list/derive-shopping-list.ts`
- Modify: `src/features/shopping-list/derive-shopping-list.test.ts`
- Modify: `src/features/shopping-list/types.ts`

- [ ] **Step 1: Add `pantry_amount` field to ShoppingListItem type**

In `src/features/shopping-list/types.ts`, add to the `ShoppingListItem` interface:

```typescript
  /**
   * Amount of this ingredient already available in the pantry (in `unit`).
   * 0 when the pantry has none of this ingredient.
   * Used to display "Xg vorhanden, Yg benötigt" in the UI.
   */
  readonly pantry_amount: number;
```

- [ ] **Step 2: Write failing tests for pantry subtraction**

Append to `src/features/shopping-list/derive-shopping-list.test.ts`:

```typescript
// =============================================================================
// 11. Pantry subtraction
// =============================================================================

import type { PantryItem } from '../pantry/types';

function makePantryItem(overrides: Partial<PantryItem> & { ingredientId: string; amount: number; unit: string }): PantryItem {
  return {
    id: `pi-${overrides.ingredientId}`,
    householdId: 'hh-1',
    ingredientName: overrides.ingredientId,
    storageType: 'Vorratskammer',
    expiresAt: null,
    addedAt: '2026-05-01T00:00:00Z',
    addedByUserId: 'user-1',
    ...overrides,
  };
}

describe('pantry subtraction', () => {
  test('pantry fully covers ingredient — item omitted from shopping list', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const pantryItems: PantryItem[] = [
      makePantryItem({ ingredientId: 'ing-kartoffeln', amount: 600, unit: 'g' }),
    ];

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS, 'REWE', pantryItems);
    expect(result.total_items).toBe(0);
  });

  test('pantry partially covers ingredient — reduced amount on shopping list', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-hackfleisch', amount: 500, unit: 'g' },
    ]);
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const pantryItems: PantryItem[] = [
      makePantryItem({ ingredientId: 'ing-hackfleisch', amount: 200, unit: 'g' }),
    ];

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS, 'REWE', pantryItems);
    const allItems = result.groups.flatMap(g => g.items);
    const hack = allItems.find(i => i.ingredient_id === 'ing-hackfleisch');
    expect(hack).toBeDefined();
    expect(hack!.amount_needed).toBe(300); // 500 - 200
    expect(hack!.pantry_amount).toBe(200);
  });

  test('no pantry items — identical to current behaviour', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-kartoffeln', amount: 500, unit: 'g' },
    ]);
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const resultWithout = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS, 'REWE');
    const resultWith = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS, 'REWE', []);
    expect(resultWith.total_items).toBe(resultWithout.total_items);
  });

  test('pantry_amount is 0 when no pantry items', () => {
    const recipe = makeRecipe('r1', 'Rezept', [
      { id: 'ri1', recipe_id: 'r1', ingredient_id: 'ing-mehl', amount: 300, unit: 'g' },
    ]);
    const plan = makePlan([
      { id: 's1', meal_plan_id: 'plan-1', day_of_week: 0, meal_type: 'Mittagessen',
        recipe_id: 'r1', is_locked: false, servings_override: null },
    ]);

    const result = deriveShoppingList(plan, [recipe], ALL_INGREDIENTS, 'REWE');
    const allItems = result.groups.flatMap(g => g.items);
    expect(allItems[0].pantry_amount).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest src/features/shopping-list/derive-shopping-list.test.ts --no-coverage`
Expected: FAIL — `pantry_amount` not on type, `deriveShoppingList` signature mismatch

- [ ] **Step 4: Implement pantry subtraction in deriveShoppingList**

Modify `src/features/shopping-list/derive-shopping-list.ts`:

1. Add import at the top:
```typescript
import type { PantryItem } from '../pantry/types';
```

2. Update the `deriveShoppingList` function signature:
```typescript
export function deriveShoppingList(
  plan: MealPlan,
  recipes: readonly Recipe[],
  ingredients: readonly Ingredient[],
  preferredStore: string = 'REWE',
  pantryItems: readonly PantryItem[] = [],
): DerivedShoppingList {
```

3. After the `aggregateIngredients` call (line ~602), add pantry subtraction logic and update the item-building loop:

```typescript
  // ── Step 1 & 2: Aggregate and normalise ──────────────────────────────────
  const accumulated = aggregateIngredients(plan, recipes, ingredients);

  // ── Step 2.5: Pantry subtraction ─────────────────────────────────────────
  // Build a lookup map from ingredientId → pantry amount (in the ingredient's default unit)
  const pantryLookup = new Map<string, number>();
  for (const pi of pantryItems) {
    const existing = pantryLookup.get(pi.ingredientId) ?? 0;
    pantryLookup.set(pi.ingredientId, existing + pi.amount);
  }

  // ── Steps 3, 4, 5: Package rounding + deduplication + display text ───────
  const items: ShoppingListItem[] = [];

  for (const acc of accumulated.values()) {
    // Subtract pantry amount
    const pantryAmount = pantryLookup.get(acc.ingredient_id) ?? 0;
    const adjustedAmount = acc.total_amount - pantryAmount;

    // If pantry fully covers the need, skip this item
    if (adjustedAmount <= 0) continue;

    const rounding = roundToPackage(adjustedAmount, acc.ingredient_ref, preferredStore);

    const displayText = buildDisplayText(
      acc.ingredient_name,
      adjustedAmount,
      acc.default_unit,
      rounding.package_count,
      rounding.package_size
    );

    items.push({
      id: itemId(acc.ingredient_id),
      ingredient_id: acc.ingredient_id,
      ingredient_name: acc.ingredient_name,
      amount_needed: adjustedAmount,
      unit: acc.default_unit,
      display_text: displayText,
      aisle_category: acc.aisle_category,
      package_count: rounding.package_count,
      package_size: rounding.package_size,
      leftover_amount: rounding.leftover_amount,
      estimated_price_cents: rounding.estimated_price_cents,
      is_checked: false,
      pantry_amount: pantryAmount > 0 ? Math.min(pantryAmount, acc.total_amount) : 0,
    });
  }
```

4. Remove the old item-building loop that this replaces (the `for (const acc of accumulated.values())` block starting around line 609).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/features/shopping-list/derive-shopping-list.test.ts --no-coverage`
Expected: All tests PASS (including all existing tests — no regression)

- [ ] **Step 6: Commit**

```bash
git add src/features/shopping-list/derive-shopping-list.ts src/features/shopping-list/derive-shopping-list.test.ts src/features/shopping-list/types.ts
git commit -m "feat: add pantry subtraction to shopping list derivation"
```

---

### Task 3: Meal Plan Algorithm — Pantry Utilization Scoring

**Files:**
- Modify: `src/features/meal-plan/algorithm/types.ts`
- Modify: `src/features/meal-plan/algorithm/scoring.ts`
- Modify: `src/features/meal-plan/algorithm/plan-generator.ts`

- [ ] **Step 1: Add pantryItems to ScoringContext**

In `src/features/meal-plan/algorithm/types.ts`, add to `ScoringContext`:

```typescript
  /**
   * Pantry items the household currently has.
   * When provided, the scoring function boosts recipes that use these ingredients.
   * Empty array = no pantry influence (Phase 1 backward compat).
   */
  pantryItems: PantryItemRef[];
```

Add a new type above `ScoringContext`:

```typescript
/**
 * Minimal pantry item reference for scoring purposes.
 * Only the fields needed by the scoring function are included.
 */
export interface PantryItemRef {
  ingredientId: string;
  amount: number;
  /** Days until expiry. null = no expiry. Negative = already expired. */
  daysUntilExpiry: number | null;
}
```

- [ ] **Step 2: Implement pantryUtilization scoring in scoring.ts**

In `src/features/meal-plan/algorithm/scoring.ts`, update `scoreIngredientReuse`:

```typescript
export function scoreIngredientReuse(ctx: ScoringContext): number {
  const { ingredientMap, pantryItems } = ctx;

  const totalIngredients = ingredientMap.totalAmounts.size;
  if (totalIngredients === 0) return 0;

  // --- Component 1: Reuse density (35%) ---
  let reusedCount = 0;
  for (const slots of ingredientMap.usedInSlots.values()) {
    if (slots.size >= 2) {
      reusedCount++;
    }
  }
  const reuseDensity = reusedCount / totalIngredients;

  // --- Component 2: Package waste (25%) ---
  let totalPurchased = 0;
  for (const [ingredientId, packagesNeeded] of ingredientMap.packagesNeeded.entries()) {
    const totalNeeded = ingredientMap.totalAmounts.get(ingredientId) ?? 0;
    totalPurchased += packagesNeeded * (totalNeeded / packagesNeeded || totalNeeded);
  }
  const wasteFraction = totalPurchased > 0
    ? Math.min(1, ingredientMap.estimatedWaste / totalPurchased)
    : 0;
  const wasteScore = 1 - wasteFraction;

  // --- Component 3: Pantry utilization (40%) ---
  let pantryUtilization = 0;

  if (pantryItems.length > 0) {
    const pantryIngredientIds = new Set(pantryItems.map(p => p.ingredientId));
    // Build a map for expiry boost lookup
    const expiryMap = new Map<string, number | null>(
      pantryItems.map(p => [p.ingredientId, p.daysUntilExpiry])
    );

    let weightedMatches = 0;
    let totalPlanIngredients = 0;

    for (const ingredientId of ingredientMap.totalAmounts.keys()) {
      totalPlanIngredients++;
      if (pantryIngredientIds.has(ingredientId)) {
        const daysUntilExpiry = expiryMap.get(ingredientId) ?? null;
        // Expiry boost: items expiring within 5 days get up to 2× weight
        let boost = 1.0;
        if (daysUntilExpiry !== null) {
          boost = 1 + Math.max(0, (5 - daysUntilExpiry) / 5);
        }
        weightedMatches += boost;
      }
    }

    pantryUtilization = totalPlanIngredients > 0
      ? Math.min(1, weightedMatches / totalPlanIngredients)
      : 0;
  }

  // Combined score with pantry-aware weights
  if (pantryItems.length > 0) {
    // With pantry: reuseDensity 35%, wasteScore 25%, pantryUtilization 40%
    const reuseScore = reuseDensity * 0.35 + wasteScore * 0.25 + pantryUtilization * 0.40;
    return Math.max(0, Math.min(1, reuseScore));
  } else {
    // Without pantry: original weights (reuseDensity 60%, wasteScore 40%)
    const reuseScore = reuseDensity * 0.60 + wasteScore * 0.40;
    return Math.max(0, Math.min(1, reuseScore));
  }
}
```

- [ ] **Step 3: Update ScoringContext construction in plan-generator.ts**

In `src/features/meal-plan/algorithm/plan-generator.ts`:

1. Add import:
```typescript
import type { PantryItemRef } from './types';
```

2. Update `PlanGenerationInput.pantryIngredientIds` to the new type — replace the existing `pantryIngredientIds` field with:
```typescript
  /**
   * Pantry items the household currently has.
   * When provided, the algorithm prefers recipes that use these ingredients
   * (especially those near expiry).
   * Optional — omit or pass empty array for no pantry influence.
   */
  pantryItems?: PantryItemRef[];
```

3. Update `generatePlan` to destructure and pass pantry items:

In the destructure at the top of `generatePlan`, replace `pantryIngredientIds = []` with:
```typescript
    pantryItems = [],
```

In the `ScoringContext` construction (around line 681), add:
```typescript
      pantryItems,
```

4. Do the same for `regenerateSingleSlot` — add `pantryItems?: PantryItemRef[]` to `RegenerateSlotInput` and pass it through to the `ScoringContext`.

- [ ] **Step 4: Run existing algorithm tests to verify no regression**

Run: `npx jest src/features/meal-plan/ --no-coverage`
Expected: All existing tests PASS (pantryItems defaults to empty array)

- [ ] **Step 5: Commit**

```bash
git add src/features/meal-plan/algorithm/types.ts src/features/meal-plan/algorithm/scoring.ts src/features/meal-plan/algorithm/plan-generator.ts
git commit -m "feat: add pantry utilization scoring to meal plan algorithm"
```

---

### Task 4: i18n Strings for Pantry Feature

**Files:**
- Modify: `src/shared/i18n/de.ts`
- Modify: `src/shared/i18n/en.ts`

- [ ] **Step 1: Add pantry strings to the Strings interface and DE translations**

In `src/shared/i18n/de.ts`, add to the `Strings` interface:

```typescript
  pantry: {
    tab: string;
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    add: string;
    searchPlaceholder: string;
    expiresIn: (days: number) => string;
    expired: string;
    noExpiry: string;
    amount: string;
    unit: string;
    expiryDate: string;
    storageType: string;
    save: string;
    delete: string;
    deleteConfirm: string;
  };
  pantryImport: {
    title: string;
    confirm: string;
    subtitle: string;
  };
  consumption: {
    title: string;
    confirm: string;
    subtitle: string;
    currentPantry: string;
    toDeduct: string;
  };
  shoppingExpiry: {
    title: string;
    daysLeft: (days: number) => string;
  };
  mealSlot: {
    cooked: string;
  };
  storageTypes: Record<string, string>;
```

Add the DE translations:

```typescript
  pantry: {
    tab: 'Vorräte',
    title: 'Vorratskammer',
    emptyTitle: 'Füge deine ersten Vorräte hinzu',
    emptySubtitle: 'Deine Vorratskammer hilft dir, Lebensmittelverschwendung zu reduzieren',
    add: 'Vorrat hinzufügen',
    searchPlaceholder: 'Zutat suchen…',
    expiresIn: (days: number) => days === 1 ? 'Läuft morgen ab' : `Läuft ab in ${days} Tagen`,
    expired: 'Abgelaufen',
    noExpiry: 'Kein Ablaufdatum',
    amount: 'Menge',
    unit: 'Einheit',
    expiryDate: 'Ablaufdatum',
    storageType: 'Lagerort',
    save: 'Speichern',
    delete: 'Löschen',
    deleteConfirm: 'Vorrat wirklich löschen?',
  },
  pantryImport: {
    title: 'Einkauf in Vorräte übernehmen?',
    confirm: 'In Vorräte übernehmen',
    subtitle: 'Gekaufte Artikel in deine Vorratskammer importieren',
  },
  consumption: {
    title: 'Verbrauch bestätigen',
    confirm: 'Verbrauch bestätigen',
    subtitle: 'Wie viel wurde für dieses Gericht verbraucht?',
    currentPantry: 'Im Vorrat',
    toDeduct: 'Verbrauch',
  },
  shoppingExpiry: {
    title: 'Bald ablaufend',
    daysLeft: (days: number) => days <= 0 ? 'Abgelaufen' : days === 1 ? 'Morgen' : `${days} Tage`,
  },
  mealSlot: {
    cooked: 'Gekocht',
  },
  storageTypes: {
    Kühlschrank: 'Kühlschrank',
    Tiefkühler: 'Tiefkühler',
    Vorratskammer: 'Vorratskammer',
    Raumtemperatur: 'Raumtemperatur',
  },
```

- [ ] **Step 2: Add EN translations**

In `src/shared/i18n/en.ts`, add the matching English translations:

```typescript
  pantry: {
    tab: 'Pantry',
    title: 'Pantry',
    emptyTitle: 'Add your first pantry items',
    emptySubtitle: 'Your pantry helps reduce food waste',
    add: 'Add item',
    searchPlaceholder: 'Search ingredient…',
    expiresIn: (days: number) => days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`,
    expired: 'Expired',
    noExpiry: 'No expiry date',
    amount: 'Amount',
    unit: 'Unit',
    expiryDate: 'Expiry date',
    storageType: 'Storage',
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: 'Really delete this item?',
  },
  pantryImport: {
    title: 'Import shopping to pantry?',
    confirm: 'Import to pantry',
    subtitle: 'Import purchased items to your pantry',
  },
  consumption: {
    title: 'Confirm consumption',
    confirm: 'Confirm usage',
    subtitle: 'How much was used for this dish?',
    currentPantry: 'In pantry',
    toDeduct: 'Used',
  },
  shoppingExpiry: {
    title: 'Expiring soon',
    daysLeft: (days: number) => days <= 0 ? 'Expired' : days === 1 ? 'Tomorrow' : `${days} days`,
  },
  mealSlot: {
    cooked: 'Cooked',
  },
  storageTypes: {
    Kühlschrank: 'Fridge',
    Tiefkühler: 'Freezer',
    Vorratskammer: 'Pantry',
    Raumtemperatur: 'Room temp',
  },
```

- [ ] **Step 3: Update the tabs section in both files**

In `de.ts`, add to `tabs`:
```typescript
    vorräte: 'Vorräte',
```

In `en.ts`, add to `tabs`:
```typescript
    vorräte: 'Pantry',
```

Update the `Strings` interface `tabs` to include:
```typescript
    vorräte: string;
```

- [ ] **Step 4: Verify the app still compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/shared/i18n/de.ts src/shared/i18n/en.ts
git commit -m "feat: add i18n strings for pantry feature (DE + EN)"
```

---

### Task 5: Pantry Screen (Vorräte Tab)

**Files:**
- Create: `src/features/pantry/screens/PantryScreen.tsx`
- Create: `src/features/pantry/components/PantryItemRow.tsx`
- Create: `src/features/pantry/components/StorageSection.tsx`
- Modify: `src/navigation/MainTabNavigator.tsx`

- [ ] **Step 1: Create PantryItemRow component**

```typescript
// src/features/pantry/components/PantryItemRow.tsx

import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem } from '../types';

interface PantryItemRowProps {
  item: PantryItem;
  onPress: (item: PantryItem) => void;
}

function daysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days < 2) return '#dc2626';    // red
  if (days <= 5) return '#d97706';   // amber
  return '#16a34a';                   // green
}

export function PantryItemRow({ item, onPress }: PantryItemRowProps) {
  const t = useTranslation();

  const days = item.expiresAt ? daysUntilExpiry(item.expiresAt) : null;

  const expiryText = (() => {
    if (days === null) return t.pantry.noExpiry;
    if (days <= 0) return t.pantry.expired;
    return t.pantry.expiresIn(days);
  })();

  const expiryTextColor = days !== null ? expiryColor(days) : '#a09080';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e8e0d8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#3d3529' }}>
            {item.ingredientName}
          </Text>
          <Text style={{ fontSize: 13, color: '#a09080', marginTop: 2 }}>
            {item.amount} {item.unit}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: expiryTextColor, fontWeight: '500' }}>
          {expiryText}
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create StorageSection component**

```typescript
// src/features/pantry/components/StorageSection.tsx

import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import type { PantryItem, StorageType } from '../types';
import { PantryItemRow } from './PantryItemRow';
import { useTranslation } from '../../../shared/i18n/t';

const STORAGE_ICONS: Record<StorageType, string> = {
  Kühlschrank: '🧊',
  Tiefkühler: '❄️',
  Vorratskammer: '🏠',
  Raumtemperatur: '🌡️',
};

interface StorageSectionProps {
  storageType: StorageType;
  items: PantryItem[];
  onItemPress: (item: PantryItem) => void;
}

export function StorageSection({ storageType, items, onItemPress }: StorageSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslation();

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setCollapsed(!collapsed)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ fontSize: 16 }}>{STORAGE_ICONS[storageType]}</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#3d3529', marginLeft: 8, flex: 1 }}>
          {t.storageTypes[storageType] ?? storageType}
        </Text>
        <View style={{
          backgroundColor: '#e8e0d8',
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 12, color: '#6b5b4e', fontWeight: '600' }}>
            {items.length}
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#a09080', marginLeft: 8 }}>
          {collapsed ? '▸' : '▾'}
        </Text>
      </Pressable>

      {!collapsed && items.map((item) => (
        <PantryItemRow key={item.id} item={item} onPress={onItemPress} />
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Create PantryScreen**

```typescript
// src/features/pantry/screens/PantryScreen.tsx

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { StorageSection } from '../components/StorageSection';
import { AddItemSheet } from '../components/AddItemSheet';
import { EditItemSheet } from '../components/EditItemSheet';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem, StorageType } from '../types';

const STORAGE_ORDER: StorageType[] = [
  'Kühlschrank',
  'Tiefkühler',
  'Vorratskammer',
  'Raumtemperatur',
];

function sortByExpiry(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => {
    if (a.expiresAt === null && b.expiresAt === null) {
      return a.ingredientName.localeCompare(b.ingredientName, 'de');
    }
    if (a.expiresAt === null) return 1;
    if (b.expiresAt === null) return -1;
    return a.expiresAt.localeCompare(b.expiresAt);
  });
}

export function PantryScreen() {
  const insets = useSafeAreaInsets();
  const items = usePantryStore((s) => s.items);
  const t = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  const handleItemPress = useCallback((item: PantryItem) => {
    setEditingItem(item);
  }, []);

  // Group items by storage type
  const groupedItems = STORAGE_ORDER.map((type) => ({
    storageType: type,
    items: sortByExpiry(items.filter((i) => i.storageType === type)),
  })).filter((group) => group.items.length > 0);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>
            {t.pantry.title}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 44, marginBottom: 16 }}>🏠</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#3d3529', textAlign: 'center' }}>
            {t.pantry.emptyTitle}
          </Text>
          <Text style={{ fontSize: 14, color: '#a09080', textAlign: 'center', marginTop: 8 }}>
            {t.pantry.emptySubtitle}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAdd(true);
            }}
            style={({ pressed }) => ({
              marginTop: 24,
              backgroundColor: '#c07a45',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
              {t.pantry.add}
            </Text>
          </Pressable>
        </View>

        {showAdd && <AddItemSheet onClose={() => setShowAdd(false)} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#faf8f5', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#3d3529' }}>
          {t.pantry.title}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedItems.map(({ storageType, items: groupItems }) => (
          <StorageSection
            key={storageType}
            storageType={storageType}
            items={groupItems}
            onItemPress={handleItemPress}
          />
        ))}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAdd(true);
        }}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 20 + insets.bottom,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#c07a45',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.93 : 1 }],
        })}
      >
        <Text style={{ fontSize: 28, color: '#ffffff', lineHeight: 32 }}>+</Text>
      </Pressable>

      {showAdd && <AddItemSheet onClose={() => setShowAdd(false)} />}
      {editingItem && (
        <EditItemSheet item={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </View>
  );
}
```

- [ ] **Step 4: Add Vorräte tab to MainTabNavigator**

In `src/navigation/MainTabNavigator.tsx`:

1. Add import:
```typescript
import { PantryScreen } from '../features/pantry/screens/PantryScreen';
```

2. Add the new tab between Einkaufsliste and Rezepte:
```typescript
      <Tab.Screen
        name="Vorräte"
        component={PantryScreen}
        options={{
          tabBarLabel: t.tabs.vorräte,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
```

- [ ] **Step 5: Verify app loads with the new tab (manual check)**

Run: `npx expo start`
Expected: App loads, 5th tab "Vorräte" appears, empty state shown

- [ ] **Step 6: Commit**

```bash
git add src/features/pantry/screens/PantryScreen.tsx src/features/pantry/components/PantryItemRow.tsx src/features/pantry/components/StorageSection.tsx src/navigation/MainTabNavigator.tsx
git commit -m "feat: add Vorräte tab with pantry screen and item display"
```

---

### Task 6: Add Item Sheet (Bottom Sheet for Adding Pantry Items)

**Files:**
- Create: `src/features/pantry/components/AddItemSheet.tsx`

- [ ] **Step 1: Create AddItemSheet component**

```typescript
// src/features/pantry/components/AddItemSheet.tsx

import { View, Text, TextInput, Pressable, Modal, FlatList, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useTranslation } from '../../../shared/i18n/t';
import { DEMO_INGREDIENTS } from '../../../data/demo-data';
import type { Ingredient } from '../../shopping-list/types';
import type { StorageType } from '../types';

interface AddItemSheetProps {
  onClose: () => void;
}

export function AddItemSheet({ onClose }: AddItemSheetProps) {
  const t = useTranslation();
  const addItem = usePantryStore((s) => s.addItem);
  const userId = useAuthStore((s) => s.userId);
  const householdId = useAuthStore((s) => s.householdId);

  const [searchText, setSearchText] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storageType, setStorageType] = useState<StorageType>('Vorratskammer');

  const filteredIngredients = useMemo(() => {
    if (searchText.length < 2) return [];
    const query = searchText.toLowerCase();
    return DEMO_INGREDIENTS.filter((i) =>
      i.name_de.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchText]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchText(ingredient.name_de);
    setStorageType(ingredient.storage_type ?? 'Vorratskammer');

    // Pre-fill expiry if shelf_life_days available
    if (ingredient.shelf_life_days) {
      const date = new Date();
      date.setDate(date.getDate() + ingredient.shelf_life_days);
      setExpiryDate(date.toISOString().slice(0, 10));
    }
  };

  const handleSave = () => {
    if (!selectedIngredient || !amount || parseFloat(amount) <= 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addItem({
      householdId: householdId ?? 'local',
      ingredientId: selectedIngredient.id,
      ingredientName: selectedIngredient.name_de,
      amount: parseFloat(amount),
      unit: selectedIngredient.default_unit,
      storageType,
      expiresAt: expiryDate || null,
      addedByUserId: userId ?? 'local',
    });

    onClose();
  };

  const canSave = selectedIngredient !== null && amount !== '' && parseFloat(amount) > 0;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#faf8f5',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            maxHeight: '80%',
          }}
        >
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 16 }}>
            {t.pantry.add}
          </Text>

          {/* Ingredient search */}
          <TextInput
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 12,
              fontSize: 15,
              borderWidth: 1,
              borderColor: '#e8e0d8',
              color: '#3d3529',
              marginBottom: 8,
            }}
            placeholder={t.pantry.searchPlaceholder}
            placeholderTextColor="#a09080"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (selectedIngredient && text !== selectedIngredient.name_de) {
                setSelectedIngredient(null);
              }
            }}
            autoFocus
          />

          {/* Search results */}
          {filteredIngredients.length > 0 && !selectedIngredient && (
            <View style={{ maxHeight: 200, marginBottom: 8 }}>
              <FlatList
                data={filteredIngredients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectIngredient(item)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: pressed ? '#f0ebe5' : 'transparent',
                      borderRadius: 8,
                    })}
                  >
                    <Text style={{ fontSize: 15, color: '#3d3529' }}>{item.name_de}</Text>
                    <Text style={{ fontSize: 12, color: '#a09080' }}>{item.category}</Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Amount input */}
          {selectedIngredient && (
            <>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.amount}</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 15,
                      borderWidth: 1,
                      borderColor: '#e8e0d8',
                      color: '#3d3529',
                    }}
                    placeholder="0"
                    placeholderTextColor="#a09080"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.unit}</Text>
                  <View style={{
                    backgroundColor: '#f0ebe5',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#e8e0d8',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 15, color: '#3d3529' }}>
                      {selectedIngredient.default_unit}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Expiry date */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.expiryDate}</Text>
                <TextInput
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: '#e8e0d8',
                    color: '#3d3529',
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a09080"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>

              {/* Storage type display */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.storageType}</Text>
                <View style={{
                  backgroundColor: '#f0ebe5',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#e8e0d8',
                }}>
                  <Text style={{ fontSize: 15, color: '#3d3529' }}>
                    {t.storageTypes[storageType] ?? storageType}
                  </Text>
                </View>
              </View>

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={({ pressed }) => ({
                  backgroundColor: canSave ? '#c07a45' : '#d0c8c0',
                  padding: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: pressed && canSave ? 0.85 : 1,
                })}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
                  {t.pantry.save}
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pantry/components/AddItemSheet.tsx
git commit -m "feat: add ingredient search and item creation bottom sheet"
```

---

### Task 7: Edit Item Sheet

**Files:**
- Create: `src/features/pantry/components/EditItemSheet.tsx`

- [ ] **Step 1: Create EditItemSheet component**

```typescript
// src/features/pantry/components/EditItemSheet.tsx

import { View, Text, TextInput, Pressable, Modal, Alert, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useTranslation } from '../../../shared/i18n/t';
import type { PantryItem } from '../types';

interface EditItemSheetProps {
  item: PantryItem;
  onClose: () => void;
}

export function EditItemSheet({ item, onClose }: EditItemSheetProps) {
  const t = useTranslation();
  const updateItem = usePantryStore((s) => s.updateItem);
  const removeItem = usePantryStore((s) => s.removeItem);

  const [amount, setAmount] = useState(String(item.amount));
  const [expiryDate, setExpiryDate] = useState(item.expiresAt ?? '');

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateItem(item.id, {
      amount: parsed,
      expiresAt: expiryDate || null,
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(t.pantry.deleteConfirm, '', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: t.pantry.delete,
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeItem(item.id);
          onClose();
        },
      },
    ]);
  };

  const canSave = amount !== '' && parseFloat(amount) > 0;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#faf8f5',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
          }}
        >
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 16 }}>
            {item.ingredientName}
          </Text>

          {/* Amount */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.amount}</Text>
              <TextInput
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: '#e8e0d8',
                  color: '#3d3529',
                }}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.unit}</Text>
              <View style={{
                backgroundColor: '#f0ebe5',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e8e0d8',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 15, color: '#3d3529' }}>{item.unit}</Text>
              </View>
            </View>
          </View>

          {/* Expiry date */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#6b5b4e', marginBottom: 4 }}>{t.pantry.expiryDate}</Text>
            <TextInput
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 12,
                fontSize: 15,
                borderWidth: 1,
                borderColor: '#e8e0d8',
                color: '#3d3529',
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#a09080"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
          </View>

          {/* Buttons */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => ({
              backgroundColor: canSave ? '#c07a45' : '#d0c8c0',
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 8,
              opacity: pressed && canSave ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
              {t.pantry.save}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: '#dc2626', fontWeight: '500', fontSize: 15 }}>
              {t.pantry.delete}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/pantry/components/EditItemSheet.tsx
git commit -m "feat: add pantry item edit/delete bottom sheet"
```

---

### Task 8: Shopping Import Flow

**Files:**
- Create: `src/features/pantry/components/ShoppingImportSheet.tsx`
- Modify: `src/features/shopping-list/screens/ShoppingListScreen.tsx`

- [ ] **Step 1: Create ShoppingImportSheet**

```typescript
// src/features/pantry/components/ShoppingImportSheet.tsx

import { View, Text, Pressable, Modal, ScrollView, Switch, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useTranslation } from '../../../shared/i18n/t';
import { DEMO_INGREDIENTS } from '../../../data/demo-data';
import type { ShoppingListItem } from '../../shopping-list/types';

interface ShoppingImportSheetProps {
  checkedItems: ShoppingListItem[];
  onClose: () => void;
  onImported: () => void;
}

interface ImportLine {
  item: ShoppingListItem;
  selected: boolean;
  expiryDate: string;
}

export function ShoppingImportSheet({ checkedItems, onClose, onImported }: ShoppingImportSheetProps) {
  const t = useTranslation();
  const addItems = usePantryStore((s) => s.addItems);
  const userId = useAuthStore((s) => s.userId);
  const householdId = useAuthStore((s) => s.householdId);

  const initialLines = useMemo(() => {
    return checkedItems.map((item): ImportLine => {
      // Look up ingredient for shelf_life_days and storage_type
      const ingredient = DEMO_INGREDIENTS.find((i) => i.id === item.ingredient_id);
      const shelfLifeDays = ingredient?.shelf_life_days;
      let expiryDate = '';
      if (shelfLifeDays) {
        const date = new Date();
        date.setDate(date.getDate() + shelfLifeDays);
        expiryDate = date.toISOString().slice(0, 10);
      }
      return { item, selected: true, expiryDate };
    });
  }, [checkedItems]);

  const [lines, setLines] = useState<ImportLine[]>(initialLines);

  const toggleLine = (index: number) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, selected: !line.selected } : line
      )
    );
  };

  const handleImport = () => {
    const selectedLines = lines.filter((l) => l.selected);
    if (selectedLines.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const itemsToAdd = selectedLines.map((line) => {
      const ingredient = DEMO_INGREDIENTS.find((i) => i.id === line.item.ingredient_id);
      // Use the package-rounded amount (what was actually purchased)
      const purchasedAmount = line.item.package_size > 0
        ? line.item.package_count * line.item.package_size
        : line.item.amount_needed;

      return {
        householdId: householdId ?? 'local',
        ingredientId: line.item.ingredient_id,
        ingredientName: line.item.ingredient_name,
        amount: purchasedAmount,
        unit: line.item.unit,
        storageType: (ingredient?.storage_type ?? 'Vorratskammer') as 'Kühlschrank' | 'Tiefkühler' | 'Vorratskammer' | 'Raumtemperatur',
        expiresAt: line.expiryDate || null,
        addedByUserId: userId ?? 'local',
      };
    });

    addItems(itemsToAdd);
    onImported();
    onClose();
  };

  const selectedCount = lines.filter((l) => l.selected).length;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#faf8f5',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            maxHeight: '75%',
          }}
        >
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 4 }}>
            {t.pantryImport.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#a09080', marginBottom: 16 }}>
            {t.pantryImport.subtitle}
          </Text>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {lines.map((line, index) => (
              <View
                key={line.item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e8e0d8',
                }}
              >
                <Switch
                  value={line.selected}
                  onValueChange={() => toggleLine(index)}
                  trackColor={{ false: '#d0c8c0', true: '#c07a45' }}
                  thumbColor="#ffffff"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, color: '#3d3529' }}>
                    {line.item.ingredient_name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#a09080' }}>
                    {line.item.display_text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={handleImport}
            disabled={selectedCount === 0}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: selectedCount > 0 ? '#c07a45' : '#d0c8c0',
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: pressed && selectedCount > 0 ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
              {t.pantryImport.confirm} ({selectedCount})
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 2: Add "Einkauf abschließen" button to ShoppingListScreen**

In `src/features/shopping-list/screens/ShoppingListScreen.tsx`:

1. Add imports:
```typescript
import { useState } from 'react';
import { ShoppingImportSheet } from '../../pantry/components/ShoppingImportSheet';
```

2. Inside the `ShoppingListScreen` component, after the `totalChecked` calculation, add:
```typescript
  const [showImport, setShowImport] = useState(false);

  const checkedItems = shoppingList.groups
    .flatMap(g => g.items)
    .filter(i => i.is_checked);
```

3. In the summary bar (the `View` with `flexDirection: 'row'` around line 53), add a "Einkauf abschließen" button when items are checked. After the closing `</Text>` for `estimatedTotal`, add:

```typescript
        {totalChecked > 0 && (
          <Pressable
            onPress={() => setShowImport(true)}
            style={({ pressed }) => ({
              backgroundColor: '#c07a45',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
              {t.shopping?.finishTrip ?? 'Einkauf abschließen'}
            </Text>
          </Pressable>
        )}
```

4. Before the closing `</View>` of the root container, add:
```typescript
      {showImport && (
        <ShoppingImportSheet
          checkedItems={checkedItems}
          onClose={() => setShowImport(false)}
          onImported={() => {
            // Clear checked items after import
          }}
        />
      )}
```

- [ ] **Step 3: Add missing i18n key for finishTrip**

Add to the `shoppingList` section in `Strings` interface and both DE/EN:

In `de.ts` `shoppingList`:
```typescript
    finishTrip: 'Einkauf abschließen',
```

In `en.ts` `shoppingList`:
```typescript
    finishTrip: 'Finish shopping',
```

In `Strings` interface `shoppingList`:
```typescript
    finishTrip: string;
```

- [ ] **Step 4: Commit**

```bash
git add src/features/pantry/components/ShoppingImportSheet.tsx src/features/shopping-list/screens/ShoppingListScreen.tsx src/shared/i18n/de.ts src/shared/i18n/en.ts
git commit -m "feat: add shopping list to pantry import flow"
```

---

### Task 9: Consumption Tracking ("Gekocht" Button + Deduction Sheet)

**Files:**
- Create: `src/features/pantry/components/ConsumptionSheet.tsx`
- Modify: `src/features/meal-plan/components/MealSlotCard.tsx`

- [ ] **Step 1: Create ConsumptionSheet**

```typescript
// src/features/pantry/components/ConsumptionSheet.tsx

import { View, Text, TextInput, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { usePantryStore } from '../store/usePantryStore';
import { useTranslation } from '../../../shared/i18n/t';
import { RECIPE_BY_ID, DEMO_INGREDIENTS } from '../../../data/demo-data';

interface ConsumptionSheetProps {
  recipeId: string;
  servingsOverride: number | null;
  onClose: () => void;
}

interface DeductionLine {
  ingredientId: string;
  ingredientName: string;
  recipeAmount: number;
  unit: string;
  pantryAmount: number;
  editableAmount: string;
}

export function ConsumptionSheet({ recipeId, servingsOverride, onClose }: ConsumptionSheetProps) {
  const t = useTranslation();
  const pantryItems = usePantryStore((s) => s.items);
  const deductIngredients = usePantryStore((s) => s.deductIngredients);

  const recipe = RECIPE_BY_ID.get(recipeId);

  const initialLines = useMemo((): DeductionLine[] => {
    if (!recipe) return [];

    const servings = servingsOverride ?? recipe.servings_default;
    const scalingFactor = recipe.servings_default > 0
      ? servings / recipe.servings_default
      : 1;

    return recipe.ingredients.map((ri) => {
      const scaledAmount = ri.amount * scalingFactor;
      const pantryItem = pantryItems.find((p) => p.ingredientId === ri.ingredient_id);
      const ingredientData = DEMO_INGREDIENTS.find((i) => i.id === ri.ingredient_id);

      return {
        ingredientId: ri.ingredient_id,
        ingredientName: ingredientData?.name_de ?? ri.ingredient_id,
        recipeAmount: Math.round(scaledAmount * 100) / 100,
        unit: ri.unit,
        pantryAmount: pantryItem?.amount ?? 0,
        editableAmount: String(Math.round(scaledAmount * 100) / 100),
      };
    }).filter((line) => line.pantryAmount > 0); // Only show ingredients in the pantry
  }, [recipe, servingsOverride, pantryItems]);

  const [lines, setLines] = useState<DeductionLine[]>(initialLines);

  const updateAmount = (index: number, value: string) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, editableAmount: value } : line
      )
    );
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const deductions = lines
      .map((line) => ({
        ingredientId: line.ingredientId,
        amount: parseFloat(line.editableAmount) || 0,
        unit: line.unit,
      }))
      .filter((d) => d.amount > 0);

    deductIngredients(deductions);
    onClose();
  };

  if (!recipe || initialLines.length === 0) {
    onClose();
    return null;
  }

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#faf8f5',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            maxHeight: '75%',
          }}
        >
          <View style={{ width: 36, height: 4, backgroundColor: '#d0c8c0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3d3529', marginBottom: 4 }}>
            {t.consumption.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#a09080', marginBottom: 16 }}>
            {recipe.title_de} — {t.consumption.subtitle}
          </Text>

          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e8e0d8' }}>
              <Text style={{ flex: 1, fontSize: 12, color: '#a09080', fontWeight: '600' }}>Zutat</Text>
              <Text style={{ width: 70, fontSize: 12, color: '#a09080', fontWeight: '600', textAlign: 'right' }}>
                {t.consumption.currentPantry}
              </Text>
              <Text style={{ width: 80, fontSize: 12, color: '#a09080', fontWeight: '600', textAlign: 'right' }}>
                {t.consumption.toDeduct}
              </Text>
            </View>

            {lines.map((line, index) => (
              <View
                key={line.ingredientId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0ebe5',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: '#3d3529' }}>{line.ingredientName}</Text>
                </View>
                <Text style={{ width: 70, fontSize: 13, color: '#a09080', textAlign: 'right' }}>
                  {line.pantryAmount} {line.unit}
                </Text>
                <View style={{ width: 80, alignItems: 'flex-end' }}>
                  <TextInput
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: '#e8e0d8',
                      color: '#3d3529',
                      textAlign: 'right',
                      width: 70,
                    }}
                    value={line.editableAmount}
                    onChangeText={(v) => updateAmount(index, v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: '#c07a45',
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
              {t.consumption.confirm}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 2: Add "Gekocht" button to MealSlotCard**

In `src/features/meal-plan/components/MealSlotCard.tsx`:

1. Add imports:
```typescript
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ConsumptionSheet } from '../../pantry/components/ConsumptionSheet';
```

2. Inside the `MealSlotCard` component, add state:
```typescript
  const [showConsumption, setShowConsumption] = useState(false);
```

3. Add the "Gekocht" button to the recipe card. After the time `<Text>` (line ~56), add:

```typescript
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowConsumption(true);
          }}
          style={({ pressed }) => ({
            marginTop: 6,
            backgroundColor: pressed ? '#d4a574' : '#c07a45',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>
            {t.mealSlot?.cooked ?? 'Gekocht'}
          </Text>
        </Pressable>
```

4. After the closing `</Pressable>` of the main card wrapper (the outermost Pressable), add:

```typescript
      {showConsumption && recipe && (
        <ConsumptionSheet
          recipeId={recipe.id}
          servingsOverride={slot.servings_override}
          onClose={() => setShowConsumption(false)}
        />
      )}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/pantry/components/ConsumptionSheet.tsx src/features/meal-plan/components/MealSlotCard.tsx
git commit -m "feat: add cooking consumption tracking with pantry deduction"
```

---

### Task 10: Expiry Warnings on Shopping List

**Files:**
- Modify: `src/features/shopping-list/screens/ShoppingListScreen.tsx`

- [ ] **Step 1: Add expiry warnings banner to ShoppingListScreen**

In `src/features/shopping-list/screens/ShoppingListScreen.tsx`:

1. Add imports:
```typescript
import { usePantryStore } from '../../pantry/store/usePantryStore';
import { useMealPlanStore } from '../../meal-plan/store/useMealPlanStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
```

2. Inside the component, compute expiring items not used in the current plan:

```typescript
  const pantryItems = usePantryStore((s) => s.items);
  const getExpiringItems = usePantryStore((s) => s.getExpiringItems);
  const activePlan = useMealPlanStore((s) => s.activePlan);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Get pantry items expiring within 3 days
  const expiringItems = getExpiringItems(3);

  // Filter out ingredients already used in the current meal plan
  const usedIngredientIds = new Set(
    activePlan.slots
      .filter((s) => s.recipe_id !== null)
      .flatMap((s) => {
        const recipe = RECIPE_BY_ID?.get(s.recipe_id!);
        return recipe?.ingredients.map((ri) => ri.ingredient_id) ?? [];
      })
  );

  const unusedExpiringItems = expiringItems.filter(
    (item) => !usedIngredientIds.has(item.ingredientId)
  );
```

3. Add the banner just before the `<SectionList>` (after the summary bar):

```typescript
      {unusedExpiringItems.length > 0 && (
        <View style={{
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: '#fef3cd',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: '#f0d88a',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#856404', marginBottom: 6 }}>
            ⚠️ {t.shoppingExpiry?.title ?? 'Bald ablaufend'}
          </Text>
          {unusedExpiringItems.map((item) => {
            const days = item.expiresAt
              ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 0;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  // Navigate to Rezepte filtered by this ingredient
                  // For now, just navigate to Rezepte tab
                  navigation.getParent()?.navigate('Rezepte');
                }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
              >
                <Text style={{ fontSize: 13, color: '#856404' }}>
                  {item.ingredientName} — {item.amount} {item.unit}
                </Text>
                <Text style={{ fontSize: 12, color: '#856404', fontWeight: '500' }}>
                  {t.shoppingExpiry?.daysLeft(days) ?? `${days} Tage`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
```

4. Add the RECIPE_BY_ID import if not already present:
```typescript
import { RECIPE_BY_ID } from '../../../data/demo-data';
```

- [ ] **Step 2: Commit**

```bash
git add src/features/shopping-list/screens/ShoppingListScreen.tsx
git commit -m "feat: add expiry warnings banner to shopping list"
```

---

### Task 11: Wire Pantry into Shopping List Store + Meal Plan Store

**Files:**
- Modify: `src/features/shopping-list/store/useShoppingListStore.ts`
- Modify: `src/features/meal-plan/store/useMealPlanStore.ts`

- [ ] **Step 1: Pass pantry items to deriveShoppingList**

In `src/features/shopping-list/store/useShoppingListStore.ts`:

1. Add import:
```typescript
import { usePantryStore } from '../../pantry/store/usePantryStore';
```

2. Update `deriveFromPlan` to pass pantry items:

```typescript
      deriveFromPlan: (plan: MealPlan) => {
        const pantryItems = usePantryStore.getState().items;
        const derived = deriveShoppingList(plan, DEMO_RECIPES, DEMO_INGREDIENTS, 'REWE', pantryItems);
```

3. Also re-derive when pantry changes. At the bottom of the file (after the meal plan subscription), add:

```typescript
// Re-derive shopping list when pantry changes.
let previousPantryItems = usePantryStore.getState().items;
usePantryStore.subscribe((state) => {
  if (state.items !== previousPantryItems) {
    previousPantryItems = state.items;
    const currentPlan = useMealPlanStore.getState().activePlan;
    useShoppingListStore.getState().deriveFromPlan(currentPlan);
  }
});
```

- [ ] **Step 2: Pass pantry items to the meal plan algorithm**

In `src/features/meal-plan/store/useMealPlanStore.ts`:

1. Add import:
```typescript
import { usePantryStore } from '../../pantry/store/usePantryStore';
```

2. In the `regeneratePlan` function, after getting preferences, build pantry refs:

```typescript
            const pantryState = usePantryStore.getState();
            const pantryItemsForAlgo = pantryState.items.map((pi) => {
              let daysUntilExpiry: number | null = null;
              if (pi.expiresAt) {
                const diffMs = new Date(pi.expiresAt).getTime() - Date.now();
                daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              }
              return {
                ingredientId: pi.ingredientId,
                amount: pi.amount,
                daysUntilExpiry,
              };
            });
```

3. Pass `pantryItems` to `buildPlanInput` (this will require updating the bridge function to accept and forward pantry items to the algorithm input). Alternatively, add `pantryItems` directly to the input object after `buildPlanInput`:

```typescript
            const input = buildPlanInput({
              householdSize: prefs.householdSize,
              dietType: prefs.dietType,
              allergens: prefs.allergens,
              maxCookingTimeMinutes: prefs.maxCookingTimeMinutes,
              preferredStore: prefs.preferredStore,
            });
            input.pantryItems = pantryItemsForAlgo;
```

Note: This requires `input` to be mutable (`const input` stays, since object properties are mutable). Verify that `buildPlanInput` returns a plain object, not a `Readonly` type. If it does, cast or update the bridge.

- [ ] **Step 3: Run all tests to verify no regression**

Run: `npx jest --no-coverage`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/shopping-list/store/useShoppingListStore.ts src/features/meal-plan/store/useMealPlanStore.ts
git commit -m "feat: wire pantry data into shopping list derivation and meal plan generation"
```

---

### Task 12: Supabase Sync for Pantry

**Files:**
- Modify: `src/shared/lib/sync.ts`
- Modify: `src/features/pantry/store/usePantryStore.ts`

- [ ] **Step 1: Add syncPantry function to sync.ts**

```typescript
// Append to src/shared/lib/sync.ts

import type { PantryItem } from '../../features/pantry/types';

export async function syncPantry(items: PantryItem[], householdId: string): Promise<void> {
  const userId = useAuthStore.getState().userId;
  if (!userId || !householdId) return;

  try {
    // Delete all existing pantry items for this household
    await supabase
      .from('pantry_items')
      .delete()
      .eq('household_id', householdId);

    if (items.length === 0) return;

    // Insert current items
    const rows = items.map((item) => ({
      household_id: householdId,
      ingredient_id: item.ingredientId,
      amount: item.amount,
      unit: item.unit,
      expires_at: item.expiresAt,
      added_by: item.addedByUserId || userId,
    }));

    const { error } = await supabase
      .from('pantry_items')
      .insert(rows);

    if (error) {
      console.error('syncPantry error:', error.message);
    }
  } catch (err) {
    console.error('syncPantry error:', err);
  }
}
```

- [ ] **Step 2: Trigger sync on pantry mutations**

In `src/features/pantry/store/usePantryStore.ts`, add at the bottom of the file:

```typescript
import { syncPantry } from '../../../shared/lib/sync';
import { useAuthStore } from '../../../shared/store/useAuthStore';

// Sync pantry to Supabase on every change (fire-and-forget).
let previousItems = usePantryStore.getState().items;
usePantryStore.subscribe((state) => {
  if (state.items !== previousItems) {
    previousItems = state.items;
    const householdId = useAuthStore.getState().householdId;
    if (householdId) {
      syncPantry(state.items, householdId);
    }
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/sync.ts src/features/pantry/store/usePantryStore.ts
git commit -m "feat: add Supabase sync for pantry items"
```

---

### Task 13: Pantry Coverage Notes on Shopping List Items

**Files:**
- Modify: `src/features/shopping-list/components/ShoppingItemCard.tsx`

- [ ] **Step 1: Read ShoppingItemCard to understand current structure**

Read: `src/features/shopping-list/components/ShoppingItemCard.tsx`

- [ ] **Step 2: Add pantry coverage note**

In `ShoppingItemCard.tsx`, after the existing `display_text` Text element, add a conditional line showing pantry coverage:

```typescript
        {item.pantry_amount > 0 && (
          <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
            {item.pantry_amount}{item.unit} vorhanden, {item.amount_needed}{item.unit} benötigt
          </Text>
        )}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/shopping-list/components/ShoppingItemCard.tsx
git commit -m "feat: show pantry coverage notes on shopping list items"
```

---

### Task 14: Final Integration Test + TypeScript Check

**Files:**
- No new files

- [ ] **Step 1: Run all unit tests**

Run: `npx jest --no-coverage`
Expected: All tests PASS

- [ ] **Step 2: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Start the app and manually verify**

Run: `npx expo start`
Expected:
- 5 tabs visible: Wochenplan, Einkaufsliste, Vorräte, Rezepte, Einstellungen
- Vorräte tab shows empty state with "Füge deine ersten Vorräte hinzu"
- Can add items via "+" FAB → search → fill details → save
- Items appear grouped by storage type
- Shopping list subtracts pantry amounts
- "Einkauf abschließen" button appears when items are checked
- "Gekocht" button on meal slot cards opens consumption sheet

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: pantry integration fixes from manual testing"
```
