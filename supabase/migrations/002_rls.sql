-- SmartKüche Schema Part 2: Row Level Security
-- Run this in the Supabase SQL Editor AFTER Part 1

-- RLS: households
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "households_select_member" ON households FOR SELECT USING (id IN (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "households_insert_authenticated" ON households FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "households_update_owner" ON households FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "households_delete_owner" ON households FOR DELETE USING (created_by = auth.uid());

-- RLS: users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_self" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_select_same_household" ON users FOR SELECT USING (household_id IS NOT NULL AND household_id = (SELECT household_id FROM users AS me WHERE me.id = auth.uid()));
CREATE POLICY "users_update_self" ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- RLS: user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_preferences_select_self" ON user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_self" ON user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_self" ON user_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_delete_self" ON user_preferences FOR DELETE USING (user_id = auth.uid());

-- RLS: ingredients (readable by all authenticated, admin-write)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_select_authenticated" ON ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ingredients_insert_admin" ON ingredients FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "ingredients_update_admin" ON ingredients FOR UPDATE USING ((auth.jwt() ->> 'user_role') = 'admin') WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "ingredients_delete_admin" ON ingredients FOR DELETE USING ((auth.jwt() ->> 'user_role') = 'admin');

-- RLS: recipes (readable by all authenticated, admin-write)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_select_authenticated" ON recipes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "recipes_insert_admin" ON recipes FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "recipes_update_admin" ON recipes FOR UPDATE USING ((auth.jwt() ->> 'user_role') = 'admin') WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "recipes_delete_admin" ON recipes FOR DELETE USING ((auth.jwt() ->> 'user_role') = 'admin');

-- RLS: recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_ingredients_select_authenticated" ON recipe_ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "recipe_ingredients_insert_admin" ON recipe_ingredients FOR INSERT WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "recipe_ingredients_update_admin" ON recipe_ingredients FOR UPDATE USING ((auth.jwt() ->> 'user_role') = 'admin') WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "recipe_ingredients_delete_admin" ON recipe_ingredients FOR DELETE USING ((auth.jwt() ->> 'user_role') = 'admin');

-- RLS: meal_plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_plans_select_household_member" ON meal_plans FOR SELECT USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "meal_plans_insert_household_member" ON meal_plans FOR INSERT WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "meal_plans_update_household_member" ON meal_plans FOR UPDATE USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())) WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "meal_plans_delete_creator" ON meal_plans FOR DELETE USING (created_by = auth.uid());

-- RLS: meal_slots
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_slots_select_household_member" ON meal_slots FOR SELECT USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "meal_slots_insert_household_member" ON meal_slots FOR INSERT WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "meal_slots_update_household_member" ON meal_slots FOR UPDATE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()))) WITH CHECK (meal_plan_id IN (SELECT id FROM meal_plans WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "meal_slots_delete_household_member" ON meal_slots FOR DELETE USING (meal_plan_id IN (SELECT id FROM meal_plans WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));

-- RLS: shopping_lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_lists_select_household_member" ON shopping_lists FOR SELECT USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "shopping_lists_insert_household_member" ON shopping_lists FOR INSERT WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "shopping_lists_update_household_member" ON shopping_lists FOR UPDATE USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())) WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "shopping_lists_delete_household_member" ON shopping_lists FOR DELETE USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));

-- RLS: shopping_list_items
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_list_items_select_household_member" ON shopping_list_items FOR SELECT USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "shopping_list_items_insert_household_member" ON shopping_list_items FOR INSERT WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "shopping_list_items_update_household_member" ON shopping_list_items FOR UPDATE USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()))) WITH CHECK (shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));
CREATE POLICY "shopping_list_items_delete_household_member" ON shopping_list_items FOR DELETE USING (shopping_list_id IN (SELECT id FROM shopping_lists WHERE household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())));

-- RLS: pantry_items
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pantry_items_select_household_member" ON pantry_items FOR SELECT USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "pantry_items_insert_household_member" ON pantry_items FOR INSERT WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()) AND added_by = auth.uid());
CREATE POLICY "pantry_items_update_household_member" ON pantry_items FOR UPDATE USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid())) WITH CHECK (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "pantry_items_delete_household_member" ON pantry_items FOR DELETE USING (household_id = (SELECT household_id FROM users WHERE users.id = auth.uid()));
