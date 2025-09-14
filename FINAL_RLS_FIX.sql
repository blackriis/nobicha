-- 🚨 การแก้ไข RLS Policies ขั้นสุดท้าย
-- รันใน Supabase Console > SQL Editor ทีละบล็อก

-- ===== ขั้นตอนที่ 1: ตรวจสอบสถานะปัจจุบัน =====
-- ดู policies ที่มีอยู่
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname ILIKE '%selfies%'
ORDER BY policyname;

-- ตรวจสอบ RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ===== ขั้นตอนที่ 2: ลบ policies เก่าทั้งหมด =====
-- รันทีละบรรทัด เพื่อให้แน่ใจว่าลบหมด
DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Employee upload selfies" ON storage.objects;
DROP POLICY IF EXISTS "Employee view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Secure employee upload" ON storage.objects;
DROP POLICY IF EXISTS "Secure employee download" ON storage.objects;
DROP POLICY IF EXISTS "Secure employee update" ON storage.objects;
DROP POLICY IF EXISTS "Secure employee delete" ON storage.objects;

-- ===== ขั้นตอนที่ 3: ยืนยันว่าลบหมดแล้ว =====
SELECT 
  policyname
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname ILIKE '%selfies%';
-- ผลลัพธ์ควรเป็น: (0 rows)

-- ===== ขั้นตอนที่ 4: เปิด RLS =====
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ===== ขั้นตอนที่ 5: สร้าง policies ใหม่ (แบบง่าย) =====
-- Policy สำหรับ INSERT - ใช้ string matching ที่ชัดเจน
CREATE POLICY "employee_selfie_upload" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    -- ตรวจสอบ path ว่าขึ้นต้นด้วย checkin/{user_id}/ หรือ checkout/{user_id}/
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR 
    name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับ SELECT (ดาวน์โหลด)
CREATE POLICY "employee_selfie_select" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR 
    name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับ UPDATE
CREATE POLICY "employee_selfie_update" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR 
    name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับ DELETE
CREATE POLICY "employee_selfie_delete" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR 
    name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- ===== ขั้นตอนที่ 6: ยืนยันว่า policies ถูกสร้าง =====
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'employee_selfie_%'
ORDER BY policyname;
-- ควรเห็น 4 policies: upload, select, update, delete

-- ===== ขั้นตอนที่ 7: ทดสอบ logic =====
-- ทดสอบว่า policy condition ทำงานถูกต้องหรือไม่
-- แทนที่ USER_ID_HERE ด้วย UUID ของ user จริง
DO $$ 
DECLARE 
    test_user_id TEXT := '585572b8-4552-4de9-8bb0-00aba3273fc0'; -- employee.som@test.com
    test_result BOOLEAN;
BEGIN
    -- Test 1: Valid path (should be true)
    SELECT ('checkin/' || test_user_id || '/test.jpg') LIKE ('checkin/' || test_user_id || '/%') INTO test_result;
    RAISE NOTICE 'Test 1 - Valid own path: %', test_result;
    
    -- Test 2: Invalid path (should be false)  
    SELECT ('checkin/00000000-0000-0000-0000-000000000002/test.jpg') LIKE ('checkin/' || test_user_id || '/%') INTO test_result;
    RAISE NOTICE 'Test 2 - Invalid other path: %', test_result;
    
    -- Test 3: Checkout path (should be true)
    SELECT ('checkout/' || test_user_id || '/test.jpg') LIKE ('checkout/' || test_user_id || '/%') INTO test_result;
    RAISE NOTICE 'Test 3 - Valid checkout path: %', test_result;
END $$;