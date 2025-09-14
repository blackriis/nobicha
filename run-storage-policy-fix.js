#!/usr/bin/env node
/**
 * รันการแก้ไข RLS Policies ทันที
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: './apps/web/.env.local' })

async function runStoragePolicyFix() {
  try {
    console.log('🔧 เริ่มการแก้ไข Storage Policies...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ ไม่พบ environment variables')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // อ่านไฟล์ SQL
    console.log('📄 อ่านไฟล์ fix-storage-policies-immediate.sql...')
    const sqlContent = fs.readFileSync('fix-storage-policies-immediate.sql', 'utf8')
    
    // แยก SQL statements (เฉพาะที่สำคัญ)
    const statements = [
      // ลบ policies เก่า
      `DROP POLICY IF EXISTS "Users can upload own selfies" ON storage.objects`,
      `DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects`, 
      `DROP POLICY IF EXISTS "Users can update own selfies" ON storage.objects`,
      `DROP POLICY IF EXISTS "Users can delete own selfies" ON storage.objects`,
      `DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects`,
      `DROP POLICY IF EXISTS "Admins can manage all selfies" ON storage.objects`,
      
      // เปิด RLS
      `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY`,
      
      // สร้าง policies ใหม่
      `CREATE POLICY "Users can upload own selfies" ON storage.objects
       FOR INSERT 
       WITH CHECK (
         bucket_id = 'employee-selfies' 
         AND auth.uid() IS NOT NULL
         AND (
           name LIKE 'checkin/' || auth.uid()::text || '/%'
           OR name LIKE 'checkout/' || auth.uid()::text || '/%'
         )
       )`,
       
      `CREATE POLICY "Users can view own selfies" ON storage.objects
       FOR SELECT 
       USING (
         bucket_id = 'employee-selfies' 
         AND auth.uid() IS NOT NULL
         AND (
           name LIKE 'checkin/' || auth.uid()::text || '/%'
           OR name LIKE 'checkout/' || auth.uid()::text || '/%'
         )
       )`,
       
      `CREATE POLICY "Users can update own selfies" ON storage.objects
       FOR UPDATE 
       USING (
         bucket_id = 'employee-selfies' 
         AND auth.uid() IS NOT NULL
         AND (
           name LIKE 'checkin/' || auth.uid()::text || '/%'
           OR name LIKE 'checkout/' || auth.uid()::text || '/%'
         )
       )`,
       
      `CREATE POLICY "Users can delete own selfies" ON storage.objects
       FOR DELETE 
       USING (
         bucket_id = 'employee-selfies' 
         AND auth.uid() IS NOT NULL
         AND (
           name LIKE 'checkin/' || auth.uid()::text || '/%'
           OR name LIKE 'checkout/' || auth.uid()::text || '/%'
         )
       )`,
       
      `CREATE POLICY "Admins can view all selfies" ON storage.objects
       FOR SELECT 
       USING (
         bucket_id = 'employee-selfies' 
         AND EXISTS (
           SELECT 1 FROM users u 
           WHERE u.id = auth.uid() AND u.role = 'admin'
         )
       )`,
       
      `CREATE POLICY "Admins can manage all selfies" ON storage.objects
       FOR ALL
       USING (
         bucket_id = 'employee-selfies' 
         AND EXISTS (
           SELECT 1 FROM users u 
           WHERE u.id = auth.uid() AND u.role = 'admin'
         )
       )`
    ]
    
    console.log(`📝 เตรียม execute ${statements.length} statements...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (!statement) continue
      
      try {
        console.log(`${i + 1}. รัน: ${statement.split('\n')[0]}...`)
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`   ❌ Error:`, error.message)
          errorCount++
        } else {
          console.log(`   ✅ สำเร็จ`)
          successCount++
        }
        
      } catch (error) {
        console.error(`   💥 Exception:`, error.message)
        errorCount++
      }
      
      // รอเล็กน้อยระหว่าง statements
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`\n📊 สรุปผลการรัน:`)
    console.log(`✅ สำเร็จ: ${successCount} statements`)
    console.log(`❌ ผิดพลาด: ${errorCount} statements`)
    
    // ตรวจสอบ policies ที่มีอยู่
    console.log('\n🔍 ตรวจสอบ policies ปัจจุบัน...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage')
      .ilike('policyname', '%selfies%')
    
    if (policyError) {
      console.error('❌ ไม่สามารถดึง policies:', policyError)
    } else {
      console.log(`📋 พบ ${policies.length} storage policies:`)
      policies.forEach(policy => {
        console.log(`- ${policy.policyname} (${policy.cmd})`)
      })
    }
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดใหญ่:', error)
  }
}

async function createAdminUser() {
  try {
    console.log('\n👑 สร้าง Admin Test User...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // ตรวจสอบว่ามี admin@test.com อยู่แล้วหรือไม่
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@test.com')
      .single()
    
    if (existingUser) {
      console.log('✅ Admin user มีอยู่แล้ว:', existingUser)
      return existingUser.id
    }
    
    // สร้าง admin user ใหม่
    console.log('🏗️ สร้าง admin user ใหม่...')
    
    const adminId = '00000000-0000-0000-0000-000000000003'
    
    // สร้างใน users table ก่อน
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: adminId,
        email: 'admin@test.com',
        full_name: 'Test Admin User',
        role: 'admin',
        phone: '+66-000-000-003'
      })
      .select()
      .single()
    
    if (createUserError) {
      console.error('❌ สร้าง user profile ล้มเหลว:', createUserError)
      return null
    }
    
    console.log('✅ สร้าง admin user สำเร็จ:', newUser)
    return newUser.id
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการสร้าง admin user:', error)
    return null
  }
}

async function runAllFixes() {
  console.log('🚀 เริ่มการแก้ไข Storage Security ทันที!')
  
  await runStoragePolicyFix()
  await createAdminUser()
  
  console.log('\n🏁 การแก้ไข Storage Policies เสร็จสิ้น!')
  console.log('📋 ขั้นตอนต่อไป: ทดสอบ policies ใหม่')
}

runAllFixes()