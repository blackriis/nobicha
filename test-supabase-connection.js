#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * ทดสอบการเชื่อมต่อ Supabase และตรวจสอบการตั้งค่า
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables from apps/web/.env.local
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

// ตรวจสอบ environment variables
function checkEnvironmentVariables() {
  console.log('🔍 ตรวจสอบ Environment Variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = []
  const present = []
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName)
    } else {
      missing.push(varName)
    }
  })
  
  if (present.length > 0) {
    console.log('✅ พบ Environment Variables:')
    present.forEach(varName => {
      const value = process.env[varName]
      const displayValue = varName.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value
      console.log(`   ${varName}: ${displayValue}`)
    })
  }
  
  if (missing.length > 0) {
    console.log('❌ ไม่พบ Environment Variables:')
    missing.forEach(varName => {
      console.log(`   ${varName}: ไม่ได้ตั้งค่า`)
    })
    return false
  }
  
  return true
}

// ทดสอบการเชื่อมต่อ Supabase
async function testSupabaseConnection() {
  console.log('\n🔗 ทดสอบการเชื่อมต่อ Supabase...')
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // ทดสอบการเชื่อมต่อด้วยการดึงข้อมูลจากตาราง users
    console.log('   📊 ทดสอบการดึงข้อมูลจากตาราง users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)
    
    if (usersError) {
      console.log('   ❌ เกิดข้อผิดพลาดในการดึงข้อมูล users:')
      console.log(`      ${usersError.message}`)
      return false
    }
    
    console.log('   ✅ เชื่อมต่อ Supabase สำเร็จ!')
    console.log(`   📈 พบข้อมูล users: ${users.length} รายการ`)
    
    // ทดสอบการดึงข้อมูลจากตาราง branches
    console.log('   📊 ทดสอบการดึงข้อมูลจากตาราง branches...')
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, address')
      .limit(1)
    
    if (branchesError) {
      console.log('   ⚠️  เกิดข้อผิดพลาดในการดึงข้อมูล branches:')
      console.log(`      ${branchesError.message}`)
    } else {
      console.log('   ✅ ดึงข้อมูล branches สำเร็จ!')
      console.log(`   📈 พบข้อมูล branches: ${branches.length} รายการ`)
    }
    
    // ทดสอบการดึงข้อมูลจากตาราง payroll_cycles
    console.log('   📊 ทดสอบการดึงข้อมูลจากตาราง payroll_cycles...')
    const { data: payrollCycles, error: payrollError } = await supabase
      .from('payroll_cycles')
      .select('id, cycle_name, start_date, end_date')
      .limit(1)
    
    if (payrollError) {
      console.log('   ⚠️  เกิดข้อผิดพลาดในการดึงข้อมูล payroll_cycles:')
      console.log(`      ${payrollError.message}`)
    } else {
      console.log('   ✅ ดึงข้อมูล payroll_cycles สำเร็จ!')
      console.log(`   📈 พบข้อมูล payroll_cycles: ${payrollCycles.length} รายการ`)
    }
    
    return true
    
  } catch (error) {
    console.log('   ❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase:')
    console.log(`      ${error.message}`)
    return false
  }
}

// ทดสอบการ Authentication
async function testAuthentication() {
  console.log('\n🔐 ทดสอบการ Authentication...')
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // ทดสอบการเข้าสู่ระบบด้วย test user
    console.log('   👤 ทดสอบการเข้าสู่ระบบด้วย test user...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'SecureAdmin2024!@#'
    })
    
    if (authError) {
      console.log('   ❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ:')
      console.log(`      ${authError.message}`)
      return false
    }
    
    console.log('   ✅ เข้าสู่ระบบสำเร็จ!')
    console.log(`   👤 User ID: ${authData.user?.id}`)
    console.log(`   📧 Email: ${authData.user?.email}`)
    
    // ทดสอบการออกจากระบบ
    console.log('   🚪 ทดสอบการออกจากระบบ...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.log('   ⚠️  เกิดข้อผิดพลาดในการออกจากระบบ:')
      console.log(`      ${signOutError.message}`)
    } else {
      console.log('   ✅ ออกจากระบบสำเร็จ!')
    }
    
    return true
    
  } catch (error) {
    console.log('   ❌ เกิดข้อผิดพลาดในการทดสอบ Authentication:')
    console.log(`      ${error.message}`)
    return false
  }
}

// ฟังก์ชันหลัก
async function main() {
  console.log('🚀 เริ่มทดสอบการเชื่อมต่อ Supabase...\n')
  
  // ตรวจสอบ environment variables
  const envCheck = checkEnvironmentVariables()
  if (!envCheck) {
    console.log('\n❌ การทดสอบหยุดลงเนื่องจากไม่พบ environment variables')
    console.log('📝 กรุณาตั้งค่า environment variables ตาม SUPABASE_SETUP_GUIDE.md')
    process.exit(1)
  }
  
  // ทดสอบการเชื่อมต่อ
  const connectionTest = await testSupabaseConnection()
  if (!connectionTest) {
    console.log('\n❌ การทดสอบหยุดลงเนื่องจากไม่สามารถเชื่อมต่อ Supabase ได้')
    process.exit(1)
  }
  
  // ทดสอบการ Authentication
  const authTest = await testAuthentication()
  if (!authTest) {
    console.log('\n⚠️  การเชื่อมต่อ Supabase สำเร็จ แต่การ Authentication มีปัญหา')
    console.log('📝 กรุณาตรวจสอบ test users ในฐานข้อมูล')
  }
  
  console.log('\n🎉 การทดสอบเสร็จสิ้น!')
  console.log('✅ Supabase พร้อมใช้งาน')
  console.log('📝 ดูรายละเอียดเพิ่มเติมได้ที่ SUPABASE_SETUP_GUIDE.md')
}

// รันการทดสอบ
main().catch(error => {
  console.error('💥 เกิดข้อผิดพลาดที่ไม่คาดคิด:', error)
  process.exit(1)
})
