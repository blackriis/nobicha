// Simple test script for branches API
const fetch = require('node-fetch');

async function testBranchesAPI() {
  try {
    console.log('Testing GET /api/admin/branches...');
    
    const response = await fetch('http://localhost:3002/api/admin/branches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.text();
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ API is working - 401 Unauthorized (expected without auth)');
    } else if (response.status === 500) {
      console.log('❌ 500 error still exists');
    } else {
      console.log('✅ API response received');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testBranchesAPI();