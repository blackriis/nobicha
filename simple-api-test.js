#!/usr/bin/env node
/**
 * ทดสอบ API อย่างง่าย
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function simpleApiTest() {
  try {
    console.log('🔍 ทดสอบ API เบื้องต้น...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    console.log('✅ Login success')
    
    // Get token
    const { data: { session } } = await userClient.auth.getSession()
    const accessToken = session?.access_token
    
    console.log('🔑 Access token available:', !!accessToken)
    
    // Test simple check-in call
    console.log('\n📞 Testing check-in API...')
    
    const response = await fetch('http://localhost:3002/api/employee/time-entries/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        branchId: '00000000-0000-0000-0000-000000000001',
        latitude: 13.7563,
        longitude: 100.5018,
        selfieUrl: `https://storage.supabase.co/employee-selfies/checkin/${authData.user.id}/test.jpg`
      })
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('📄 Response body (first 200 chars):', text.substring(0, 200))
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const json = JSON.parse(text)
        console.log('✅ Valid JSON response:', json)
      } catch (e) {
        console.log('❌ Invalid JSON despite content-type header')
      }
    } else {
      console.log('⚠️ Response is not JSON, content-type:', response.headers.get('content-type'))
    }
    
    await userClient.auth.signOut()
    
  } catch (error) {
    console.error('💥 Test error:', error.message)
  }
}

simpleApiTest()