#!/usr/bin/env node
/**
 * ทดสอบ Application-Level Security
 * ตรวจสอบว่า API endpoints ป้องกันการส่ง selfie URL ของคนอื่นได้หรือไม่
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function testApplicationSecurity() {
  try {
    console.log('🔒 ทดสอบ Application-Level Security...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login เป็น employee.som@test.com
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }
    
    console.log('✅ Login success, User ID:', authData.user.id)
    
    // สร้าง token สำหรับ API calls
    const { data: { session } } = await userClient.auth.getSession()
    const accessToken = session?.access_token
    
    if (!accessToken) {
      console.error('❌ No access token available')
      return
    }
    
    // Test 1: ทดสอบ check-in API ด้วย selfie URL ของคนอื่น
    console.log('\n🚨 Test 1: Check-in with unauthorized selfie URL')
    
    const unauthorizedSelfieUrl = 'https://storage.supabase.co/employee-selfies/checkin/00000000-0000-0000-0000-000000000002/hacker.jpg'
    const validBranchId = '00000000-0000-0000-0000-000000000001' // สาขาสีลม
    
    const checkInResponse = await fetch('http://localhost:3002/api/employee/time-entries/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        branchId: validBranchId,
        latitude: 13.7563,
        longitude: 100.5018,
        selfieUrl: unauthorizedSelfieUrl
      })
    })
    
    const checkInResult = await checkInResponse.json()
    
    if (checkInResponse.status === 403 && checkInResult.error?.includes('Security violation')) {
      console.log('✅ GOOD: Check-in API blocked unauthorized selfie URL')
    } else if (checkInResponse.status === 200) {
      console.log('❌ BAD: Check-in API accepted unauthorized selfie URL!', checkInResult)
    } else {
      console.log('⚠️ UNEXPECTED: Check-in API response:', checkInResponse.status, checkInResult)
    }
    
    // Test 2: ทดสอบ check-in API ด้วย selfie URL ที่ถูกต้อง
    console.log('\n✅ Test 2: Check-in with authorized selfie URL')
    
    const authorizedSelfieUrl = `https://storage.supabase.co/employee-selfies/checkin/${authData.user.id}/legitimate.jpg`
    
    const validCheckInResponse = await fetch('http://localhost:3002/api/employee/time-entries/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        branchId: validBranchId,
        latitude: 13.7563,
        longitude: 100.5018,
        selfieUrl: authorizedSelfieUrl
      })
    })
    
    const validCheckInResult = await validCheckInResponse.json()
    
    if (validCheckInResponse.status === 200) {
      console.log('✅ GOOD: Check-in API accepted authorized selfie URL')
      
      // Test 3: ทดสอบ check-out API ด้วย selfie URL ของคนอื่น
      console.log('\n🚨 Test 3: Check-out with unauthorized selfie URL')
      
      const unauthorizedCheckoutUrl = 'https://storage.supabase.co/employee-selfies/checkout/00000000-0000-0000-0000-000000000002/hacker_checkout.jpg'
      
      const checkOutResponse = await fetch('http://localhost:3002/api/employee/time-entries/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          latitude: 13.7563,
          longitude: 100.5018,
          selfieUrl: unauthorizedCheckoutUrl
        })
      })
      
      const checkOutResult = await checkOutResponse.json()
      
      if (checkOutResponse.status === 403 && checkOutResult.error?.includes('Security violation')) {
        console.log('✅ GOOD: Check-out API blocked unauthorized selfie URL')
      } else if (checkOutResponse.status === 200) {
        console.log('❌ BAD: Check-out API accepted unauthorized selfie URL!', checkOutResult)
      } else {
        console.log('⚠️ UNEXPECTED: Check-out API response:', checkOutResponse.status, checkOutResult)
      }
      
    } else {
      console.log('⚠️ Could not test check-out (check-in failed):', validCheckInResult)
    }
    
    await userClient.auth.signOut()
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

async function testUploadServiceSecurity() {
  try {
    console.log('\n🛡️ ทดสอบ Upload Service Security...')
    
    // Test UUID validation
    console.log('📝 Test UUID validation:')
    
    const validUUID = '585572b8-4552-4de9-8bb0-00aba3273fc0'
    const invalidUUIDs = [
      'invalid-uuid',
      '123',
      'user-id',
      '../../../etc/passwd',
      'DROP TABLE users;',
      ''
    ]
    
    // Mock isValidUUID function (same logic as in service)
    function isValidUUID(uuid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }
    
    console.log(`✅ Valid UUID (${validUUID}):`, isValidUUID(validUUID))
    
    invalidUUIDs.forEach(uuid => {
      const isValid = isValidUUID(uuid)
      if (isValid) {
        console.log(`❌ BAD: Invalid UUID passed validation: "${uuid}"`)
      } else {
        console.log(`✅ GOOD: Invalid UUID blocked: "${uuid}"`)
      }
    })
    
    // Test path sanitization
    console.log('\n🧽 Test path sanitization:')
    
    function sanitizePathComponent(component) {
      return component
        .replace(/[^a-zA-Z0-9\-_.]/g, '')
        .replace(/\.\./g, '')
        .replace(/\//g, '')
        .trim();
    }
    
    const dangerousInputs = [
      '../../../etc/passwd',
      'user/../../admin',
      'user;DROP TABLE users;',
      'user<script>alert(1)</script>',
      'normal-filename.jpg'
    ]
    
    dangerousInputs.forEach(input => {
      const sanitized = sanitizePathComponent(input)
      console.log(`Input: "${input}" → Sanitized: "${sanitized}"`)
    })
    
  } catch (error) {
    console.error('💥 Upload service test error:', error)
  }
}

async function runSecurityTests() {
  console.log('🔐 เริ่มการทดสอบ Security ระบบ Supabase Storage\n')
  
  await testApplicationSecurity()
  await testUploadServiceSecurity()
  
  console.log('\n🎯 สรุปการทดสอบ Security:')
  console.log('1. Application-Level Security ป้องกันการส่ง URL ของคนอื่น')
  console.log('2. Input Validation ป้องกัน injection attacks')
  console.log('3. Path Sanitization ป้องกัน path traversal')
  console.log('4. UUID Validation ป้องกัน invalid employee IDs')
  
  console.log('\n🚀 ขั้นตอนต่อไป:')
  console.log('1. ถ้า tests ผ่านหมด = Security ระดับ Application ทำงานแล้ว')
  console.log('2. แก้ไข Storage RLS ใน Supabase Console (ถ้าจำเป็น)')  
  console.log('3. Deploy และทดสอบในสภาพแวดล้อมจริง')
  
  console.log('\n🏁 การทดสอบ Security เสร็จสิ้น!')
}

runSecurityTests()