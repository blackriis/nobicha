// วางโค้ดนี้ใน Browser Console (F12) เมื่อเปิดหน้าเว็บแล้ว

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
    console.log('📊 Response data:', result);
    
    if (response.ok && result.data) {
      console.log('✅ API Success!');
      console.log('👥 Employee count:', result.data.employees?.length || 0);
      console.log('📈 Summary:', result.data.summary);
      
      if (result.data.employees && result.data.employees.length > 0) {
        console.log('👤 Sample employee:', result.data.employees[0]);
      }
    } else {
      console.log('❌ API Error:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    return null;
  }
}

// Test different date ranges
async function testAllRanges() {
  const ranges = ['today', 'week', 'month', 'all'];
  
  for (const range of ranges) {
    console.log(`\n🗓️ Testing range: ${range}`);
    
    try {
      const response = await fetch(`/api/admin/reports/employees?dateRange=${range}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${range}: ${result.data?.employees?.length || 0} employees`);
      } else {
        console.log(`❌ ${range}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${range}: ${error.message}`);
    }
  }
}

// Run tests
console.log('🚀 Starting tests...');
testEmployeeAPI().then(() => {
  console.log('\n🔄 Testing all date ranges...');
  return testAllRanges();
}).then(() => {
  console.log('\n✅ All tests completed!');
});