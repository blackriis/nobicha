-- Fix RLS policy for branches table to allow service role access
-- This fixes the "Branch not found" error during check-out

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view branches" ON branches;
DROP POLICY IF EXISTS "Users and service role can view branches" ON branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;

-- Create new policy that allows both authenticated users AND service role to read branches
CREATE POLICY "Users and service role can view branches" ON branches
  FOR SELECT USING (
    -- Regular authenticated sessions
    auth.uid() IS NOT NULL
    OR
    -- Supabase service role (PostgREST fallback + auth helper)
    auth.role() = 'service_role'
    OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Allow service role to perform privileged operations alongside admins
CREATE POLICY "Admins can manage branches" ON branches
  FOR ALL
  USING (
    -- Direct service role access (bypasses auth.uid())
    auth.role() = 'service_role'
    OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Existing admin check
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
