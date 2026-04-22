# Phase 4: Mobile App Scaffold & Core Loop

> Date: 2026-04-22
> Status: Approved

## Summary

Set up the Expo React Native app with two functional screens — Wochenplan (meal plan) and Einkaufsliste (shopping list) — running entirely on local seed data. No backend, no auth, no persistence. The goal is a tappable app that demonstrates the core planning-to-shopping flow using the existing algorithm and derivation logic.

## Scope

### In Scope

- Expo managed workflow project setup in the existing repo
- React Navigation: bottom tab navigator with native stack
- Nativewind (Tailwind CSS for RN) styling setup
- Zustand state management (in-memory only)
- **Wochenplan screen**: vertical-scroll layout, day cards with meals side-by-side, "Neu generieren" button to regenerate the full plan using the existing `plan-generator.ts`
- **Einkaufsliste screen**: card-style items grouped by aisle with sticky section headers, checkbox toggle, progress summary bar, auto-derived from active meal plan via existing `deriveShoppingList()`
- Two placeholder tabs (Rezepte, Einstellungen) showing "Kommt bald"
- Hardcoded demo plan from seed recipes for instant content on launch
- German UI strings centralized in `de.ts`

### Out of Scope

- Auth / Supabase connection
- Onboarding flow
- SQLite / offline persistence
- Realtime sync / shared lists
- Haptic feedback
- Recipe detail screen (tapping a meal slot is a no-op)
- Pull-to-refresh gesture
- i18n library (strings are simple exports, not react-i18next)

## Tech Stack (Phase 4)

| Concern | Choice |
|---|---|
| Framework | Expo SDK (managed workflow) |
| Navigation | `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack` |
| Styling | Nativewind v4 + Tailwind CSS |
| State | Zustand |
| ID generation | `uuid` |
| Backend | None — local seed data only |

## Navigation Structure

```
RootNavigator (NativeStack)
  └── MainTabs (BottomTab)
        ├── Wochenplan       → MealPlanScreen
        ├── Einkaufsliste    → ShoppingListScreen
        ├── Rezepte          → PlaceholderScreen ("Kommt bald")
        └── Einstellungen    → PlaceholderScreen ("Kommt bald")
```

The app boots directly into MainTabs. No auth gate or onboarding in this phase.

## File Layout

```
app.tsx                              ← Expo entry point, wraps providers
src/
  app/
    RootNavigator.tsx                ← NativeStack with MainTabs as only screen
    MainTabNavigator.tsx             ← 4-tab bottom navigator
  features/
    meal-plan/
      screens/MealPlanScreen.tsx     ← Vertical scroll, day cards
      components/DayColumn.tsx       ← Single day card with meals side-by-side
      components/MealSlotCard.tsx    ← Individual meal slot (recipe name, time, type label)
      store/useMealPlanStore.ts      ← Zustand: active plan, regeneratePlan()
      algorithm/                     ← Existing files (plan-generator.ts, scoring.ts, types.ts)
    shopping-list/
      screens/ShoppingListScreen.tsx ← SectionList grouped by aisle
      components/AisleSection.tsx    ← Sticky aisle header with emoji + count
      components/ShoppingItemCard.tsx← Card-style item with checkbox, name, amount, package info
      store/useShoppingListStore.ts  ← Zustand: derived list, toggleItem()
      derive-shopping-list.ts        ← Existing
      types.ts                       ← Existing
  shared/
    components/PlaceholderScreen.tsx  ← "Kommt bald" screen for inactive tabs
    i18n/de.ts                       ← German UI string constants
  data/
    demo-plan.ts                     ← Hardcoded 7-day plan from seed recipes
    seed-ingredients.ts              ← Existing
    seed-recipes-batch1.ts           ← Existing
    seed-recipes-batch1a.ts          ← Existing
    seed-recipes-batch1b.ts          ← Existing
tailwind.config.ts                   ← Nativewind Tailwind config
nativewind-env.d.ts                  ← Nativewind TypeScript env
```

