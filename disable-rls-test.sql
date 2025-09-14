-- Temporarily disable RLS for testing
-- ปิด RLS ชั่วคราวเพื่อทดสอบว่าปัญหาอยู่ที่ RLS หรือไม่

-- Disable RLS on time_entries temporarily
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;

-- Test INSERT
INSERT INTO time_entries (user_id, branch_id, check_in_time) 
SELECT 
    (SELECT id FROM users LIMIT 1), 
    (SELECT id FROM branches LIMIT 1), 
    now();

-- Check if INSERT worked
SELECT 'INSERT successful - problem is RLS policies' as test_result;

-- Re-enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;