-- Find and complete active time entries for employee.som@test.com
UPDATE time_entries 
SET 
  check_out_time = NOW(),
  check_out_selfie_url = 'test-cleanup-selfie'
WHERE user_id = (
  SELECT id FROM users WHERE email = 'employee.som@test.com'
) 
AND check_out_time IS NULL;

-- Verify cleanup
SELECT 
  u.email,
  te.id,
  te.check_in_time,
  te.check_out_time,
  CASE 
    WHEN te.check_out_time IS NULL THEN 'ACTIVE' 
    ELSE 'COMPLETED' 
  END as status
FROM time_entries te
JOIN users u ON u.id = te.user_id
WHERE u.email = 'employee.som@test.com'
ORDER BY te.check_in_time DESC
LIMIT 5;