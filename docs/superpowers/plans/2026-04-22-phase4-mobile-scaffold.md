# Phase 4: Mobile App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Expo React Native app with functional Wochenplan and Einkaufsliste screens running on local seed data.

**Architecture:** Expo managed workflow app with React Navigation (bottom tabs + native stack), Nativewind styling, and Zustand state management. Two working screens (meal plan + shopping list) consume the existing plan-generator and derive-shopping-list algorithms. Two placeholder tabs round out the tab bar. All data is in-memory from hardcoded seed data — no backend.

**Tech Stack:** Expo SDK, React Navigation, Nativewind v4, Zustand, TypeScript strict mode

---

## File Structure

```
New files to create:
  app.tsx                                         ← Expo entry point
  babel.config.js                                 ← Babel config for Nativewind
  tailwind.config.ts                              ← Tailwind config for Nativewind
  nativewind-env.d.ts                             ← Nativewind TypeScript declarations
  global.css                                      ← Tailwind CSS directives
  metro.config.js                                 ← Metro config for CSS support
  src/app/RootNavigator.tsx                       ← Stack navigator wrapping tabs
  src/app/MainTabNavigator.tsx                    ← 4-tab bottom navigator
  src/shared/components/PlaceholderScreen.tsx     ← "Kommt bald" placeholder
  src/shared/i18n/de.ts                           ← German UI string constants
  src/data/demo-data.ts                           ← Transforms seed data into app types
  src/data/demo-plan.ts                           ← Hardcoded 7-day plan from seed recipes
  src/features/meal-plan/store/useMealPlanStore.ts
  src/features/meal-plan/screens/MealPlanScreen.tsx
  src/features/meal-plan/components/DayColumn.tsx
  src/features/meal-plan/components/MealSlotCard.tsx
  src/features/shopping-list/store/useShoppingListStore.ts
  src/features/shopping-list/screens/ShoppingListScreen.tsx
  src/features/shopping-list/components/AisleSection.tsx
  src/features/shopping-list/components/ShoppingItemCard.tsx

Existing files (read-only — NOT modified):
  src/features/meal-plan/algorithm/types.ts
  src/features/meal-plan/algorithm/plan-generator.ts
  src/features/meal-plan/algorithm/scoring.ts
  src/features/shopping-list/types.ts
  src/features/shopping-list/derive-shopping-list.ts
  data/seed-ingredients.ts
  data/seed-recipes-batch1.ts
  data/seed-recipes-batch1a.ts
  data/seed-recipes-batch1b.ts
```

## Important: Type System Bridge

The codebase has two distinct type systems that the demo data layer must bridge:

1. **Plan generator types** (`src/features/meal-plan/algorithm/types.ts`): camelCase properties, nested `ingredient: Ingredient` objects within `RecipeIngredient`.
2. **Shopping list types** (`src/features/shopping-list/types.ts`): snake_case properties, flat `ingredient_id` references in `RecipeIngredient`, separate `Ingredient` catalogue.
3. **Seed data** (`data/seed-*.ts`): flat `RecipeData` / `Ingredient` types with `ingredient_name_de` string references (not IDs).

The `demo-data.ts` file transforms raw seed data into both formats. The Zustand stores use the shopping-list types (snake_case) for UI rendering, and the plan generator types (camelCase) are only needed when calling `generatePlan()`.

---

### Task 1: Expo Project Scaffolding

**Files:**
- Create: `package.json` (via `npx create-expo-app`)
- Create: `app.tsx`
- Create: `babel.config.js`
- Create: `tailwind.config.ts`
- Create: `nativewind-env.d.ts`
- Create: `global.css`
- Create: `metro.config.js`
- Modify: `tsconfig.json`

- [ ] **Step 1: Initialize Expo project**

Run from `/Users/ida/Desktop/projects/smart-kitchen`:

```bash
npx create-expo-app@latest . --template blank-typescript --yes
```

This creates `package.json`, `tsconfig.json`, `app.json`, and `App.tsx` in the project root.

- [ ] **Step 2: Install dependencies**

```bash
npx expo install react-native-screens react-native-safe-area-context @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-gesture-handler
npm install zustand nativewind@^4 tailwindcss @expo/metro-config
npm install --save-dev @types/react @types/react-native
```

- [ ] **Step 3: Create Tailwind config**

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: '#16213e',
        background: '#1a1a2e',
        accent: '#7aa2f7',
        'meal-mittag': '#7aa2f7',
        'meal-abend': '#bb86fc',
        'meal-abendbrot': '#f7c97a',
        'meal-frueh': '#73daca',
        muted: '#888888',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create global.css**

