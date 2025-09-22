-- Check RLS status for users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check policies for users table
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';
