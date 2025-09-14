-- Clean up test data and apply proper RLS fix
-- ลบข้อมูลทดสอบและแก้ไข RLS ให้ถูกต้อง

-- 1. Clean up any test data that might be stuck
DELETE FROM time_entries WHERE selfie_url = 'test-selfie-url';
DELETE FROM time_entries WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 2. Drop ALL existing policies on time_entries (clean slate)
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can manage all time entries" ON time_entries;
DROP POLICY IF EXISTS "Service role can manage all time entries" ON time_entries;
DROP POLICY IF EXISTS "Admin users can manage time entries" ON time_entries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON time_entries;

-- 3. Ensure RLS is enabled
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working policies
CREATE POLICY "Users can view own time entries" ON time_entries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries" ON time_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Simple admin policy (no recursion)
CREATE POLICY "Admins can manage all time entries" ON time_entries 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- 6. Verify policies are working
SELECT 'RLS policies updated successfully' as status;