Create `global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create metro.config.js**

Create `metro.config.js`:

```javascript
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 6: Create babel.config.js**

Create `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 7: Create nativewind-env.d.ts**

Create `nativewind-env.d.ts`:

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 8: Update tsconfig.json**

Ensure `tsconfig.json` has strict mode and path aliases. The exact content depends on what `create-expo-app` generates, but ensure these are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@data/*": ["./data/*"]
    }
  }
}
```

- [ ] **Step 9: Create app.tsx entry point**

Rename the generated `App.tsx` to `app.tsx` (lowercase) and replace its content:

```typescript
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/app/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 10: Verify the app starts**

```bash
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator. The app should show a blank screen (RootNavigator doesn't exist yet — that's expected). Verify no crash on launch.

If RootNavigator import fails, that's fine — just verify Expo boots. Press `Ctrl+C` to stop.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Phase 4 Task 1: Expo project scaffolding with Nativewind and React Navigation"
```

---

### Task 2: Navigation Shell & Placeholder Screen

**Files:**
- Create: `src/shared/components/PlaceholderScreen.tsx`
- Create: `src/shared/i18n/de.ts`
- Create: `src/app/RootNavigator.tsx`
- Create: `src/app/MainTabNavigator.tsx`

- [ ] **Step 1: Create German UI strings**

Create `src/shared/i18n/de.ts`:

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
    weekPrefix: 'Woche vom',
  },
  shoppingList: {
    title: 'Einkaufsliste',
    itemsDone: (done: number, total: number) => `${done} von ${total} erledigt`,
    estimatedTotal: (euros: string) => `~${euros} €`,
  },
  placeholder: {
    comingSoon: 'Kommt bald',
    comingSoonSubtitle: 'Dieses Feature wird in einem späteren Update verfügbar sein.',
  },
  mealTypes: {
    Frühstück: 'Frühstück',
    Mittagessen: 'Mittagessen',
    Abendessen: 'Abendessen',
    Abendbrot: 'Abendbrot',
  },
  days: [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
    'Sonntag',
  ] as const,
  daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const,
} as const;
```

- [ ] **Step 2: Create PlaceholderScreen**

Create `src/shared/components/PlaceholderScreen.tsx`:

```tsx
import { View, Text } from 'react-native';
import { DE } from '../i18n/de';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="text-2xl font-bold text-white mb-2">{title}</Text>
      <Text className="text-base text-muted text-center">
        {DE.placeholder.comingSoonSubtitle}
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Create MainTabNavigator**

Create `src/app/MainTabNavigator.tsx`:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DE } from '../shared/i18n/de';
import { PlaceholderScreen } from '../shared/components/PlaceholderScreen';

const Tab = createBottomTabNavigator();

function WochenplanPlaceholder() {
  return <PlaceholderScreen title={DE.tabs.wochenplan} />;
}

function EinkaufslistePlaceholder() {
  return <PlaceholderScreen title={DE.tabs.einkaufsliste} />;
}

function RezeptePlaceholder() {
  return <PlaceholderScreen title={DE.tabs.rezepte} />;
}

function EinstellungenPlaceholder() {
  return <PlaceholderScreen title={DE.tabs.einstellungen} />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f23',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#7aa2f7',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Wochenplan"
        component={WochenplanPlaceholder}
        options={{
          tabBarLabel: DE.tabs.wochenplan,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einkaufsliste"
        component={EinkaufslistePlaceholder}
        options={{
          tabBarLabel: DE.tabs.einkaufsliste,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🛒</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Rezepte"
        component={RezeptePlaceholder}
        options={{
          tabBarLabel: DE.tabs.rezepte,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Einstellungen"
        component={EinstellungenPlaceholder}
        options={{
          tabBarLabel: DE.tabs.einstellungen,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 4: Create RootNavigator**

Create `src/app/RootNavigator.tsx`:

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 5: Verify navigation works**

```bash
npx expo start
```

Verify: app launches, 4 tabs visible at bottom (Wochenplan, Einkaufsliste, Rezepte, Einstellungen). Each tab shows "Kommt bald" placeholder. Tab switching works. Dark background with blue accent colors.

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/shared/
git commit -m "Phase 4 Task 2: Navigation shell with 4 tabs and placeholder screens"
```

---

### Task 3: Demo Data Layer

**Files:**
- Create: `src/data/demo-data.ts`
- Create: `src/data/demo-plan.ts`

