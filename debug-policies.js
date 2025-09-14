#!/usr/bin/env node
/**
 * Debug policies โดยละเอียด
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function debugPolicies() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔍 Debug Storage Policies...')
    
    console.log('\n📊 Supabase Connection Info:')
    console.log('- URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('- Service Key available:', !!supabaseServiceKey)
    
    // ตรวจสอบ bucket
    console.log('\n📦 Bucket Status:')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError)
      return
    }
    
    const employeeBucket = buckets.find(b => b.name === 'employee-selfies')
    if (!employeeBucket) {
      console.error('❌ employee-selfies bucket not found!')
      return
    }
    
    console.log('✅ Bucket found:', {
      name: employeeBucket.name,
      public: employeeBucket.public,
      owner: employeeBucket.owner
    })
    
    // ตรวจสอบว่าสามารถเขียนไฟล์ด้วย Service Role ได้หรือไม่
    console.log('\n🧪 Service Role Test:')
    const testBuffer = Buffer.from('test')
    const servicePath = `test/service-${Date.now()}.txt`
    
    const { data: serviceUpload, error: serviceError } = await supabase.storage
      .from('employee-selfies')
      .upload(servicePath, testBuffer, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (serviceError) {
      if (serviceError.message.includes('mime type')) {
        console.log('✅ Service role works (mime type restriction expected)')
      } else {
        console.error('❌ Service role upload failed:', serviceError.message)
      }
    } else {
      console.log('✅ Service role upload works')
      // ลบไฟล์ทดสอบ
      await supabase.storage.from('employee-selfies').remove([servicePath])
    }
    
    // แสดง SQL สำหรับ debug policies
    console.log('\n🔧 SQL Commands to Debug in Supabase Console:')
    console.log(`
-- 1. ตรวจสอบ RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. ตรวจสอบ policies ปัจจุบัน
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- 3. ตรวจสอบ auth context (รันขณะ login)
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 4. ทดสอบ policy condition
SELECT 
  'checkin/585572b8-4552-4de9-8bb0-00aba3273fc0/test.png' ~ ('^checkin/' || '585572b8-4552-4de9-8bb0-00aba3273fc0' || '/.*') as should_be_true,
  'checkin/00000000-0000-0000-0000-000000000002/test.png' ~ ('^checkin/' || '585572b8-4552-4de9-8bb0-00aba3273fc0' || '/.*') as should_be_false;
    `)
    
    console.log('\n⚠️ สาเหตุที่เป็นไปได้:')
    console.log('1. Policies ไม่ถูกสร้าง หรือ ถูกลบไปแล้ว')
    console.log('2. RLS ไม่ได้เปิดบน storage.objects')
    console.log('3. Policy syntax ไม่ถูกต้อง')
    console.log('4. Supabase caching issues')
    console.log('5. ใช้ Service Role โดยไม่ได้ตั้งใจ (bypass policies)')
    
    console.log('\n🚨 การแก้ไขด่วน:')
    console.log('วิธีที่ 1: ปิด bucket ชั่วคราว')
    console.log('UPDATE storage.buckets SET public = false WHERE name = \'employee-selfies\';')
    console.log('')
    console.log('วิธีที่ 2: ใช้ Application-level validation แทน')
    console.log('- ตรวจสอบ user_id ใน API endpoints')
    console.log('- ห้ามพึ่งพา Storage RLS อย่างเดียว')
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

debugPolicies()