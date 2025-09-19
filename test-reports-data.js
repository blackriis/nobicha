import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing existing data and reports...');

if (url && serviceKey) {
  const supabase = createClient(url, serviceKey);
  
  async function testReports() {
    try {
      console.log('1. Checking existing data...');
      
      // Check users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, employee_id, full_name, role')
        .limit(10);
      console.log('Users found:', users ? users.length : 0);
      if (userError) console.error('Users error:', userError);
      
      // Check branches
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .limit(10);
      console.log('Branches found:', branches ? branches.length : 0);
      if (branchError) console.error('Branches error:', branchError);
      
      // Check time entries
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('id, user_id, branch_id, check_in_time, total_hours')
        .limit(10);
      console.log('Time entries found:', timeEntries ? timeEntries.length : 0);
      if (timeError) console.error('Time entries error:', timeError);
      
      console.log('2. Testing reports query (same as API)...');
      const today = new Date().toISOString().split('T')[0];
      
      const { data: reportData, error: reportError } = await supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          branch_id,
          check_in_time,
          check_out_time,
          total_hours,
          users!inner(
            id,
            full_name,
            employee_id
          ),
          branches!inner(
            id,
            name
          )
        `)
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false })
        .limit(50);
        
      if (reportError) {
        console.error('Reports query error:', reportError);
        return;
      }
      
      console.log('✓ Reports query successful! Found:', reportData ? reportData.length : 0, 'entries for today');
      
      if (reportData && reportData.length > 0) {
        console.log('Sample report data:');
        reportData.forEach((entry, index) => {
          if (index < 5) {
            console.log(`  - ${entry.users.full_name} (${entry.users.employee_id}) at ${entry.branches.name}: ${entry.total_hours || 'Working'} hours`);
          }
        });
        
        // Test aggregation logic
        console.log('3. Testing employee aggregation...');
        const employeeMap = new Map();
        
        reportData.forEach(entry => {
          const userId = entry.user_id;
          const userData = entry.users;
          const branchData = entry.branches;
          
          if (!employeeMap.has(userId)) {
            employeeMap.set(userId, {
              userId,
              fullName: userData.full_name,
              employeeId: userData.employee_id,
              totalHours: 0,
              totalSessions: 0,
              branches: new Set(),
              status: 'offline'
            });
          }
          
          const employee = employeeMap.get(userId);
          employee.totalHours += entry.total_hours || 0;
          employee.totalSessions += 1;
          employee.branches.add(branchData.name);
          
          if (!entry.check_out_time) {
            employee.status = 'working';
          }
        });
        
        const employeeReports = Array.from(employeeMap.values()).map(emp => ({
          ...emp,
          branches: Array.from(emp.branches),
          averageHoursPerSession: emp.totalSessions > 0 ? emp.totalHours / emp.totalSessions : 0
        }));
        
        console.log('✓ Aggregated employee reports:', employeeReports.length);
        employeeReports.forEach(emp => {
          console.log(`  - ${emp.fullName} (${emp.employeeId}): ${emp.totalHours} hours, ${emp.totalSessions} sessions, ${emp.status}`);
        });
        
        console.log('🎉 Reports should work now!');
        
      } else {
        console.log('⚠️ No time entries found for today. Creating some...');
        
        if (users && users.length > 0 && branches && branches.length > 0) {
          const userId = users[0].id;
          const branchId = branches[0].id;
          const now = new Date();
          
          const { data: newEntry, error: newError } = await supabase
            .from('time_entries')
            .insert({
              user_id: userId,
              branch_id: branchId,
              check_in_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
              check_out_time: null,
              total_hours: null
            })
            .select();
            
          if (newError) {
            console.error('Error creating today entry:', newError);
          } else {
            console.log('✓ Created entry for today:', newEntry ? newEntry.length : 0);
            console.log('🔄 Please test reports again!');
          }
        }
      }
      
    } catch (error) {
      console.error('Testing failed:', error);
    }
  }
  
  testReports();
}