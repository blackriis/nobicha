// Network connectivity testing utility
export async function testNetworkConnectivity() {
  const tests = [
    {
      name: 'Internet connectivity',
      url: 'https://httpbin.org/get',
      timeout: 5000
    },
    {
      name: 'Supabase reachability',
      url: 'https://nyhwnafkybuxneqiaffq.supabase.co/health',
      timeout: 5000
    }
  ]

  const results = []

  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), test.timeout)
      
      const response = await fetch(test.url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      })
      
      clearTimeout(timeoutId)
      
      results.push({
        name: test.name,
        success: response.ok,
        status: response.status,
        url: test.url
      })
      
      console.log(`✅ ${test.name}: OK (${response.status})`)
    } catch (error) {
      results.push({
        name: test.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: test.url
      })
      
      console.error(`❌ ${test.name}: FAILED`, error)
    }
  }

  return results
}

// Test Supabase auth endpoint specifically
export async function testSupabaseAuth() {
  try {
    console.log('🔍 Testing Supabase auth endpoint...')
    
    const response = await fetch('https://nyhwnafkybuxneqiaffq.supabase.co/auth/v1/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjM1NjksImV4cCI6MjA3Mjc5OTU2OX0.sgFadGCoquAO9NqZ8bGxBYOFnPGBXkE_Xbo4A_iuznE'
      }
    })

    console.log('🔧 Supabase auth test result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    }
  } catch (error) {
    console.error('❌ Supabase auth test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}