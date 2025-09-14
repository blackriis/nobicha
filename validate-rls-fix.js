#!/usr/bin/env node
/**
 * ตรวจสอบว่า RLS Policies ใหม่ทำงานหรือไม่
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function validateRLSFix() {
  try {
    console.log('🔍 ตรวจสอบ RLS Policies หลังการแก้ไข...')
    
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
    
    // Test 1: อัพโหลดในพาธตัวเอง (ควรสำเร็จ)
    console.log('\n✅ Test 1: อัพโหลดในพาธตัวเอง')
    const ownPath = `checkin/${authData.user.id}/rls_test_${Date.now()}.png`
    
    const { data: ownUpload, error: ownError } = await userClient.storage
      .from('employee-selfies')
      .upload(ownPath, mockImage, { contentType: 'image/png' })
    
    if (ownError) {
      console.log('❌ อัพโหลดในพาธตัวเองล้มเหลว:', ownError.message)
    } else {
      console.log('✅ อัพโหลดในพาธตัวเองสำเร็จ')
      
      // ลบไฟล์ทดสอบ
      await userClient.storage.from('employee-selfies').remove([ownPath])
      console.log('🗑️ ลบไฟล์ทดสอบแล้ว')
    }
    
    // Test 2: อัพโหลดในพาธคนอื่น (ควรล้มเหลว)
    console.log('\n🚫 Test 2: อัพโหลดในพาธคนอื่น (ควรถูกปฏิเสธ)')
    const otherPath = `checkin/00000000-0000-0000-0000-000000000002/rls_test_${Date.now()}.png`
    
    const { data: otherUpload, error: otherError } = await userClient.storage
      .from('employee-selfies')
      .upload(otherPath, mockImage, { contentType: 'image/png' })
    
    if (otherError) {
      console.log('✅ PERFECT: อัพโหลดในพาธคนอื่นถูกปฏิเสธ:', otherError.message)
      console.log('🎉 RLS Policies ทำงานถูกต้องแล้ว!')
    } else {
      console.log('❌ PROBLEM: อัพโหลดในพาธคนอื่นผ่าน!', otherUpload)
      console.log('🚨 RLS Policies ยังไม่ทำงาน - ต้องตรวจสอบใน Supabase Console')
      
      // ลบไฟล์ที่ไม่ควรอัพโหลดได้
      await userClient.storage.from('employee-selfies').remove([otherPath])
    }
    
    // Test 3: อัพโหลดในพาธ checkout (ควรสำเร็จ)
    console.log('\n✅ Test 3: อัพโหลดในพาธ checkout')
    const checkoutPath = `checkout/${authData.user.id}/rls_test_${Date.now()}.png`
    
    const { data: checkoutUpload, error: checkoutError } = await userClient.storage
      .from('employee-selfies')
      .upload(checkoutPath, mockImage, { contentType: 'image/png' })
    
    if (checkoutError) {
      console.log('❌ อัพโหลดในพาธ checkout ล้มเหลว:', checkoutError.message)
    } else {
      console.log('✅ อัพโหลดในพาธ checkout สำเร็จ')
      
      // ลบไฟล์ทดสอบ
      await userClient.storage.from('employee-selfies').remove([checkoutPath])
      console.log('🗑️ ลบไฟล์ทดสอบแล้ว')
    }
    
    await userClient.auth.signOut()
    
  } catch (error) {
    console.error('💥 Test error:', error)
  }
}

async function showInstructions() {
  console.log('📋 คำแนะนำการแก้ไข RLS Policies:')
  console.log('')
  console.log('1. เข้า Supabase Dashboard')
  console.log('2. ไป SQL Editor')
  console.log('3. รัน SQL จากไฟล์ FINAL_RLS_FIX.sql ทีละบล็อก')
  console.log('4. หลังรัน SQL แล้ว ให้รันคำสั่ง: node validate-rls-fix.js')
  console.log('')
  console.log('🎯 ผลลัพธ์ที่ต้องการ:')
  console.log('✅ Test 1: อัพโหลดในพาธตัวเองสำเร็จ')
  console.log('✅ Test 2: อัพโหลดในพาธคนอื่นถูกปฏิเสธ (PERFECT!)')
  console.log('✅ Test 3: อัพโหลดในพาธ checkout สำเร็จ')
  console.log('')
  console.log('🚨 หากยัง Test 2 ผ่าน = RLS ยังไม่ทำงาน')
  console.log('')
}

async function main() {
  await showInstructions()
  console.log('⏳ รอ 5 วินาที แล้วเริ่มทดสอบ...\n')
  await new Promise(resolve => setTimeout(resolve, 5000))
  await validateRLSFix()
}

main()