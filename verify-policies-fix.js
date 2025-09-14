#!/usr/bin/env node
/**
 * ตรวจสอบ Policies ที่มีอยู่ปัจจุบัน
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/web/.env.local' })

async function verifyCurrentPolicies() {
  try {
    console.log('🔍 ตรวจสอบ Policies ปัจจุบันใน Supabase...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('📋 ขั้นตอนการตรวจสอบที่แนะนำ:')
    console.log('1. เข้า Supabase Dashboard')
    console.log('2. ไป Authentication > Policies')
    console.log('3. กดปุ่ม "All tables" และเลือก "storage.objects"')
    console.log('4. ดู policies ที่มีอยู่สำหรับ bucket "employee-selfies"')
    
    console.log('\n🔧 SQL สำหรับตรวจสอบ policies (รันใน SQL Editor):')
    console.log(`
-- ตรวจสอบ policies ปัจจุบัน
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
  AND policyname ILIKE '%selfies%'
ORDER BY policyname;

-- ตรวจสอบว่า RLS เปิดอยู่หรือไม่
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'objects' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');
    `)
    
    console.log('\n❗ หาก policies ไม่มี หรือ มีแต่ไม่ทำงาน:')
    console.log('1. ลบ policies เก่าทั้งหมดก่อน:')
    console.log(`
DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all selfies" ON storage.objects;
    `)
    
    console.log('\n2. สร้างใหม่ทีละตัว:')
    console.log(`
-- เปิด RLS ก่อน
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ INSERT
CREATE POLICY "Employee upload selfies" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'employee-selfies' 
  AND (storage.foldername(name))[1] = 'checkin'
  AND (storage.foldername(name))[2] = auth.uid()::text
  OR
  bucket_id = 'employee-selfies' 
  AND (storage.foldername(name))[1] = 'checkout'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy สำหรับ SELECT
CREATE POLICY "Employee view own selfies" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'employee-selfies' 
  AND (
    ((storage.foldername(name))[1] = 'checkin' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    ((storage.foldername(name))[1] = 'checkout' AND (storage.foldername(name))[2] = auth.uid()::text)
  )
);
    `)
    
    // ทดสอบการเข้าถึงด้วย Service Role
    console.log('\n🧪 ทดสอบด้วย Service Role (ควรเข้าถึงได้ทุกอย่าง):')
    
    const { data: bucketFiles, error: bucketError } = await supabase.storage
      .from('employee-selfies')
      .list('', { limit: 5 })
    
    if (bucketError) {
      console.error('❌ Service Role ไม่สามารถ list files:', bucketError.message)
    } else {
      console.log(`✅ Service Role สามารถ list files: ${bucketFiles.length} รายการ`)
    }
    
    // ตรวจสอบ bucket configuration
    const { data: bucketInfo, error: bucketInfoError } = await supabase.storage.getBucket('employee-selfies')
    
    if (bucketInfoError) {
      console.error('❌ ไม่สามารถดึงข้อมูล bucket:', bucketInfoError.message)
    } else {
      console.log('📦 Bucket Info:')
      console.log('   - Public:', bucketInfo.public)
      console.log('   - File Size Limit:', bucketInfo.file_size_limit)
      console.log('   - Allowed MIME Types:', bucketInfo.allowed_mime_types)
    }
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

console.log('🔐 ตรวจสอบ Storage Policies และให้คำแนะนำการแก้ไข\n')
verifyCurrentPolicies()