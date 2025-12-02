DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins and service role can insert users" ON users;

CREATE POLICY "Admins and service role can insert users" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
