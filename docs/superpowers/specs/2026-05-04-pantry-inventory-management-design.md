# Pantry/Inventory Management (Vorratskammer) — Design Spec

## Overview

Add pantry tracking as a first-class feature to SmartKüche. Users can track what ingredients they have at home, import items from completed shopping trips, confirm consumption after cooking, and benefit from smarter shopping lists and meal plans that account for existing inventory. The primary goal is reducing food waste — the pantry closes the loop between planning, shopping, cooking, and what's already on hand.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data flow | Pantry as source of truth | Shopping list derivation and meal plan algorithm read pantry state as input — clean, no sync issues |
| Adding items | Manual + post-shopping import | Manual for initial setup, shopping list import as ongoing channel |
| Consumption tracking | Suggested deduction with user confirmation | Balance of accuracy and UX — user sees what will be deducted and can adjust |
| Shopping list integration | Subtract + expiry warnings | Subtract pantry amounts from shopping needs, surface near-expiry items as nudges |
| Meal plan influence | Soft preference via scoring boost | No separate "Resteküche" mode — algorithm prefers pantry ingredients, especially near-expiry |
| Navigation | New 5th bottom tab "Vorräte" | Core feature deserving top-level access |

---

## 1. Vorräte Tab (Pantry Screen)

### Navigation

- 5th bottom tab in `MainTabNavigator`
- Icon: pantry/cabinet icon
- Label: "Vorräte"
- Positioned between Einkaufsliste and Rezepte (tab order: Wochenplan, Einkaufsliste, Vorräte, Rezepte, Einstellungen)

### Main List View

- Items grouped by `storage_type`: Kühlschrank, Tiefkühler, Vorratskammer, Raumtemperatur
- Each group is a collapsible section with item count badge
- Each item row displays:
  - Ingredient name (German)
  - Amount + unit (e.g. "500 g", "1 l", "6 Stück")
  - Expiry date if set, with color coding:
    - Green: >5 days until expiry
    - Yellow (amber): 2–5 days until expiry
    - Red: <2 days or expired
  - Storage type icon
- Sort within groups: expiring-soonest first, then alphabetical for items without expiry

### Add Item Flow

