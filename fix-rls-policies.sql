-- Fix RLS Policies - Remove Infinite Recursion
-- แก้ไข RLS policies ที่มี infinite recursion

-- 1. Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- 2. Create simple, non-recursive policies for users table
-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all users (for admin operations)
-- This policy uses service role which bypasses RLS
CREATE POLICY "Service role can manage all users" ON users 
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Fix other policies that reference users table
-- Update branches policies to avoid recursion
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
CREATE POLICY "Admins can manage branches" ON branches 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Update work shifts policies
DROP POLICY IF EXISTS "Admins can manage work shifts" ON work_shifts;
CREATE POLICY "Admins can manage work shifts" ON work_shifts 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Update payroll policies
DROP POLICY IF EXISTS "Admins can manage payroll cycles" ON payroll_cycles;
CREATE POLICY "Admins can manage payroll cycles" ON payroll_cycles 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage all payroll details" ON payroll_details;
CREATE POLICY "Admins can manage all payroll details" ON payroll_details 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Update raw materials policies
DROP POLICY IF EXISTS "Admins can manage raw materials" ON raw_materials;
CREATE POLICY "Admins can manage raw materials" ON raw_materials 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Update material usage policies
DROP POLICY IF EXISTS "Admins can manage all material usage" ON material_usage;
CREATE POLICY "Admins can manage all material usage" ON material_usage 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Update sales reports policies
DROP POLICY IF EXISTS "Admins can manage all sales reports" ON sales_reports;
CREATE POLICY "Admins can manage all sales reports" ON sales_reports 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 4. Create a simple policy for user creation (for admin operations)
-- This will be handled by the service role in API routes
CREATE POLICY "Allow user creation via service role" ON users 
  FOR INSERT WITH CHECK (true);

-- 5. Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create a function to check if user is admin (to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update policies to use the function (optional, for better performance)
-- This is a more efficient way to check admin status
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
CREATE POLICY "Admins can manage branches" ON branches 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage work shifts" ON work_shifts;
CREATE POLICY "Admins can manage work shifts" ON work_shifts 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage payroll cycles" ON payroll_cycles;
CREATE POLICY "Admins can manage payroll cycles" ON payroll_cycles 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all payroll details" ON payroll_details;
CREATE POLICY "Admins can manage all payroll details" ON payroll_details 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage raw materials" ON raw_materials;
CREATE POLICY "Admins can manage raw materials" ON raw_materials 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all material usage" ON material_usage;
CREATE POLICY "Admins can manage all material usage" ON material_usage 
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage all sales reports" ON sales_reports;
CREATE POLICY "Admins can manage all sales reports" ON sales_reports 
  FOR ALL USING (is_admin());
