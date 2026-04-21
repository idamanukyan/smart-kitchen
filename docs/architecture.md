# SmartKüche — System Architecture

> Last updated: 2026-04-21
> Stack: React Native + Expo | Supabase | TypeScript | Deno Edge Functions

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Module Decomposition](#2-module-decomposition)
3. [API Design](#3-api-design)
4. [Realtime Architecture](#4-realtime-architecture-shared-einkaufsliste)
5. [Offline Strategy](#5-offline-strategy)
6. [Security Model](#6-security-model)
7. [Mobile-Specific Considerations](#7-mobile-specific-considerations)
8. [Database Schema Overview](#8-database-schema-overview)
9. [Decisions & Trade-offs](#9-decisions--trade-offs)

---

## 1. High-Level Architecture

SmartKüche is a **mobile-first** app. The React Native client is the primary interface; there is no web frontend. All backend services are provided by Supabase, hosted in the EU (Frankfurt, `eu-central-1`) to satisfy DSGVO requirements.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT — React Native (Expo)                    │
│                                                                     │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │ Onboard- │  │  Meal Plan │  │ Shopping  │  │    Pantry       │  │
│  │  ing     │  │  Screen    │  │  List     │  │  (Phase 2)      │  │
│  └────┬─────┘  └─────┬──────┘  └─────┬─────┘  └────────┬────────┘  │
│       │              │               │                  │           │
│  ┌────▼──────────────▼───────────────▼──────────────────▼────────┐  │
│  │                    Zustand Store (global state)                │  │
│  │  auth | preferences | mealPlan | shoppingList | pantry        │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │             expo-sqlite  (local offline cache)                 │  │
│  │  shopping_list_items | recipes | preferences | pending_syncs  │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │  HTTPS / WSS
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                          SUPABASE (Frankfurt)                        │
│                                                                      │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  Auth          │  │  PostgreSQL DB   │  │  Realtime           │  │
│  │                │  │  (RLS enforced)  │  │  (WebSocket)        │  │
│  │  - Email/pass  │  │                  │  │                     │  │
│  │  - Anonymous   │  │  households      │  │  shopping_list_     │  │
│  │  - OAuth       │  │  users           │  │  items channel      │  │
│  │  - Account     │  │  recipes         │  │                     │  │
│  │    upgrade     │  │  meal_plans      │  │  broadcast:         │  │
│  └────────────────┘  │  meal_slots      │  │  item:checked       │  │
│                      │  shopping_lists  │  │  item:added         │  │
│  ┌────────────────┐  │  shopping_list_  │  │  item:deleted       │  │
│  │  Edge Functions│  │    items         │  └─────────────────────┘  │
│  │  (Deno / TS)   │  │  pantry_items    │                           │
│  │                │  │  user_prefs      │  ┌─────────────────────┐  │
│  │  /generate-    │  └──────────────────┘  │  Storage            │  │
│  │    plan        │                        │  (recipe images)    │  │
│  │  /regenerate-  │                        └─────────────────────┘  │
│  │    slot        │                                                  │
│  │  /shopping-    │                                                  │
│  │    list/:id    │                                                  │
│  └────────────────┘                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

```
1. ONBOARDING → PREFERENCE STORAGE
   User fills onboarding screens
   → Zustand writes to local SQLite
   → If authenticated: POST /rest/v1/user_preferences (upsert)

2. MEAL PLAN GENERATION
   User taps "Wochenplan erstellen"
   → POST /generate-plan { preferences, lockedSlots }
   → Edge Function queries recipes DB with filters
   → Returns 7-day MealPlan JSON
   → Zustand stores plan; local SQLite caches it

3. SHOPPING LIST DERIVATION
   User navigates to Einkaufsliste
   → GET /shopping-list/:planId
   → Edge Function aggregates ingredients across all slots
   → Deduplicates (500g + 250g Mehl → 750g Mehl → rounds to 1kg pack)
   → Groups by German supermarket aisle (Kühlregal, Obst & Gemüse, etc.)
   → Response stored in Zustand + SQLite

4. SHARED LIST SYNC (Realtime)
   Household member A checks off "Milch"
   → Optimistic local update (SQLite + Zustand)
   → PATCH shopping_list_items SET checked=true
   → Supabase Realtime broadcasts to all subscribers in household
   → Household member B's app receives event, updates UI

5. OFFLINE → RECONNECT SYNC
   App goes offline (in supermarket basement)
   → All checkbox changes queue in SQLite pending_syncs table
   → On reconnect: flush queue in order, apply to Supabase
   → Pull any remote changes that occurred while offline
```

---

## 2. Module Decomposition

All modules live under `src/features/`. Each module owns its screens, components, hooks, store slice, types, and API calls.

```
src/
  features/
    auth/
    onboarding/
    recipes/
    meal-plan/
    shopping-list/
    pantry/           ← Phase 2 (interfaces defined now)
    user-preferences/
  shared/
    components/       ← reusable UI primitives
    hooks/            ← useNetwork, useHaptics, useSupabase
    lib/              ← supabase client, sqlite client, i18n
    types/            ← shared domain types (Recipe, MealPlan, etc.)
    constants/        ← aisle categories, diet types, allergens
```

---

### Module: `auth`

**Responsibility:** Identity management, session lifecycle, anonymous-to-account upgrade.

| Concern | Detail |
|---|---|
| Provider | Supabase Auth (JWT-based) |
| Anonymous usage | Anonymous session created on first launch — users get full local functionality without signing up |
| Account upgrade | `supabase.auth.linkIdentity()` — converts anonymous session to permanent account; all local data migrated to cloud |
| OAuth | Google Sign-In (optional, Phase 2) |
| Token storage | Expo SecureStore (never AsyncStorage for tokens) |
| Session refresh | Automatic via Supabase client; background refresh on app foreground |

**Key files:**
```
src/features/auth/
  useAuthStore.ts       ← Zustand slice: session, user, isAnonymous
  AuthGate.tsx          ← wraps app, ensures session exists
  UpgradePrompt.tsx     ← shown when anon user tries to share a list
  supabase-auth.ts      ← thin wrapper around supabase.auth.*
```

---

### Module: `onboarding`

**Responsibility:** Collect household configuration on first launch. Data drives all downstream features (recipe filtering, portion scaling, time filtering).

Onboarding collects, in order:

1. **Haushaltsgrösse** — number of people (1–8+), with adult/child breakdown for portion scaling
2. **Ernahrungsweise** — diet type selection:
   - `omnivor` — alles
   - `flexitarisch` — wenig Fleisch
   - `vegetarisch` — kein Fleisch/Fisch
   - `vegan` — keine tierischen Produkte
3. **Unvertraglichkeiten & Allergien** — multi-select:
   - Laktose, Gluten, Nüsse, Erdnüsse, Ei, Soja, Fisch, Meeresfrüchte, Sellerie, Senf
4. **Kochzeit-Budget** — per day (in minutes): `≤20`, `≤30`, `≤45`, `≤60`, `unbegrenzt`
5. **Bevorzugter Supermarkt** — REWE, EDEKA, Lidl, Aldi Nord, Aldi Süd, Kaufland, Netto, Penny (affects aisle labels and package size assumptions)

**Key files:**
```
src/features/onboarding/
  OnboardingNavigator.tsx   ← stack navigator for onboarding flow
  screens/
    HouseholdScreen.tsx
    DietScreen.tsx
    AllergiesScreen.tsx
    CookingTimeScreen.tsx
    StoreScreen.tsx
    OnboardingDoneScreen.tsx
  useOnboardingStore.ts     ← collects partial state across screens
```

Onboarding data writes to `user_preferences` (cloud) and SQLite (local) on completion.

---

### Module: `recipes`

**Responsibility:** Recipe data access, search, filtering, and tagging. Recipes are the core content of the app.

| Concern | Detail |
|---|---|
| Storage | Supabase PostgreSQL `recipes` table |
| Language | All recipe names, instructions, and ingredient names in German |
| Units | Metric only (g, kg, ml, l, Stück, Bund, Prise) |
| Filtering | By diet type, allergen exclusions, max cooking time, ingredient availability |
| Search | Full-text search via PostgreSQL `tsvector` on recipe name + ingredients (German language config) |
| Tagging | Many-to-many `recipe_tags` table — e.g., `Abendbrot`, `Schnell`, `Meal-Prep`, `Günstig`, `Familienfreundlich` |
| Abendbrot | `Abendbrot` is a first-class meal type tag — cold dinner recipes are distinct from warm dinner recipes |
| Images | Stored in Supabase Storage; served via CDN URL on recipe cards |
| CRUD | Admin-only recipe creation via RLS policy; users can save favourites |

**Key files:**
```
src/features/recipes/
  useRecipesStore.ts
  recipeApi.ts          ← Supabase query helpers
  RecipeCard.tsx
  RecipeDetailScreen.tsx
  RecipeSearchScreen.tsx
  filters.ts            ← buildRecipeFilter(preferences) → PostgREST query params
```

---

### Module: `meal-plan`

**Responsibility:** Generate and manage 7-day meal plans. Each day has up to 3 slots: Frühstück (optional), Mittagessen, Abendessen (Abendbrot or warm).

**Plan structure:**

```
MealPlan {
  id: uuid
  householdId: uuid
  weekStart: date        ← always a Monday
  slots: MealSlot[21]   ← 7 days × 3 meals max
}

MealSlot {
  id: uuid
  planId: uuid
  day: 0..6             ← 0 = Monday
  mealType: 'fruehstueck' | 'mittagessen' | 'abendessen'
  recipeId: uuid | null
  locked: boolean        ← user locked this slot; regeneration skips it
  servings: number       ← from household size
}
```

**Generation algorithm (Edge Function):**

1. Load user preferences (diet, allergens, time budget, household size)
2. Exclude allergen-incompatible recipes via tag filter
3. Exclude recipes exceeding daily time budget
4. Score remaining recipes by: ingredient overlap with rest of plan (reduces waste), variety (avoid repeating same main ingredient), and a small random factor for freshness
5. Fill slots greedily: highest score first, respecting locked slots
6. Return complete plan; client stores in Zustand + DB

**Swap/lock logic:**
- User can lock any slot (tap lock icon) — locked slots are skipped in regeneration
- User can swap a single slot (tap shuffle icon) → calls `/regenerate-slot`
- Swapping updates the plan in DB and triggers shopping list re-derivation

**Key files:**
```
src/features/meal-plan/
  useMealPlanStore.ts
  MealPlanScreen.tsx         ← 7-day calendar grid view
  DayColumn.tsx
  MealSlotCard.tsx           ← shows recipe, lock/swap controls
  mealPlanApi.ts
```

---

### Module: `shopping-list`

**Responsibility:** Derive a shopping list from the active meal plan, deduplicate and round to German package sizes, group by supermarket aisle, and sync across household members in real time.

**Derivation pipeline:**

```
MealPlan.slots
  → flatten all recipe.ingredients × servings
  → aggregate by ingredient (sum amounts, unify units)
  → deduplicate (e.g., 300g + 200g Mehl → 500g Mehl)
  → round up to nearest package size
     (e.g., 500g Mehl → 1kg pack if store = REWE)
  → assign aisle category
  → sort by aisle order (matches physical supermarket layout)
```

**Aisle categories** (German supermarket order):

```typescript
type AisleCategory =
  | 'Obst & Gemüse'
  | 'Brot & Backwaren'
  | 'Kühlregal — Milch & Käse'
  | 'Kühlregal — Fleisch & Wurst'
  | 'Kühlregal — Fertigprodukte'
  | 'Tiefkühl'
  | 'Konserven & Gläser'
  | 'Nudeln, Reis & Getreide'
  | 'Öle, Soßen & Gewürze'
  | 'Süßes & Snacks'
  | 'Getränke'
  | 'Drogerie & Haushalt'
  | 'Sonstiges'
```

**Shared list:**
- Each `shopping_list` belongs to a `household_id`
- All household members see the same list
- Checking off an item updates `shopping_list_items.checked = true` with `checked_by` user ID
- Realtime subscription (see Section 4) propagates changes instantly

**Key files:**
```
src/features/shopping-list/
  useShoppingListStore.ts
  ShoppingListScreen.tsx     ← grouped by aisle, swipe-to-check
  AisleSection.tsx
  ShoppingItem.tsx           ← checkbox with haptic feedback
  shoppingListApi.ts
  derivation.ts              ← pure functions: aggregate, round, sort
  sync.ts                    ← offline queue + reconnect flush
```

---

### Module: `pantry` (Phase 2 — Interface Defined Now)

**Responsibility:** Track current ingredient inventory to inform meal plan generation (prefer recipes that use what's already on hand) and reduce food waste.

This module will **not** be implemented in Phase 1, but its TypeScript interfaces are defined now so the rest of the system can reference them without breaking changes later.

```typescript
// src/features/pantry/types.ts

interface PantryItem {
  id: string;
  householdId: string;
  ingredientId: string;
  amount: number;
  unit: string;            // g, kg, ml, l, Stück
  expiresAt: Date | null;
  addedAt: Date;
  addedByUserId: string;
}

interface PantryStore {
  items: PantryItem[];
  addItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateAmount: (id: string, amount: number) => Promise<void>;
  getExpiringItems: (withinDays: number) => PantryItem[];
}

// Phase 2 extension to generate-plan API:
// POST /generate-plan { preferences, lockedSlots, pantryItems }
// → algorithm prefers recipes that consume pantry items near expiry
```

Phase 2 database table (`pantry_items`) is included in the initial migration with RLS policies, so no migration is needed when the feature ships.

---

### Module: `user-preferences`

**Responsibility:** Persist and expose household configuration. Single source of truth for diet rules, allergen exclusions, time budget, and store selection.

```typescript
interface UserPreferences {
  householdId: string;
  householdSize: number;
  adultsCount: number;
  childrenCount: number;
  dietType: 'omnivor' | 'flexitarisch' | 'vegetarisch' | 'vegan';
  allergens: AllergenKey[];
  cookingTimeBudgetMinutes: number;  // per day
  preferredStore: GermanStore;
  budgetMode: 'günstig' | 'normal' | 'premium' | null;
  updatedAt: Date;
}
```

These preferences are loaded at app start from SQLite (fast, synchronous) and then revalidated from Supabase in the background (authenticated users only).

---

## 3. API Design

All Edge Functions are TypeScript/Deno, deployed to Supabase. Authentication is via the `Authorization: Bearer <JWT>` header. RLS on the database layer provides a second enforcement boundary.

### POST /generate-plan

Generates a complete 7-day meal plan based on user preferences.

**Request:**
```typescript
{
  preferences: {
    dietType: DietType;
    allergens: AllergenKey[];
    cookingTimeBudgetMinutes: number;
    householdSize: number;
    preferredStore: GermanStore;
  };
  lockedSlots: Array<{
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    mealType: MealType;
    recipeId: string;
  }>;
  weekStart: string;   // ISO date, always a Monday
  pantryItems?: PantryItemSummary[];   // Phase 2 field, optional
}
```

**Response:**
```typescript
{
  planId: string;
  weekStart: string;
  slots: Array<{
    day: number;
    mealType: MealType;
    recipe: RecipeSummary;
    locked: boolean;
    servings: number;
  }>;
  generatedAt: string;
}
```

**Error responses:** `400 Bad Request` (invalid preferences), `404 Not Found` (no recipes match constraints), `429 Too Many Requests` (rate limited).

---

### POST /regenerate-slot

Replaces a single meal slot with a new recipe. Respects all active constraints and avoids recipes already present in the plan.

**Request:**
```typescript
{
  planId: string;
  day: number;
  mealType: MealType;
  excludeRecipeIds: string[];   // all recipe IDs already in the plan
  preferences: PreferencesSummary;
}
```

**Response:**
```typescript
{
  slot: {
    day: number;
    mealType: MealType;
    recipe: RecipeSummary;
    servings: number;
  };
}
```

---

### GET /shopping-list/:planId

Derives and returns the shopping list for a given plan. Idempotent — calling it again for the same plan returns the same result (cached after first call).

**Response:**
```typescript
{
  listId: string;
  planId: string;
  householdId: string;
  aisles: Array<{
    category: AisleCategory;
    items: Array<{
      id: string;
      ingredientId: string;
      displayName: string;     // German, e.g. "Vollmilch"
      amount: number;
      unit: string;            // g, kg, ml, l, Stück
      packageInfo: string;     // e.g. "1 Packung (1 kg)"
      checked: boolean;
      checkedByUserId: string | null;
    }>;
  }>;
  derivedAt: string;
}
```

---

### Standard CRUD (PostgREST — no Edge Function needed)

These use Supabase's auto-generated REST API directly from the client. RLS enforces access control.

| Operation | Endpoint | Notes |
|---|---|---|
| List recipes | `GET /rest/v1/recipes` | Filter via query params |
| Get recipe | `GET /rest/v1/recipes?id=eq.:id` | |
| Favourite recipe | `POST /rest/v1/user_favourites` | |
| Upsert preferences | `POST /rest/v1/user_preferences` | `upsert=true` |
| Get household | `GET /rest/v1/households?id=eq.:id` | |
| Invite to household | `POST /rest/v1/household_invites` | generates 6-digit code |
| Join household | `POST /rest/v1/household_joins` | validates invite code |
| Check off item | `PATCH /rest/v1/shopping_list_items?id=eq.:id` | triggers Realtime |
| Add pantry item | `POST /rest/v1/pantry_items` | Phase 2 |

---

## 4. Realtime Architecture — Shared Einkaufsliste

The shared shopping list is the primary collaborative feature of SmartKüche. Two household members can be in the same supermarket and check items off simultaneously.

### Subscription Setup

```typescript
// src/features/shopping-list/sync.ts

const channel = supabase
  .channel(`shopping-list:${listId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shopping_list_items',
      filter: `list_id=eq.${listId}`,
    },
    (payload) => handleRealtimeEvent(payload)
  )
  .subscribe();
```

The subscription is created when the ShoppingListScreen mounts and destroyed on unmount.

### Event Handling

```
Event: UPDATE (checked = true)
  ├── Is this our own optimistic update? → ignore (already applied locally)
  └── Is it from another device? → apply to Zustand + SQLite, no haptic

Event: INSERT (new item added by household member)
  └── Append to local list, scroll notification if item is off-screen

Event: DELETE (item removed)
  └── Remove from local list
```

### Optimistic UI

When a user checks off an item:

1. Immediately update local Zustand state (checkbox appears checked)
2. Trigger haptic feedback (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`)
3. Write to SQLite (for offline persistence)
4. Send `PATCH` to Supabase
5. If `PATCH` fails: roll back the optimistic update, show toast

### Conflict Resolution

Strategy: **last-write-wins** on `checked` state.

Rationale: The only meaningful conflict on a shopping list is "two people check the same item at the same moment." Both people want it checked — last write wins, and the outcome (item is checked) is correct regardless of which write wins. Unchecking is a deliberate user action and rare enough that last-write-wins is acceptable.

The `shopping_list_items` table includes `checked_at TIMESTAMPTZ` and `checked_by UUID` for audit purposes, but these are not used in conflict resolution logic.

---

## 5. Offline Strategy

The shopping list **must** work fully offline. The primary use case is a user in a supermarket basement with no signal.

### Local Storage: expo-sqlite

SQLite via `expo-sqlite` is the offline cache. It mirrors the server state and is the source of truth when the network is unavailable.

**Tables mirrored locally:**

```sql
-- Minimal local schema (not full Supabase schema)

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,     -- JSON blob of RecipeSummary
  cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  data TEXT NOT NULL,     -- JSON blob
  checked INTEGER NOT NULL DEFAULT 0,
  dirty INTEGER NOT NULL DEFAULT 0,  -- 1 = local change not yet synced
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_syncs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,   -- 'CHECK_ITEM' | 'UNCHECK_ITEM' | 'ADD_ITEM'
  payload TEXT NOT NULL,     -- JSON
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
```

### Sync on Reconnect

```typescript
// src/shared/hooks/useNetworkSync.ts

NetInfo.addEventListener((state) => {
  if (state.isConnected && state.isInternetReachable) {
    flushPendingSyncs();   // drain pending_syncs table
    pullRemoteChanges();   // fetch any changes made by other household members
  }
});
```

`flushPendingSyncs` processes the queue in insertion order. Failed syncs (network error) are retried up to 5 times with exponential backoff; after that, the user is notified.

### What Works Offline

| Feature | Offline support |
|---|---|
| View shopping list | Yes (SQLite cache) |
| Check off items | Yes (queued sync) |
| View meal plan | Yes (SQLite cache) |
| Generate new plan | No (requires Edge Function) |
| Browse recipes | Partial (cached recipes only) |
| Invite to household | No (requires server) |

---

## 6. Security Model

### Row Level Security (RLS)

Every table in the Supabase database has RLS enabled. No table has public read/write access. All policies are defined in `supabase/migrations/`.

**Core RLS patterns:**

```sql
-- Users can only read/write their own household's data
CREATE POLICY "household_members_only" ON shopping_lists
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Recipes are readable by all authenticated users
CREATE POLICY "recipes_readable" ON recipes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert/update recipes
CREATE POLICY "recipes_admin_write" ON recipes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );
```

### Household Membership Model

```
users → household_members → households
              ↓
    shopping_lists, meal_plans, pantry_items, user_preferences
```

`household_members` is the authorization join table. Every RLS policy on shared data queries through it. A user leaving a household immediately loses access via RLS (no app-layer enforcement needed).

### Anonymous Users

- Anonymous Supabase session created on first launch
- Anonymous users get a `household_id` scoped to themselves
- All data stored only in SQLite locally; nothing synced to cloud
- When user upgrades to a real account: `supabase.auth.linkIdentity()` preserves the session UUID, local SQLite data is uploaded to Supabase, and RLS policies grant normal access

### DSGVO (GDPR) Compliance

| Requirement | Implementation |
|---|---|
| EU data residency | Supabase Frankfurt region (`eu-central-1`) |
| Data minimization | No analytics SDK; no third-party tracking |
| Consent | Onboarding includes DSGVO consent screen before any data is stored |
| Deletion | `DELETE /rest/v1/users` + cascade deletes household data; handled in Edge Function |
| Export | `GET /export-my-data` Edge Function (Phase 2) |

---

## 7. Mobile-Specific Considerations

SmartKüche is a **mobile-first** product. The following considerations are baked into the architecture, not bolted on later.

### Touch-First Interaction Design

- All interactive targets are minimum 44×44pt (Apple HIG) / 48×48dp (Material)
- Swipe-to-check on shopping list items (react-native-gesture-handler)
- Long-press on meal slot → context menu (lock / swap / view recipe)
- Pull-to-refresh on meal plan and shopping list screens

### One-Handed Operation Priority

The two most-used screens while shopping — ShoppingListScreen — are designed for one-handed use:

- Checkboxes on the left edge (reachable with right thumb on large phones) with an option to mirror to the right
- Floating "Alle erledigt" button pinned to bottom center
- Aisle section headers are sticky so the user always knows where they are

### Offline-First for Shopping List

The shopping list screen boots from SQLite synchronously — there is no loading spinner when the user opens the app in the supermarket. Network state is shown as a subtle banner, not a blocking modal.

### Haptic Feedback

```typescript
// Checking off a shopping item
await Haptics.impactAsync(ImpactFeedbackStyle.Light);

// Completing the last item in an aisle section
await Haptics.notificationAsync(NotificationFeedbackType.Success);

// Locking a meal slot
await Haptics.impactAsync(ImpactFeedbackStyle.Medium);

// Generating a new meal plan
await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
```

Haptics are gated on `expo-haptics` availability check and respect the device's system haptic setting.

### Background Sync

When the app returns to the foreground (`AppState` change from `background` to `active`):

1. Re-authenticate Supabase session if expired
2. Pull latest shopping list state from Supabase (household member may have checked items while app was backgrounded)
3. Flush any pending offline sync operations
4. Re-subscribe to Realtime channel if it dropped

```typescript
// src/shared/hooks/useAppForeground.ts
AppState.addEventListener('change', (nextState) => {
  if (nextState === 'active') {
    supabase.auth.startAutoRefresh();
    syncService.onForeground();
  } else if (nextState === 'background') {
    supabase.auth.stopAutoRefresh();
  }
});
```

### Navigation Structure

```
RootNavigator
  ├── AuthStack (when no session)
  │     ├── WelcomeScreen
  │     ├── LoginScreen
  │     └── RegisterScreen
  ├── OnboardingStack (first launch)
  │     └── [5 onboarding screens]
  └── MainTabs (authenticated)
        ├── Tab: Wochenplan      → MealPlanNavigator
        ├── Tab: Einkaufsliste   → ShoppingListNavigator
        ├── Tab: Rezepte         → RecipesNavigator
        └── Tab: Einstellungen   → SettingsNavigator
```

---

## 8. Database Schema Overview

```sql
-- Core tables (abbreviated — see supabase/migrations/ for full definitions)

households (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ,
  invite_code TEXT UNIQUE   -- 6-char alphanumeric
)

household_members (
  household_id UUID REFERENCES households,
  user_id UUID REFERENCES auth.users,
  role TEXT DEFAULT 'member',  -- 'owner' | 'member'
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (household_id, user_id)
)

user_preferences (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households,
  diet_type TEXT,
  allergens TEXT[],
  cooking_time_budget_minutes INTEGER,
  preferred_store TEXT,
  household_size INTEGER,
  adults_count INTEGER,
  children_count INTEGER,
  updated_at TIMESTAMPTZ
)

recipes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,          -- German
  description TEXT,
  instructions TEXT[],         -- German, one step per array element
  cooking_time_minutes INTEGER,
  servings INTEGER,
  diet_types TEXT[],           -- which diets this recipe suits
  allergens_present TEXT[],    -- allergens IN this recipe
  image_url TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ
)

recipe_ingredients (
  id UUID PRIMARY KEY,
  recipe_id UUID REFERENCES recipes,
  ingredient_id UUID REFERENCES ingredients,
  amount NUMERIC,
  unit TEXT
)

ingredients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,          -- German (e.g. "Vollmilch", "Hackfleisch")
  aisle_category TEXT,
  default_unit TEXT,
  package_sizes JSONB          -- { "REWE": [500, 1000], "Lidl": [1000] } in grams/ml
)

meal_plans (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households,
  week_start DATE,
  generated_at TIMESTAMPTZ
)

meal_slots (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES meal_plans,
  day SMALLINT,                -- 0 = Monday
  meal_type TEXT,              -- 'fruehstueck' | 'mittagessen' | 'abendessen'
  recipe_id UUID REFERENCES recipes,
  locked BOOLEAN DEFAULT FALSE,
  servings SMALLINT
)

shopping_lists (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households,
  plan_id UUID REFERENCES meal_plans,
  derived_at TIMESTAMPTZ
)

shopping_list_items (
  id UUID PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists,
  ingredient_id UUID REFERENCES ingredients,
  display_name TEXT,
  amount NUMERIC,
  unit TEXT,
  package_info TEXT,
  aisle_category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES auth.users
)

pantry_items (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households,
  ingredient_id UUID REFERENCES ingredients,
  amount NUMERIC,
  unit TEXT,
  expires_at DATE,
  added_at TIMESTAMPTZ,
  added_by UUID REFERENCES auth.users
)
```

---

## 9. Decisions & Trade-offs

### React Native + Expo over Flutter or native

**Decision:** React Native with Expo SDK.

**Rationale:** The team writes TypeScript. A single codebase for iOS and Android is non-negotiable for a small team. Expo provides managed builds, OTA updates, and pre-built native modules (haptics, SQLite, SecureStore, notifications) that would take weeks to build natively. The Expo ecosystem has matured significantly; EAS Build covers the production build pipeline.

**Trade-off:** React Native has a larger memory footprint than Flutter and occasional JS bridge overhead. For a food app (not a game or AR app), this is entirely acceptable. Animation performance is handled by keeping heavy animations in the native thread via `react-native-reanimated`.

---

### Supabase over a custom backend

**Decision:** Supabase as the entire backend.

**Rationale:** Supabase provides Auth, PostgreSQL, Realtime, Edge Functions, and Storage in one platform. For a two-person team building an MVP, this eliminates infrastructure work (no server provisioning, no auth implementation, no WebSocket server). The EU Frankfurt region satisfies DSGVO data residency out of the box. PostgREST auto-generates a REST API from the schema, removing boilerplate CRUD code.

**Trade-off:** Vendor lock-in to Supabase. Mitigation: Supabase is open source and self-hostable. If costs grow prohibitively, the PostgreSQL schema and Edge Functions (Deno/TS) can migrate to a self-hosted instance. The client SDK interface would not change.

---

### Zustand over Redux or React Query

**Decision:** Zustand for global state management.

**Rationale:** Redux is over-engineered for this app's state complexity. React Query is excellent for server state but does not handle the offline-first, SQLite-backed state model well without significant custom configuration. Zustand is minimal, TypeScript-friendly, and pairs cleanly with our SQLite persistence layer via a custom middleware.

**Trade-off:** Zustand has less ecosystem tooling than Redux (no Redux DevTools equivalent out of the box). This is acceptable; the app's state graph is not complex enough to require advanced debugging tools.

---

### expo-sqlite over MMKV or AsyncStorage for offline cache

**Decision:** expo-sqlite for offline storage.

**Rationale:** MMKV and AsyncStorage are key-value stores. The shopping list and recipe data are relational (items belong to lists, lists belong to plans). SQLite allows querying, filtering, and ordering without loading entire datasets into memory. The `pending_syncs` queue needs guaranteed ordering — a SQL table with auto-increment ID provides this cleanly.

**Trade-off:** SQLite schema migrations must be managed manually. This is handled by a `runMigrations()` function called at app startup, applying versioned SQL files from `src/lib/sqlite/migrations/`.

---

### Realtime via Supabase Postgres Changes over polling

**Decision:** Supabase Realtime (WebSocket subscription on `shopping_list_items`).

**Rationale:** The shared shopping list use case (two people shopping simultaneously) requires near-instant sync. Polling at even 5-second intervals would feel noticeably laggy when one person checks an item the other is looking at. WebSocket push eliminates this latency entirely.

**Trade-off:** WebSocket connections are stateful and can drop (network handoff, app backgrounding). The reconnection logic must be robust. Supabase's client SDK handles reconnection automatically; the app also re-subscribes on foreground via the `AppState` listener.

---

### Last-write-wins conflict resolution for shopping list

**Decision:** No operational transformation or CRDTs — last-write-wins on `checked`.

**Rationale:** The only meaningful conflict for a shopping list item is "two people toggle the same item's checkbox at the same moment." In 100% of realistic cases, both users intend the same outcome (item is checked or unchecked). The complexity of CRDT-based merge far exceeds the value for this specific conflict type. Last-write-wins with a `checked_at` timestamp provides a clear audit trail.

**Trade-off:** In the astronomically rare case where User A unchecks an item at the exact millisecond User B checks it, last-write-wins will apply one change and discard the other. This is an acceptable trade-off.

---

### Anonymous sessions before account creation

**Decision:** Create an anonymous Supabase session on first launch; prompt for account creation only when the user wants to share a list.

**Rationale:** Requiring sign-up before showing value is a known conversion killer. Users should experience meal plan generation and shopping list creation before committing to an account. Anonymous sessions allow us to give them a real UUID immediately (useful for local RLS scoping), and `linkIdentity()` upgrades the session without losing data.

**Trade-off:** Anonymous sessions complicate the auth state machine (three states: anonymous, authenticated, upgrading). The `AuthGate` and `useAuthStore` must handle all three states gracefully. This is a known complexity and is worth the improved onboarding conversion.

---

### Aisle categories hard-coded to German supermarket layout

**Decision:** Fixed `AisleCategory` enum matching the physical layout of German supermarkets (REWE/EDEKA standard layout).

**Rationale:** German supermarkets follow a highly consistent aisle layout. Mapping shopping items to a fixed enum means the list order matches what users actually encounter as they walk through the store. This is a significant usability win for a shopping list app.

**Trade-off:** Different chains have minor variations in layout (Aldi has no dedicated bakery aisle; Kaufland has a larger non-food section). The `preferred_store` preference is used to adjust the sort order of categories where chains differ, but the category names themselves remain consistent German terms the user recognizes.

---

*End of architecture document.*
