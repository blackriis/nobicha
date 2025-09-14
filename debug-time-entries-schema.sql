-- Debug Time Entries Schema and RLS Issues
-- ตรวจสอบ schema และ RLS policies ที่เป็นปัญหา

-- 1. Check current time_entries table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current RLS policies on time_entries
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'time_entries';

-- 3. Check if check_in_selfie_url is NOT NULL constraint
SELECT 
    a.attname AS column_name,
    a.attnotnull AS is_not_null,
    pg_get_expr(d.adbin, d.adrelid) AS default_value
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
WHERE a.attrelid = 'public.time_entries'::regclass
AND a.attnum > 0
AND NOT a.attisdropped
AND a.attname LIKE '%selfie%'
ORDER BY a.attnum;

-- 4. Test INSERT permission (this will show the exact RLS error)
-- EXPLAIN (ANALYZE, BUFFERS) 
-- INSERT INTO time_entries (user_id, branch_id, check_in_time, check_in_selfie_url) 
-- VALUES (auth.uid(), 'test-branch-id', now(), 'test-url');