This is the critical bridging layer. The seed data uses flat types (`RecipeData` with `ingredient_name_de` strings). The shopping list derivation expects `Recipe` with `RecipeIngredient[]` containing `ingredient_id` references, plus a separate `Ingredient[]` catalogue. This task creates the transformation.

- [ ] **Step 1: Create demo-data.ts — seed data transformer**

Create `src/data/demo-data.ts`:

```typescript
import { SEED_INGREDIENTS } from '../../data/seed-ingredients';
import { SEED_RECIPES } from '../../data/seed-recipes-batch1';
import type {
  Ingredient,
  Recipe,
  RecipeIngredient,
  Unit,
  AisleCategory,
} from '../features/shopping-list/types';

// Transform seed ingredients into the shopping-list Ingredient type.
// Each ingredient gets a stable ID derived from its name.
function makeIngredientId(name: string): string {
  return `ing-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-äöüß]/g, '')}`;
}

function transformIngredient(raw: typeof SEED_INGREDIENTS[number]): Ingredient {
  const id = makeIngredientId(raw.name_de);

  // Transform package sizes from array of {size, unit, price_cents} to
  // the Record<string, number[]> format the shopping-list types expect.
  // Seed data doesn't have per-store sizes, so we assign all to 'REWE'.
  const packageSizeValues = raw.common_package_sizes.map(ps => ps.size);
  const priceLookup: Record<number, number> = {};
  for (const ps of raw.common_package_sizes) {
    priceLookup[ps.size] = ps.price_cents;
  }

  return {
    id,
    name_de: raw.name_de,
    category: raw.category as AisleCategory,
    default_unit: raw.default_unit as Unit,
    common_package_sizes: packageSizeValues.length > 0 ? { REWE: packageSizeValues } : {},
    price_per_package_cents: Object.keys(priceLookup).length > 0
      ? { REWE: priceLookup }
      : undefined,
    shelf_life_days: raw.shelf_life_days,
    storage_type: raw.storage_type,
  };
}

// Build the ingredient catalogue — transformed once at import time.
export const DEMO_INGREDIENTS: Ingredient[] = SEED_INGREDIENTS.map(transformIngredient);

// Lookup map: ingredient name (lowercase) → Ingredient
const ingredientByName = new Map<string, Ingredient>(
  DEMO_INGREDIENTS.map(i => [i.name_de.toLowerCase(), i])
);

// Helper: find ingredient by German name (case-insensitive)
function findIngredient(nameDe: string): Ingredient | undefined {
  return ingredientByName.get(nameDe.toLowerCase());
}

function makeRecipeId(title: string, index: number): string {
  return `rec-${index}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-äöüß]/g, '')}`;
}

function transformRecipe(raw: typeof SEED_RECIPES[number], index: number): Recipe {
  const id = makeRecipeId(raw.title_de, index);

  const ingredients: RecipeIngredient[] = raw.ingredients
    .map((ri, riIndex) => {
      const ingredient = findIngredient(ri.ingredient_name_de);
      if (!ingredient) {
        // Skip ingredients not in our catalogue — this can happen for
        // spices/garnishes that weren't included in seed-ingredients.
        return null;
      }
      return {
        id: `${id}-ri-${riIndex}`,
        recipe_id: id,
        ingredient_id: ingredient.id,
        amount: ri.amount,
        unit: ri.unit as Unit,
        preparation_note: ri.preparation_note,
      };
    })
    .filter((ri): ri is RecipeIngredient => ri !== null);

  return {
    id,
    title_de: raw.title_de,
    description_de: raw.description_de,
    servings_default: raw.servings_default,
    prep_time_minutes: raw.prep_time_minutes,
    cook_time_minutes: raw.cook_time_minutes,
    diet_tags: raw.diet_tags,
    meal_type: raw.meal_type.filter(
      (mt): mt is Recipe['meal_type'][number] =>
        mt === 'Frühstück' || mt === 'Mittagessen' || mt === 'Abendessen' || mt === 'Abendbrot'
    ),
    cost_estimate_cents_per_serving: raw.cost_estimate_cents_per_serving,
    image_url: raw.image_url ?? undefined,
    ingredients,
  };
}

// Build the recipe catalogue.
export const DEMO_RECIPES: Recipe[] = SEED_RECIPES.map(transformRecipe);

// Quick lookup: recipe ID → Recipe
export const RECIPE_BY_ID = new Map<string, Recipe>(
  DEMO_RECIPES.map(r => [r.id, r])
);
```

- [ ] **Step 2: Create demo-plan.ts — hardcoded 7-day plan**

Create `src/data/demo-plan.ts`:

