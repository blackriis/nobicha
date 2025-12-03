/**
 * สคริปต์ตรวจสอบพนักงานที่สร้างใหม่ล่าสุด
 * 
 * ตรวจสอบพนักงานที่สร้างใหม่ 5 คนล่าสุดว่าสามารถ login ได้หรือไม่
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

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
 * ทดสอบการ login
 */
async function testLogin(email, password, username) {
  const results = {
    email: false,
    username: false,
    errors: []
  }

  // Test 1: Login with email
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      results.errors.push(`Email login: ${error.message}`)
    } else if (data.user) {
      results.email = true
      await supabaseClient.auth.signOut()
    }
  } catch (error) {
    results.errors.push(`Email login error: ${error.message}`)
  }

  // Test 2: Login with username (if exists)
  if (username) {
    try {
      // Lookup email from username
      const { data: userData, error: lookupError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

      if (lookupError || !userData) {
        results.errors.push(`Username lookup: ${lookupError?.message || 'Not found'}`)
      } else {
        // Try login with looked up email
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: userData.email,
          password: password
        })

        if (error) {
          results.errors.push(`Username login: ${error.message}`)
        } else if (data.user) {
          results.username = true
          await supabaseClient.auth.signOut()
        }
      }
    } catch (error) {
      results.errors.push(`Username login error: ${error.message}`)
    }
  }

  return results
}

/**
 * ฟังก์ชันหลัก
 */
async function main() {
  console.log('🔍 ตรวจสอบพนักงานที่สร้างใหม่ล่าสุด\n')
  console.log('='.repeat(70))

  try {
    // ดึงพนักงาน 5 คนล่าสุด
    const { data: employees, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name, role, created_at, is_active')
      .eq('role', 'employee')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', error.message)
      process.exit(1)
    }

    if (!employees || employees.length === 0) {
      console.log('⚠️  ไม่พบพนักงานในระบบ')
      process.exit(0)
    }

    console.log(`\n📋 พบพนักงาน ${employees.length} คน\n`)

    const results = []

    for (const employee of employees) {
      console.log(`\n👤 ${employee.full_name || 'ไม่ระบุชื่อ'}`)
      console.log(`   Email: ${employee.email}`)
      console.log(`   Username: ${employee.username || '❌ ไม่มี'}`)
      console.log(`   สร้างเมื่อ: ${new Date(employee.created_at).toLocaleString('th-TH')}`)
      console.log(`   สถานะ: ${employee.is_active ? '✅ ใช้งาน' : '❌ ปิดใช้งาน'}`)

      // ตรวจสอบว่ามี username หรือไม่
      if (!employee.username) {
        const expectedUsername = employee.email.split('@')[0].toLowerCase()
        console.log(`   ⚠️  ไม่มี username (ควรเป็น: ${expectedUsername})`)
      }

      // ถาม password (ในกรณีจริงควรเก็บ password ไว้ที่ไหนสักแห่ง)
      // สำหรับการทดสอบ เราจะใช้ password ที่เป็นไปได้
      console.log(`   🔐 ทดสอบการ login...`)

      // หมายเหตุ: ในระบบจริง password จะถูกส่งให้พนักงานแยกต่างหาก
      // สำหรับการทดสอบ เราจะใช้ password ทั่วไป
      const testPasswords = [
        'Employee123!',
        'Password123!',
        '12345678',
        employee.email.split('@')[0] + '123!'
      ]

      let loginSuccess = false
      let testedPassword = null

      for (const testPassword of testPasswords) {
        const loginResults = await testLogin(employee.email, testPassword, employee.username)
        
        if (loginResults.email) {
          loginSuccess = true
          testedPassword = testPassword
          console.log(`   ✅ Login ด้วย email สำเร็จ (password: ${'*'.repeat(testPassword.length)})`)
          
          if (employee.username && loginResults.username) {
            console.log(`   ✅ Login ด้วย username สำเร็จ`)
          } else if (employee.username) {
            console.log(`   ⚠️  Login ด้วย username ล้มเหลว`)
          }
          break
        }
      }

      if (!loginSuccess) {
        console.log(`   ❌ ไม่สามารถ login ได้ (ลอง password หลายแบบแล้ว)`)
        console.log(`   💡 หมายเหตุ: Password อาจถูกเปลี่ยนหรือไม่ตรงกับที่สร้างไว้`)
      }

      results.push({
        employee,
        loginSuccess,
        testedPassword: testedPassword ? '*'.repeat(testedPassword.length) : null
      })
    }

    // สรุปผล
    console.log('\n' + '='.repeat(70))
    console.log('📊 สรุปผลการตรวจสอบ\n')

    const successCount = results.filter(r => r.loginSuccess).length
    const hasUsernameCount = results.filter(r => r.employee.username).length

    console.log(`✅ สามารถ login ได้: ${successCount}/${results.length} คน`)
    console.log(`📝 มี username: ${hasUsernameCount}/${results.length} คน`)

    console.log('\nรายละเอียด:')
    results.forEach((result, index) => {
      const emp = result.employee
      console.log(`\n${index + 1}. ${emp.full_name || emp.email}`)
      console.log(`   - Email: ${emp.email}`)
      console.log(`   - Username: ${emp.username || '❌ ไม่มี'}`)
      console.log(`   - Login: ${result.loginSuccess ? '✅ สำเร็จ' : '❌ ล้มเหลว'}`)
    })

    // คำแนะนำ
    console.log('\n' + '='.repeat(70))
    console.log('💡 คำแนะนำ:\n')

    const noUsername = results.filter(r => !r.employee.username)
    if (noUsername.length > 0) {
      console.log('⚠️  พนักงานที่ไม่มี username:')
      noUsername.forEach(r => {
        const expected = r.employee.email.split('@')[0].toLowerCase()
        console.log(`   - ${r.employee.email} (ควรเป็น: ${expected})`)
        console.log(`     แก้ไขด้วย: UPDATE users SET username = '${expected}' WHERE email = '${r.employee.email}';`)
      })
    }

    const loginFailed = results.filter(r => !r.loginSuccess)
    if (loginFailed.length > 0) {
      console.log('\n⚠️  พนักงานที่ไม่สามารถ login ได้:')
      loginFailed.forEach(r => {
        console.log(`   - ${r.employee.email}`)
        console.log(`     อาจเป็นเพราะ: password ไม่ถูกต้อง หรือ account ถูก disable`)
      })
    }

    if (successCount === results.length && hasUsernameCount === results.length) {
      console.log('\n✅ ทุกอย่างเรียบร้อย! พนักงานทั้งหมดสามารถ login ได้')
    }

    console.log('\n' + '='.repeat(70))

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)

