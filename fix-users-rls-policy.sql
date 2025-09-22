-- Fix RLS policy for users table to allow admin access
-- First, check current policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Create new policies
-- Policy 1: Admin can view all users
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Policy 2: Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: Allow service role to access all data
CREATE POLICY "Service role can access all data" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Verify policies were created
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
