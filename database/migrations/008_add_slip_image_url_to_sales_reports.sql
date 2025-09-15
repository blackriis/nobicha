-- Add slip_image_url column to sales_reports table
-- This column was missing from the initial schema but is required by the application

-- Add the slip_image_url column
ALTER TABLE sales_reports 
ADD COLUMN slip_image_url TEXT;

-- Update existing records with a placeholder URL (if any exist)
UPDATE sales_reports 
SET slip_image_url = 'https://placeholder.com/slip.jpg' 
WHERE slip_image_url IS NULL;

-- Make the column NOT NULL now that all existing records have values
ALTER TABLE sales_reports 
ALTER COLUMN slip_image_url SET NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
AND column_name = 'slip_image_url';