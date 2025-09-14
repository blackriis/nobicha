-- Create Storage Bucket and Policies for Employee Selfies
-- สร้าง Storage bucket และ policies สำหรับเซลฟี่พนักงาน

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-selfies',
  'employee-selfies', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects;

-- 4. Create simple, working policies
-- Allow authenticated users to upload to employee-selfies bucket
CREATE POLICY "Allow upload to employee-selfies" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to view files in employee-selfies bucket
CREATE POLICY "Allow view employee-selfies" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update files in employee-selfies bucket
CREATE POLICY "Allow update employee-selfies" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete files in employee-selfies bucket
CREATE POLICY "Allow delete employee-selfies" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid() IS NOT NULL
);

-- 5. Verify setup
SELECT 'Storage bucket and policies created successfully' as status;