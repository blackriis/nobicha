-- Fix infinite recursion in RLS policies for users table
-- This happens when policies reference themselves in a loop

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Disable RLS temporarily to fix the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Allow service role to access all data (for API calls)
CREATE POLICY "Service role can access all users" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Allow authenticated users to view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 3: Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Allow authenticated users to insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 5: Admin can view all users (simple check without recursion)
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Verify policies are created
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
