-- Fix branches RLS to allow service role access (more robust approach)
-- This ensures service role client can read branches without RLS blocking

-- Drop all existing policies on branches
DROP POLICY IF EXISTS "Users can view branches" ON branches;
DROP POLICY IF EXISTS "Users and service role can view branches" ON branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;

-- Method 1: Policy that explicitly allows service_role role
-- This works when using @supabase/supabase-js with service role key
CREATE POLICY "Service role can access branches" ON branches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Method 2: Policy for authenticated users (regular sessions)
CREATE POLICY "Users can view branches" ON branches
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Method 3: Policy for admins to manage branches
CREATE POLICY "Admins can manage branches" ON branches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

