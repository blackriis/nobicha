-- Storage setup for employee selfies
-- This script sets up Supabase Storage bucket and policies for selfie images

-- Create storage bucket for employee selfies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-selfies',
  'employee-selfies', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own selfies
CREATE POLICY "Users can upload own selfies" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND auth.uid()::text = (string_to_array(name, '/'))[3] -- employee_id is in path
);

-- Policy: Users can view their own selfies
CREATE POLICY "Users can view own selfies" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid()::text = (string_to_array(name, '/'))[3] -- employee_id is in path
);

-- Policy: Admins can view all selfies
CREATE POLICY "Admins can view all selfies" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'employee-selfies' 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Policy: Users can update their own selfies (for retakes)
CREATE POLICY "Users can update own selfies" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid()::text = (string_to_array(name, '/'))[3] -- employee_id is in path
);

-- Policy: Users can delete their own selfies (for retakes)
CREATE POLICY "Users can delete own selfies" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'employee-selfies' 
  AND auth.uid()::text = (string_to_array(name, '/'))[3] -- employee_id is in path
);

-- Update time_entries schema to match expected structure from Story 1.5
-- Add separate columns for check-in and check-out selfies
ALTER TABLE time_entries 
DROP COLUMN IF EXISTS selfie_url;

ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS check_in_selfie_url TEXT,
ADD COLUMN IF NOT EXISTS check_out_selfie_url TEXT;

-- Make check_in_selfie_url required as per Story 1.5 requirements
-- Note: This might fail if there are existing records without selfies
-- Run this after ensuring all existing records have been migrated or removed
-- ALTER TABLE time_entries ALTER COLUMN check_in_selfie_url SET NOT NULL;

-- Add comment for future reference
COMMENT ON COLUMN time_entries.check_in_selfie_url IS 'Required selfie URL for check-in verification';
COMMENT ON COLUMN time_entries.check_out_selfie_url IS 'Optional selfie URL for check-out verification';