```typescript
import type { MealPlan, MealSlot, MealType } from '../features/shopping-list/types';
import { DEMO_RECIPES } from './demo-data';

// Pick recipes by meal type for the demo plan.
function recipesByMealType(mealType: MealType) {
  return DEMO_RECIPES.filter(r => r.meal_type.includes(mealType));
}

function buildDemoPlan(): MealPlan {
  const mittagRecipes = recipesByMealType('Mittagessen');
  const abendRecipes = recipesByMealType('Abendessen');
  const abendbrotRecipes = recipesByMealType('Abendbrot');

  const slots: MealSlot[] = [];
  let slotIndex = 0;

  // Abendbrot on Wednesday (2) and Friday (4), Abendessen on other days.
  const abendbrotDays = new Set([2, 4]);

  for (let day = 0; day <= 6; day++) {
    // Mittagessen
    const mittagRecipe = mittagRecipes[day % mittagRecipes.length];
    if (mittagRecipe) {
      slots.push({
        id: `demo-slot-${slotIndex++}`,
        meal_plan_id: 'demo-plan-1',
        day_of_week: day as MealSlot['day_of_week'],
        meal_type: 'Mittagessen',
        recipe_id: mittagRecipe.id,
        is_locked: false,
        servings_override: null,
      });
    }

    // Evening meal
    if (abendbrotDays.has(day)) {
      const recipe = abendbrotRecipes[(day === 2 ? 0 : 1) % Math.max(abendbrotRecipes.length, 1)];
      if (recipe) {
        slots.push({
          id: `demo-slot-${slotIndex++}`,
          meal_plan_id: 'demo-plan-1',
          day_of_week: day as MealSlot['day_of_week'],
          meal_type: 'Abendbrot',
          recipe_id: recipe.id,
          is_locked: false,
          servings_override: null,
        });
      }
    } else {
      const recipe = abendRecipes[day % Math.max(abendRecipes.length, 1)];
      if (recipe) {
        slots.push({
          id: `demo-slot-${slotIndex++}`,
          meal_plan_id: 'demo-plan-1',
          day_of_week: day as MealSlot['day_of_week'],
          meal_type: 'Abendessen',
          recipe_id: recipe.id,
          is_locked: false,
          servings_override: null,
        });
      }
    }
  }

  // Calculate week start date (next Monday from today)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  const weekStart = monday.toISOString().split('T')[0];

  return {
    id: 'demo-plan-1',
    household_id: 'demo-household',
    week_start_date: weekStart,
    status: 'active',
    slots,
  };
}

export const DEMO_PLAN: MealPlan = buildDemoPlan();
```

- [ ] **Step 3: Verify the data loads without errors**

Add a temporary console.log to `app.tsx` (remove after verification):

```typescript
import { DEMO_PLAN } from './src/data/demo-plan';
import { DEMO_RECIPES, DEMO_INGREDIENTS } from './src/data/demo-data';
console.log(`Demo plan: ${DEMO_PLAN.slots.length} slots`);
console.log(`Recipes: ${DEMO_RECIPES.length}, Ingredients: ${DEMO_INGREDIENTS.length}`);
```

Run `npx expo start`. Check the terminal/console output. Expected:
- `Demo plan: 14 slots` (7 days × 2 meals)
- `Recipes: 50, Ingredients: <number matching seed data>`

Remove the console.log lines after verification.

- [ ] **Step 4: Commit**

```bash
git add src/data/
git commit -m "Phase 4 Task 3: Demo data layer bridging seed data to app types"
```

---

### Task 4: Zustand Stores

**Files:**
- Create: `src/features/meal-plan/store/useMealPlanStore.ts`
- Create: `src/features/shopping-list/store/useShoppingListStore.ts`

- [ ] **Step 1: Create useMealPlanStore**

Create `src/features/meal-plan/store/useMealPlanStore.ts`:

