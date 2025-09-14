#!/usr/bin/env node

/**
 * Test Authentication Fix
 * ทดสอบการ authentication ด้วย test users ที่ถูกต้อง
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

async function testAuthentication() {
  console.log('🔐 ทดสอบการ Authentication...\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  // Test users ที่มีอยู่จริง
  const testUsers = [
    { email: 'admin@test.com', password: 'password123', role: 'admin' },
    { email: 'employee.som@test.com', password: 'password123', role: 'employee' },
    { email: 'manager.silom@test.com', password: 'password123', role: 'admin' }
  ]
  
  for (const testUser of testUsers) {
    console.log(`🧪 ทดสอบเข้าสู่ระบบด้วย: ${testUser.email}`)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      })
      
      if (authError) {
        console.log(`   ❌ ล้มเหลว: ${authError.message}`)
      } else {
        console.log(`   ✅ สำเร็จ! User ID: ${authData.user?.id}`)
        
        // Test profile API
        console.log(`   📊 ทดสอบ Profile API...`)
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('supabase.co', 'supabase.co')}/rest/v1/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.session?.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          }
        })
        
        if (response.ok) {
          const profileData = await response.json()
          console.log(`   ✅ Profile API ทำงานได้!`)
          console.log(`   👤 Profile: ${JSON.stringify(profileData, null, 2)}`)
        } else {
          console.log(`   ❌ Profile API ล้มเหลว: ${response.status} ${response.statusText}`)
        }
        
        // Sign out
        await supabase.auth.signOut()
        console.log(`   🚪 ออกจากระบบแล้ว`)
      }
    } catch (error) {
      console.log(`   💥 เกิดข้อผิดพลาด: ${error.message}`)
    }
    
    console.log('')
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มทดสอบการ Authentication...\n')
  
  try {
    await testAuthentication()
    console.log('🎉 การทดสอบเสร็จสิ้น!')
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

main()
