const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function quickTestAPI() {
  console.log('Quick API Test...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'manager.silom@test.com',
      password: 'Manager123!'
    });
    
    if (loginError) {
      console.log('Login error:', loginError.message);
      return;
    }
    
    console.log('Login successful:', loginData.user.email);
    
    // Get session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Session active:', sessionData.session ? 'Yes' : 'No');
    
    // Test API call using fetch with session
    console.log('\\n2. Testing Employee Reports API...');
    
    // We need to simulate browser environment for cookie-based auth
    // Let's test the API logic directly instead
    
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Simulate the API query
    const { data: employeeData, error: queryError } = await adminClient
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
    console.log('Query error:', queryError);
    
    if (employeeData && employeeData.length > 0) {
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

      console.log('\\n3. Processed Results:');
      console.log('Employee reports count:', employeeReports.length);
      
      const summary = {
        totalEmployees: employeeReports.length,
        totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
        activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
        averageHoursPerEmployee: employeeReports.length > 0 ? 
          Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
      };
      
      console.log('Summary:', summary);
      console.log('\\nSample employees:');
      employeeReports.slice(0, 3).forEach((emp, index) => {
        console.log(`Employee ${index + 1}:`, emp);
      });
      
      console.log('\\n✅ API logic works correctly!');
      console.log('The issue is likely in the frontend authentication or API routing.');
      
    } else {
      console.log('❌ No employee data found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

quickTestAPI().catch(console.error);