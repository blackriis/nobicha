-- EMERGENCY: Disable Storage RLS Completely
-- ฉุกเฉิน: ปิด Storage RLS ทั้งหมด

-- WARNING: This disables security on storage.objects
-- Use only for testing/development

-- Try to disable RLS (may require superuser)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: Create super permissive policy
DROP POLICY IF EXISTS "Allow everything" ON storage.objects;

CREATE POLICY "Allow everything" ON storage.objects
FOR ALL 
WITH CHECK (true)
USING (true);

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('employee-selfies', 'employee-files', 'public-uploads');

-- Show final status
SELECT 'Emergency RLS bypass applied' as status;

-- Test bucket access
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE public = true;