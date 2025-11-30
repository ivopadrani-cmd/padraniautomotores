-- Fix RLS policies to allow initial login
-- This allows unauthenticated users to read the users table for login purposes

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new permissive policies for users table
CREATE POLICY "Anyone can read users for login"
  ON users FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin_or_manager());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin_or_manager());

-- Fix exchange_rates policies
DROP POLICY IF EXISTS "Authenticated users can view exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can insert exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can update exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can delete exchange_rates" ON exchange_rates;

CREATE POLICY "Anyone can read exchange_rates"
  ON exchange_rates FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert exchange_rates"
  ON exchange_rates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exchange_rates"
  ON exchange_rates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exchange_rates"
  ON exchange_rates FOR DELETE
  USING (auth.role() = 'authenticated');

