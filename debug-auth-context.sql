-- Debug Authentication Context and RLS
-- ตรวจสอบ auth context และ user permissions แบบละเอียด

-- 1. Check current auth context
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- 2. Check if user exists in users table
SELECT 
    u.id,
    u.email, 
    u.full_name,
    u.role,
    u.is_active
FROM users u 
WHERE u.id = auth.uid();

-- 3. Check available branches
SELECT id, name FROM branches LIMIT 3;

-- 4. Test simple INSERT with debug info
DO $$
DECLARE
    current_user_uuid UUID;
    first_branch_uuid UUID;
    test_result TEXT;
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_uuid;
    RAISE NOTICE 'Current user ID: %', current_user_uuid;
    
    -- Get first branch
    SELECT id INTO first_branch_uuid FROM branches LIMIT 1;
    RAISE NOTICE 'Using branch ID: %', first_branch_uuid;
    
    -- Check if user can read their own data first
    SELECT 'Can read user data' INTO test_result
    FROM users WHERE id = current_user_uuid;
    RAISE NOTICE 'User read test: %', COALESCE(test_result, 'FAILED - Cannot read user data');
    
    -- Try to check existing time entries
    SELECT 'Has existing time entries: ' || COUNT(*)::text INTO test_result
    FROM time_entries WHERE user_id = current_user_uuid;
    RAISE NOTICE 'Existing time entries: %', test_result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in debug: %', SQLERRM;
END $$;

-- 5. Try a minimal INSERT test
-- INSERT INTO time_entries (user_id, branch_id, check_in_time) 
-- SELECT auth.uid(), (SELECT id FROM branches LIMIT 1), now()
-- WHERE auth.uid() IS NOT NULL;