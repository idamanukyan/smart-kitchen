# 🍳 Smart Kitchen

> Germany-specific meal planning that generates weekly plans, auto-creates categorized Einkaufslisten mapped to real German supermarket aisles, and reduces food waste through intelligent ingredient reuse.

## The problem

German supermarkets organize aisles differently than other countries — and differently from each other. Edeka, Rewe, Aldi, and Lidl each have their own layouts. Generic meal planning apps generate shopping lists in random order, so you walk back and forth across the store. They also don't track what you already have, leading to duplicate purchases and food waste.

## The solution

A meal planning app that:

- **Generates weekly plans** based on dietary preferences, household size, and time-to-cook
- **Maps each ingredient to its real aisle** in your local supermarket chain
- **Reuses ingredients across meals** — if Monday's recipe uses half an onion, Wednesday's recipe gets the other half
- **Outputs a shopping list ordered by aisle**, so you walk the store once

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Language | TypeScript |
| Styling | Tailwind via NativeWind |
| Backend / Auth | Supabase |
| Database | PostgreSQL (managed via Supabase) |

## What's interesting technically

- **Aisle mapping** — ingredient-to-aisle relationships are stored per-supermarket-chain, so the same recipe produces different shopping list orderings depending on where the user shops.
- **Ingredient reuse engine** — recipes share an ingredient pool across the week, with the planner solving for minimum waste before locking the plan.
- **Localized to the German market** — units in metric, ingredient names in German, supermarket categories matching real Edeka/Rewe layouts.

## Running locally

```bash
git clone https://github.com/idamanukyan/smart-kitchen.git
cd smart-kitchen
npm install

# Add your Supabase credentials to a .env file:
#   EXPO_PUBLIC_SUPABASE_URL=...
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...

npx expo start
```

## Status

Active development. Built solo. Exploring expansion to Austrian and Swiss supermarket chains next.

## License

MIT
