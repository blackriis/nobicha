-- Authentication Setup and Enhanced RLS Policies

-- Function to create user profile automatically after signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enhanced RLS Policies

-- Drop existing basic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users; 
DROP POLICY IF EXISTS "Admins can view all" ON users;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Branches table policies
CREATE POLICY "Users can view branches" ON branches 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage branches" ON branches 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Work shifts policies  
CREATE POLICY "Users can view work shifts" ON work_shifts 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage work shifts" ON work_shifts 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Time entries enhanced policies
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries; 
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;

CREATE POLICY "Users can view own time entries" ON time_entries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries" ON time_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON time_entries 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all time entries" ON time_entries 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Raw materials policies
CREATE POLICY "Users can view materials" ON raw_materials 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage materials" ON raw_materials 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Material usage policies
CREATE POLICY "Users can view own material usage" ON material_usage 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT te.user_id FROM time_entries te 
      WHERE te.id = material_usage.time_entry_id
    )
  );

CREATE POLICY "Users can insert own material usage" ON material_usage 
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT te.user_id FROM time_entries te 
      WHERE te.id = material_usage.time_entry_id
    )
  );

CREATE POLICY "Admins can manage all material usage" ON material_usage 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Sales reports policies
CREATE POLICY "Users can view own sales reports" ON sales_reports 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales reports" ON sales_reports 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales reports" ON sales_reports 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sales reports" ON sales_reports 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Payroll policies (admin only)
CREATE POLICY "Admins can manage payroll cycles" ON payroll_cycles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can view own payroll details" ON payroll_details 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payroll details" ON payroll_details 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );