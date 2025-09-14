-- Debug Supabase Storage Configuration
-- ตรวจสอบการตั้งค่า Supabase Storage

-- 1. Check if employee-selfies bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'employee-selfies';

-- 2. Check storage.objects policies
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check if bucket needs to be created
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'employee-selfies'
    ) INTO bucket_exists;
    
    IF bucket_exists THEN
        RAISE NOTICE 'employee-selfies bucket EXISTS';
    ELSE
        RAISE NOTICE 'employee-selfies bucket DOES NOT EXIST - needs to be created';
    END IF;
END $$;