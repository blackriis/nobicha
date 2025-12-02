-- Seed database with test data for Employee Management System
-- This file is automatically run after migrations during `supabase db reset`
-- Use ON CONFLICT to prevent duplicate inserts

-- ============================================================================
-- TEST BRANCHES DATA
-- ============================================================================

INSERT INTO branches (id, name, address, latitude, longitude) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'สาขาสีลม', '123 ถนนสีลม บางรัก กรุงเทพมหานคร 10500', 13.7563, 100.5018),
  ('00000000-0000-0000-0000-000000000002', 'สาขาสุขุมวิท', '456 ถนนสุขุมวิท วัฒนา กรุงเทพมหานคร 10110', 13.7398, 100.5612),
  ('00000000-0000-0000-0000-000000000003', 'สาขาจตุจักร', '789 ถนนพหลโยธิน จตุจักร กรุงเทพมหานคร 10900', 13.8077, 100.5538)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- WORK SHIFTS DATA
-- ============================================================================

-- Insert work shifts (use WHERE NOT EXISTS to prevent duplicates)
INSERT INTO work_shifts (branch_id, shift_name, start_time, end_time, days_of_week)
SELECT * FROM (VALUES
  -- สาขาสีลม
  ('00000000-0000-0000-0000-000000000001'::UUID, 'กะเช้า', '08:00:00'::TIME, '16:00:00'::TIME, '{1,2,3,4,5}'::INTEGER[]),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'กะบ่าย', '14:00:00'::TIME, '22:00:00'::TIME, '{1,2,3,4,5}'::INTEGER[]),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'กะวันหยุด', '09:00:00'::TIME, '17:00:00'::TIME, '{0,6}'::INTEGER[]),
  
  -- สาขาสุขุมวิท  
  ('00000000-0000-0000-0000-000000000002'::UUID, 'กะเช้า', '08:30:00'::TIME, '16:30:00'::TIME, '{1,2,3,4,5}'::INTEGER[]),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'กะบ่าย', '13:30:00'::TIME, '21:30:00'::TIME, '{1,2,3,4,5}'::INTEGER[]),
  
  -- สาขาจตุจักร
  ('00000000-0000-0000-0000-000000000003'::UUID, 'กะเช้า', '09:00:00'::TIME, '17:00:00'::TIME, '{1,2,3,4,5}'::INTEGER[]),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'กะดึก', '21:00:00'::TIME, '05:00:00'::TIME, '{5,6,0}'::INTEGER[])
) AS v(branch_id, shift_name, start_time, end_time, days_of_week)
WHERE NOT EXISTS (
  SELECT 1 FROM work_shifts ws 
  WHERE ws.branch_id = v.branch_id 
    AND ws.shift_name = v.shift_name 
    AND ws.start_time = v.start_time
);

-- ============================================================================
-- RAW MATERIALS DATA
-- ============================================================================

-- Insert raw materials (use WHERE NOT EXISTS to prevent duplicates)
INSERT INTO raw_materials (name, unit, cost_per_unit, supplier, description)
SELECT * FROM (VALUES
  ('น้ำ', 'ลิตร', 2.50, 'บริษัท น้ำดี จำกัด', 'น้ำดื่มสำหรับผลิตเครื่องดื่ม'),
  ('น้ำตาล', 'กิโลกรัม', 25.00, 'มิตรผล', 'น้ำตาลทรายขาว'),
  ('กาแฟ', 'กิโลกรัม', 450.00, 'คาเฟ่ เบลนด์', 'เมล็ดกาแฟอาราบิก้า'),
  ('นม', 'ลิตร', 42.00, 'ไดรี่ ฟาร์ม', 'นมสด 3.25%'),
  ('ถ้วยกระดาษ', 'ใบ', 1.20, 'แพค แอนด์ เซิร์ฟ', 'ถ้วยกระดาษ 12 oz'),
  ('ฝาปิด', 'ใบ', 0.80, 'แพค แอนด์ เซิร์ฟ', 'ฝาปิดถ้วยกระดาษ')
) AS v(name, unit, cost_per_unit, supplier, description)
WHERE NOT EXISTS (
  SELECT 1 FROM raw_materials rm WHERE rm.name = v.name
);

-- ============================================================================
-- NOTE: Test users should be created through Supabase Auth
-- ============================================================================
-- 
-- The following test users need to be created through Supabase Auth signup
-- process. After creating auth users, their profiles will be automatically
-- created via triggers, or you can manually insert them.
--
-- TEST ADMIN ACCOUNTS:
-- Email: admin@test.com
-- Password: SecureAdmin2024!@#
-- Full Name: ผู้ดูแลระบบ (Admin)  
-- Role: admin
--
-- Email: manager.silom@test.com  
-- Password: Manager123!
-- Full Name: วิชัย จันทร์แสง (ผู้จัดการสาขาสีลม)
-- Role: admin
-- Branch: สาขาสีลม
--
-- TEST EMPLOYEE ACCOUNTS:
-- Email: employee.som@test.com
-- Password: Employee123!
-- Full Name: สมใจ ใจดี (พนักงานสาขาสีลม)
-- Role: employee  
-- Branch: สาขาสีลม
-- Employee ID: EMP001
--
-- Email: employee.malee@test.com
-- Password: Employee123!
-- Full Name: มาลี ดีใจ (พนักงานสาขาสุขุมวิท)
-- Role: employee
-- Branch: สาขาสุขุมวิท  
-- Employee ID: EMP002
--
-- Email: employee.chai@test.com
-- Password: Employee123!
-- Full Name: ชาย กล้าหาญ (พนักงานสาขาจตุจักร)
-- Role: employee
-- Branch: สาขาจตุจักร
-- Employee ID: EMP003
--
-- Email: employee.nina@test.com
-- Password: Employee123!  
-- Full Name: นิน่า สวยงาม (พนักงานหลายสาขา)
-- Role: employee
-- Branch: null (สามารถทำงานหลายสาขา)
-- Employee ID: EMP004
--
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify seed data after running:
-- SELECT 'Branches:' as table_name, count(*) as count FROM branches
-- UNION ALL
-- SELECT 'Work Shifts:', count(*) FROM work_shifts
-- UNION ALL
-- SELECT 'Raw Materials:', count(*) FROM raw_materials
-- UNION ALL
-- SELECT 'Users:', count(*) FROM users;

