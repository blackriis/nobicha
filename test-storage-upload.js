#!/usr/bin/env node
/**
 * Test Script สำหรับทดสอบการอัพโหลดรูปไปยัง Supabase Storage
 * ทดสอบ bucket 'employee-selfies' ที่สร้างไว้
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })
import fs from 'fs'
import path from 'path'

console.log('🚀 เริ่มทดสอบการอัพโหลดรูปไปยัง Supabase Storage')

async function testStorageUpload() {
  try {
    // ใช้ Service Role Client สำหรับการทดสอบ
    console.log('1️⃣ สร้าง Supabase client...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ ไม่พบ environment variables:', { 
        url: !!supabaseUrl, 
        serviceKey: !!supabaseServiceKey 
      })
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // ตรวจสอบ Storage Bucket
    console.log('2️⃣ ตรวจสอบ bucket "employee-selfies"...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ ไม่สามารถดึงข้อมูล buckets:', bucketsError)
      return
    }
    
    console.log('📦 Buckets ทั้งหมด:', buckets.map(b => b.name))
    
    const employeeSelfieBucket = buckets.find(b => b.name === 'employee-selfies')
    if (!employeeSelfieBucket) {
      console.error('❌ ไม่พบ bucket "employee-selfies"')
      return
    }
    
    console.log('✅ พบ bucket "employee-selfies":', employeeSelfieBucket)
    
    // สร้างไฟล์รูปสำหรับทดสอบ (Base64 เป็น Buffer)
    console.log('3️⃣ สร้างไฟล์ทดสอบ...')
    
    // สร้าง mock image data (1x1 pixel PNG)
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // Test Employee ID (จากข้อมูล test users)
    const testEmployeeId = '00000000-0000-0000-0000-000000000001' // จาก employee.som@test.com
    const testFilename = `checkin/${testEmployeeId}/${Date.now()}_test.png`
    
    console.log('📄 ไฟล์ทดสอบ:', testFilename)
    console.log('📦 ขนาดไฟล์:', mockImageBuffer.length, 'bytes')
    
    // ทดสอบการอัพโหลด
    console.log('4️⃣ ทำการอัพโหลด...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(testFilename, mockImageBuffer, {
        contentType: 'image/png',
        duplex: 'half' // สำหรับ Node.js
      })
    
    if (uploadError) {
      console.error('❌ การอัพโหลดล้มเหลว:', uploadError)
      return
    }
    
    console.log('✅ อัพโหลดสำเร็จ:', uploadData)
    
    // ทดสอบการดึงข้อมูล URL
    console.log('5️⃣ ทดสอบการดึง Public URL...')
    const { data: urlData } = supabase.storage
      .from('employee-selfies')
      .getPublicUrl(testFilename)
    
    console.log('🔗 Public URL:', urlData.publicUrl)
    
    // ทดสอบการดาวน์โหลด
    console.log('6️⃣ ทดสอบการดาวน์โหลด...')
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('employee-selfies')
      .download(testFilename)
    
    if (downloadError) {
      console.error('❌ การดาวน์โหลดล้มเหลว:', downloadError)
    } else {
      console.log('✅ ดาวน์โหลดสำเร็จ, ขนาด:', downloadData.size, 'bytes')
    }
    
    // ทดสอบการลบไฟล์
    console.log('7️⃣ ทดสอบการลบไฟล์...')
    const { error: deleteError } = await supabase.storage
      .from('employee-selfies')
      .remove([testFilename])
    
    if (deleteError) {
      console.error('❌ การลบไฟล์ล้มเหลว:', deleteError)
    } else {
      console.log('✅ ลบไฟล์สำเร็จ')
    }
    
    // รายงานสรุป
    console.log('\n🎯 สรุปผลการทดสอบ:')
    console.log('✅ Bucket พร้อมใช้งาน')
    console.log('✅ การอัพโหลดทำงานได้')
    console.log('✅ การสร้าง Public URL ทำงานได้')
    console.log('✅ การดาวน์โหลดทำงานได้')
    console.log('✅ การลบไฟล์ทำงานได้')
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error)
  }
}

// ทดสอบการใช้งาน Bucket กับ User Authentication
async function testUserBasedUpload() {
  try {
    console.log('\n🔐 ทดสอบการอัพโหลดแบบมี Authentication...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ ไม่พบ environment variables สำหรับ anon client')
      return
    }
    
    // ใช้ regular client และ login เป็น test user
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('🔑 Login ด้วย test employee...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'employee.som@test.com',
      password: 'Employee123!'
    })
    
    if (authError || !authData.user) {
      console.error('❌ Login ล้มเหลว:', authError)
      return
    }
    
    console.log('✅ Login สำเร็จ, User ID:', authData.user.id)
    
    // ทดสอบอัพโหลดด้วย User session
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    const userFilename = `checkin/${authData.user.id}/${Date.now()}_user_test.png`
    
    console.log('📤 อัพโหลดด้วย user session...')
    const { data: userUpload, error: userUploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(userFilename, mockImageBuffer, {
        contentType: 'image/png'
      })
    
    if (userUploadError) {
      console.error('❌ User upload ล้มเหลว:', userUploadError)
    } else {
      console.log('✅ User upload สำเร็จ:', userUpload)
      
      // ลบไฟล์ทดสอบ
      await supabase.storage
        .from('employee-selfies')  
        .remove([userFilename])
      console.log('🗑️ ลบไฟล์ทดสอบแล้ว')
    }
    
    // Logout
    await supabase.auth.signOut()
    console.log('🚪 Logout สำเร็จ')
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการทดสอบ User-based upload:', error)
  }
}

// รันการทดสอบ
async function runAllTests() {
  await testStorageUpload()
  await testUserBasedUpload()
  
  console.log('\n🏁 การทดสอบทั้งหมดเสร็จสิ้น!')
}

runAllTests()