```typescript
import { create } from 'zustand';
import type { MealPlan } from '../../shopping-list/types';
import { DEMO_PLAN } from '../../../data/demo-plan';

interface MealPlanState {
  activePlan: MealPlan;
  isGenerating: boolean;
  regeneratePlan: () => void;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  activePlan: DEMO_PLAN,
  isGenerating: false,

  regeneratePlan: () => {
    set({ isGenerating: true });

    // Use setTimeout to avoid blocking the UI thread during generation.
    // The plan generator is CPU-intensive (75 candidates scored).
    setTimeout(() => {
      try {
        // For now, shuffle the demo plan slots to simulate regeneration.
        // Full algorithm integration requires transforming to camelCase types
        // which is deferred to a future task.
        const currentPlan = useMealPlanStore.getState().activePlan;
        const shuffledSlots = [...currentPlan.slots].sort(() => Math.random() - 0.5);

        // Reassign slot IDs and day_of_week to maintain structure
        const mittagSlots = shuffledSlots.filter(s => s.meal_type === 'Mittagessen');
        const eveningSlots = shuffledSlots.filter(s => s.meal_type !== 'Mittagessen');

        const newSlots = [];
        let slotIndex = 0;
        const abendbrotDays = new Set([2, 4]);

        for (let day = 0; day <= 6; day++) {
          // Mittagessen
          const mittagSource = mittagSlots[day % mittagSlots.length];
          if (mittagSource) {
            newSlots.push({
              ...mittagSource,
              id: `regen-slot-${slotIndex++}`,
              day_of_week: day as MealPlan['slots'][number]['day_of_week'],
              meal_type: 'Mittagessen' as const,
            });
          }

          // Evening
          const eveningSource = eveningSlots[day % eveningSlots.length];
          if (eveningSource) {
            newSlots.push({
              ...eveningSource,
              id: `regen-slot-${slotIndex++}`,
              day_of_week: day as MealPlan['slots'][number]['day_of_week'],
              meal_type: abendbrotDays.has(day) ? 'Abendbrot' as const : 'Abendessen' as const,
            });
          }
        }

        set({
          activePlan: {
            ...currentPlan,
            slots: newSlots,
          },
          isGenerating: false,
        });
      } catch {
        set({ isGenerating: false });
      }
    }, 100);
  },
}));
```

- [ ] **Step 2: Create useShoppingListStore**

Create `src/features/shopping-list/store/useShoppingListStore.ts`:

```typescript
import { create } from 'zustand';
import type {
  DerivedShoppingList,
  MealPlan,
  Recipe,
  Ingredient,
  ShoppingListItem,
  AisleGroup,
} from '../types';
import { deriveShoppingList } from '../derive-shopping-list';
import { DEMO_RECIPES, DEMO_INGREDIENTS } from '../../../data/demo-data';
import { useMealPlanStore } from '../../meal-plan/store/useMealPlanStore';

interface ShoppingListState {
  shoppingList: DerivedShoppingList | null;
  deriveFromPlan: (plan: MealPlan) => void;
  toggleItem: (itemId: string) => void;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  shoppingList: null,

  deriveFromPlan: (plan: MealPlan) => {
    const derived = deriveShoppingList(plan, DEMO_RECIPES, DEMO_INGREDIENTS, 'REWE');
    set({ shoppingList: derived });
  },

  toggleItem: (itemId: string) => {
    const current = get().shoppingList;
    if (!current) return;

    const updatedGroups: AisleGroup[] = current.groups.map(group => ({
      ...group,
      items: group.items.map(item =>
        item.id === itemId
          ? { ...item, is_checked: !item.is_checked }
          : item
      ),
    }));

    // Recalculate total_items isn't needed (count doesn't change), but
    // we provide the updated groups for UI re-render.
    set({
      shoppingList: {
        ...current,
        groups: updatedGroups,
      },
    });
  },
}));

// Subscribe to meal plan changes and re-derive the shopping list.
// This runs once at import time and stays active for the app lifetime.
useMealPlanStore.subscribe(
  (state) => {
    useShoppingListStore.getState().deriveFromPlan(state.activePlan);
  }
);

// Derive initial shopping list from the demo plan.
useShoppingListStore.getState().deriveFromPlan(useMealPlanStore.getState().activePlan);
```

- [ ] **Step 3: Verify stores initialize**

Add temporary logging to `app.tsx`:

```typescript
import { useMealPlanStore } from './src/features/meal-plan/store/useMealPlanStore';
import { useShoppingListStore } from './src/features/shopping-list/store/useShoppingListStore';
console.log('Plan slots:', useMealPlanStore.getState().activePlan.slots.length);
console.log('Shopping list items:', useShoppingListStore.getState().shoppingList?.total_items);
```

Run `npx expo start`. Check console. Expected:
- `Plan slots: 14`
- `Shopping list items: <some positive number>`

Remove the console.log lines after verification.

- [ ] **Step 4: Commit**

```bash
git add src/features/meal-plan/store/ src/features/shopping-list/store/
git commit -m "Phase 4 Task 4: Zustand stores for meal plan and shopping list"
```

---

### Task 5: Wochenplan Screen

**Files:**
- Create: `src/features/meal-plan/components/MealSlotCard.tsx`
- Create: `src/features/meal-plan/components/DayColumn.tsx`
- Create: `src/features/meal-plan/screens/MealPlanScreen.tsx`
- Modify: `src/app/MainTabNavigator.tsx` — replace Wochenplan placeholder

