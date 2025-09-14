-- ไฟล์แก้ไข RLS ทันที - รันใน Supabase SQL Editor
-- Fix RLS Infinite Recursion - Run in Supabase SQL Editor

-- ขั้นตอนที่ 1: Disable RLS ทุกตาราง
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS material_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- ขั้นตอนที่ 2: ลบ policies ทั้งหมด
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user creation via service role" ON users;

-- ขั้นตอนที่ 3: ลบ function ที่ทำให้เกิด recursion
DROP FUNCTION IF EXISTS is_admin();

-- ขั้นตอนที่ 4: แสดงสถานะ
SELECT 'RLS Disabled Successfully - Ready for testing' as status;