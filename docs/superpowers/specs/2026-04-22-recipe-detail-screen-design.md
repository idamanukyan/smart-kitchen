# Recipe Detail Screen

> Date: 2026-04-22
> Status: Approved

## Summary

Tapping a meal slot card on the Wochenplan pushes a full-screen recipe detail view showing title, description, meta info, ingredients list, and step-by-step instructions.

## Navigation

- `MealSlotCard` becomes tappable (wrapped in `Pressable`)
- Tapping navigates to `RecipeDetailScreen` via React Navigation's native stack
- Route param: `{ recipeId: string }`
- Back button (native stack header or manual) returns to Wochenplan
- Slots with no recipe (`recipe_id === null`) are not tappable

## Screen Layout

Top to bottom, scrollable:

1. **Title** — Recipe `title_de`, large bold text (`#3d3529`)
2. **Description** — Recipe `description_de`, muted text, 2-3 lines
3. **Meta row** — Horizontal row of pill/chip elements:
   - Total time (prep + cook): e.g. "50 Min" / "50 min"
   - Difficulty: "einfach" / "easy", "mittel" / "medium", "anspruchsvoll" / "advanced"
   - Cost rating: "günstig" / "budget", "mittel" / "moderate", "gehoben" / "premium"
   - Pill styling: `#faf8f5` background, `#e8e0d8` border, rounded
4. **Ingredients section** — "Zutaten" / "Ingredients" header, list of rows:
   - Each row: `{amount} {unit} {ingredient_name}` with optional `preparation_note` in muted italic
   - White card background, warm border
   - Shows servings count above list: "Für 4 Portionen" / "Serves 4"
5. **Instructions section** — "Zubereitung" / "Instructions" header, numbered steps:
   - Each step: step number in accent circle + instruction text
   - White card background

## Styling — Warm & Cozy

- Screen background: `#faf8f5`
- Cards (ingredients, instructions): `#ffffff`, borderRadius 16, shadow, border `#e8e0d8`
- Section headers: `#c07a45` (accent), uppercase, letter-spacing
- Meta pills: `#faf8f5` bg, `#e8e0d8` border, `#3d3529` text, borderRadius 20
- Step numbers: `#c07a45` background, white text, 24x24 circle
- Ingredient amounts: `#3d3529`, ingredient names: `#3d3529`, prep notes: `#a09080` italic

## i18n Strings

Added to `de.ts` and `en.ts` under a `recipe` key:

```typescript
recipe: {
  ingredients: 'Zutaten',        // 'Ingredients'
  instructions: 'Zubereitung',   // 'Instructions'
  servings: (n: number) => `Für ${n} Portionen`,  // `Serves ${n}`
  difficulty: {
    einfach: 'Einfach',          // 'Easy'
    mittel: 'Mittel',            // 'Medium'
    anspruchsvoll: 'Anspruchsvoll', // 'Advanced'
  },
  costRating: {
    günstig: 'Günstig',          // 'Budget'
    mittel: 'Mittel',            // 'Moderate'
    gehoben: 'Gehoben',         // 'Premium'
  },
}
```

## Files

### New
- `src/features/recipes/screens/RecipeDetailScreen.tsx`

### Modified
- `src/shared/i18n/de.ts` — add `recipe` section
- `src/shared/i18n/en.ts` — add `recipe` section
- `src/navigation/RootNavigator.tsx` — add RecipeDetailScreen to native stack
- `src/features/meal-plan/components/MealSlotCard.tsx` — wrap in Pressable, navigate on tap
- `src/features/shopping-list/types.ts` — add `instructions_de`, `difficulty`, `cost_rating` fields to `Recipe` interface
- `src/data/demo-data.ts` — include `instructions_de`, `difficulty`, `cost_rating` in recipe transform

## Out of Scope

- Recipe images
- Favoriting
- Editing/scaling servings
- Sharing
- Recipe search/browse (Rezepte tab stays placeholder)
