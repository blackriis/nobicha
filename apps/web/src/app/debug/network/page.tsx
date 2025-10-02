'use client'

import { useState } from 'react'
import { testNetworkConnectivity, testSupabaseAuth } from '@/lib/network-test'

export default function NetworkTestPage() {
  const [results, setResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    setResults([])
    
    try {
      console.log('🚀 Starting network tests...')
      
      // Test general connectivity
      const connectivityResults = await testNetworkConnectivity()
      setResults(prev => [...prev, ...connectivityResults])
      
      // Test Supabase auth
      const authResult = await testSupabaseAuth()
      setResults(prev => [...prev, { name: 'Supabase Auth', ...authResult }])
      
      console.log('✅ All tests completed')
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      setResults(prev => [...prev, { 
        name: 'Test Suite', 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }])
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Network Connectivity Test</h1>
      
      <button
        onClick={runTests}
        disabled={testing}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 mb-6"
      >
        {testing ? 'Testing...' : 'Run Network Tests'}
      </button>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-4 rounded border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅' : '❌'}
                </span>
                <strong>{result.name}</strong>
              </div>
              
              {result.url && (
                <div className="text-sm text-gray-600">URL: {result.url}</div>
              )}
              
              {result.status && (
                <div className="text-sm text-gray-600">Status: {result.status}</div>
              )}
              
              {result.error && (
                <div className="text-sm text-red-600">Error: {result.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser dev tools (F12)</li>
          <li>Click "Run Network Tests"</li>
          <li>Check console for detailed logs</li>
          <li>Review results above</li>
        </ol>
      </div>
    </div>
  )
}