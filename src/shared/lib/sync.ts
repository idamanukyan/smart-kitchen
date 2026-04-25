import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { MealPlan } from '../../features/shopping-list/types';

interface PreferencesSnapshot {
  dietType: string;
  allergens: string[];
  maxCookingTimeMinutes: number | null;
  preferredStore: string;
  householdSize: number;
}

export async function syncPreferences(prefs: PreferencesSnapshot): Promise<void> {
  const userId = useAuthStore.getState().userId;
  if (!userId) return;

  try {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        diet_type: prefs.dietType,
        allergies: prefs.allergens,
        max_cooking_time_minutes: prefs.maxCookingTimeMinutes,
        budget_mode: 'normal',
      }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('syncPreferences error:', err);
  }
}

export async function syncMealPlan(plan: MealPlan): Promise<void> {
  const { userId, householdId } = useAuthStore.getState();
  if (!userId || !householdId) return;

  try {
    // Upsert meal plan
    const { data: planRow, error: planError } = await supabase
      .from('meal_plans')
      .upsert({
        household_id: householdId,
        created_by: userId,
        week_start_date: plan.week_start_date,
        status: plan.status ?? 'active',
      }, { onConflict: 'household_id,week_start_date' })
      .select('id')
      .single();

    if (planError || !planRow) {
      console.error('syncMealPlan error (plan):', planError?.message);
      return;
    }

    // Delete existing slots for this plan
    await supabase
      .from('meal_slots')
      .delete()
      .eq('meal_plan_id', planRow.id);

    // Insert new slots
    const slots = plan.slots.map(slot => ({
      meal_plan_id: planRow.id,
      day_of_week: slot.day_of_week,
      meal_type: slot.meal_type,
      recipe_id: slot.recipe_id,
      is_locked: slot.is_locked,
      servings_override: slot.servings_override,
    }));

    if (slots.length > 0) {
      const { error: slotsError } = await supabase
        .from('meal_slots')
        .insert(slots);

      if (slotsError) {
        console.error('syncMealPlan error (slots):', slotsError.message);
      }
    }
  } catch (err) {
    console.error('syncMealPlan error:', err);
  }
}
