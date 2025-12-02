-- Seed Test Users for Development and Testing
-- This file creates test user accounts for Admin and Employee roles

-- ============================================================================
-- TEST BRANCHES DATA
-- ============================================================================

INSERT INTO branches (id, name, address, latitude, longitude) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'สาขาสีลม', '123 ถนนสีลม บางรัก กรุงเทพมหานคร 10500', 13.7563, 100.5018),
  ('00000000-0000-0000-0000-000000000002', 'สาขาสุขุมวิท', '456 ถนนสุขุมวิท วัฒนา กรุงเทพมหานคร 10110', 13.7398, 100.5612),
  ('00000000-0000-0000-0000-000000000003', 'สาขาจตุจักร', '789 ถนนพหลโยธิน จตุจักร กรุงเทพมหานคร 10900', 13.8077, 100.5538);

-- ============================================================================
-- WORK SHIFTS DATA
-- ============================================================================

INSERT INTO work_shifts (branch_id, shift_name, start_time, end_time, days_of_week) VALUES 
  -- สาขาสีลม
  ('00000000-0000-0000-0000-000000000001', 'กะเช้า', '08:00:00', '16:00:00', '{1,2,3,4,5}'),
  ('00000000-0000-0000-0000-000000000001', 'กะบ่าย', '14:00:00', '22:00:00', '{1,2,3,4,5}'),
  ('00000000-0000-0000-0000-000000000001', 'กะวันหยุด', '09:00:00', '17:00:00', '{0,6}'),
  
  -- สาขาสุขุมวิท  
  ('00000000-0000-0000-0000-000000000002', 'กะเช้า', '08:30:00', '16:30:00', '{1,2,3,4,5}'),
  ('00000000-0000-0000-0000-000000000002', 'กะบ่าย', '13:30:00', '21:30:00', '{1,2,3,4,5}'),
  
  -- สาขาจตุจักร
  ('00000000-0000-0000-0000-000000000003', 'กะเช้า', '09:00:00', '17:00:00', '{1,2,3,4,5}'),
  ('00000000-0000-0000-0000-000000000003', 'กะดึก', '21:00:00', '05:00:00', '{5,6,0}');

-- ============================================================================
-- RAW MATERIALS DATA
-- ============================================================================

INSERT INTO raw_materials (name, unit, cost_per_unit, supplier, description) VALUES 
  ('น้ำ', 'ลิตร', 2.50, 'บริษัท น้ำดี จำกัด', 'น้ำดื่มสำหรับผลิตเครื่องดื่ม'),
  ('น้ำตาล', 'กิโลกรัม', 25.00, 'มิตรผล', 'น้ำตาลทรายขาว'),
  ('กาแฟ', 'กิโลกรัม', 450.00, 'คาเฟ่ เบลนด์', 'เมล็ดกาแฟอาราบิก้า'),
  ('นม', 'ลิตร', 42.00, 'ไดรี่ ฟาร์ม', 'นมสด 3.25%'),
  ('ถ้วยกระดาษ', 'ใบ', 1.20, 'แพค แอนด์ เซิร์ฟ', 'ถ้วยกระดาษ 12 oz'),
  ('ฝาปิด', 'ใบ', 0.80, 'แพค แอนด์ เซิร์ฟ', 'ฝาปิดถ้วยกระดาษ');

-- ============================================================================
-- NOTE: Test users should be created through the authentication system
-- The following are the credentials that should be used when creating accounts:
-- ============================================================================

-- TEST ADMIN ACCOUNTS:
-- Email: admin@test.com
-- Password: SecureAdmin2024!@#
-- Full Name: ผู้ดูแลระบบ (Admin)  
-- Role: admin

-- Email: manager.silom@test.com  
-- Password: Manager123!
-- Full Name: วิชัย จันทร์แสง (ผู้จัดการสาขาสีลม)
-- Role: admin
-- Branch: สาขาสีลม

-- TEST EMPLOYEE ACCOUNTS:
-- Email: employee.som@test.com
-- Password: Employee123!
-- Full Name: สมใจ ใจดี (พนักงานสาขาสีลม)
-- Role: employee  
-- Branch: สาขาสีลม
-- Employee ID: EMP001

-- Email: employee.malee@test.com
-- Password: Employee123!
-- Full Name: มาลี ดีใจ (พนักงานสาขาสุขุมวิท)
-- Role: employee
-- Branch: สาขาสุขุมวิท  
-- Employee ID: EMP002

-- Email: employee.chai@test.com
-- Password: Employee123!
-- Full Name: ชาย กล้าหาญ (พนักงานสาขาจตุจักร)
-- Role: employee
-- Branch: สาขาจตุจักร
-- Employee ID: EMP003

-- Email: employee.nina@test.com
-- Password: Employee123!  
-- Full Name: นิน่า สวยงาม (พนักงานหลายสาขา)
-- Role: employee
-- Branch: null (สามารถทำงานหลายสาขา)
-- Employee ID: EMP004

-- ============================================================================
-- MANUAL PROFILE INSERTION (Use only if automatic trigger doesn't work)
-- ============================================================================


-- If the automatic trigger doesn't create profiles, manually insert:
INSERT INTO users (id, email, full_name, role, branch_id, employee_id, phone_number, hire_date) VALUES 
  -- Admin accounts (UUIDs should match Supabase auth.users)
  ('admin-uuid-from-auth', 'admin@test.com', 'ผู้ดูแลระบบ (Admin)', 'admin', NULL, NULL, '021234567', CURRENT_DATE),
  ('manager-silom-uuid', 'manager.silom@test.com', 'วิชัย จันทร์แสง', 'admin', '00000000-0000-0000-0000-000000000001', 'MGR001', '021234568', CURRENT_DATE),
  
  -- Employee accounts  
  ('employee-som-uuid', 'employee.som@test.com', 'สมใจ ใจดี', 'employee', '00000000-0000-0000-0000-000000000001', 'EMP001', '0812345671', CURRENT_DATE - INTERVAL '1 year'),
  ('employee-malee-uuid', 'employee.malee@test.com', 'มาลี ดีใจ', 'employee', '00000000-0000-0000-0000-000000000002', 'EMP002', '0812345672', CURRENT_DATE - INTERVAL '8 months'),
  ('employee-chai-uuid', 'employee.chai@test.com', 'ชาย กล้าหาญ', 'employee', '00000000-0000-0000-0000-000000000003', 'EMP003', '0812345673', CURRENT_DATE - INTERVAL '6 months'),
  ('employee-nina-uuid', 'employee.nina@test.com', 'นิน่า สวยงาม', 'employee', NULL, 'EMP004', '0812345674', CURRENT_DATE - INTERVAL '3 months');

