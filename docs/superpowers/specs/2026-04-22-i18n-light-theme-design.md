# i18n (DE/EN) + Light Theme Refresh

> Date: 2026-04-22
> Status: Approved

## Summary

Add English translations with a manual language toggle, and replace the dark theme with a clean minimal light theme (white backgrounds, subtle borders, no shadows).

## i18n

### Architecture

- `src/shared/i18n/en.ts` — English strings, same structure as `de.ts`
- `src/shared/i18n/useLanguage.ts` — Zustand store: `{ locale: 'de' | 'en', setLocale: (l) => void }`
- `src/shared/i18n/t.ts` — `useTranslation()` hook returning the right string object for the current locale
- Default locale: `'de'`
- No persistence (resets on reload) — persistence deferred to when Supabase/SQLite is added

### Migration

All components switch from:
```typescript
import { DE } from '../shared/i18n/de';
// DE.mealPlan.title
```
To:
```typescript
import { useTranslation } from '../shared/i18n/t';
const t = useTranslation();
// t.mealPlan.title
```

### Settings Screen

The Einstellungen placeholder is replaced with a real `SettingsScreen` containing:
- Header: "Einstellungen" / "Settings" (localized)
- Language row: label + pill toggle with DE | EN buttons
- Active button gets accent color background, inactive is light gray

Rezepte tab stays as placeholder.

### String Coverage

Both `de.ts` and `en.ts` cover:
- Tab labels
- Meal plan screen (title, week range, regenerate button)
- Shopping list screen (title, summary, empty state)
- Meal type names (Frühstück, Mittagessen, Abendessen, Abendbrot)
- Day names (full and short)
- Settings screen labels
- Placeholder text

Recipe content (titles, descriptions, ingredients) stays in German — not translated.

## Light Theme

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#ffffff` | Page backgrounds |
| `surface` | `#f5f5f5` | Cards, sections |
| `border` | `#e5e5e5` | Card borders, dividers |
| `text` | `#1a1a1a` | Primary text |
| `muted` | `#888888` | Secondary text |
| `accent` | `#2563eb` | Buttons, active states, links |
| `meal-mittag` | `#2563eb` | Mittagessen label |
| `meal-abend` | `#7c3aed` | Abendessen label |
| `meal-abendbrot` | `#d97706` | Abendbrot label |
| `meal-frueh` | `#059669` | Frühstück label |

### Card Style

- Background: `surface` (`#f5f5f5`)
- Border: 1px `border` (`#e5e5e5`)
- Border radius: 12px (generous)
- No shadows
- Generous padding

### Tab Bar

- Background: white
- Top border: 1px `#e5e5e5`
- Active tab: accent blue
- Inactive tab: muted gray

### Meal Slot Cards

- Background: white
- Border: 1px `#e5e5e5`
- Meal type label in the meal-type color
- Recipe title in primary text color
- Time in muted

### Shopping List Items

- Card background: `surface`
- Border: 1px `#e5e5e5`
- Checkbox: accent blue fill when checked, `#d4d4d4` border when unchecked
- Checked items: strikethrough, muted text
- Aisle headers: uppercase muted text, no emoji

### Regenerate Button

- Background: accent blue
- Text: white
- Border radius: 8px

## Files

### New
- `src/shared/i18n/en.ts`
- `src/shared/i18n/useLanguage.ts`
- `src/shared/i18n/t.ts`
- `src/features/settings/screens/SettingsScreen.tsx`

### Modified
- `src/shared/i18n/de.ts` — add settings strings
- `tailwind.config.ts` — light color palette
- `src/navigation/MainTabNavigator.tsx` — light tab bar, wire SettingsScreen
- `src/navigation/RootNavigator.tsx` — no changes expected
- `src/shared/components/PlaceholderScreen.tsx` — light colors
- `src/features/meal-plan/screens/MealPlanScreen.tsx` — light styles, use `t()`
- `src/features/meal-plan/components/DayColumn.tsx` — light styles, use `t()`
- `src/features/meal-plan/components/MealSlotCard.tsx` — light styles, use `t()`
- `src/features/shopping-list/screens/ShoppingListScreen.tsx` — light styles, use `t()`
- `src/features/shopping-list/components/ShoppingItemCard.tsx` — light styles
- `src/features/shopping-list/components/AisleSection.tsx` — light styles, remove emoji

## Out of Scope

- Persisting language choice across sessions
- RTL support
- Translating recipe content (titles, descriptions, ingredients stay German)
- Additional languages beyond DE/EN
