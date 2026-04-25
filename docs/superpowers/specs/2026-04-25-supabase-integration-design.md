# Supabase Integration: Client + Anonymous Auth + Cloud Sync

> Date: 2026-04-25
> Status: Approved

## Summary

Connect the app to Supabase with anonymous authentication and background sync of preferences and meal plans to the cloud. The app remains local-first — localStorage is the source of truth, Supabase sync is fire-and-forget.

## Supabase Client

- Install `@supabase/supabase-js`
- `src/shared/lib/supabase.ts` — singleton client created with `createClient(url, anonKey, options)`
- URL and anon key read from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars (already in `.env`)
- Auth persistence: use `localStorage` via a custom storage adapter (reuse the existing `appStorage` pattern) so sessions survive browser refreshes

## Anonymous Auth

### Auth Store

`src/shared/store/useAuthStore.ts` — Zustand store:

```typescript
interface AuthState {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
}
```

### Flow

1. App launches → `useAuthStore.initialize()` is called
2. Check `supabase.auth.getSession()` for existing session
3. If no session → `supabase.auth.signInAnonymously()`
4. Store `session` and `userId` in the auth store
5. Listen to `supabase.auth.onAuthStateChange()` to keep session updated

### App.tsx Integration

`App.tsx` calls `initialize()` on mount. While `isLoading` is true, show a splash/loading view (cream background with "SmartKüche" text). Once auth is ready, render the navigator.

## Household Auto-Creation

After anonymous auth succeeds and `userId` is available:

1. Check if user already has a `household_id` by querying `users` table
2. If `household_id` is null:
   - Create a new `households` row (name: "Mein Haushalt", size: from preferences, invite_code: random 6-char string)
   - Update `users.household_id` to point to the new household
3. Store `householdId` in the auth store for use by sync functions

This runs once per new user. Existing users (returning after refresh) already have a household.

## Cloud Sync

### Strategy: Local-First, Push-Only

- localStorage remains the source of truth (via Zustand persist)
- After local state changes, push to Supabase in the background
- No read-back from cloud (yet — that's for the multi-device phase)
- Errors are logged to console, not shown to the user
- No retry logic (fire-and-forget)

### Sync Functions (`src/shared/lib/sync.ts`)

```typescript
// Push preferences to user_preferences table
async function syncPreferences(userId: string, prefs: PreferencesSnapshot): Promise<void>

// Push meal plan to meal_plans + meal_slots tables
async function syncMealPlan(householdId: string, userId: string, plan: MealPlan): Promise<void>
```

#### syncPreferences
- Upsert into `user_preferences` table with `user_id = userId`
- Maps local preference fields to DB columns: `dietType` → `diet_type`, `allergens` → `allergies`, etc.
- Called after any preference change in `usePreferencesStore`

#### syncMealPlan
- Upsert into `meal_plans` table with `household_id` and `week_start_date`
- Delete existing `meal_slots` for the plan, then insert new ones
- Maps local `MealSlot` fields to DB columns
- Called after `regeneratePlan()` completes in `useMealPlanStore`

### Triggering Sync

- `usePreferencesStore` — subscribe to state changes, call `syncPreferences()` when preferences change (debounced, skip if no userId)
- `useMealPlanStore` — after `regeneratePlan()` succeeds, call `syncMealPlan()` (skip if no userId/householdId)

## What Does NOT Sync

- Shopping list check state (local only — realtime sync is next phase)
- Recipe/ingredient catalogue (stays as local seed data)
- Language preference (local-only UI setting)
- Read-back from cloud on app load (no pull, only push)

## Files

### New
- `src/shared/lib/supabase.ts` — Supabase client singleton
- `src/shared/store/useAuthStore.ts` — Auth state + anonymous sign-in + household creation
- `src/shared/lib/sync.ts` — Push functions for preferences and meal plans

### Modified
- `App.tsx` — Auth initialization wrapper with loading state
- `src/shared/store/usePreferencesStore.ts` — Trigger syncPreferences on changes
- `src/features/meal-plan/store/useMealPlanStore.ts` — Trigger syncMealPlan after generation

### Dependencies
- Install `@supabase/supabase-js`

## Out of Scope

- Email auth / login UI
- Pull data from cloud on load
- Conflict resolution
- Seeding recipes/ingredients into Supabase DB
- Shopping list sync
- Offline queue with retry
