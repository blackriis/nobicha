-- Create Storage Policies for Employee Selfies
-- สร้าง Storage policies สำหรับเซลฟี่พนักงาน (ใช้ฟังก์ชัน Supabase)

-- 1. Enable RLS on storage.objects (ถ้ายังไม่ได้เปิด)
-- Note: อาจจะ error ถ้าไม่มีสิทธิ์ แต่ไม่เป็นไร
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for INSERT (Upload)
SELECT create_storage_policy(
  'employee_selfies_upload',
  'storage',
  'objects',
  'INSERT',
  NULL,
  'bucket_id = ''employee-selfies'' AND auth.uid() IS NOT NULL'
);

-- 3. Create policy for SELECT (View/Download)
SELECT create_storage_policy(
  'employee_selfies_select',
  'storage', 
  'objects',
  'SELECT',
  'bucket_id = ''employee-selfies'' AND auth.uid() IS NOT NULL',
  NULL
);

-- 4. Create policy for UPDATE (Replace files)
SELECT create_storage_policy(
  'employee_selfies_update',
  'storage',
  'objects', 
  'UPDATE',
  'bucket_id = ''employee-selfies'' AND auth.uid() IS NOT NULL',
  NULL
);

-- 5. Create policy for DELETE (Remove files)
SELECT create_storage_policy(
  'employee_selfies_delete',
  'storage',
  'objects',
  'DELETE', 
  'bucket_id = ''employee-selfies'' AND auth.uid() IS NOT NULL',
  NULL
);

-- 6. Verify policies were created
SELECT 'Storage policies created successfully' as status;