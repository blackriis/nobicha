-- Seed database with test data for employee management system
-- Run this script in Supabase SQL Editor

-- Insert test branches
INSERT INTO branches (id, name, address, latitude, longitude) VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'สาขาสีลม', '123 ถนนสีลม กรุงเทพฯ', 13.728, 100.534),
  ('b2222222-2222-2222-2222-222222222222', 'สาขาสุขุมวิท', '456 ถนนสุขุมวิท กรุงเทพฯ', 13.736, 100.560),
  ('b3333333-3333-3333-3333-333333333333', 'สาขาจตุจักร', '789 ถนนพหลโยธิน กรุงเทพฯ', 13.813, 100.553)
ON CONFLICT (id) DO NOTHING;

-- Insert test raw materials
INSERT INTO raw_materials (id, name, unit, cost_per_unit, supplier, is_active) VALUES 
  ('m1111111-1111-1111-1111-111111111111', 'แป้งสาลี', 'กิโลกรัม', 25.00, 'บริษัท อาหารใส', true),
  ('m2222222-2222-2222-2222-222222222222', 'น้ำตาล', 'กิโลกรัม', 30.00, 'บริษัท หวานมาก', true),
  ('m3333333-3333-3333-3333-333333333333', 'เนื้อไก่', 'กิโลกรัม', 120.00, 'ฟาร์มไก่ดี', true)
ON CONFLICT (id) DO NOTHING;

-- Create test users in auth.users first (this would normally be done through Supabase Auth signup)
-- NOTE: These users need to be created through Supabase Auth signup process, 
-- but we can insert the profile data assuming they exist

-- Insert test user profiles (assuming auth users exist)
INSERT INTO users (id, email, full_name, role, branch_id, employee_id, phone_number, hire_date, is_active) VALUES 
  ('u1111111-1111-1111-1111-111111111111', 'employee@example.com', 'พนักงาน ทดสอบ', 'employee', 'b1111111-1111-1111-1111-111111111111', 'EMP001', '0812345678', '2024-01-01', true),
  ('u2222222-2222-2222-2222-222222222222', 'admin@example.com', 'ผู้จัดการ ระบบ', 'admin', 'b1111111-1111-1111-1111-111111111111', 'ADM001', '0812345679', '2024-01-01', true),
  ('u3333333-3333-3333-3333-333333333333', 'employee2@example.com', 'พนักงาน ทดสอบ 2', 'employee', 'b2222222-2222-2222-2222-222222222222', 'EMP002', '0812345680', '2024-01-02', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test work shifts
INSERT INTO work_shifts (id, branch_id, shift_name, start_time, end_time, days_of_week, is_active) VALUES 
  ('s1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'กะเช้า', '08:00:00', '16:00:00', '{1,2,3,4,5}', true),
  ('s2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'กะบ่าย', '16:00:00', '00:00:00', '{1,2,3,4,5}', true),
  ('s3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'กะเต็มวัน', '09:00:00', '18:00:00', '{1,2,3,4,5,6}', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test time entries (check-ins)
INSERT INTO time_entries (id, user_id, branch_id, check_in_time, check_out_time, selfie_url, total_hours) VALUES 
  ('t1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '2025-09-15 08:00:00+07', '2025-09-15 16:00:00+07', 'https://example.com/selfie1.jpg', 8.0),
  ('t2222222-2222-2222-2222-222222222222', 'u3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', '2025-09-15 09:00:00+07', NULL, 'https://example.com/selfie2.jpg', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert test sales reports
INSERT INTO sales_reports (id, branch_id, user_id, report_date, total_sales, slip_image_url) VALUES 
  ('sr111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '2025-09-14', 15000.00, 'https://example.com/slip1.jpg'),
  ('sr222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'u3333333-3333-3333-3333-333333333333', '2025-09-14', 8500.00, 'https://example.com/slip2.jpg')
ON CONFLICT (id) DO NOTHING;

-- Verify data was inserted
SELECT 'Branches:' as table_name, count(*) as count FROM branches
UNION ALL
SELECT 'Users:', count(*) FROM users  
UNION ALL
SELECT 'Raw Materials:', count(*) FROM raw_materials
UNION ALL
SELECT 'Work Shifts:', count(*) FROM work_shifts
UNION ALL
SELECT 'Time Entries:', count(*) FROM time_entries
UNION ALL
SELECT 'Sales Reports:', count(*) FROM sales_reports;