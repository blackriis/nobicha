#!/usr/bin/env node

/**
 * Update User Passwords
 * อัปเดต password ของ test users
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

async function updatePasswords() {
  console.log('🔐 อัปเดต User Passwords...\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const updates = [
    { email: 'admin@test.com', password: 'SecureAdmin2024!@#' },
    { email: 'employee.som@test.com', password: 'Employee123!' },
    { email: 'manager.silom@test.com', password: 'Manager123!' }
  ]
  
  for (const update of updates) {
    console.log(`🔄 อัปเดต password สำหรับ: ${update.email}`)
    
    try {
      // Get user by email first
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.log(`   ❌ ล้มเหลวในการดึงข้อมูล users: ${listError.message}`)
        continue
      }
      
      const user = users.users.find(u => u.email === update.email)
      
      if (!user) {
        console.log(`   ⚠️  ไม่พบ user: ${update.email}`)
        continue
      }
      
      // Update password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: update.password }
      )
      
      if (updateError) {
        console.log(`   ❌ อัปเดต password ล้มเหลว: ${updateError.message}`)
      } else {
        console.log(`   ✅ อัปเดต password สำเร็จ: ${user.id}`)
      }
      
    } catch (error) {
      console.log(`   💥 เกิดข้อผิดพลาด: ${error.message}`)
    }
    
    console.log('')
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มอัปเดต User Passwords...\n')
  
  try {
    await updatePasswords()
    console.log('🎉 การอัปเดต User Passwords เสร็จสิ้น!')
    console.log('📝 ตอนนี้สามารถทดสอบ login ด้วย password ใหม่ได้แล้ว')
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

main()