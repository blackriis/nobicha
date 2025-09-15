// Test API endpoint directly using curl-like approach

async function testAPIDirect() {
  console.log('🔍 Testing API endpoint directly...')
  
  try {
    const response = await fetch('http://localhost:3001/api/employee/sales-reports', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    console.log('📊 API Response:')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))
    
    if (response.status === 401) {
      console.log('✅ Expected: API correctly returns 401 for unauthenticated request')
    } else if (response.status === 500) {
      console.log('❌ Unexpected: Still getting 500 error - check server logs')
    } else {
      console.log('🔍 Unexpected status - investigate further')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testAPIDirect().catch(console.error)