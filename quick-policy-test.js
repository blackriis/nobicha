#!/usr/bin/env node
/**
 * ทดสอบ policy ใหม่อย่างรวดเร็ว
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function quickTest() {
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
  
  console.log('✅ Login success, User ID:', authData.user.id)
  
  const mockImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )
  
  // Test: อัพโหลดในพาธคนอื่น (ควรล้มเหลว)
  const badPath = `checkin/00000000-0000-0000-0000-000000000002/test_${Date.now()}.png`
  console.log('\n🚫 Testing unauthorized upload:', badPath)
  
  const { data, error } = await userClient.storage
    .from('employee-selfies')
    .upload(badPath, mockImage, { contentType: 'image/png' })
  
  if (error) {
    console.log('✅ GOOD: Unauthorized upload blocked:', error.message)
  } else {
    console.log('❌ BAD: Unauthorized upload succeeded!', data)
    // ลบไฟล์ที่อัพโหลดผิด
    await userClient.storage.from('employee-selfies').remove([badPath])
  }
  
  await userClient.auth.signOut()
}

quickTest()