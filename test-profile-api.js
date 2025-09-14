#!/usr/bin/env node

/**
 * Test Profile API
 * ทดสอบ Profile API ผ่าน Next.js server
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

async function testProfileAPI() {
  console.log('🧪 ทดสอบ Profile API...\n')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const testUser = { email: 'admin@test.com', password: 'password123' }
  
  try {
    // 1. Login
    console.log(`🔐 เข้าสู่ระบบด้วย: ${testUser.email}`)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (authError) {
      console.log(`   ❌ เข้าสู่ระบบล้มเหลว: ${authError.message}`)
      return false
    }
    
    console.log(`   ✅ เข้าสู่ระบบสำเร็จ! User ID: ${authData.user?.id}`)
    
    // 2. Test Profile API
    console.log(`\n📊 ทดสอบ Profile API...`)
    const response = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session?.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`   ❌ Profile API ล้มเหลว: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log(`   Error: ${errorText}`)
      return false
    }
    
    const profileData = await response.json()
    console.log(`   ✅ Profile API ทำงานได้!`)
    console.log(`   📋 Profile Data:`)
    console.log(`      Success: ${profileData.success}`)
    console.log(`      Profile: ${JSON.stringify(profileData.profile, null, 2)}`)
    
    // 3. Test with getUser function
    console.log(`\n🔧 ทดสอบ getUser function...`)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log(`   ❌ getUser ล้มเหลว: ${userError.message}`)
    } else {
      console.log(`   ✅ getUser สำเร็จ!`)
      console.log(`      User: ${JSON.stringify(userData.user, null, 2)}`)
    }
    
    // 4. Sign out
    console.log(`\n🚪 ออกจากระบบ...`)
    await supabase.auth.signOut()
    console.log(`   ✅ ออกจากระบบแล้ว`)
    
    return true
    
  } catch (error) {
    console.log(`   💥 เกิดข้อผิดพลาด: ${error.message}`)
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 เริ่มทดสอบ Profile API...\n')
  
  try {
    const success = await testProfileAPI()
    
    if (success) {
      console.log('\n🎉 การทดสอบ Profile API สำเร็จ!')
      console.log('✅ Profile API ทำงานได้ปกติ')
      console.log('✅ Authentication ทำงานได้ปกติ')
      console.log('✅ Supabase connection ทำงานได้ปกติ')
    } else {
      console.log('\n❌ การทดสอบ Profile API ล้มเหลว')
      console.log('📝 กรุณาตรวจสอบ Next.js server และ Supabase configuration')
    }
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error)
  }
}

main()
