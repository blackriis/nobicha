-- Create Storage Policies for Employee Selfies (Direct Method)
-- สร้าง Storage policies โดยตรงสำหรับเซลฟี่พนักงาน

-- 1. Create policy for INSERT (Upload)
CREATE POLICY "employee_selfies_upload" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- 2. Create policy for SELECT (View/Download)
CREATE POLICY "employee_selfies_select" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- 3. Create policy for UPDATE (Replace files)
CREATE POLICY "employee_selfies_update" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- 4. Create policy for DELETE (Remove files)
CREATE POLICY "employee_selfies_delete" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- 5. Verify policies were created
SELECT 'Storage policies created successfully - ' || COUNT(*) || ' policies' as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE 'employee_selfies_%';