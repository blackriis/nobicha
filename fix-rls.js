#!/usr/bin/env node

/**
 * Fix RLS Policies Script
 * แก้ไข RLS policies ที่มี infinite recursion
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

async function fixRLSPolicies() {
  console.log('🔧 เริ่มแก้ไข RLS Policies...\n')
  
  try {
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-rls-policies.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 อ่านไฟล์ SQL...')
    console.log(`   ไฟล์: ${sqlPath}`)
    console.log(`   ขนาด: ${sqlContent.length} ตัวอักษร`)
    
    // Execute the SQL
    console.log('\n🚀 รัน SQL commands...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })
    
    if (error) {
      console.error('❌ เกิดข้อผิดพลาดในการรัน SQL:')
      console.error(`   ${error.message}`)
      
      // Try alternative method - execute directly
      console.log('\n🔄 ลองวิธีอื่น...')
      const { data: directData, error: directError } = await supabase
        .from('_sql')
        .select('*')
        .eq('query', sqlContent)
      
      if (directError) {
        console.error('❌ ไม่สามารถรัน SQL ได้:')
        console.error(`   ${directError.message}`)
        console.log('\n📝 กรุณารัน SQL ด้วยตนเองใน Supabase Dashboard:')
        console.log('   1. ไปที่ https://supabase.com/dashboard')
        console.log('   2. เลือกโปรเจคของคุณ')
        console.log('   3. ไปที่ SQL Editor')
        console.log('   4. คัดลอกเนื้อหาจาก fix-rls-policies.sql')
        console.log('   5. รัน SQL commands')
        return false
      }
    }
    
    console.log('✅ แก้ไข RLS Policies สำเร็จ!')
    
    // Test the connection
    console.log('\n🧪 ทดสอบการเชื่อมต่อ...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)
    
    if (usersError) {
      console.error('❌ ยังมีปัญหาในการดึงข้อมูล users:')
      console.error(`   ${usersError.message}`)
      return false
    }
    
    console.log('✅ การเชื่อมต่อทำงานปกติ!')
    console.log(`   พบข้อมูล users: ${users.length} รายการ`)
    
    return true
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดที่ไม่คาดคิด:')
    console.error(`   ${error.message}`)
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มแก้ไข RLS Policies...\n')
  
  const success = await fixRLSPolicies()
  
  if (success) {
    console.log('\n🎉 แก้ไข RLS Policies สำเร็จ!')
    console.log('📝 ตอนนี้สามารถรัน test-supabase-connection.js ได้แล้ว')
  } else {
    console.log('\n❌ การแก้ไขล้มเหลว')
    console.log('📝 กรุณาตรวจสอบ Supabase project และรัน SQL ด้วยตนเอง')
  }
}

main().catch(error => {
  console.error('💥 เกิดข้อผิดพลาด:', error)
  process.exit(1)
})
