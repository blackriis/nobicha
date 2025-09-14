-- Fix RLS Policy Infinite Recursion Issue

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all" ON users;

-- Create correct policies without recursive reference
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Admin policy that doesn't cause recursion
-- Use auth.jwt() to get role from JWT token instead of querying users table
CREATE POLICY "Service role can access all users" 
ON users FOR ALL 
USING (auth.role() = 'service_role');

-- Alternative: Allow authenticated users to read other users (can be restricted later)
CREATE POLICY "Authenticated users can view users" 
ON users FOR SELECT 
USING (auth.role() = 'authenticated');

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;