-- Fix Time Entries RLS Policies - Column Name Mismatch
-- แก้ไข RLS policies ที่ใช้ user_id แทน employee_id ใน time_entries table

-- Drop existing problematic policies on time_entries
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Admins can manage all time entries" ON time_entries;

-- Create corrected policies using 'employee_id' instead of 'user_id'
CREATE POLICY "Users can view own time entries" ON time_entries 
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own time entries" ON time_entries 
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
  FOR UPDATE USING (auth.uid() = employee_id);

-- Admin policy using the is_admin() function to avoid recursion
CREATE POLICY "Admins can manage all time entries" ON time_entries 
  FOR ALL USING (is_admin());

-- Ensure RLS is enabled
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Add comment for reference
COMMENT ON TABLE time_entries IS 'RLS policies updated to use employee_id instead of user_id';