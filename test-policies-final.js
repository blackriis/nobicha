#!/usr/bin/env node
/**
 * ทดสอบ Storage Policies ด้วยรูปภาพจริง
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function testFinalPolicies() {
  try {
    console.log('📸 ทดสอบ Storage Policies ด้วยไฟล์รูปภาพ...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // สร้าง mock image buffer (1x1 pixel PNG)
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // Login
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError) {
      console.error('❌ User login ล้มเหลว:', authError)
      return
    }
    
    console.log('✅ User login สำเร็จ, User ID:', authData.user.id)
    
    // Test 1: อัพโหลดในพาธตัวเอง (ควรผ่าน)
    const ownPath = `checkin/${authData.user.id}/policy_test_${Date.now()}.png`
    console.log('\n📤 Test 1: อัพโหลดในพาธตัวเอง')
    console.log('   Path:', ownPath)
    
    const { data: ownUpload, error: ownError } = await userClient.storage
      .from('employee-selfies')
      .upload(ownPath, mockImageBuffer, {
        contentType: 'image/png'
      })
    
    if (ownError) {
      console.log('❌ อัพโหลดในพาธตัวเองล้มเหลว:', ownError.message)
    } else {
      console.log('✅ อัพโหลดในพาธตัวเองสำเร็จ')
      
      // ทดสอบการดาวน์โหลด
      const { data: downloadData, error: downloadError } = await userClient.storage
        .from('employee-selfies')
        .download(ownPath)
      
      if (downloadError) {
        console.log('❌ ดาวน์โหลดล้มเหลว:', downloadError.message)
      } else {
        console.log('✅ ดาวน์โหลดสำเร็จ')
      }
      
      // ลบไฟล์ทดสอบ
      const { error: deleteError } = await userClient.storage
        .from('employee-selfies')
        .remove([ownPath])
      
      if (deleteError) {
        console.log('❌ ลบไฟล์ล้มเหลว:', deleteError.message)
      } else {
        console.log('✅ ลบไฟล์สำเร็จ')
      }
    }
    
    // Test 2: อัพโหลดในพาธคนอื่น (ควรล้มเหลว)
    const otherPath = `checkin/00000000-0000-0000-0000-000000000002/unauthorized_${Date.now()}.png`
    console.log('\n🚫 Test 2: อัพโหลดในพาธคนอื่น (ควรถูกปฏิเสธ)')
    console.log('   Path:', otherPath)
    
    const { data: otherUpload, error: otherError } = await userClient.storage
      .from('employee-selfies')
      .upload(otherPath, mockImageBuffer, {
        contentType: 'image/png'
      })
    
    if (otherError) {
      console.log('✅ อัพโหลดในพาธคนอื่นถูกปฏิเสธ (ถูกต้อง):', otherError.message)
    } else {
      console.log('❌ อัพโหลดในพาธคนอื่นผ่าน (ช่องโหว่ความปลอดภัย!):', otherUpload)
      // ลบไฟล์ที่ไม่ควรอัพโหลดได้
      await userClient.storage.from('employee-selfies').remove([otherPath])
      console.log('🗑️ ลบไฟล์ที่อัพโหลดผิดแล้ว')
    }
    
    // Test 3: อัพโหลดในพาธ checkout (ควรผ่าน)
    const checkoutPath = `checkout/${authData.user.id}/checkout_test_${Date.now()}.png`
    console.log('\n📤 Test 3: อัพโหลดในพาธ checkout')
    console.log('   Path:', checkoutPath)
    
    const { data: checkoutUpload, error: checkoutError } = await userClient.storage
      .from('employee-selfies')
      .upload(checkoutPath, mockImageBuffer, {
        contentType: 'image/png'
      })
    
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
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

async function testAdminPolicies() {
  try {
    console.log('\n👑 ทดสอบ Admin Policies...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const adminClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login เป็น admin
    const { data: adminAuth, error: adminAuthError } = await adminClient.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'Admin123!'
    })
    
    if (adminAuthError) {
      console.error('❌ Admin login ล้มเหลว:', adminAuthError.message)
      console.log('💡 สร้าง admin user ก่อนครับ!')
      return
    }
    
    console.log('✅ Admin login สำเร็จ, User ID:', adminAuth.user.id)
    
    // ทดสอบการดูไฟล์ทั้งหมด
    const { data: allFiles, error: listError } = await adminClient.storage
      .from('employee-selfies')
      .list('', { limit: 10 })
    
    if (listError) {
      console.error('❌ Admin ไม่สามารถ list files:', listError.message)
    } else {
      console.log(`✅ Admin สามารถดูไฟล์ทั้งหมด: ${allFiles.length} รายการ`)
    }
    
    await adminClient.auth.signOut()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ admin:', error)
  }
}

async function runFinalTest() {
  console.log('🔍 ทดสอบ Storage Policies ขั้นสุดท้าย\n')
  
  await testFinalPolicies()
  await testAdminPolicies()
  
  console.log('\n🎯 สรุปการทดสอบ:')
  console.log('1. หากทุก Test ผ่าน = Policies ทำงานถูกต้อง ✅')
  console.log('2. หาก Test 2 ผ่าน = มีช่องโหว่ ต้องแก้ไข ❌')
  console.log('3. หาก Test 1,3 ล้มเหลว = Policies เข้มงวดเกินไป')
  
  console.log('\n📋 หาก policies ยังมีปัญหา ให้รันคำสั่งนี้:')
  console.log('   ใน Supabase Console > SQL Editor:')
  console.log('   - ลบ policies เก่า')
  console.log('   - สร้าง policies ใหม่ตาม fix-storage-policies-immediate.sql')
  
  console.log('\n🏁 การทดสอบเสร็จสิ้น!')
}

runFinalTest()