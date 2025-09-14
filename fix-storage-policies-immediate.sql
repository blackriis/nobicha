-- ตรวจสอบและแก้ไข RLS Policies ทันที
-- ปัญหา: ผู้ใช้สามารถอัพโหลดไฟล์ไปยังพาธของคนอื่นได้

-- 1. ลบ policies เก่าที่มีปัญหา
DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects; 
DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;

-- 2. ตรวจสอบว่า RLS เปิดอยู่หรือไม่
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. สร้าง policies ใหม่ที่ปลอดภัยกว่า
-- Policy สำหรับการ INSERT (อัพโหลด)
CREATE POLICY "Users can upload own selfies" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND name LIKE 'checkin/' || auth.uid()::text || '/%'
  OR name LIKE 'checkout/' || auth.uid()::text || '/%'
);

-- Policy สำหรับการ SELECT (ดาวน์โหลด/ดู)
CREATE POLICY "Users can view own selfies" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับการ UPDATE
CREATE POLICY "Users can update own selfies" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับการ DELETE
CREATE POLICY "Users can delete own selfies" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE 'checkin/' || auth.uid()::text || '/%'
    OR name LIKE 'checkout/' || auth.uid()::text || '/%'
  )
);

-- Policy สำหรับ Admin (ดูได้ทั้งหมด)
CREATE POLICY "Admins can view all selfies" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Policy สำหรับ Admin (จัดการได้ทั้งหมด) 
CREATE POLICY "Admins can manage all selfies" ON storage.objects
FOR ALL
USING (
  bucket_id = 'employee-selfies' 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- 4. ตรวจสอบ policies ที่สร้างใหม่
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%selfies%';

-- 5. สร้าง admin test user หากยังไม่มี
DO $$
BEGIN
  -- ตรวจสอบว่ามี admin@test.com หรือยัง
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@test.com'
  ) THEN
    -- สร้าง admin user ใน auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000003',
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- สร้าง user profile
    INSERT INTO users (
      id,
      email,
      full_name,
      role,
      phone,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      'admin@test.com',
      'Test Admin User',
      'admin',
      '+66-000-000-003',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created admin test user successfully';
  ELSE
    RAISE NOTICE 'Admin test user already exists';
  END IF;
END $$;