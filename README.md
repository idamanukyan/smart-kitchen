=====

# 🍳 Smart Kitchen

> Germany-specific meal planning that generates weekly plans, auto-creates categorized Einkaufslisten mapped to real German supermarket aisles, and reduces food waste through intelligent ingredient reuse.

[FILL: drop a screenshot or demo GIF here — even one screen is enough. Use Quicktime/built-in screen recorder, then GIF-convert online. Skip if you can't, but it materially improves recruiter perception.]

## The problem

German supermarkets organize aisles differently than other countries (and differently from each other — Edeka ≠ Rewe ≠ Aldi). Generic meal planning apps generate shopping lists in random order, so you walk back and forth across the store. They also don't track what you already have, leading to duplicate purchases and food waste.

## The solution

A meal planning app that:
- **Generates weekly plans** based on dietary preferences, household size, and time-to-cook
- **Maps each ingredient to its real aisle** in your local German supermarket chain
- **Reuses ingredients across meals** to minimize waste — if Monday's recipe uses half an onion, Wednesday's recipe gets the other half
- **Outputs a shopping list ordered by aisle**, so you walk the store once

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Language | TypeScript |
| Styling | Tailwind (NativeWind) |
| Backend / Auth | Supabase |
| Database | PostgreSQL (via Supabase) |

## What's interesting technically

- **Aisle mapping** — ingredient-to-aisle relationships are stored per-supermarket-chain, allowing the same recipe to produce different shopping list orderings depending on where the user shops
- **Ingredient reuse engine** — recipes share an ingredient pool across the week, with the planner solving for minimum waste before locking the plan
- **Localized to the German market** — units in metric, ingredient names in German, supermarket categories matching real Edeka/Rewe layouts

## Running locally

```bash
git clone https://github.com/idamanukyan/smart-kitchen.git
cd smart-kitchen
npm install
# Add your Supabase credentials to a .env file (see .env.example)
npx expo start
```

## Status

Active development. Built solo, around 60 commits in. Exploring expansion to Austrian and Swiss supermarket chains next.

=====
