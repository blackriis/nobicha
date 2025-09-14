-- 🚨 การแก้ไข RLS Policy Infinite Recursion (42P17)
-- ปัญหา: Policy "Admins can view all" อ้างอิงตัวเอง ทำให้เกิด infinite recursion
-- แก้โดย: ใช้ auth.jwt() แทนการ query users table

-- ===== ขั้นตอนที่ 1: ตรวจสอบ policies ปัจจุบัน =====
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

-- ===== ขั้นตอนที่ 2: ลบ policy ที่มี infinite recursion =====
-- Policy นี้เป็นสาเหตุของ 42P17 error
DROP POLICY IF EXISTS "Admins can view all" ON users;

-- ===== ขั้นตอนที่ 3: ลบ policies อื่นที่อาจซ้ำซ้อน =====
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ===== ขั้นตอนที่ 4: สร้าง policies ใหม่ (ไม่มี recursion) =====

-- Policy สำหรับ user ดูข้อมูลตัวเอง
CREATE POLICY "users_select_own" ON users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy สำหรับ user แก้ไขข้อมูลตัวเอง  
CREATE POLICY "users_update_own" ON users 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy สำหรับ user สร้าง profile ใหม่ (เมื่อ sign up)
CREATE POLICY "users_insert_own" ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy สำหรับ admin ดูข้อมูลทุกคน (ใช้ JWT แทน users table)
CREATE POLICY "admin_select_all" ON users 
FOR SELECT 
USING (
  -- ใช้ auth.jwt() เพื่อหลีกเลี่ยง infinite recursion
  (auth.jwt() ->> 'role')::text = 'admin'
  OR 
  auth.uid() = id  -- fallback: user ดูข้อมูลตัวเองได้เสมอ
);

-- Policy สำหรับ admin แก้ไขข้อมูลทุกคน
CREATE POLICY "admin_update_all" ON users 
FOR UPDATE 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  OR 
  auth.uid() = id  -- fallback: user แก้ไขข้อมูลตัวเองได้เสมอ
);

-- Policy สำหรับ admin จัดการทุก operation
CREATE POLICY "admin_all_operations" ON users 
FOR ALL 
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- ===== ขั้นตอนที่ 5: ตรวจสอบ policies ใหม่ =====
SELECT 
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- ===== ขั้นตอนที่ 6: ทดสอบไม่มี recursion =====
-- Test case จำลอง
DO $$ 
BEGIN
    RAISE NOTICE 'Testing JWT role access...';
    RAISE NOTICE 'Current auth.uid(): %', auth.uid();
    RAISE NOTICE 'JWT role field: %', (auth.jwt() ->> 'role');
    RAISE NOTICE 'Policies should work without infinite recursion now.';
END $$;

-- ===== หมายเหตุสำคัญ =====
-- 1. หลังจากรัน SQL นี้แล้ว ต้องอัพเดต user metadata ใน Supabase Auth
--    เพื่อให้ auth.jwt() ->> 'role' ส่งค่าที่ถูกต้อง
-- 2. สำหรับ admin users ต้องมี role = 'admin' ใน user_metadata
-- 3. ทดสอบ login/logout หลังจากแก้เพื่อยืนยันว่า policies ทำงานถูกต้อง