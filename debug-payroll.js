// Debug script to check payroll calculation prerequisites
// Run with: node debug-payroll.js

const cycleId = 'd18c820a-8bff-4d65-bb71-9fc66800b601';

console.log('🔍 Debugging Payroll Calculation for cycle:', cycleId);
console.log('\n1. Check browser console for detailed server errors');
console.log('2. Common issues to check:');
console.log('   ✓ Cycle status must be "active"');
console.log('   ✓ No existing calculations for this cycle');
console.log('   ✓ Employees must have both hourly_rate AND daily_rate set');
console.log('   ✓ Authentication must be valid (admin user)');

console.log('\n3. SQL Queries to run in Supabase dashboard:');

console.log('\n-- Check cycle status:');
console.log(`SELECT id, name, status, start_date, end_date FROM payroll_cycles WHERE id = '${cycleId}';`);

console.log('\n-- Check existing calculations:');
console.log(`SELECT COUNT(*) as existing_calculations FROM payroll_details WHERE payroll_cycle_id = '${cycleId}';`);

console.log('\n-- Check employees eligibility:');
console.log(`SELECT id, full_name, role, hourly_rate, daily_rate 
FROM users 
WHERE role = 'employee' 
AND hourly_rate IS NOT NULL 
AND daily_rate IS NOT NULL;`);

console.log('\n-- Check employees with missing rates:');
console.log(`SELECT id, full_name, role, hourly_rate, daily_rate 
FROM users 
WHERE role = 'employee' 
AND (hourly_rate IS NULL OR daily_rate IS NULL);`);

console.log('\n4. If cycle status is not "active", update it:');
console.log(`UPDATE payroll_cycles SET status = 'active' WHERE id = '${cycleId}';`);

console.log('\n5. If calculations already exist, delete them (if safe):');
console.log(`DELETE FROM payroll_details WHERE payroll_cycle_id = '${cycleId}';`);

console.log('\n6. Check the enhanced error logs in browser console for specific error details');