- [ ] **Step 1: Create MealSlotCard**

Create `src/features/meal-plan/components/MealSlotCard.tsx`:

```tsx
import { View, Text } from 'react-native';
import type { MealSlot, MealType } from '../../shopping-list/types';
import { RECIPE_BY_ID } from '../../../data/demo-data';
import { DE } from '../../../shared/i18n/de';

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  Frühstück: 'text-meal-frueh',
  Mittagessen: 'text-meal-mittag',
  Abendessen: 'text-meal-abend',
  Abendbrot: 'text-meal-abendbrot',
};

interface MealSlotCardProps {
  slot: MealSlot;
}

export function MealSlotCard({ slot }: MealSlotCardProps) {
  const recipe = slot.recipe_id ? RECIPE_BY_ID.get(slot.recipe_id) : null;

  if (!recipe) {
    return (
      <View className="flex-1 bg-surface/50 rounded-lg p-3">
        <Text className="text-xs text-muted">
          {DE.mealTypes[slot.meal_type]}
        </Text>
        <Text className="text-sm text-muted italic mt-1">Kein Rezept</Text>
      </View>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const colorClass = MEAL_TYPE_COLORS[slot.meal_type];

  return (
    <View className="flex-1 bg-[#0f3460] rounded-lg p-3">
      <Text className={`text-[10px] font-medium ${colorClass} mb-1`}>
        {DE.mealTypes[slot.meal_type]}
      </Text>
      <Text className="text-sm text-white" numberOfLines={2}>
        {recipe.title_de}
      </Text>
      <Text className="text-[10px] text-muted mt-1">
        {totalTime} Min
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create DayColumn**

Create `src/features/meal-plan/components/DayColumn.tsx`:

```tsx
import { View, Text } from 'react-native';
import type { MealSlot } from '../../shopping-list/types';
import { MealSlotCard } from './MealSlotCard';
import { DE } from '../../../shared/i18n/de';

interface DayColumnProps {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  dateString: string;
  slots: MealSlot[];
}

