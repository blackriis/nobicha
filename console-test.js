// Copy และ paste โค้ดนี้ใน Browser Console (F12)

console.log('🔍 Testing Employee Reports API...');

// Test Employee Reports API
async function testEmployeeAPI() {
  try {
    console.log('📡 Calling Employee Reports API...');
    
    const response = await fetch('/api/admin/reports/employees?dateRange=month', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    const result = await response.json();
    console.log('📊 Full Response:', result);
    
    if (response.ok && result.data) {
      console.log('✅ API Success!');
      console.log('👥 Employee count:', result.data.employees?.length || 0);
      console.log('📈 Summary:', result.data.summary);
      
      if (result.data.employees && result.data.employees.length > 0) {
        console.log('👤 Sample employees:');
        result.data.employees.slice(0, 3).forEach((emp, i) => {
          console.log(`  ${i+1}. ${emp.fullName} (${emp.employeeId}) - ${emp.totalHours}h`);
        });
      } else {
        console.log('❌ No employees found in response');
      }
    } else {
      console.log('❌ API Error:', result.error);
      console.log('❌ Full error response:', result);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    return null;
  }
}

// Test auth status
async function checkAuth() {
  try {
    const response = await fetch('/api/user/profile', {
      credentials: 'include'
    });
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Authenticated as:', result.user?.email, '(Role:', result.user?.role + ')');
      return true;
    } else {
      console.log('❌ Not authenticated. Please login first.');
      return false;
    }
  } catch (error) {
    console.log('❌ Auth check failed:', error.message);
    return false;
  }
}

// Run the test
console.log('🚀 Starting test...');
checkAuth().then(isAuth => {
  if (isAuth) {
    return testEmployeeAPI();
  } else {
    console.log('💡 Please login at: http://localhost:3000/login/admin');
    console.log('💡 Use: manager.silom@test.com / Manager123!');
  }
}).then(() => {
  console.log('✅ Test completed!');
});