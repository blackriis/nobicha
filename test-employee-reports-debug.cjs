const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmployeeReports() {
  console.log('Testing employee reports query...');
  
  // Simulate the same query as in the API
  const { data: employeeData, error } = await supabase
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
    .order('check_in_time', { ascending: false })
    .limit(50);

  console.log('Query result - data count:', employeeData?.length || 0);
  console.log('Query error:', error);
  
  if (employeeData?.length > 0) {
    console.log('Sample entry:', employeeData[0]);
    
    // Process data like in the API
    const employeeMap = new Map();
    
    employeeData.forEach((entry) => {
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
          lastCheckIn: null,
          status: 'offline'
        });
      }
      
      const employee = employeeMap.get(userId);
      employee.totalHours += entry.total_hours || 0;
      employee.totalSessions += 1;
      employee.branches.add(branchData.name);
      
      if (!entry.check_out_time && (!employee.lastCheckIn || entry.check_in_time > employee.lastCheckIn)) {
        employee.lastCheckIn = entry.check_in_time;
        employee.status = 'working';
      }
    });

    const employeeReports = Array.from(employeeMap.values()).map(employee => ({
      userId: employee.userId,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      totalHours: Math.round(employee.totalHours * 100) / 100,
      totalSessions: employee.totalSessions,
      averageHoursPerSession: employee.totalSessions > 0 ? 
        Math.round((employee.totalHours / employee.totalSessions) * 100) / 100 : 0,
      branches: Array.from(employee.branches),
      status: employee.status,
      lastCheckIn: employee.lastCheckIn
    }));

    console.log('Processed employee reports:', employeeReports.length);
    console.log('Sample processed employee:', employeeReports[0]);
    
    // Calculate summary
    const summary = {
      totalEmployees: employeeReports.length,
      totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
      activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
      averageHoursPerEmployee: employeeReports.length > 0 ? 
        Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
    };
    
    console.log('Summary:', summary);
  }
}

testEmployeeReports().catch(console.error);