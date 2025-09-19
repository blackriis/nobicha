-- Migration: Add hourly_rate and daily_rate columns to users table
-- This migration adds the missing salary rate fields needed for payroll calculations

-- Add hourly_rate and daily_rate columns to users table
ALTER TABLE users 
ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN daily_rate DECIMAL(10,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.hourly_rate IS 'Employee hourly rate for payroll calculations';
COMMENT ON COLUMN users.daily_rate IS 'Employee daily rate for payroll calculations (used when working >12 hours)';

-- Update existing employees with default rates (you may want to update these manually)
-- Default values: 50 THB/hour, 600 THB/day for employees
UPDATE users 
SET 
  hourly_rate = 50.00,
  daily_rate = 600.00
WHERE role = 'employee' AND (hourly_rate IS NULL OR daily_rate IS NULL);

-- Create index for performance on rate fields
CREATE INDEX idx_users_rates ON users(hourly_rate, daily_rate) WHERE role = 'employee';