#!/usr/bin/env node

/**
 * Create Test Users
 * สร้าง test users ใน Supabase Auth
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

async function createTestUsers() {
  console.log('👥 สร้าง Test Users...\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const testUsers = [
    { email: 'admin@test.com', password: 'SecureAdmin2024!@#', role: 'admin' },
    { email: 'employee.som@test.com', password: 'Employee123!', role: 'employee' },
    { email: 'manager.silom@test.com', password: 'Manager123!', role: 'admin' }
  ]
  
  for (const testUser of testUsers) {
    console.log(`🔨 สร้าง user: ${testUser.email}`)
    
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  User มีอยู่แล้ว: ${testUser.email}`)
        } else {
          console.log(`   ❌ ล้มเหลว: ${authError.message}`)
        }
        continue
      }
      
      console.log(`   ✅ สร้าง auth user สำเร็จ: ${authData.user?.id}`)
      
      // Create user profile in users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testUser.email,
          full_name: testUser.email.split('@')[0],
          role: testUser.role,
          branch_id: '00000000-0000-0000-0000-000000000001', // สาขาสีลม
          employee_id: `EMP${Date.now()}`,
          phone_number: '0123456789',
          hire_date: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single()
      
      if (profileError) {
        console.log(`   ⚠️  สร้าง profile ล้มเหลว: ${profileError.message}`)
      } else {
        console.log(`   ✅ สร้าง profile สำเร็จ: ${profileData.id}`)
      }
      
    } catch (error) {
      console.log(`   💥 เกิดข้อผิดพลาด: ${error.message}`)
    }
    
    console.log('')
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มสร้าง Test Users...\n')
  
  try {
    await createTestUsers()
    console.log('🎉 การสร้าง Test Users เสร็จสิ้น!')
    console.log('📝 ตอนนี้สามารถทดสอบ authentication ได้แล้ว')
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

main()
