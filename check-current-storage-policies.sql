-- Check current storage policies
-- ตรวจสอบ storage policies ปัจจุบัน

-- Check existing policies on storage.objects
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
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;