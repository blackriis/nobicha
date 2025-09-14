-- แก้ไข Storage Policies ทีละขั้นตอน
-- รันทีละบล็อกใน Supabase Console > SQL Editor

-- ขั้นตอนที่ 1: ตรวจสอบ policies ที่มีอยู่
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
ORDER BY policyname;

-- ขั้นตอนที่ 2: ลบ policies เก่าทั้งหมด (รันทีละบรรทัด)
DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects;

DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;

DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects;

DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;

DROP POLICY IF EXISTS "Admins can manage all selfies" ON storage.objects;

DROP POLICY IF EXISTS "Employee upload selfies" ON storage.objects;

DROP POLICY IF EXISTS "Employee view own selfies" ON storage.objects;

-- ขั้นตอนที่ 3: ตรวจสอบว่าลบหมดแล้ว
SELECT 
  policyname
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname ILIKE '%selfies%';

-- ขั้นตอนที่ 4: เปิด RLS (ถ้ายังไม่เปิด)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ขั้นตอนที่ 5: สร้าง policies ใหม่ที่ปลอดภัย
-- Policy สำหรับ INSERT (อัพโหลด)
CREATE POLICY "Secure employee upload" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name ~ ('^checkin/' || auth.uid()::text || '/.*')
    OR 
    name ~ ('^checkout/' || auth.uid()::text || '/.*')
  )
);

-- Policy สำหรับ SELECT (ดาวน์โหลด)  
CREATE POLICY "Secure employee download" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name ~ ('^checkin/' || auth.uid()::text || '/.*')
    OR 
    name ~ ('^checkout/' || auth.uid()::text || '/.*')
  )
);

-- Policy สำหรับ UPDATE
CREATE POLICY "Secure employee update" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name ~ ('^checkin/' || auth.uid()::text || '/.*')
    OR 
    name ~ ('^checkout/' || auth.uid()::text || '/.*')
  )
);

-- Policy สำหรับ DELETE
CREATE POLICY "Secure employee delete" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name ~ ('^checkin/' || auth.uid()::text || '/.*')
    OR 
    name ~ ('^checkout/' || auth.uid()::text || '/.*')
  )
);

-- ขั้นตอนที่ 6: ตรวจสอบ policies ใหม่
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname ILIKE '%secure%'
ORDER BY policyname;