# SmartKüche — Weekly Meal Planning & Shopping for Germany

## Vision

Germany-specific meal planning app that generates weekly plans, auto-creates categorized Einkaufslisten mapped to German supermarket aisles, and reduces food waste through intelligent ingredient reuse.

## Target Market

- **Country**: Germany only
- **Language**: German UI throughout
- **Retail context**: All ingredients, units, packaging sizes, and retailer structures reflect German supermarket reality (REWE, EDEKA, Lidl, Aldi, Kaufland)

## Tech Stack

| Layer              | Technology                                      |
|--------------------|------------------------------------------------|
| Mobile             | React Native with Expo (cross-platform iOS + Android) |
| Backend            | Supabase (PostgreSQL + Auth + Realtime for shared lists) |
| API layer          | Edge Functions (Deno/TypeScript) on Supabase    |
| State management   | Zustand                                         |
| Styling            | Nativewind (Tailwind for RN)                    |
| Language           | TypeScript everywhere                           |
| Hosting            | Supabase (EU region — Frankfurt)                |

## Core Domain Concepts

- **Recipe** — A cookable dish with ingredients, instructions, metadata
- **Ingredient** — A purchasable item with German name, aisle category, package sizes, prices
- **MealPlan** — A 7-day plan assigning recipes to meal slots
- **MealSlot** — A single meal within a plan (day + meal type + recipe)
- **ShoppingList** — Derived from a MealPlan, grouped by supermarket aisle
- **ShoppingItem** — A single item on the shopping list with amount, unit, display text
- **Pantry** — User's current ingredient inventory (Phase 2)
- **PantryItem** — A single item in the pantry with amount and expiry
- **UserPreferences** — Diet type, allergies, cooking time budget, budget mode
- **Household** — A group of users sharing plans and shopping lists

## Coding Conventions

- **Strict TypeScript**: No `any` types. Enable strict mode.
- **German strings**: All user-facing text in a centralized i18n file
- **Metric units**: All ingredient data uses g, kg, ml, l
- **Prices**: EUR cents as integers (e.g., 449 = €4,49)
- **File structure**: Feature-based folders under `src/` (e.g., `src/features/meal-plan/`, `src/features/shopping-list/`)

## Key Constraints

These apply across ALL development work:

1. **German recipes & ingredients** — Recipes are in German with German ingredients
2. **Metric units & German packaging** — 500g Hackfleisch, 250g Butter, 200ml Sahne, 1kg Mehl, 10er-Packung Eier, etc.
3. **Einkaufsliste maps to aisles** — Shopping list categories correspond to German supermarket aisle organization
4. **Abendbrot is first-class** — Cold dinner (Abendbrot) is a distinct meal type, not an afterthought
5. **Free tier includes core features** — Planning + shopping list generation must work without payment
6. **GDPR-first (DSGVO)** — Minimize data collection, EU hosting only, no third-party tracking without consent
