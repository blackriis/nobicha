#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 * ทดสอบการเชื่อมต่อด้วย service role key (bypass RLS)
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

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

async function testSupabaseWithServiceRole() {
  console.log('🔧 ทดสอบการเชื่อมต่อ Supabase ด้วย Service Role...\n')
  
  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('✅ สร้าง Supabase client สำเร็จ')
    
    // Test database connection
    console.log('\n📊 ทดสอบการดึงข้อมูลจากตาราง users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)
    
    if (usersError) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล users:')
      console.error(`   ${usersError.message}`)
      return false
    }
    
    console.log('✅ ดึงข้อมูล users สำเร็จ!')
    console.log(`   พบข้อมูล: ${users.length} รายการ`)
    
    if (users.length > 0) {
      console.log('   ตัวอย่างข้อมูล:')
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`)
      })
    }
    
    // Test branches table
    console.log('\n📊 ทดสอบการดึงข้อมูลจากตาราง branches...')
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, address')
      .limit(3)
    
    if (branchesError) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล branches:')
      console.error(`   ${branchesError.message}`)
    } else {
      console.log('✅ ดึงข้อมูล branches สำเร็จ!')
      console.log(`   พบข้อมูล: ${branches.length} รายการ`)
    }
    
    // Test authentication with anon key
    console.log('\n🔐 ทดสอบการ Authentication ด้วย anon key...')
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: authData, error: authError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ:')
      console.error(`   ${authError.message}`)
      console.log('\n💡 หมายเหตุ: นี่อาจเป็นเพราะ RLS policies ยังมีปัญหา')
      console.log('   กรุณาดูคำแนะนำใน RLS_FIX_INSTRUCTIONS.md')
    } else {
      console.log('✅ เข้าสู่ระบบสำเร็จ!')
      console.log(`   User ID: ${authData.user?.id}`)
      console.log(`   Email: ${authData.user?.email}`)
    }
    
    return true
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดที่ไม่คาดคิด:')
    console.error(`   ${error.message}`)
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มทดสอบการเชื่อมต่อ Supabase...\n')
  
  const success = await testSupabaseWithServiceRole()
  
  if (success) {
    console.log('\n🎉 การทดสอบเสร็จสิ้น!')
    console.log('✅ Supabase พร้อมใช้งาน (ด้วย service role)')
    console.log('📝 หากมีปัญหา authentication กรุณาดู RLS_FIX_INSTRUCTIONS.md')
  } else {
    console.log('\n❌ การทดสอบล้มเหลว')
    console.log('📝 กรุณาตรวจสอบ environment variables และ Supabase project')
  }
}

main().catch(error => {
  console.error('💥 เกิดข้อผิดพลาด:', error)
  process.exit(1)
})
