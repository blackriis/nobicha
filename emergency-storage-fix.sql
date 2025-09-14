-- Emergency Storage Fix - Disable RLS temporarily for testing
-- แก้ไข Storage แบบฉุกเฉิน - ปิด RLS ชั่วคราวเพื่อทดสอบ

-- WARNING: This removes security temporarily - use only for testing

-- 1. Disable RLS on storage.objects (if you have permissions)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Alternative: Try to make bucket completely public
UPDATE storage.buckets 
SET public = true
WHERE id = 'employee-selfies';

-- 3. Check if upload endpoint exists in API
-- This tests if the bucket is accessible via API
-- POST https://nyhwnafkybuxneqiaffq.supabase.co/storage/v1/object/employee-selfies/test

-- 4. Show current status
SELECT 
    'Bucket: ' || id || ', Public: ' || public::text as bucket_status
FROM storage.buckets 
WHERE id = 'employee-selfies';

-- 5. Alternative approach - try different bucket name
-- Sometimes the issue is with bucket name caching
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-files',
  'employee-files', 
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

SELECT 'Emergency fix applied' as status;