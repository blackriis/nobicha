import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM';

console.log('Testing employee reports API endpoint...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPI() {
  try {
    // First create an admin user session
    console.log('1. Creating admin user...');
    
    // Check if admin user exists
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (!adminUser) {
      console.log('Creating admin user...');
      const { data: newAdmin, error: adminError } = await supabase
        .from('users')
        .insert({
          employee_id: 'ADMIN001',
          full_name: 'Admin Test',
          email: 'admin@test.com',
          role: 'admin'
        })
        .select()
        .single();
        
      if (adminError) {
        console.error('Failed to create admin:', adminError);
        return;
      }
      console.log('Created admin user:', newAdmin.id);
    } else {
      console.log('Found admin user:', adminUser.id);
    }
    
    // Test the API logic directly (simulate the API endpoint)
    console.log('\\n2. Testing API logic directly...');
    
    const now = new Date();
    const dateFilter = now.toISOString().split('T')[0];
    const limit = 50;
    
    console.log('Date filter:', dateFilter);
    
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
      .gte('check_in_time', dateFilter)
      .order('check_in_time', { ascending: false })
      .limit(limit);

    console.log('Raw query result - count:', employeeData?.length || 0);
    console.log('Error:', error);
    
    if (employeeData && employeeData.length > 0) {
      console.log('Sample entry:', employeeData[0]);
      
      // Process the data as the API does
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

      employeeReports.sort((a, b) => b.totalHours - a.totalHours);

      const summary = {
        totalEmployees: employeeReports.length,
        totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
        activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
        averageHoursPerEmployee: employeeReports.length > 0 ? 
          Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
      };

      console.log('\\n✅ Processed Results:');
      console.log('Employee reports count:', employeeReports.length);
      console.log('Summary:', summary);
      console.log('\\nSample employees:');
      employeeReports.slice(0, 3).forEach(emp => {
        console.log(`  - ${emp.fullName} (${emp.employeeId}): ${emp.totalHours}h, ${emp.totalSessions} sessions, ${emp.status}`);
      });
      
    } else {
      console.log('❌ No data found for today');
      
      // Check what data exists
      console.log('\\n3. Checking available data...');
      const { data: allData } = await supabase
        .from('time_entries')
        .select('check_in_time')
        .order('check_in_time', { ascending: false })
        .limit(5);
        
      console.log('Recent time entries:');
      allData?.forEach(entry => {
        console.log('  -', entry.check_in_time);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();