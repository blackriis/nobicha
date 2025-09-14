-- Final Fix for RLS Issues - Complete Solution
-- แก้ไขปัญหา RLS และ update schema ให้ตรงกับ Story 1.5

-- 1. Drop all current problematic RLS policies
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can manage all time entries" ON time_entries;

-- 2. Create safe, simple RLS policies (without recursion)
CREATE POLICY "Users can view own time entries" ON time_entries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries" ON time_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Create admin policy using service role approach (safer)
CREATE POLICY "Service role can manage all time entries" ON time_entries 
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Add a simple admin policy that doesn't cause recursion
CREATE POLICY "Admin users can manage time entries" ON time_entries 
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role = 'admin'
    )
  );

-- 5. Update schema to match Story 1.5 requirements
-- Add separate selfie columns
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS check_in_selfie_url TEXT,
ADD COLUMN IF NOT EXISTS check_out_selfie_url TEXT;

-- 6. Migrate existing selfie_url data if any exists
UPDATE time_entries 
SET check_in_selfie_url = selfie_url 
WHERE selfie_url IS NOT NULL AND check_in_selfie_url IS NULL;

-- 7. Keep old selfie_url column for backward compatibility (for now)
-- DROP COLUMN selfie_url; -- Uncomment this later when sure migration is complete

-- 8. Add comments
COMMENT ON COLUMN time_entries.check_in_selfie_url IS 'Selfie URL for check-in verification (Story 1.5)';
COMMENT ON COLUMN time_entries.check_out_selfie_url IS 'Selfie URL for check-out verification (Story 1.5)';

-- 9. Ensure RLS is enabled
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- 10. Test query - should work now
-- Test with: INSERT INTO time_entries (user_id, branch_id, check_in_time) VALUES (auth.uid(), (SELECT id FROM branches LIMIT 1), now());