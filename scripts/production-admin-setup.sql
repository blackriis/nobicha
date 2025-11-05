-- Production Admin User Setup
-- ⚠️ รันบน Supabase SQL Editor ของ Production Project เท่านั้น!
-- ⚠️ อย่ารันบน development database!

-- สร้าง Admin User สำหรับ Production
-- เปลี่ยน email และ password เป็นของจริง

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@your-company.com', -- ⚠️ เปลี่ยนเป็น email จริง
  crypt('ChangeThisPassword123!', gen_salt('bf')), -- ⚠️ เปลี่ยนเป็น password ที่ปลอดภัย (อย่างน้อย 12 ตัวอักษร)
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"role": "admin", "full_name": "Admin User"}'::jsonb, -- ⚠️ เปลี่ยน full_name ตามต้องการ
  false,
  'authenticated'
);

-- เพิ่มข้อมูลใน users table
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  role, 
  employee_code, 
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  (raw_user_meta_data->>'full_name')::text,
  'admin',
  'ADMIN001', -- ⚠️ เปลี่ยนรหัสพนักงานตามต้องการ
  'active',
  now(),
  now()
FROM auth.users
WHERE email = 'admin@your-company.com'; -- ⚠️ ต้องตรงกับ email ด้านบน

-- ตรวจสอบว่าสร้างสำเร็จ
SELECT 
  u.email,
  u.full_name,
  u.role,
  u.employee_code,
  u.status
FROM public.users u
WHERE u.email = 'admin@your-company.com'; -- ⚠️ ต้องตรงกับ email ด้านบน

-- สร้าง Additional Admin Users (Optional)
-- คัดลอกและแก้ไข section ด้านบนสำหรับ admin users เพิ่มเติม

-- Example: Manager User
/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'manager@your-company.com',
  crypt('ChangeThisPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"role": "admin", "full_name": "Manager Name"}'::jsonb,
  false,
  'authenticated'
);

INSERT INTO public.users (id, email, full_name, role, employee_code, status, created_at, updated_at)
SELECT id, email, (raw_user_meta_data->>'full_name')::text, 'admin', 'MGR001', 'active', now(), now()
FROM auth.users WHERE email = 'manager@your-company.com';
*/

-- ✅ หมายเหตุ:
-- 1. เปลี่ยน email, password, full_name, employee_code ทุกตัวก่อนรัน
-- 2. ใช้ password ที่แข็งแรง: อย่างน้อย 12 ตัวอักษร มี uppercase, lowercase, ตัวเลข และ symbols
-- 3. เก็บ credentials ไว้ในที่ปลอดภัย (1Password, LastPass, ฯลฯ)
-- 4. อย่า commit file นี้พร้อม credentials จริงเข้า git

