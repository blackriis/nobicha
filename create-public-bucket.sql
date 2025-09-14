-- Create Public Bucket Without RLS
-- สร้าง public bucket โดยไม่มี RLS

-- 1. Create a completely public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-uploads',
  'public-uploads', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Drop all RLS policies for this bucket
DROP POLICY IF EXISTS "Public bucket policy" ON storage.objects;

-- 3. Create a very permissive policy for public bucket
CREATE POLICY "Allow all operations on public bucket" ON storage.objects
FOR ALL 
WITH CHECK (bucket_id = 'public-uploads')
USING (bucket_id = 'public-uploads');

-- 4. Verify bucket creation
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'public-uploads';

SELECT 'Public bucket created successfully' as status;