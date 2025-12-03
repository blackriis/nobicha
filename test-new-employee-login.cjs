/**
 * สคริปต์ทดสอบการ Login ของพนักงานที่สร้างใหม่
 * 
 * ตรวจสอบว่า:
 * 1. พนักงานที่สร้างใหม่มี username ในตาราง users หรือไม่
 * 2. สามารถ login ด้วย email ได้หรือไม่
 * 3. สามารถ login ด้วย username ได้หรือไม่
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// สร้าง clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * ฟังก์ชันทดสอบการ login ด้วย email
 */
async function testLoginWithEmail(email, password) {
  console.log(`\n🔐 ทดสอบ Login ด้วย Email: ${email}`)
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.log(`   ❌ Login ล้มเหลว: ${error.message}`)
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log(`   ✅ Login สำเร็จ!`)
      console.log(`   - User ID: ${data.user.id}`)
      console.log(`   - Email: ${data.user.email}`)
      
      // Sign out
      await supabaseClient.auth.signOut()
      return { success: true, user: data.user }
    }

    return { success: false, error: 'No user data returned' }
  } catch (error) {
    console.log(`   ❌ เกิดข้อผิดพลาด: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * ฟังก์ชันทดสอบการ login ด้วย username
 */
async function testLoginWithUsername(username, password) {
  console.log(`\n🔐 ทดสอบ Login ด้วย Username: ${username}`)
  
  try {
    // Step 1: Lookup email from username
    console.log(`   🔍 กำลังค้นหา email จาก username...`)
    
    const { data: userData, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('email, username')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle()

    if (lookupError) {
      console.log(`   ❌ Lookup ล้มเหลว: ${lookupError.message}`)
      return { success: false, error: lookupError.message }
    }

    if (!userData || !userData.email) {
      console.log(`   ❌ ไม่พบ username: ${username}`)
      return { success: false, error: 'Username not found' }
    }

    console.log(`   ✅ พบ email: ${userData.email}`)

    // Step 2: Login with email
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: userData.email,
      password: password
    })

    if (error) {
      console.log(`   ❌ Login ล้มเหลว: ${error.message}`)
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log(`   ✅ Login สำเร็จ!`)
      console.log(`   - User ID: ${data.user.id}`)
      console.log(`   - Email: ${data.user.email}`)
      console.log(`   - Username: ${username}`)
      
      // Sign out
      await supabaseClient.auth.signOut()
      return { success: true, user: data.user }
    }

    return { success: false, error: 'No user data returned' }
  } catch (error) {
    console.log(`   ❌ เกิดข้อผิดพลาด: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * ฟังก์ชันตรวจสอบข้อมูลพนักงานในฐานข้อมูล
 */
async function checkEmployeeData(email) {
  console.log(`\n📋 ตรวจสอบข้อมูลพนักงาน: ${email}`)
  
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name, role, branch_id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.log(`   ❌ เกิดข้อผิดพลาด: ${error.message}`)
      return null
    }

    if (!user) {
      console.log(`   ❌ ไม่พบข้อมูลพนักงาน`)
      return null
    }

    console.log(`   ✅ พบข้อมูลพนักงาน:`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Username: ${user.username || '❌ ไม่มี username'}`)
    console.log(`   - Full Name: ${user.full_name}`)
    console.log(`   - Role: ${user.role}`)
    console.log(`   - Branch ID: ${user.branch_id || 'ไม่ระบุ'}`)
    console.log(`   - Is Active: ${user.is_active ? '✅' : '❌'}`)

    return user
  } catch (error) {
    console.log(`   ❌ เกิดข้อผิดพลาด: ${error.message}`)
    return null
  }
}

/**
 * ฟังก์ชันหลัก
 */
async function main() {
  console.log('🚀 เริ่มทดสอบการ Login ของพนักงานที่สร้างใหม่\n')
  console.log('=' .repeat(60))

  // รับ input จาก command line หรือใช้ค่า default
  const args = process.argv.slice(2)
  let testEmail = args[0]
  let testPassword = args[1]

  if (!testEmail || !testPassword) {
    console.log('📝 ใช้ข้อมูลทดสอบจาก command line arguments')
    console.log('   Usage: node test-new-employee-login.cjs <email> <password>')
    console.log('\n   ตัวอย่าง:')
    console.log('   node test-new-employee-login.cjs employee.som@test.com Employee123!')
    console.log('\n   หรือกรอกข้อมูลด้านล่าง:')
    
    // ถ้าไม่มี arguments ให้ใช้ test user
    if (!testEmail) {
      testEmail = 'employee.som@test.com'
      testPassword = 'Employee123!'
      console.log(`\n   ⚠️  ใช้ข้อมูลทดสอบ: ${testEmail}`)
    }
  }

  console.log(`\n📧 Email: ${testEmail}`)
  console.log(`🔑 Password: ${'*'.repeat(testPassword.length)}`)

  // Step 1: ตรวจสอบข้อมูลพนักงาน
  const employeeData = await checkEmployeeData(testEmail)

  if (!employeeData) {
    console.log('\n❌ ไม่พบข้อมูลพนักงาน - ไม่สามารถทดสอบได้')
    process.exit(1)
  }

  // Step 2: ตรวจสอบว่ามี username หรือไม่
  if (!employeeData.username) {
    console.log('\n⚠️  พนักงานนี้ไม่มี username!')
    console.log('   Username จะถูกสร้างอัตโนมัติจาก email เมื่อสร้างพนักงานใหม่')
    console.log('   Username ที่ควรจะเป็น:', testEmail.split('@')[0].toLowerCase())
    
    // ถามว่าต้องการสร้าง username หรือไม่
    console.log('\n   💡 วิธีแก้ไข:')
    console.log('   1. สร้างพนักงานใหม่ผ่าน Admin Panel')
    console.log('   2. หรืออัปเดต username ด้วย SQL:')
    console.log(`      UPDATE users SET username = '${testEmail.split('@')[0].toLowerCase()}' WHERE email = '${testEmail}';`)
  }

  // Step 3: ทดสอบ Login ด้วย Email
  const emailLoginResult = await testLoginWithEmail(testEmail, testPassword)

  // Step 4: ทดสอบ Login ด้วย Username (ถ้ามี)
  let usernameLoginResult = null
  if (employeeData.username) {
    usernameLoginResult = await testLoginWithUsername(employeeData.username, testPassword)
  } else {
    console.log('\n⏭️  ข้ามการทดสอบ Login ด้วย Username (ไม่มี username)')
  }

  // สรุปผลการทดสอบ
  console.log('\n' + '='.repeat(60))
  console.log('📊 สรุปผลการทดสอบ\n')
  
  console.log('1. ข้อมูลพนักงาน:')
  console.log(`   ${employeeData ? '✅ พบข้อมูล' : '❌ ไม่พบข้อมูล'}`)
  console.log(`   ${employeeData?.username ? '✅ มี username' : '❌ ไม่มี username'}`)
  
  console.log('\n2. Login ด้วย Email:')
  console.log(`   ${emailLoginResult.success ? '✅ สำเร็จ' : '❌ ล้มเหลว'}`)
  if (!emailLoginResult.success) {
    console.log(`   Error: ${emailLoginResult.error}`)
  }
  
  if (employeeData.username) {
    console.log('\n3. Login ด้วย Username:')
    console.log(`   ${usernameLoginResult?.success ? '✅ สำเร็จ' : '❌ ล้มเหลว'}`)
    if (usernameLoginResult && !usernameLoginResult.success) {
      console.log(`   Error: ${usernameLoginResult.error}`)
    }
  }

  // สรุปผล
  const allTestsPassed = 
    employeeData && 
    emailLoginResult.success && 
    (employeeData.username ? usernameLoginResult?.success : true)

  console.log('\n' + '='.repeat(60))
  if (allTestsPassed) {
    console.log('✅ การทดสอบทั้งหมดผ่าน!')
    console.log('   พนักงานสามารถ login ได้ทั้งด้วย email และ username')
  } else {
    console.log('❌ การทดสอบบางส่วนล้มเหลว')
    if (!employeeData.username) {
      console.log('   ⚠️  พนักงานไม่มี username - ต้องสร้าง username ก่อน')
    }
    if (!emailLoginResult.success) {
      console.log('   ⚠️  ไม่สามารถ login ด้วย email ได้')
    }
    if (employeeData.username && !usernameLoginResult?.success) {
      console.log('   ⚠️  ไม่สามารถ login ด้วย username ได้')
    }
  }
  console.log('='.repeat(60) + '\n')
}

// Run
main().catch(console.error)

