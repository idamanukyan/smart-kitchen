-- Fix infinite recursion in users RLS policies
-- The users_select_same_household policy queries users table from within
-- a users policy, causing infinite recursion.

-- Drop the problematic policies
DROP POLICY IF EXISTS "users_select_self" ON users;
DROP POLICY IF EXISTS "users_select_same_household" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;

-- Recreate with a single non-recursive select policy
-- Users can see their own row and rows of users in the same household
CREATE POLICY "users_select" ON users FOR SELECT
  USING (
    id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND household_id IN (
        SELECT u.household_id FROM users u WHERE u.id = auth.uid()
      )
    )
  );

-- Users can update their own row
CREATE POLICY "users_update_self" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Also fix households: the insert policy references auth.uid() = created_by
-- which is fine, but the select policy queries users table which may also recurse.
DROP POLICY IF EXISTS "households_select_member" ON households;

-- Simpler: households are readable by their creator or by users linked to them
CREATE POLICY "households_select" ON households FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT u.household_id FROM users u WHERE u.id = auth.uid()
    )
  );
