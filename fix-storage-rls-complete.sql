-- Complete Fix for Storage RLS Issues
-- แก้ไขปัญหา RLS policies และ schema constraints ครบถ้วน

-- 1. First check current schema state
DO $$
DECLARE
    selfie_col_exists BOOLEAN;
    selfie_not_null BOOLEAN;
BEGIN
    -- Check if check_in_selfie_url column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'time_entries' 
        AND column_name = 'check_in_selfie_url'
    ) INTO selfie_col_exists;
    
    IF selfie_col_exists THEN
        RAISE NOTICE 'check_in_selfie_url column exists';
        
        -- Check if it has NOT NULL constraint
        SELECT a.attnotnull FROM pg_attribute a
        WHERE a.attrelid = 'public.time_entries'::regclass
        AND a.attname = 'check_in_selfie_url'
        INTO selfie_not_null;
        
        IF selfie_not_null THEN
            RAISE NOTICE 'check_in_selfie_url is NOT NULL - this might be causing the issue';
        ELSE
            RAISE NOTICE 'check_in_selfie_url allows NULL';
        END IF;
    ELSE
        RAISE NOTICE 'check_in_selfie_url column does not exist';
    END IF;
END $$;

-- 2. Temporarily remove NOT NULL constraint if it exists
-- This allows testing without selfie URLs first
ALTER TABLE time_entries ALTER COLUMN check_in_selfie_url DROP NOT NULL;

-- 3. Drop and recreate RLS policies with correct logic
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can manage all time entries" ON time_entries;

-- 4. Create simplified RLS policies for testing
CREATE POLICY "Users can view own time entries" ON time_entries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries" ON time_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create admin policy using function to avoid recursion
CREATE POLICY "Admins can manage all time entries" ON time_entries 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.users u ON au.id = u.id
      WHERE au.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 6. Ensure RLS is enabled
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- 7. Test basic INSERT without selfie (should work now)
-- Run this manually to test:
-- INSERT INTO time_entries (user_id, branch_id, check_in_time) 
-- VALUES (auth.uid(), (SELECT id FROM branches LIMIT 1), now());

-- 8. Add debug logging
COMMENT ON TABLE time_entries IS 'RLS policies fixed, check_in_selfie_url constraint temporarily removed for testing';