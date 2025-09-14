-- Storage setup for sales slips images
-- Create bucket and RLS policies to allow employees to manage their own slip images

-- Create storage bucket for sales slips (public, 5MB limit, allow jpeg/png/webp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sales-slips',
  'sales-slips',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path pattern used by API: {user_id}/{report_date}/{timestamp}.{ext}
-- Therefore, user_id is the first segment => (string_to_array(name, '/'))[1]
DROP POLICY IF EXISTS "Sales slips - users can upload own" ON storage.objects;
CREATE POLICY "Sales slips - users can upload own" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'sales-slips'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

DROP POLICY IF EXISTS "Sales slips - users can view own" ON storage.objects;
CREATE POLICY "Sales slips - users can view own" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'sales-slips'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

DROP POLICY IF EXISTS "Sales slips - users can update own" ON storage.objects;
CREATE POLICY "Sales slips - users can update own" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'sales-slips'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

DROP POLICY IF EXISTS "Sales slips - users can delete own" ON storage.objects;
CREATE POLICY "Sales slips - users can delete own" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'sales-slips'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Notes:
-- - These policies intentionally avoid recursive references to application tables
-- - Bucket is public to allow generating public URLs for slip_image_url
-- - Keep file path structure consistent with API route implementation


