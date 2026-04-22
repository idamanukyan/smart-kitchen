# Phase 5: Preferences + Real Plan Generation

> Date: 2026-04-22
> Status: Approved

## Summary

Expand the Settings screen with 5 dietary/household preference sections, add a first-launch setup gate, and wire the real meal plan generation algorithm so "Neu generieren" produces personalized plans based on user preferences.

## Preferences Store

Zustand store `usePreferencesStore` with:

```typescript
interface PreferencesState {
  hasCompletedSetup: boolean;
  householdSize: number;           // 1-8, default 2
  dietType: DietType;              // default 'omnivor'
  allergens: AllergenKey[];        // default []
  maxCookingTimeMinutes: number | null;  // null = unbegrenzt, default 45
  preferredStore: PreferredStore;  // default 'REWE'
  setHouseholdSize: (n: number) => void;
  setDietType: (d: DietType) => void;
  toggleAllergen: (a: AllergenKey) => void;
  setMaxCookingTime: (m: number | null) => void;
  setPreferredStore: (s: PreferredStore) => void;
  completeSetup: () => void;
}
```

Types reused from `src/features/meal-plan/algorithm/types.ts`: `DietType`, `AllergenKey`, `PreferredStore`.

No persistence — state resets on app reload. `hasCompletedSetup` defaults to `false`.

## Settings Screen

The existing `SettingsScreen` is expanded. Below the language toggle, add 5 sections in a ScrollView:

1. **Haushaltsgröße** — Label + stepper (minus/plus buttons with count display)
2. **Ernährungsweise** — Single-select horizontal pill row
3. **Unverträglichkeiten** — Multi-select horizontal pill row (wrapping)
4. **Kochzeit pro Tag** — Single-select horizontal pill row with options: 20, 30, 45, 60, null (Unbegrenzt)
5. **Bevorzugter Supermarkt** — Single-select horizontal pill row

Each section uses a shared `PreferenceSection` component for consistent styling.

Pill styling: Warm & Cozy palette — active pill `#c07a45` bg with white text, inactive pill `#faf8f5` bg with `#e8e0d8` border.

## First-Launch Setup Gate

`RootNavigator` checks `usePreferencesStore.hasCompletedSetup`:
- If `false`: shows a `SetupScreen` that renders the same preference content as Settings, with a large "Fertig" / "Done" button at the bottom. Tapping it calls `completeSetup()` and navigates to MainTabs.
- If `true`: shows MainTabs directly.

`SetupScreen` is a separate screen on the root stack, not a modal. It reuses the preference sections from Settings but adds a header ("Willkommen" / "Welcome") and the finish button.

## Algorithm Bridge

`src/data/algorithm-bridge.ts` transforms data between the two type systems:

- Shopping-list `Recipe` (snake_case, flat `ingredient_id` refs) → Algorithm `Recipe` (camelCase, nested `ingredient: Ingredient` objects)
- Shopping-list `Ingredient` → Algorithm `Ingredient`
- Preferences store state → Algorithm `UserPreferences` and `Household`

This is a pure transformation layer — no logic, just mapping field names and nesting.

## Real Plan Generation

`useMealPlanStore.regeneratePlan()` is updated:

1. Read preferences from `usePreferencesStore`
2. Transform `DEMO_RECIPES` and `DEMO_INGREDIENTS` via the algorithm bridge
3. Build `PlanGenerationInput` with preferences, household, recipe pool, empty locked slots
4. Call `generatePlan()` from `plan-generator.ts`
5. Transform the result back to shopping-list `MealPlan` type
6. Set as `activePlan`

The shopping list store auto-derives from the new plan via its existing subscription.

## i18n Strings

Added under `preferences` key in both `de.ts` and `en.ts`:

```typescript
preferences: {
  householdSize: 'Haushaltsgröße',           // 'Household size'
  dietType: 'Ernährungsweise',                // 'Diet'
  allergens: 'Unverträglichkeiten',           // 'Allergies'
  cookingTime: 'Kochzeit pro Tag',            // 'Cooking time per day'
  store: 'Bevorzugter Supermarkt',            // 'Preferred store'
  unlimited: 'Unbegrenzt',                    // 'Unlimited'
  minutes: (n: number) => `≤${n} Min`,        // `≤${n} min`
  person: (n: number) => n === 1 ? '1 Person' : `${n} Personen`,  // persons
},
setup: {
  welcome: 'Willkommen bei SmartKüche',       // 'Welcome to SmartKüche'
  subtitle: 'Richte deine Präferenzen ein',   // 'Set up your preferences'
  done: 'Fertig',                              // 'Done'
},
```

Diet type labels, allergen labels, and store names use the `mealTypes`-style Record<string, string> pattern for easy lookup.

## Files

### New
- `src/shared/store/usePreferencesStore.ts`
- `src/features/settings/components/PreferenceSection.tsx`
- `src/features/settings/screens/SetupScreen.tsx`
- `src/data/algorithm-bridge.ts`

### Modified
- `src/shared/i18n/de.ts` — add `preferences` and `setup` strings
- `src/shared/i18n/en.ts` — add `preferences` and `setup` strings
- `src/features/settings/screens/SettingsScreen.tsx` — add preference sections in ScrollView
- `src/navigation/RootNavigator.tsx` — add setup gate + SetupScreen
- `src/features/meal-plan/store/useMealPlanStore.ts` — use real generatePlan()

## Out of Scope

- Budget mode / Sparwoche
- Pantry integration
- Store-specific aisle sorting
- Persistence (resets on reload)
- Onboarding animations or progress indicator