## Screen Designs

### Wochenplan (Meal Plan)

**Layout: Vertical scroll of day cards**

- Screen header: "Wochenplan" with week date range subtitle (e.g., "20.–26. April 2026")
- "Neu generieren" button at the top to regenerate the entire plan
- Each day is a rounded card showing the day name (e.g., "Montag, 20. Apr")
- Within each day card, meals are displayed side-by-side (2 columns: Mittagessen + Abendessen/Abendbrot)
- Each meal slot shows: meal type label (color-coded), recipe title, cooking time
- Meal type colors: Mittagessen = blue, Abendessen = purple, Abendbrot = amber, Frühstück = green
- No lock/swap controls in this phase — just display

### Einkaufsliste (Shopping List)

**Layout: Card-style items grouped by aisle**

- Summary bar at top: items checked count, estimated total price
- SectionList with sticky aisle headers
- Aisle headers: emoji + category name + checked/total count (e.g., "🍎 Obst & Gemüse (1/3)")
- Each item is a rounded card containing:
  - Checkbox (left)
  - Ingredient name (primary text)
  - Secondary line: amount + unit, package info, estimated price
- Checked items: strikethrough text, muted opacity, checkbox filled with accent color
- List auto-derives from the active meal plan whenever it changes

## Data Flow

```
App Launch
  → Load demo-plan.ts (hardcoded MealPlan with seed recipes)
  → useMealPlanStore initializes with demo plan
  → useShoppingListStore derives shopping list from plan

User taps "Neu generieren"
  → useMealPlanStore calls generatePlan() from plan-generator.ts
  → New plan replaces active plan in store
  → useShoppingListStore re-derives shopping list

User taps checkbox on shopping item
  → useShoppingListStore.toggleItem(id)
  → Item's is_checked flips, UI updates (strikethrough + muted)
  → Summary bar updates count

User switches to Rezepte or Einstellungen tab
  → PlaceholderScreen renders "Kommt bald" message
```

## Zustand Stores

### useMealPlanStore

```typescript
interface MealPlanState {
  activePlan: MealPlan | null;
  isGenerating: boolean;
  regeneratePlan: () => void;
}
```

- Initialized with the demo plan from `demo-plan.ts`
- `regeneratePlan()` runs the existing algorithm with seed recipes and default preferences
- `isGenerating` drives a loading indicator on the button

### useShoppingListStore

```typescript
interface ShoppingListState {
  shoppingList: DerivedShoppingList | null;
  deriveFromPlan: (plan: MealPlan, recipes: Recipe[], ingredients: Ingredient[]) => void;
  toggleItem: (itemId: string) => void;
}
```

- `deriveFromPlan()` calls the existing `deriveShoppingList()` pure function
- `toggleItem()` flips `is_checked` on the item and updates summary counts
- Re-derives automatically when the meal plan store's active plan changes

## German UI Strings

All user-facing text lives in `src/shared/i18n/de.ts` as named exports:

```typescript
export const DE = {
  tabs: {
    wochenplan: 'Wochenplan',
    einkaufsliste: 'Einkaufsliste',
    rezepte: 'Rezepte',
    einstellungen: 'Einstellungen',
  },
  mealPlan: {
    title: 'Wochenplan',
    regenerate: 'Neu generieren',
    generating: 'Wird erstellt...',
  },
  shoppingList: {
    title: 'Einkaufsliste',
    itemsDone: '{done} von {total} erledigt',
    estimatedTotal: '~{amount} €',
  },
  placeholder: {
    comingSoon: 'Kommt bald',
  },
  mealTypes: {
    Frühstück: 'Frühstück',
    Mittagessen: 'Mittagessen',
    Abendessen: 'Abendessen',
    Abendbrot: 'Abendbrot',
  },
} as const;
```
