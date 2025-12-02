/**
 * Script สำหรับสร้าง Test User Accounts
 * สำหรับการทดสอบระบบ Employee Management System
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: './apps/web/.env.local' })
dotenv.config({ path: './.env.local' })
dotenv.config()

// Supabase configuration (จะต้องตั้งค่าผ่าน environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ กรุณาตั้งค่า environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Pre-seed required branches for FK integrity
const requiredBranches = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'สาขาสีลม',
    address: '123 ถนนสีลม บางรัก กรุงเทพมหานคร 10500',
    latitude: 13.7563,
    longitude: 100.5018,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'สาขาสุขุมวิท',
    address: '456 ถนนสุขุมวิท วัฒนา กรุงเทพมหานคร 10110',
    latitude: 13.7398,
    longitude: 100.5612,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'สาขาจตุจักร',
    address: '789 ถนนพหลโยธิน จตุจักร กรุงเทพมหานคร 10900',
    latitude: 13.8077,
    longitude: 100.5538,
  },
]

async function ensureBranches() {
  try {
    console.log('🔧 ตรวจสอบ/สร้างสาขาที่จำเป็นสำหรับ FK...')
    const { data: existing, error: selErr } = await supabase
      .from('branches')
      .select('id')
      .in('id', requiredBranches.map(b => b.id))
    if (selErr) {
      console.warn('⚠️ ไม่สามารถอ่านตาราง branches ได้:', selErr.message)
    }

    const existingIds = new Set((existing || []).map(b => b.id))
    const toInsert = requiredBranches.filter(b => !existingIds.has(b.id))
    if (toInsert.length === 0) {
      console.log('✅ branches ครบถ้วนแล้ว')
      return true
    }

    const { error: upErr } = await supabase.from('branches').upsert(toInsert)
    if (upErr) {
      console.error('❌ สร้างสาขาไม่สำเร็จ:', upErr.message)
      return false
    }
    console.log(`✅ สร้างสาขาเพิ่ม ${toInsert.length} รายการสำเร็จ`)
    return true
  } catch (e) {
    console.error('❌ ผิดพลาดขณะเตรียม branches:', e.message)
    return false
  }
}

async function findUserByEmail(email) {
  try {
    let page = 1
    const perPage = 1000
    while (page < 10) { // กันลูปยาวเกินไป
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) return null
      const found = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (found) return found
      if (data.users.length < perPage) break
      page++
    }
  } catch (_) {}
  return null
}

// Test users data
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'SecureAdmin2024!@#',
    fullName: 'ผู้ดูแลระบบ (Admin)',
    role: 'admin',
    branchId: null,
    employeeId: null,
    phoneNumber: '021234567'
  },
  {
    email: 'manager.silom@test.com',
    password: 'Manager123!',
    fullName: 'วิชัย จันทร์แสง',
    role: 'admin',
    branchId: '00000000-0000-0000-0000-000000000001', // สาขาสีลม
    employeeId: 'MGR001',
    phoneNumber: '021234568'
  },
  {
    email: 'employee.som@test.com',
    password: 'Employee123!',
    fullName: 'สมใจ ใจดี',
    role: 'employee',
    branchId: '00000000-0000-0000-0000-000000000001', // สาขาสีลม
    employeeId: 'EMP001',
    phoneNumber: '0812345671'
  },
  {
    email: 'employee.malee@test.com',
    password: 'Employee123!',
    fullName: 'มาลี ดีใจ',
    role: 'employee',
    branchId: '00000000-0000-0000-0000-000000000002', // สาขาสุขุมวิท
    employeeId: 'EMP002',
    phoneNumber: '0812345672'
  },
  {
    email: 'employee.chai@test.com',
    password: 'Employee123!',
    fullName: 'ชาย กล้าหาญ',
    role: 'employee',
    branchId: '00000000-0000-0000-0000-000000000003', // สาขาจตุจักร
    employeeId: 'EMP003',
    phoneNumber: '0812345673'
  },
  {
    email: 'employee.nina@test.com',
    password: 'Employee123!',
    fullName: 'นิน่า สวยงาม',
    role: 'employee',
    branchId: null, // สามารถทำงานหลายสาขา
    employeeId: 'EMP004',
    phoneNumber: '0812345674'
  }
]

async function createTestUser(userData) {
  try {
    console.log(`🔄 กำลังสร้างบัญชี: ${userData.email}`)
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role
      }
    })

    let authUserId = authData?.user?.id
    if (authError) {
      // ถ้าผู้ใช้มีอยู่แล้ว ให้ค้นหา id เพื่อไปอัปเดทโปรไฟล์ต่อ
      if (authError.message && authError.message.includes('already been registered')) {
        console.warn(`ℹ️ ผู้ใช้นี้มีอยู่แล้วใน Auth: ${userData.email} — จะค้นหาเพื่ออัปเดทโปรไฟล์`)
        const existing = await findUserByEmail(userData.email)
        if (!existing) {
          console.error(`❌ หา user ใน Auth ไม่เจอ: ${userData.email}`)
          return false
        }
        authUserId = existing.id
      } else {
        console.error(`❌ เกิดข้อผิดพลาดในการสร้าง auth user: ${userData.email}`, authError.message)
        return false
      }
    } else {
      console.log(`✅ สร้าง auth user สำเร็จ: ${userData.email}`)
    }

    // Ensure user_metadata has correct role/full_name (useful if user existed already)
    if (authUserId) {
      const { error: metaErr } = await supabase.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          full_name: userData.fullName,
          role: userData.role,
        },
      })
      if (metaErr) {
        console.warn(`⚠️ อัปเดต user_metadata ไม่สำเร็จ: ${userData.email}`, metaErr.message)
      }
    }

    // Generate username from email (before @ symbol)
    const username = userData.email.split('@')[0]

    // Update user profile in users table (in case trigger doesn't work)
    const profileData = {
      email: userData.email,
      username: username,
      full_name: userData.fullName,
      role: userData.role,
      branch_id: userData.branchId,
      employee_id: userData.employeeId,
      phone_number: userData.phoneNumber,
      hire_date: new Date().toISOString().split('T')[0], // Today's date
      is_active: true
    }

    const { error: profileError } = await supabase
      .from('users')
      .upsert({ id: authUserId, ...profileData })

    if (profileError) {
      // ชี้นำว่าอาจยังไม่ได้รัน migrations
      console.error(`❌ เกิดข้อผิดพลาดในการอัพเดท profile: ${userData.email}`, profileError.message)
      console.error('   👉 โปรดตรวจสอบว่าได้รัน database migrations (001_initial_schema.sql, 002_auth_setup.sql) แล้ว')
      return false
    }

    console.log(`✅ อัพเดท profile สำเร็จ: ${userData.email}`)
    return true

  } catch (error) {
    console.error(`❌ เกิดข้อผิดพลาดไม่คาดคิด: ${userData.email}`, error.message)
    return false
  }
}

async function createAllTestUsers() {
  console.log('🚀 เริ่มสร้าง Test User Accounts...\n')

  // Ensure branches before creating users with branch_id
  await ensureBranches()

  let successCount = 0
  let failCount = 0
  const succeeded = []

  for (const userData of testUsers) {
    const success = await createTestUser(userData)
    if (success) {
      successCount++
      succeeded.push(userData)
    } else {
      failCount++
    }
    console.log('') // Empty line for spacing
  }

  console.log('📊 สรุปผลการสร้าง Test Users:')
  console.log(`   ✅ สำเร็จ: ${successCount} บัญชี`)
  console.log(`   ❌ ล้มเหลว: ${failCount} บัญชี`)
  console.log(`   📝 รวม: ${testUsers.length} บัญชี`)

  if (successCount > 0) {
    console.log('\n🎉 Test Users ที่สร้างสำเร็จ:')
    succeeded.forEach((user) => {
      console.log(`   📧 ${user.email} - ${user.fullName} (${user.role})`)
    })

    console.log('\n📋 รายละเอียดการล็อกอิน:')
    console.log('   Admin Account:')
    console.log('   📧 admin@test.com')
    console.log('   🔑 SecureAdmin2024!@#')
    console.log('')
    console.log('   Employee Accounts:')
    console.log('   📧 employee.som@test.com   🔑 Employee123!')
    console.log('   📧 employee.malee@test.com 🔑 Employee123!')
    console.log('   📧 employee.chai@test.com  🔑 Employee123!')
    console.log('   📧 employee.nina@test.com  🔑 Employee123!')
  }
}

// Run the script
createAllTestUsers()
  .catch(error => {
    console.error('❌ เกิดข้อผิดพลาดในการรันสคริปท์:', error)
    process.exit(1)
  })
