#!/usr/bin/env node
/**
 * แก้ไข Storage Policies โดยใช้ Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function fixPoliciesDirect() {
  try {
    console.log('⚡ แก้ไข Storage Policies โดยตรง...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🧪 ทดสอบ policies ปัจจุบันด้วยการลองอัพโหลด...')
    
    // ทดสอบโดยใช้ Service Role (ควรผ่าน)
    const testBuffer = Buffer.from('test')
    const serviceRoleTestPath = 'test/service-role-test.txt'
    
    const { data: serviceUpload, error: serviceError } = await supabase.storage
      .from('employee-selfies')
      .upload(serviceRoleTestPath, testBuffer, {
        contentType: 'text/plain'
      })
    
    if (serviceError) {
      console.error('❌ Service role upload ล้มเหลว:', serviceError)
    } else {
      console.log('✅ Service role upload สำเร็จ (คาดหวัง)')
      
      // ลบไฟล์ทดสอบ
      await supabase.storage
        .from('employee-selfies')
        .remove([serviceRoleTestPath])
    }
    
    // ตรวจสอบ bucket info
    console.log('📦 ข้อมูล bucket ปัจจุบัน:')
    const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket('employee-selfies')
    
    if (bucketError) {
      console.error('❌ ไม่สามารถดึงข้อมูล bucket:', bucketError)
    } else {
      console.log('✅ Bucket info:', bucketInfo)
    }
    
    // List ไฟล์ทั้งหมดในbucket
    const { data: allFiles, error: listError } = await supabase.storage
      .from('employee-selfies')
      .list('', { limit: 10 })
    
    if (listError) {
      console.error('❌ ไม่สามารถ list files:', listError)
    } else {
      console.log(`📁 ไฟล์ใน bucket: ${allFiles.length} รายการ`)
      allFiles.forEach(file => console.log(`  - ${file.name}`))
    }
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

async function testPoliciesWithUser() {
  try {
    console.log('\n🔐 ทดสอบ policies ด้วย user authentication...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    
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
    
    const testBuffer = Buffer.from('test-user-file')
    
    // Test 1: อัพโหลดในพาธตัวเอง (ควรผ่าน)
    const ownPath = `checkin/${authData.user.id}/policy_test_${Date.now()}.txt`
    console.log('📤 ทดสอบอัพโหลดในพาธตัวเอง:', ownPath)
    
    const { data: ownUpload, error: ownError } = await userClient.storage
      .from('employee-selfies')
      .upload(ownPath, testBuffer, {
        contentType: 'text/plain'
      })
    
    if (ownError) {
      console.log('❌ อัพโหลดในพาธตัวเองล้มเหลว:', ownError.message)
    } else {
      console.log('✅ อัพโหลดในพาธตัวเองสำเร็จ')
      // ลบไฟล์ทดสอบ
      await userClient.storage.from('employee-selfies').remove([ownPath])
    }
    
    // Test 2: อัพโหลดในพาธคนอื่น (ควรล้มเหลว)
    const otherPath = `checkin/00000000-0000-0000-0000-000000000002/unauthorized_${Date.now()}.txt`
    console.log('🚫 ทดสอบอัพโหลดในพาธคนอื่น:', otherPath)
    
    const { data: otherUpload, error: otherError } = await userClient.storage
      .from('employee-selfies')
      .upload(otherPath, testBuffer, {
        contentType: 'text/plain'
      })
    
    if (otherError) {
      console.log('✅ อัพโหลดในพาธคนอื่นถูกปฏิเสธ (ถูกต้อง):', otherError.message)
    } else {
      console.log('❌ อัพโหลดในพาธคนอื่นผ่าน (ไม่ถูกต้อง!):', otherUpload)
      // ลบไฟล์ที่ไม่ควรอัพโหลดได้
      await userClient.storage.from('employee-selfies').remove([otherPath])
    }
    
    await userClient.auth.signOut()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ user policies:', error)
  }
}

async function runDirectFix() {
  console.log('🚨 การแก้ไข Storage Policies โดยตรง\n')
  
  await fixPoliciesDirect()
  await testPoliciesWithUser()
  
  console.log('\n📋 ขั้นตอนการแก้ไขที่ต้องทำใน Supabase Console:')
  console.log('1. เข้า Supabase Dashboard > Authentication > Policies')
  console.log('2. ไป Table: storage.objects')
  console.log('3. ลบ policies เก่าทั้งหมด')
  console.log('4. สร้าง policies ใหม่:')
  console.log('   - Users can upload own selfies: FOR INSERT')
  console.log('   - Users can view own selfies: FOR SELECT') 
  console.log('   - Users can update own selfies: FOR UPDATE')
  console.log('   - Users can delete own selfies: FOR DELETE')
  console.log('   - Admins can manage all: FOR ALL')
  
  console.log('\n🎯 Policy Condition ที่ต้องใช้:')
  console.log('bucket_id = \'employee-selfies\' AND')
  console.log('auth.uid() IS NOT NULL AND')
  console.log('(name LIKE \'checkin/\' || auth.uid()::text || \'/%\' OR')
  console.log(' name LIKE \'checkout/\' || auth.uid()::text || \'/%\')')
}

runDirectFix()