- Floating action button "+" at bottom-right corner
- Opens a bottom sheet containing:
  - Ingredient search field with typeahead against seed ingredients (`seed-ingredients.ts`)
  - Amount input (numeric) + unit picker (pre-filled from ingredient's `default_unit`)
  - Optional expiry date picker
  - Storage type auto-filled from ingredient's `storage_type` metadata, editable
- "Hinzufügen" button to confirm
- If ingredient already exists in pantry, amounts are merged (summed)

### Edit / Remove

- Tap item row to open edit bottom sheet (same layout as add, pre-filled)
- Swipe left to delete with confirmation

### Empty State

- Centered message: "Füge deine ersten Vorräte hinzu"
- Subtitle: "Deine Vorratskammer hilft dir, Lebensmittelverschwendung zu reduzieren"
- CTA button: "Vorräte hinzufügen" (opens add flow)

---

## 2. Shopping List → Pantry Import

### Trigger

- When user taps an "Einkauf abschließen" button on the Einkaufsliste screen (visible when at least one item is checked)
- Button appears in the summary bar area at the bottom

### Import Flow

- Bottom sheet / modal presents all checked-off shopping items as a pre-filled import list
- Each item shows:
  - Ingredient name
  - Amount (from shopping list's package-rounded quantity)
  - Unit
  - Editable expiry date field (pre-filled from ingredient's `shelf_life_days` if available, calculated as today + shelf_life_days)
- User can:
  - Adjust amounts per item
  - Uncheck items they don't want to import
  - Edit expiry dates
- "In Vorräte übernehmen" button to confirm

### Merge Logic

- If the ingredient already exists in the pantry, add the new amount to the existing amount
- Expiry date: keep the earlier expiry date (conservative approach for food safety)
- After import, checked items are cleared from the shopping list

### Partial Shopping

- Only checked items are offered for import
- Unchecked items remain on the shopping list unchanged

---

## 3. Consumption Tracking ("Verbrauch bestätigen")

### Trigger

- User taps a "Gekocht ✓" button on a `MealSlotCard` in the Wochenplan
- No automatic date-based triggering — explicit user action only

### Confirmation Flow

- Bottom sheet lists the recipe's ingredients with calculated amounts (adjusted for the meal plan's serving count)
- Each line shows:
  - Ingredient name
  - Amount to deduct
  - Current pantry amount (for context)
  - Editable amount field (user can adjust if they used more/less)
- "Verbrauch bestätigen" button applies all deductions

### Deduction Rules

- Deduct the confirmed amount from the pantry item
- If deduction would result in ≤0, remove the item from pantry entirely
- If an ingredient from the recipe is not in the pantry, skip it silently (user may have bought it ad-hoc and not imported)
- Negative inventory is never created

### Dismissal

- If user dismisses the sheet, no deductions occur
- They can always manually adjust pantry amounts later

---

## 4. Shopping List Integration

### Subtraction Logic

- `deriveShoppingList()` gains a new optional parameter: `pantryItems: PantryItem[]`
- Processing (inserted after ingredient aggregation, before package rounding):
  1. For each aggregated ingredient, look up matching pantry item by `ingredient_id`
  2. Convert pantry amount to the same unit as the aggregated need (using existing unit conversion)
  3. Subtract pantry amount from needed amount
  4. If result ≤ 0, omit the item from the shopping list entirely
  5. If result > 0, proceed with the reduced amount to package rounding
- When `pantryItems` is not provided or empty, behavior is identical to current — no regression

### Visual Indicators

- Items partially covered by pantry display a secondary line in muted text:
  - Format: "{pantryAmount} vorhanden, {neededAmount} benötigt"
  - Example: "200g vorhanden, 500g benötigt"

### Expiry Warnings Banner

- Collapsible section at the top of the Einkaufsliste: "Bald ablaufend"
- Shows pantry items expiring within 3 days that are NOT used in the current week's meal plan
- Each warning item shows: name, amount, expiry date, days remaining
- Tapping a warning item navigates to Rezepte screen pre-filtered by that ingredient
- Banner is hidden when there are no expiring items

---

## 5. Meal Plan Algorithm Integration

### Scoring Change

- The existing `ingredientReuse` dimension (25% total weight) gains a new sub-signal: `pantryUtilization`
- New weight split within ingredient reuse:
  - `reuseDensity`: 35% (was ~60%)
  - `wasteScore`: 25% (was ~40%)
  - `pantryUtilization`: 40% (new)

### Pantry Utilization Scoring

- For each candidate plan, count how many recipe ingredients match pantry items
- Near-expiry items get an exponential boost:
  - `expiryBoost = 1 + max(0, (5 - daysUntilExpiry) / 5)` — items expiring within 5 days get up to 2× weight
  - Items with no expiry date get a base boost of 1.0 (neutral)
- Score = sum of matched ingredients (weighted by expiry boost) / total ingredient count across the plan

### Input Change

- `generatePlan()` accepts an optional `pantryItems` parameter
- When present, pantry utilization sub-signal is active
- When absent or empty array, `pantryUtilization` returns 0 and the other two sub-signals are renormalized to their original relative weights (60/40) — identical behavior to today

---

## 6. Data & State Management

### Zustand Store: `usePantryStore`

Located at `src/features/pantry/store/usePantryStore.ts`

**State:**
```typescript
interface PantryState {
  items: PantryItem[];
  isLoading: boolean;
}
```

**Actions:**
```typescript
interface PantryActions {
  addItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;
  addItems: (items: Omit<PantryItem, 'id' | 'addedAt'>[]) => void;  // bulk add for shopping import
  updateItem: (id: string, patch: Partial<Pick<PantryItem, 'amount' | 'unit' | 'expiresAt'>>) => void;
  removeItem: (id: string) => void;
  deductIngredients: (deductions: Array<{ ingredientId: string; amount: number; unit: string }>) => void;
  getExpiringItems: (withinDays: number) => PantryItem[];
}
```

**Persistence:** localStorage via Zustand `persist` middleware (same pattern as existing stores)

**Merge behavior in `addItem` / `addItems`:** If an item with the same `ingredientId` already exists, sum the amounts. For expiry dates, keep the earlier date.

### PantryItem Type

Located at `src/features/pantry/types.ts` — follows the interface defined in `docs/architecture.md`:

```typescript
interface PantryItem {
  id: string;
  householdId: string;
  ingredientId: string;
  amount: number;
  unit: string;
  expiresAt: Date | null;
  addedAt: Date;
  addedByUserId: string;
}
```

### Cloud Sync

- Same fire-and-forget pattern as `syncPreferences()` and `syncMealPlan()` in `src/shared/lib/sync.ts`
- New function: `syncPantry(items: PantryItem[], householdId: string)`
- Upserts to `pantry_items` table, deletes items no longer in local state
- Triggered on every pantry mutation (add, update, remove, deduct)

---

## 7. File Structure

```
src/features/pantry/
├── screens/
│   └── PantryScreen.tsx           — Main Vorräte tab screen
├── components/
│   ├── PantryItemRow.tsx          — Single pantry item display
│   ├── StorageSection.tsx         — Collapsible section per storage type
│   ├── AddItemSheet.tsx           — Bottom sheet for adding items
│   ├── EditItemSheet.tsx          — Bottom sheet for editing items
│   ├── ShoppingImportSheet.tsx    — Post-shopping import flow
│   └── ConsumptionSheet.tsx       — Post-cooking deduction confirmation
├── store/
│   └── usePantryStore.ts         — Zustand store with persistence
└── types.ts                       — PantryItem type definition
```

**Modifications to existing files:**
- `src/navigation/MainTabNavigator.tsx` — add 5th tab
- `src/features/shopping-list/derive-shopping-list.ts` — add `pantryItems` parameter
- `src/features/shopping-list/screens/ShoppingListScreen.tsx` — expiry banner, "Einkauf abschließen" button, pantry coverage notes
- `src/features/meal-plan/algorithm/scoring.ts` — pantry utilization sub-signal
- `src/features/meal-plan/algorithm/plan-generator.ts` — pass pantry items to scoring
- `src/features/meal-plan/components/MealSlotCard.tsx` — "Gekocht" button
- `src/shared/lib/sync.ts` — add `syncPantry()` function
- `src/shared/i18n/de.ts` — new German strings
- `src/shared/i18n/en.ts` — new English strings
- `src/shared/i18n/t.ts` — new translation keys

---

## 8. i18n Strings (Key Examples)

| Key | DE | EN |
|-----|----|----|
| `pantry.tab` | Vorräte | Pantry |
| `pantry.empty.title` | Füge deine ersten Vorräte hinzu | Add your first pantry items |
| `pantry.empty.subtitle` | Deine Vorratskammer hilft dir, Lebensmittelverschwendung zu reduzieren | Your pantry helps reduce food waste |
| `pantry.add` | Vorrat hinzufügen | Add item |
| `pantry.search` | Zutat suchen… | Search ingredient… |
| `pantry.expiresIn` | Läuft ab in {days} Tagen | Expires in {days} days |
| `pantry.expired` | Abgelaufen | Expired |
| `pantry.import.title` | Einkauf in Vorräte übernehmen? | Import shopping to pantry? |
| `pantry.import.confirm` | In Vorräte übernehmen | Import to pantry |
| `pantry.consumption.title` | Verbrauch bestätigen | Confirm consumption |
| `pantry.consumption.confirm` | Verbrauch bestätigen | Confirm usage |
| `shopping.finishTrip` | Einkauf abschließen | Finish shopping trip |
| `shopping.expiryWarning` | Bald ablaufend | Expiring soon |
| `mealSlot.cooked` | Gekocht | Cooked |

---

## 9. Error Handling

- **Ingredient search returns no results:** Show "Keine Zutat gefunden" with option to search again
- **Amount validation:** Must be > 0, numeric only. Unit must be compatible with ingredient's default_unit
- **Sync failures:** Silent (fire-and-forget). Pantry works fully offline via localStorage
- **Deduction from empty pantry:** Skip silently, never go negative
- **Expiry date in the past on add:** Allow it (user may be logging existing items that are near expiry)

---

## 10. Testing Strategy

- **Unit tests for `deriveShoppingList()`** with pantry subtraction — extend existing test file
- **Unit tests for pantry store** — add, merge, deduct, remove, expiry queries
- **Unit tests for scoring** — pantry utilization sub-signal, expiry boost, fallback when no pantry
- **No regression:** All existing tests must pass unchanged when pantry parameter is omitted
