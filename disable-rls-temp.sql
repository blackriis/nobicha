-- Temporarily disable RLS to fix infinite recursion
-- ใช้ชั่วคราวเพื่อแก้ไข infinite recursion

-- Disable RLS on all tables temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user creation via service role" ON users;

DROP POLICY IF EXISTS "Users can view branches" ON branches;
DROP POLICY IF EXISTS "Admins can manage branches" ON branches;

DROP POLICY IF EXISTS "Users can view work shifts" ON work_shifts;
DROP POLICY IF EXISTS "Admins can manage work shifts" ON work_shifts;

DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;

DROP POLICY IF EXISTS "Admins can manage payroll cycles" ON payroll_cycles;
DROP POLICY IF EXISTS "Users can view own payroll details" ON payroll_details;
DROP POLICY IF EXISTS "Admins can manage all payroll details" ON payroll_details;

DROP POLICY IF EXISTS "Admins can manage raw materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can view own material usage" ON material_usage;
DROP POLICY IF EXISTS "Admins can manage all material usage" ON material_usage;

DROP POLICY IF EXISTS "Users can view own sales reports" ON sales_reports;
DROP POLICY IF EXISTS "Users can insert own sales reports" ON sales_reports;
DROP POLICY IF EXISTS "Users can update own sales reports" ON sales_reports;
DROP POLICY IF EXISTS "Admins can manage all sales reports" ON sales_reports;

-- Handle audit_logs table (may not exist yet)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
        DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
    END IF;
END $$;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Note: RLS is now disabled temporarily
-- You can re-enable it later with proper policies