/**
 * Script สำหรับสร้าง Test User Accounts
 * สำหรับการทดสอบระบบ Employee Management System
 */

const { createClient } = require('@supabase/supabase-js')

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

// Test users data
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
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

    if (authError) {
      console.error(`❌ เกิดข้อผิดพลาดในการสร้าง auth user: ${userData.email}`, authError.message)
      return false
    }

    console.log(`✅ สร้าง auth user สำเร็จ: ${userData.email}`)

    // Update user profile in users table (in case trigger doesn't work)
    const profileData = {
      email: userData.email,
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
      .upsert({ id: authData.user.id, ...profileData })

    if (profileError) {
      console.error(`❌ เกิดข้อผิดพลาดในการอัพเดท profile: ${userData.email}`, profileError.message)
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

  let successCount = 0
  let failCount = 0

  for (const userData of testUsers) {
    const success = await createTestUser(userData)
    if (success) {
      successCount++
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
    testUsers.forEach((user, index) => {
      if (index < successCount) {
        console.log(`   📧 ${user.email} - ${user.fullName} (${user.role})`)
      }
    })

    console.log('\n📋 รายละเอียดการล็อกอิน:')
    console.log('   Admin Account:')
    console.log('   📧 admin@test.com')
    console.log('   🔑 TestAdmin123!')
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