-- SmartKüche Schema Part 1: Extensions, Enums, Helper Function, Tables
-- Run this in the Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enums
CREATE TYPE preferred_store_enum AS ENUM ('REWE','EDEKA','Lidl','Aldi','Kaufland','Other');
CREATE TYPE diet_type_enum AS ENUM ('omnivor','flexitarisch','vegetarisch','vegan','pescetarisch');
CREATE TYPE budget_mode_enum AS ENUM ('normal','sparwoche');
CREATE TYPE ingredient_category_enum AS ENUM ('Obst & Gemüse','Fleisch & Wurst','Milchprodukte','Kühlregal','Tiefkühl','Konserven & Gläser','Backzutaten','Gewürze & Öle','Getränke','Brot & Backwaren','Süßwaren & Snacks','Sonstiges');
CREATE TYPE unit_enum AS ENUM ('g','kg','ml','l','Stück','Bund','Packung','Dose','Becher','Tüte');
CREATE TYPE storage_type_enum AS ENUM ('Kühlschrank','Tiefkühler','Vorratskammer','Raumtemperatur');
CREATE TYPE difficulty_enum AS ENUM ('einfach','mittel','anspruchsvoll');
CREATE TYPE cost_rating_enum AS ENUM ('günstig','mittel','gehoben');
CREATE TYPE meal_plan_status_enum AS ENUM ('draft','active','completed');
CREATE TYPE shopping_list_status_enum AS ENUM ('draft','shopping','completed');

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- households
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 1 CHECK (size BETWEEN 1 AND 20),
  created_by UUID NOT NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households (invite_code);

-- users (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  household_id UUID REFERENCES households (id) ON DELETE SET NULL,
  preferred_store preferred_store_enum NOT NULL DEFAULT 'REWE',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_users_household_id ON users (household_id);

-- Auto-create users row on auth signup
CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO public.users (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  diet_type diet_type_enum NOT NULL DEFAULT 'omnivor',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  excluded_ingredients TEXT[] NOT NULL DEFAULT '{}',
  max_cooking_time_minutes INTEGER CHECK (max_cooking_time_minutes > 0),
  budget_mode budget_mode_enum NOT NULL DEFAULT 'normal',
  weekly_budget_cents INTEGER CHECK (weekly_budget_cents IS NULL OR weekly_budget_cents > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_de TEXT NOT NULL,
  category ingredient_category_enum NOT NULL,
  default_unit unit_enum NOT NULL,
  common_package_sizes JSONB NOT NULL DEFAULT '{}',
  shelf_life_days INTEGER CHECK (shelf_life_days IS NULL OR shelf_life_days > 0),
  storage_type storage_type_enum NOT NULL DEFAULT 'Raumtemperatur',
  is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
  season_months INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT season_months_valid CHECK (season_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::INTEGER[])
);
CREATE TRIGGER ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients (category);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_de_trgm ON ingredients USING gin (name_de gin_trgm_ops);

-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_de TEXT NOT NULL,
  description_de TEXT,
  instructions_de JSONB NOT NULL DEFAULT '[]',
  prep_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (cook_time_minutes >= 0),
  difficulty difficulty_enum NOT NULL DEFAULT 'einfach',
  servings_default INTEGER NOT NULL DEFAULT 4 CHECK (servings_default BETWEEN 1 AND 20),
  meal_type TEXT[] NOT NULL DEFAULT '{}',
  diet_tags TEXT[] NOT NULL DEFAULT '{}',
  cost_rating cost_rating_enum NOT NULL DEFAULT 'mittel',
  cost_estimate_cents_per_serving INTEGER CHECK (cost_estimate_cents_per_serving IS NULL OR cost_estimate_cents_per_serving > 0),
  image_url TEXT,
  source_attribution TEXT,
  is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
  season_months INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fts_de TSVECTOR GENERATED ALWAYS AS (to_tsvector('german', coalesce(title_de, '') || ' ' || coalesce(description_de, ''))) STORED,
  CONSTRAINT season_months_valid CHECK (season_months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::INTEGER[])
);
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_recipes_fts_de ON recipes USING gin (fts_de);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes USING gin (meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_diet_tags ON recipes USING gin (diet_tags);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes (difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_cost_rating ON recipes (cost_rating);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes ((prep_time_minutes + cook_time_minutes));

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  unit TEXT NOT NULL,
  preparation_note TEXT,
  UNIQUE (recipe_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients (recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients (ingredient_id);

-- meal_plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE SET NULL,
  week_start_date DATE NOT NULL,
  status meal_plan_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, week_start_date)
);
CREATE TRIGGER meal_plans_updated_at BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_meal_plans_household_id ON meal_plans (household_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans (status);

-- meal_slots
CREATE TABLE IF NOT EXISTS meal_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans (id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes (id) ON DELETE SET NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  servings_override SMALLINT CHECK (servings_override IS NULL OR servings_override BETWEEN 1 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meal_plan_id, day_of_week, meal_type)
);
CREATE TRIGGER meal_slots_updated_at BEFORE UPDATE ON meal_slots FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_meal_slots_meal_plan_id ON meal_slots (meal_plan_id);

-- shopping_lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans (id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  status shopping_list_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meal_plan_id)
);
CREATE TRIGGER shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- shopping_list_items (Realtime enabled)
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists (id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients (id) ON DELETE SET NULL,
  amount_needed NUMERIC NOT NULL CHECK (amount_needed > 0),
  unit TEXT NOT NULL,
  display_text TEXT NOT NULL,
  aisle_category TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by UUID REFERENCES users (id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER shopping_list_items_updated_at BEFORE UPDATE ON shopping_list_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;

-- pantry_items (Phase 2)
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  unit TEXT NOT NULL,
  expires_at DATE,
  added_by UUID NOT NULL REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER pantry_items_updated_at BEFORE UPDATE ON pantry_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
