-- 🚨 การแก้ไข RLS Policy Infinite Recursion (42P17)
-- ปัญหา: Policy "Admins can view all" อ้างอิงตัวเอง
-- วิธีแก้: ใช้ auth.jwt() แทนการอ้างอิง users table

-- ===== ขั้นตอนที่ 1: ตรวจสอบ policies ที่เป็นปัญหา =====
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- ===== ขั้นตอนที่ 2: ลบ policy ที่เป็นปัญหา =====
DROP POLICY IF EXISTS "Admins can view all" ON users;

-- ===== ขั้นตอนที่ 3: สร้าง policies ใหม่ที่ไม่มี infinite recursion =====

-- Policy สำหรับ user ดูข้อมูลตัวเอง
CREATE POLICY "users_select_own" ON users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy สำหรับ user แก้ไขข้อมูลตัวเอง  
CREATE POLICY "users_update_own" ON users 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy สำหรับ admin ดูข้อมูลทุกคน (ใช้ auth.jwt() แทน users table)
CREATE POLICY "admin_select_all" ON users 
FOR SELECT 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  OR 
  auth.uid() = id  -- fallback: ดูข้อมูลตัวเองได้เสมอ
);

-- Policy สำหรับ admin แก้ไขข้อมูลทุกคน
CREATE POLICY "admin_update_all" ON users 
FOR UPDATE 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  OR 
  auth.uid() = id  -- fallback: แก้ไขข้อมูลตัวเองได้เสมอ
);

-- Policy สำหรับสร้าง user profile ใหม่ (เมื่อ sign up)
CREATE POLICY "users_insert_own" ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ===== ขั้นตอนที่ 4: ตรวจสอบ policies ใหม่ =====
SELECT 
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- ===== ขั้นตอนที่ 5: ทดสอบ policy logic =====
-- ทดสอบว่าไม่มี infinite recursion
DO $$ 
BEGIN
    RAISE NOTICE 'Testing policies...';
    RAISE NOTICE 'auth.uid(): %', auth.uid();
    RAISE NOTICE 'auth.jwt() role: %', (auth.jwt() ->> 'role');
END $$;

-- หมายเหตุ: หลังจากรัน SQL นี้แล้ว ให้อัพเดต user metadata ใน Supabase Auth
-- เพื่อให้ auth.jwt() ->> 'role' ส่งคืนค่าที่ถูกต้อง