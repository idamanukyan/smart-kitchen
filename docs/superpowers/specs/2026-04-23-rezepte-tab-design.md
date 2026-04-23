# Rezepte Tab: Browse, Search & Filter

> Date: 2026-04-23
> Status: Approved

## Summary

Replace the Rezepte placeholder tab with a full recipe browse screen featuring text search, filter pills (meal type, diet, cooking time), and a scrollable list of recipe cards that navigate to the existing RecipeDetailScreen.

## Screen Layout

Top to bottom, scrollable:

1. **Header** — "Rezepte" / "Recipes" (localized)
2. **Search bar** — TextInput with placeholder "Rezept suchen..." / "Search recipes...". Filters by substring match on `title_de` (case-insensitive). Cream background, warm border, rounded.
3. **Filter pills** — Horizontal ScrollView with toggleable pills:
   - **Meal type** (multi-select OR): Mittagessen, Abendessen, Abendbrot, Frühstück
   - **Diet** (multi-select OR): Vegetarisch, Vegan
   - **Cooking time** (single-select): ≤20 Min, ≤30 Min, ≤45 Min
4. **Recipe list** — FlatList of `RecipeListCard` components
5. **Empty state** — "Keine Rezepte gefunden" / "No recipes found" when no recipes match

## Filter Logic

- Filters are AND-combined across categories: (meal type) AND (diet) AND (time) AND (search text)
- Within meal type: OR (selecting Mittagessen + Abendbrot shows recipes tagged with either)
- Within diet: OR (selecting Vegetarisch + Vegan shows recipes tagged with either)
- Cooking time: single select, filters recipes where `prep_time_minutes + cook_time_minutes <= selected`
- No filters active = show all recipes
- Text search: case-insensitive substring match on `title_de`
- Filter state is component-local (`useState`), not persisted

## RecipeListCard

Each card shows:
- **Title** — `title_de`, bold, `#3d3529`
- **Meal type pills** — small colored pills using meal-type colors (Mittagessen terracotta, Abendessen purple, etc.)
- **Meta line** — total time + difficulty + cost rating, muted text, separated by ` · `

Card styling: white background, `#e8e0d8` border, 16px radius, subtle shadow (matching DayColumn/ShoppingItemCard pattern).

Tap → navigates to `RecipeDetailScreen` with `{ recipeId: recipe.id }`.

## i18n Strings

Added under `recipes` key:

```
recipes: {
  title: 'Rezepte' / 'Recipes'
  searchPlaceholder: 'Rezept suchen...' / 'Search recipes...'
  noResults: 'Keine Rezepte gefunden' / 'No recipes found'
  allMealTypes: 'Alle' / 'All'
}
```

Filter labels reuse existing strings: `t.mealTypes`, `t.dietTypes`, `t.preferences.minutes`.

## Navigation

Tap on `RecipeListCard` calls `navigation.navigate('RecipeDetail', { recipeId })` using the existing root stack route. Same navigation pattern as `MealSlotCard`.

## Files

### New
- `src/features/recipes/screens/RecipesScreen.tsx` — main screen with search, filters, list
- `src/features/recipes/components/RecipeListCard.tsx` — individual recipe card
- `src/features/recipes/components/RecipeFilters.tsx` — search bar + filter pills

### Modified
- `src/shared/i18n/de.ts` — add `recipes` section to Strings interface and DE object
- `src/shared/i18n/en.ts` — add `recipes` section to EN object
- `src/navigation/MainTabNavigator.tsx` — import RecipesScreen, replace RezeptePlaceholder

## Out of Scope

- Favoriting recipes
- Sorting options (alphabetical, time, cost)
- Pagination or virtualized loading
- Recipe images
- Adding recipes to a meal plan from this screen
