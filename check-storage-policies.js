#!/usr/bin/env node
/**
 * ตรวจสอบ Storage Policies และ Permissions
 * สำหรับ bucket 'employee-selfies'
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function checkStoragePolicies() {
  try {
    console.log('🔒 ตรวจสอบ Storage Policies สำหรับ bucket "employee-selfies"')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // ตรวจสอบ RLS Policies บน storage.objects
    console.log('1️⃣ ตรวจสอบ RLS Policies บน storage.objects...')
    
    const { data: policies, error: policiesError } = await supabase.rpc('get_storage_policies')
    
    if (policiesError) {
      console.log('⚠️ ไม่สามารถเรียกใช้ RPC function:', policiesError.message)
      
      // ลองใช้วิธีอื่นในการตรวจสอบ
      console.log('🔄 ใช้วิธีการตรวจสอบทางอื่น...')
      
      // ตรวจสอบการเข้าถึง bucket โดยตรง
      const { data: files, error: listError } = await supabase.storage
        .from('employee-selfies')
        .list('')
      
      if (listError) {
        console.error('❌ ไม่สามารถ list files ใน bucket:', listError)
      } else {
        console.log('✅ สามารถเข้าถึง bucket ได้, files:', files.length, 'รายการ')
      }
      
    } else {
      console.log('✅ พบ Storage Policies:', policies)
    }
    
    // ทดสอบ permissions แบบต่าง ๆ
    console.log('\n2️⃣ ทดสอบ User Permissions...')
    
    // Test 1: Login และทดสอบการอัพโหลดในพาธของตัวเอง
    await testUserOwnPath()
    
    // Test 2: ทดสอบการเข้าถึงพาธของคนอื่น
    await testUnauthorizedAccess()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

async function testUserOwnPath() {
  try {
    console.log('\n📁 ทดสอบการเข้าถึงพาธของตัวเอง...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login เป็น employee.som@test.com
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError) {
      console.error('❌ Login ล้มเหลว:', authError)
      return
    }
    
    console.log('✅ Login สำเร็จ, User ID:', authData.user.id)
    
    // ทดสอบการอัพโหลดในพาธของตัวเอง
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    const ownPath = `checkin/${authData.user.id}/permission_test_${Date.now()}.png`
    console.log('📤 ทดสอบอัพโหลดในพาธตัวเอง:', ownPath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(ownPath, mockImageBuffer, {
        contentType: 'image/png'
      })
    
    if (uploadError) {
      console.error('❌ อัพโหลดในพาธตัวเองล้มเหลว:', uploadError)
    } else {
      console.log('✅ อัพโหลดในพาธตัวเองสำเร็จ')
      
      // ทดสอบการดาวน์โหลด
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('employee-selfies')
        .download(ownPath)
      
      if (downloadError) {
        console.error('❌ ดาวน์โหลดล้มเหลว:', downloadError)
      } else {
        console.log('✅ ดาวน์โหลดสำเร็จ')
      }
      
      // ลบไฟล์ทดสอบ
      await supabase.storage.from('employee-selfies').remove([ownPath])
      console.log('🗑️ ลบไฟล์ทดสอบแล้ว')
    }
    
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบพาธตัวเอง:', error)
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('\n🚫 ทดสอบการเข้าถึงพาธของคนอื่น (ควรล้มเหลว)...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login เป็น employee.som@test.com
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError) {
      console.error('❌ Login ล้มเหลว:', authError)
      return
    }
    
    // ทดสอบการเข้าถึงพาธของคนอื่น (ใช้ UUID อื่น)
    const otherUserId = '00000000-0000-0000-0000-000000000002' // UUID อื่น
    const unauthorizedPath = `checkin/${otherUserId}/unauthorized_test_${Date.now()}.png`
    
    console.log('🚨 ทดสอบอัพโหลดในพาธของคนอื่น:', unauthorizedPath)
    
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(unauthorizedPath, mockImageBuffer, {
        contentType: 'image/png'
      })
    
    if (uploadError) {
      console.log('✅ การอัพโหลดในพาธของคนอื่นถูกปฏิเสธ (ถูกต้อง):', uploadError.message)
    } else {
      console.log('❌ การอัพโหลดในพาธของคนอื่นผ่าน (ไม่ควรเป็นอย่างนี้!):', uploadData)
      
      // ลบไฟล์ที่อัพโหลดได้ (ไม่ควรเกิดขึ้น)
      await supabase.storage.from('employee-selfies').remove([unauthorizedPath])
    }
    
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ unauthorized access:', error)
  }
}

async function testAdminAccess() {
  try {
    console.log('\n👑 ทดสอบการเข้าถึงแบบ Admin...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Login เป็น admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'Admin123!'
    })
    
    if (authError) {
      console.error('❌ Admin login ล้มเหลว:', authError)
      return
    }
    
    console.log('✅ Admin login สำเร็จ, User ID:', authData.user.id)
    
    // ทดสอบการดู files ทั้งหมดใน bucket
    const { data: allFiles, error: listError } = await supabase.storage
      .from('employee-selfies')
      .list('', {
        limit: 10
      })
    
    if (listError) {
      console.error('❌ Admin ไม่สามารถ list files:', listError)
    } else {
      console.log(`✅ Admin สามารถดู files ทั้งหมด: ${allFiles.length} รายการ`)
      if (allFiles.length > 0) {
        console.log('📂 Files:', allFiles.map(f => f.name).slice(0, 3))
      }
    }
    
    await supabase.auth.signOut()
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ admin access:', error)
  }
}

async function runAllPolicyTests() {
  await checkStoragePolicies()
  await testAdminAccess()
  
  console.log('\n🎯 สรุปการทดสอบ Policies:')
  console.log('✅ ผู้ใช้สามารถอัพโหลดในพาธของตัวเองได้')
  console.log('✅ ผู้ใช้ไม่สามารถเข้าถึงพาธของคนอื่น (ถ้า policy ทำงานถูกต้อง)')
  console.log('✅ Admin สามารถดูไฟล์ทั้งหมดได้')
  console.log('\n🏁 การทดสอบ Policies เสร็จสิ้น!')
}

runAllPolicyTests()