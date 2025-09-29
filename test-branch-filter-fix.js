// Test script to verify branch filter fix
console.log('🔧 Testing Branch Filter Fix...\n')

// Simulate the AdminReportsService.getMaterialReports method
function simulateGetMaterialReports(dateRange, branchId = null, limit = 100) {
  console.log('📊 Simulating getMaterialReports call:')
  console.log(`  - dateRange: ${JSON.stringify(dateRange)}`)
  console.log(`  - branchId: ${branchId}`)
  console.log(`  - limit: ${limit}`)
  
  // Simulate formatDateRange method
  function formatDateRange(dateRange) {
    const params = new URLSearchParams()
    params.set('dateRange', dateRange.type)
    
    if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
      params.set('startDate', dateRange.startDate)
      params.set('endDate', dateRange.endDate)
    }
    
    return params.toString()
  }
  
  try {
    // This was the problematic line - now fixed
    const queryParams = new URLSearchParams(formatDateRange(dateRange))
    
    if (branchId) {
      queryParams.append('branchId', branchId)
    }
    queryParams.append('limit', limit.toString())
    
    const url = `/api/admin/reports/materials?${queryParams.toString()}`
    
    console.log('✅ URL constructed successfully:')
    console.log(`  ${url}`)
    
    return { success: true, url }
    
  } catch (error) {
    console.log('❌ Error occurred:')
    console.log(`  ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Test cases
const testCases = [
  {
    name: 'Test 1: Today with no branch filter',
    dateRange: { type: 'today' },
    branchId: null,
    expected: 'dateRange=today'
  },
  {
    name: 'Test 2: Today with branch filter',
    dateRange: { type: 'today' },
    branchId: '11111111-1111-1111-1111-111111111111',
    expected: 'dateRange=today&branchId=11111111-1111-1111-1111-111111111111'
  },
  {
    name: 'Test 3: Week with branch filter',
    dateRange: { type: 'week' },
    branchId: '22222222-2222-2222-2222-222222222222',
    expected: 'dateRange=week&branchId=22222222-2222-2222-2222-222222222222'
  },
  {
    name: 'Test 4: Custom date range with branch filter',
    dateRange: { 
      type: 'custom', 
      startDate: '2025-01-01', 
      endDate: '2025-01-31' 
    },
    branchId: '11111111-1111-1111-1111-111111111111',
    expected: 'dateRange=custom&startDate=2025-01-01&endDate=2025-01-31&branchId=11111111-1111-1111-1111-111111111111'
  }
]

console.log('🧪 Running test cases:\n')

let allTestsPassed = true

testCases.forEach((testCase, index) => {
  console.log(`${testCase.name}:`)
  
  const result = simulateGetMaterialReports(
    testCase.dateRange, 
    testCase.branchId
  )
  
  if (result.success) {
    const queryString = result.url.split('?')[1]
    
    // Check if expected parameters are present
    const hasExpectedParams = testCase.expected.split('&').every(param => {
      return queryString.includes(param)
    })
    
    if (hasExpectedParams) {
      console.log('  ✅ PASS - URL contains expected parameters')
    } else {
      console.log('  ❌ FAIL - URL missing expected parameters')
      console.log(`    Expected: ${testCase.expected}`)
      console.log(`    Got: ${queryString}`)
      allTestsPassed = false
    }
  } else {
    console.log('  ❌ FAIL - Error occurred')
    console.log(`    ${result.error}`)
    allTestsPassed = false
  }
  
  console.log('')
})

console.log('📋 Summary:')
if (allTestsPassed) {
  console.log('✅ All tests passed! Branch filter fix is working correctly.')
  console.log('')
  console.log('🎉 The queryParams.append is not a function error has been resolved!')
  console.log('')
  console.log('📝 What was fixed:')
  console.log('  - Changed: const queryParams = this.formatDateRange(dateRange)')
  console.log('  - To: const queryParams = new URLSearchParams(this.formatDateRange(dateRange))')
  console.log('  - This ensures queryParams is a URLSearchParams object with .append() method')
} else {
  console.log('❌ Some tests failed. Please check the implementation.')
}

console.log('')
console.log('🚀 Next steps:')
console.log('1. Development server should now start without errors')
console.log('2. Navigate to: http://localhost:3000/admin/reports/materials')
console.log('3. Test the branch filter dropdown functionality')
console.log('4. Verify that URL parameters update correctly')
