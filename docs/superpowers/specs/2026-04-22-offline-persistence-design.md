# Phase 6: Offline Persistence with AsyncStorage

> Date: 2026-04-22
> Status: Approved

## Summary

Persist preferences, active meal plan, and shopping list check state using AsyncStorage via Zustand's built-in `persist` middleware. Data survives app restarts and browser refreshes. Works on web + native.

## What Gets Persisted

| Data | Store | Strategy |
|---|---|---|
| Preferences (household, diet, allergens, cooking time, store) | `usePreferencesStore` | Full state via persist middleware |
| `hasCompletedSetup` flag | `usePreferencesStore` | Part of preferences state |
| Language (`locale`) | `usePreferencesStore` | Merged from `useLanguageStore` into preferences |
| Active meal plan | `useMealPlanStore` | `activePlan` object persisted |
| Shopping list checked items | `useShoppingListStore` | `checkedItemIds: string[]` persisted; derived list recomputed from plan, then checked state reapplied |

## Architecture

### Zustand persist middleware

Each store wraps its creation with `persist()` from `zustand/middleware`:

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist<State>(
    (set, get) => ({ ... }),
    {
      name: 'store-key',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Language store merge

Currently `useLanguageStore` is a separate Zustand store with `locale` and `setLocale`. To avoid persisting two independent stores:

1. Add `locale: Locale` and `setLocale` to `usePreferencesStore`
2. Change `useLanguageStore` to read from / write to `usePreferencesStore`
3. `useTranslation()` continues to work unchanged (it reads from `useLanguageStore`)

### Shopping list check state

The `DerivedShoppingList` is not persisted — it's recomputed from the active plan. Only the checked item IDs are persisted.

On hydration:
1. `useMealPlanStore` loads the persisted `activePlan`
2. `useShoppingListStore` re-derives the shopping list from the plan
3. Checked IDs from persistence are reapplied to the derived items

The `useShoppingListStore` stores `checkedItemIds: string[]` (persisted) alongside `shoppingList: DerivedShoppingList | null` (not persisted — excluded via `partialize`).

### Hydration timing

AsyncStorage is async. Stores may render with default state before hydration completes. For this phase, this is acceptable — the UI may flash briefly on load. A loading screen can be added later.

## Files

### Modified
- `src/shared/store/usePreferencesStore.ts` — add persist middleware, add `locale`/`setLocale` fields
- `src/shared/i18n/useLanguage.ts` — delegate to `usePreferencesStore` instead of own state
- `src/features/meal-plan/store/useMealPlanStore.ts` — add persist middleware for `activePlan`
- `src/features/shopping-list/store/useShoppingListStore.ts` — add `checkedItemIds` with persist, reapply on hydration

### Dependencies
- Install `@react-native-async-storage/async-storage`

## Out of Scope

- Multi-device sync
- Schema migration / versioning
- Data expiration
- Loading screen during hydration
- Persisting the full derived shopping list (recomputed instead)
