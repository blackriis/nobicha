#!/usr/bin/env node

/**
 * Reset Test User Passwords
 * รีเซ็ต password ของ test users
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

async function resetTestPasswords() {
  console.log('🔑 รีเซ็ต Test User Passwords...\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const testUsers = [
    { email: 'admin@test.com', password: 'password123' },
    { email: 'employee.som@test.com', password: 'password123' },
    { email: 'manager.silom@test.com', password: 'password123' }
  ]
  
  for (const testUser of testUsers) {
    console.log(`🔑 รีเซ็ต password สำหรับ: ${testUser.email}`)
    
    try {
      // Get user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.log(`   ❌ ไม่สามารถดึงรายการ users: ${listError.message}`)
        continue
      }
      
      const user = users.users.find(u => u.email === testUser.email)
      
      if (!user) {
        console.log(`   ❌ ไม่พบ user: ${testUser.email}`)
        continue
      }
      
      // Update password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: testUser.password }
      )
      
      if (updateError) {
        console.log(`   ❌ รีเซ็ต password ล้มเหลว: ${updateError.message}`)
      } else {
        console.log(`   ✅ รีเซ็ต password สำเร็จ: ${updateData.user?.id}`)
      }
      
    } catch (error) {
      console.log(`   💥 เกิดข้อผิดพลาด: ${error.message}`)
    }
    
    console.log('')
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มรีเซ็ต Test User Passwords...\n')
  
  try {
    await resetTestPasswords()
    console.log('🎉 การรีเซ็ต Passwords เสร็จสิ้น!')
    console.log('📝 ตอนนี้สามารถทดสอบ authentication ได้แล้ว')
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

main()
