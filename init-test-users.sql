-- Create test users for the employee management system
-- This script creates initial users for testing the sales reports functionality

-- Insert test users into users table
-- Note: These users should correspond to Supabase Auth users

-- Test Employee User
INSERT INTO users (id, email, role, first_name, last_name, phone, home_branch_id, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 
    'employee@example.com', 
    'employee', 
    'พนักงาน', 
    'ทดสอบ', 
    '0123456789', 
    (SELECT id FROM branches LIMIT 1), -- Get first available branch
    NOW(), 
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    'admin@example.com', 
    'admin', 
    'ผู้จัดการ', 
    'ระบบ', 
    '0987654321', 
    (SELECT id FROM branches LIMIT 1), -- Get first available branch
    NOW(), 
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Verify the users were created
SELECT 
  id, 
  email, 
  role, 
  first_name, 
  last_name, 
  home_branch_id,
  created_at
FROM users 
ORDER BY created_at DESC;

-- Check available branches
SELECT id, name, latitude, longitude FROM branches LIMIT 5;