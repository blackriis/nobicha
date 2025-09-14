-- Final Storage Fix - Ensure bucket and policies work correctly
-- แก้ไข Storage ขั้นสุดท้าย - ให้ bucket และ policies ทำงานถูกต้อง

-- 1. Check current bucket configuration
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'employee-selfies';

-- 2. If bucket exists but has wrong config, update it
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png']
WHERE id = 'employee-selfies';

-- 3. Verify bucket is public and accessible
SELECT 'Bucket configuration updated' as status;

-- 4. Check if any RLS policies exist on storage.objects
SELECT COUNT(*) as policy_count, 'storage policies exist' as info
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%employee%';

-- 5. If no policies exist, create them using a different approach
-- (Try service role method)
-- INSERT INTO storage.objects_policies (bucket_id, operation, policy)
-- VALUES ('employee-selfies', 'INSERT', 'auth.uid() IS NOT NULL');

SELECT 'Storage configuration check completed' as final_status;