export function DayColumn({ dayOfWeek, dateString, slots }: DayColumnProps) {
  const dayName = DE.days[dayOfWeek];

  return (
    <View className="bg-surface rounded-xl p-3 mb-3">
      <Text className="text-sm font-semibold text-white mb-2">
        {dayName}, {dateString}
      </Text>
      <View className="flex-row gap-2">
        {slots.map(slot => (
          <MealSlotCard key={slot.id} slot={slot} />
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create MealPlanScreen**

Create `src/features/meal-plan/screens/MealPlanScreen.tsx`:

```tsx
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { DayColumn } from '../components/DayColumn';
import { DE } from '../../../shared/i18n/de';

function formatDateShort(isoDate: string, dayOffset: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getDate()}. ${
    ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
     'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][date.getMonth()]
  }`;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}.–${endDay}. ${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${startDay}. ${months[start.getMonth()]}–${endDay}. ${months[end.getMonth()]} ${start.getFullYear()}`;
}

export function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const { activePlan, isGenerating, regeneratePlan } = useMealPlanStore();

  const weekRange = formatWeekRange(activePlan.week_start_date);

  // Group slots by day
  const slotsByDay = new Map<number, typeof activePlan.slots>();
  for (const slot of activePlan.slots) {
    const existing = slotsByDay.get(slot.day_of_week) ?? [];
    existing.push(slot);
    slotsByDay.set(slot.day_of_week, existing);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">
          {DE.mealPlan.title}
        </Text>
        <Text className="text-sm text-muted mt-1">{weekRange}</Text>
      </View>

      {/* Regenerate button */}
      <View className="px-4 pb-3">
        <Pressable
          onPress={regeneratePlan}
          disabled={isGenerating}
          className="bg-accent rounded-lg py-3 items-center active:opacity-80"
          style={isGenerating ? { opacity: 0.6 } : undefined}
        >
          {isGenerating ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#1a1a2e" />
              <Text className="text-background font-semibold">
                {DE.mealPlan.generating}
              </Text>
            </View>
          ) : (
            <Text className="text-background font-semibold">
              {DE.mealPlan.regenerate}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Day list */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const slots = slotsByDay.get(day) ?? [];
          if (slots.length === 0) return null;

          return (
            <DayColumn
              key={day}
              dayOfWeek={day as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              dateString={formatDateShort(activePlan.week_start_date, day)}
              slots={slots}
            />
          );
        })}
        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Wire MealPlanScreen into MainTabNavigator**

In `src/app/MainTabNavigator.tsx`, replace the Wochenplan placeholder:

Add this import at the top:
```typescript
import { MealPlanScreen } from '../features/meal-plan/screens/MealPlanScreen';
```

Remove the `WochenplanPlaceholder` function.

Change the Wochenplan Tab.Screen `component` prop:
```typescript
<Tab.Screen
  name="Wochenplan"
  component={MealPlanScreen}
  options={{...}}
/>
```

- [ ] **Step 5: Verify MealPlanScreen renders**

```bash
npx expo start
```

Verify: Wochenplan tab shows the week range header, "Neu generieren" button, and 7 day cards with recipe names. Tapping "Neu generieren" shuffles the recipes. The other tabs still show placeholders.

- [ ] **Step 6: Commit**

```bash
git add src/features/meal-plan/screens/ src/features/meal-plan/components/ src/app/MainTabNavigator.tsx
git commit -m "Phase 4 Task 5: Wochenplan screen with day cards and meal slots"
```

---

### Task 6: Einkaufsliste Screen

**Files:**
- Create: `src/features/shopping-list/components/ShoppingItemCard.tsx`
- Create: `src/features/shopping-list/components/AisleSection.tsx`
- Create: `src/features/shopping-list/screens/ShoppingListScreen.tsx`
- Modify: `src/app/MainTabNavigator.tsx` — replace Einkaufsliste placeholder

- [ ] **Step 1: Create ShoppingItemCard**

Create `src/features/shopping-list/components/ShoppingItemCard.tsx`:

```tsx
import { View, Text, Pressable } from 'react-native';
import type { ShoppingListItem } from '../types';
import { useShoppingListStore } from '../store/useShoppingListStore';

interface ShoppingItemCardProps {
  item: ShoppingListItem;
}

export function ShoppingItemCard({ item }: ShoppingItemCardProps) {
  const toggleItem = useShoppingListStore(state => state.toggleItem);

  const formatPrice = (cents: number): string => {
    if (cents === 0) return '';
    return `~${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
  };

  const formatPackageInfo = (): string => {
    if (item.package_size === 0) return '';
    if (item.package_count === 1) {
      return `1 Packung`;
    }
    return `${item.package_count} Packungen`;
  };

  const secondaryParts = [
    item.display_text !== item.ingredient_name ? item.display_text : `${item.amount_needed} ${item.unit}`,
    formatPackageInfo(),
    formatPrice(item.estimated_price_cents),
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => toggleItem(item.id)}
      className="active:opacity-80"
    >
      <View
        className="bg-surface rounded-xl p-3 mb-2 flex-row items-center"
        style={item.is_checked ? { opacity: 0.5 } : undefined}
      >
        {/* Checkbox */}
        <View
          className="w-6 h-6 rounded-md mr-3 items-center justify-center border-2"
          style={
            item.is_checked
              ? { backgroundColor: '#7aa2f7', borderColor: '#7aa2f7' }
              : { borderColor: '#555' }
          }
        >
          {item.is_checked && (
            <Text className="text-xs text-background font-bold">✓</Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-sm font-medium text-white"
            style={item.is_checked ? { textDecorationLine: 'line-through', color: '#666' } : undefined}
          >
            {item.ingredient_name}
          </Text>
          <Text
            className="text-xs text-muted mt-0.5"
            style={item.is_checked ? { textDecorationLine: 'line-through', color: '#555' } : undefined}
            numberOfLines={1}
          >
            {secondaryParts.join(' · ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create AisleSection**

Create `src/features/shopping-list/components/AisleSection.tsx`:

```tsx
import { View, Text } from 'react-native';
import type { AisleGroup, AisleCategory } from '../types';

const AISLE_EMOJI: Partial<Record<AisleCategory, string>> = {
  'Obst & Gemüse': '🍎',
  'Brot & Backwaren': '🍞',
  'Kühlregal': '❄️',
  'Milchprodukte': '🥛',
  'Fleisch & Wurst': '🥩',
  'Tiefkühl': '🧊',
  'Konserven & Gläser': '🥫',
  'Trockenwaren & Beilagen': '🍝',
  'Backzutaten': '🧈',
  'Gewürze & Öle': '🧂',
  'Getränke': '🥤',
  'Süßwaren & Snacks': '🍫',
  'Sonstiges': '📦',
};

interface AisleSectionHeaderProps {
  group: AisleGroup;
}

export function AisleSectionHeader({ group }: AisleSectionHeaderProps) {
  const emoji = AISLE_EMOJI[group.category] ?? '📦';
  const checkedCount = group.items.filter(i => i.is_checked).length;

  return (
    <View className="bg-background pt-3 pb-2 px-4">
      <Text className="text-xs font-bold text-accent uppercase tracking-wide">
        {emoji} {group.category}{' '}
        <Text className="text-muted font-normal">
          ({checkedCount}/{group.item_count})
        </Text>
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Create ShoppingListScreen**

Create `src/features/shopping-list/screens/ShoppingListScreen.tsx`:

```tsx
import { View, Text, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { ShoppingItemCard } from '../components/ShoppingItemCard';
import { AisleSectionHeader } from '../components/AisleSection';
import { DE } from '../../../shared/i18n/de';
import type { AisleGroup, ShoppingListItem } from '../types';

interface SectionData {
  group: AisleGroup;
  data: readonly ShoppingListItem[];
}

export function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const shoppingList = useShoppingListStore(state => state.shoppingList);

  if (!shoppingList) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Keine Einkaufsliste vorhanden</Text>
      </View>
    );
  }

  // Count checked items across all groups.
  const totalChecked = shoppingList.groups.reduce(
    (sum, g) => sum + g.items.filter(i => i.is_checked).length,
    0
  );

  const formatTotal = (): string => {
    if (shoppingList.total_estimated_cents === 0) return '';
    const euros = (shoppingList.total_estimated_cents / 100).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
    });
    return DE.shoppingList.estimatedTotal(euros);
  };

  const sections: SectionData[] = shoppingList.groups.map(group => ({
    group,
    data: group.items,
  }));

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-white">
          {DE.shoppingList.title}
        </Text>
      </View>

      {/* Summary bar */}
      <View className="mx-4 mb-3 bg-surface rounded-lg px-3 py-2 flex-row justify-between items-center">
        <Text className="text-sm text-white">
          {DE.shoppingList.itemsDone(totalChecked, shoppingList.total_items)}
        </Text>
        {shoppingList.total_estimated_cents > 0 && (
          <Text className="text-sm text-accent font-medium">
            {formatTotal()}
          </Text>
        )}
      </View>

      {/* Shopping list */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <ShoppingItemCard item={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <AisleSectionHeader group={(section as SectionData).group} />
        )}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View className="h-4" />}
      />
    </View>
  );
}
```

- [ ] **Step 4: Wire ShoppingListScreen into MainTabNavigator**

In `src/app/MainTabNavigator.tsx`, add this import:
```typescript
import { ShoppingListScreen } from '../features/shopping-list/screens/ShoppingListScreen';
```

Remove the `EinkaufslistePlaceholder` function.

Change the Einkaufsliste Tab.Screen `component` prop:
```typescript
<Tab.Screen
  name="Einkaufsliste"
  component={ShoppingListScreen}
  options={{...}}
/>
```

- [ ] **Step 5: Verify ShoppingListScreen renders**

```bash
npx expo start
```

Verify:
- Einkaufsliste tab shows summary bar with item count and estimated price
- Items grouped by aisle with sticky headers and emoji icons
- Tapping an item toggles the checkbox — text gets strikethrough, opacity dims
- Summary counter updates when items are checked/unchecked
- Switching to Wochenplan, tapping "Neu generieren", then switching back to Einkaufsliste shows a re-derived list

- [ ] **Step 6: Commit**

```bash
git add src/features/shopping-list/screens/ src/features/shopping-list/components/ src/app/MainTabNavigator.tsx
git commit -m "Phase 4 Task 6: Einkaufsliste screen with aisle sections and checkable items"
```

---

### Task 7: Polish & Verification

**Files:**
- Modify: `app.tsx` — clean up any leftover debug code
- Modify: `src/app/MainTabNavigator.tsx` — final cleanup

- [ ] **Step 1: Clean up app.tsx**

Ensure `app.tsx` has no debug console.log statements. Final content should be:

```typescript
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/app/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Full app walkthrough verification**

```bash
npx expo start
```

Verify the complete flow:
1. App launches into Wochenplan tab with 7 day cards showing recipes
2. "Neu generieren" button shuffles recipes, button shows loading state briefly
3. Switch to Einkaufsliste — shows derived shopping list grouped by aisle
4. Tap items to check them off — strikethrough, opacity change, counter updates
5. Switch to Rezepte tab — shows "Kommt bald" placeholder
6. Switch to Einstellungen tab — shows "Kommt bald" placeholder
7. Switch back to Wochenplan, tap "Neu generieren", then switch to Einkaufsliste — list is re-derived with new items

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Phase 4 Task 7: Final polish and cleanup"
```
