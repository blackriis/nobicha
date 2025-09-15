const fetch = require('node-fetch');

async function testBranchesAPI() {
  try {
    console.log('Testing API endpoint: GET /api/admin/branches...');
    
    const response = await fetch('http://localhost:3002/api/admin/branches');
    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 200) {
      console.log('✅ API working correctly!');
    } else {
      console.log('❌ API error:', response.status, result.error);
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testBranchesAPI();