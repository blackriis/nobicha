-- Migration 005: Add bonus/deduction reason fields and net_pay to payroll_details
-- Story 3.2: Admin Bonus and Deduction Management

-- Add bonus_reason and deduction_reason fields
ALTER TABLE payroll_details 
ADD COLUMN bonus_reason TEXT,
ADD COLUMN deduction_reason TEXT;

-- Rename total_pay to net_pay for clarity
ALTER TABLE payroll_details 
RENAME COLUMN total_pay TO net_pay;

-- Rename base_salary to base_pay for consistency 
ALTER TABLE payroll_details
RENAME COLUMN base_salary TO base_pay;

-- Rename bonuses to bonus for consistency (singular form)
ALTER TABLE payroll_details
RENAME COLUMN bonuses TO bonus;

-- Rename deductions to deduction for consistency (singular form)
ALTER TABLE payroll_details
RENAME COLUMN deductions TO deduction;

-- Update comments for clarity
COMMENT ON COLUMN payroll_details.bonus_reason IS 'Reason for bonus (required if bonus > 0)';
COMMENT ON COLUMN payroll_details.deduction_reason IS 'Reason for deduction (required if deduction > 0)';
COMMENT ON COLUMN payroll_details.net_pay IS 'Final pay: base_pay + overtime_pay + bonus - deduction';

-- Add constraint to ensure net_pay is never negative
ALTER TABLE payroll_details 
ADD CONSTRAINT check_net_pay_non_negative CHECK (net_pay >= 0);

-- Add constraint to ensure bonus_reason is provided when bonus > 0
ALTER TABLE payroll_details 
ADD CONSTRAINT check_bonus_reason_required 
CHECK (bonus = 0 OR (bonus > 0 AND bonus_reason IS NOT NULL AND LENGTH(TRIM(bonus_reason)) > 0));

-- Add constraint to ensure deduction_reason is provided when deduction > 0
ALTER TABLE payroll_details 
ADD CONSTRAINT check_deduction_reason_required 
CHECK (deduction = 0 OR (deduction > 0 AND deduction_reason IS NOT NULL AND LENGTH(TRIM(deduction_reason)) > 0));