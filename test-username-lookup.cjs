/**
 * สคริปต์ทดสอบ Username Lookup API
 * 
 * ตรวจสอบว่า username lookup ทำงานถูกต้องหรือไม่
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * ทดสอบ username lookup
 */
async function testUsernameLookup(username) {
  console.log(`\n🔍 ทดสอบ Username Lookup: "${username}"`)
  
  try {
    // Test 1: Lookup with exact username
    const { data: user1, error: error1 } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name')
      .eq('username', username)
      .maybeSingle()

    if (error1) {
      console.log(`   ❌ Error: ${error1.message}`)
      return null
    }

    if (user1) {
      console.log(`   ✅ พบด้วย exact match:`)
      console.log(`      Email: ${user1.email}`)
      console.log(`      Username: ${user1.username}`)
      console.log(`      Full Name: ${user1.full_name}`)
      return user1
    }

    // Test 2: Lookup with lowercase
    const { data: user2, error: error2 } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (error2) {
      console.log(`   ❌ Error (lowercase): ${error2.message}`)
      return null
    }

    if (user2) {
      console.log(`   ✅ พบด้วย lowercase:`)
      console.log(`      Email: ${user2.email}`)
      console.log(`      Username: ${user2.username}`)
      console.log(`      Full Name: ${user2.full_name}`)
      return user2
    }

    // Test 3: Lookup with trimmed
    const { data: user3, error: error3 } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name')
      .eq('username', username.trim())
      .maybeSingle()

    if (error3) {
      console.log(`   ❌ Error (trimmed): ${error3.message}`)
      return null
    }

    if (user3) {
      console.log(`   ✅ พบด้วย trimmed:`)
      console.log(`      Email: ${user3.email}`)
      console.log(`      Username: ${user3.username}`)
      console.log(`      Full Name: ${user3.full_name}`)
      return user3
    }

    // Test 4: Lookup with lowercase + trimmed (เหมือน API)
    const { data: user4, error: error4 } = await supabaseAdmin
      .from('users')
      .select('id, email, username, full_name')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle()

    if (error4) {
      console.log(`   ❌ Error (lowercase + trimmed): ${error4.message}`)
      return null
    }

    if (user4) {
      console.log(`   ✅ พบด้วย lowercase + trimmed (เหมือน API):`)
      console.log(`      Email: ${user4.email}`)
      console.log(`      Username: ${user4.username}`)
      console.log(`      Full Name: ${user4.full_name}`)
      return user4
    }

    console.log(`   ❌ ไม่พบ username: "${username}"`)
    
    // แสดง username ที่มีในระบบ
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('username, email')
      .not('username', 'is', null)
      .limit(10)

    if (allUsers && allUsers.length > 0) {
      console.log(`\n   💡 Username ที่มีในระบบ (ตัวอย่าง):`)
      allUsers.forEach(u => {
        console.log(`      - ${u.username} (${u.email})`)
      })
    }

    return null

  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
    return null
  }
}

/**
 * ฟังก์ชันหลัก
 */
async function main() {
  console.log('🔍 ทดสอบ Username Lookup API\n')
  console.log('='.repeat(70))

  // รับ username จาก command line หรือใช้ค่า default
  const args = process.argv.slice(2)
  const testUsernames = args.length > 0 ? args : [
    'employee.nina',
    'employee.som',
    'tanaka',
    'nut',
    'pook'
  ]

  console.log(`\n📝 จะทดสอบ ${testUsernames.length} username(s)\n`)

  const results = []

  for (const username of testUsernames) {
    const result = await testUsernameLookup(username)
    results.push({ username, found: !!result, user: result })
  }

  // สรุปผล
  console.log('\n' + '='.repeat(70))
  console.log('📊 สรุปผลการทดสอบ\n')

  const foundCount = results.filter(r => r.found).length
  console.log(`✅ พบ username: ${foundCount}/${results.length} คน`)

  console.log('\nรายละเอียด:')
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. Username: "${result.username}"`)
    if (result.found) {
      console.log(`   ✅ พบ: ${result.user.email}`)
    } else {
      console.log(`   ❌ ไม่พบ`)
    }
  })

  // ตรวจสอบ username ที่มีในระบบ
  console.log('\n' + '='.repeat(70))
  console.log('📋 ตรวจสอบ Username ทั้งหมดในระบบ\n')

  try {
    const { data: allUsers, error } = await supabaseAdmin
      .from('users')
      .select('username, email, full_name, role')
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.log(`❌ เกิดข้อผิดพลาด: ${error.message}`)
    } else if (allUsers && allUsers.length > 0) {
      console.log(`พบ ${allUsers.length} username(s):\n`)
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username || '(null)'}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Name: ${user.full_name || 'ไม่ระบุ'}`)
        console.log(`   Role: ${user.role}`)
        console.log('')
      })
    } else {
      console.log('⚠️  ไม่พบ username ในระบบ')
    }
  } catch (error) {
    console.log(`❌ เกิดข้อผิดพลาด: ${error.message}`)
  }

  console.log('='.repeat(70) + '\n')
}

main().catch(console.error)

