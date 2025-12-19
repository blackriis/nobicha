import { createClient } from '@supabase/supabase-js'
import type { Database } from '@employee-management/database'

/**
 * Test Data Setup Script
 *
 * This script creates necessary test data for E2E tests:
 * - Test admin user
 * - Test employees with hourly/daily rates
 * - Test branch
 * - Sample time entries
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Create test admin user
 */
async function createTestAdmin() {
  console.log('📝 Creating test admin user...')

  // Check if admin already exists
  const { data: existingAdmin } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'admin@test.com')
    .single()

  if (existingAdmin) {
    console.log('✅ Test admin already exists:', existingAdmin.email)
    return existingAdmin.id
  }

  // Create auth user first
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'SecureAdmin2024!@#',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Admin'
    }
  })

  if (authError) {
    console.error('❌ Error creating admin auth user:', authError)
    throw authError
  }

  console.log('✅ Created admin auth user:', authData.user.id)

  // Create user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: 'admin@test.com',
      full_name: 'Test Admin',
      role: 'admin',
      is_active: true
    })
    .select()
    .single()

  if (userError) {
    console.error('❌ Error creating admin user profile:', userError)
    throw userError
  }

  console.log('✅ Created admin user profile:', userData.email)
  return userData.id
}

/**
 * Create test branch
 */
async function createTestBranch() {
  console.log('📝 Creating test branch...')

  // Check if branch exists
  const { data: existingBranch } = await supabase
    .from('branches')
    .select('id, name')
    .eq('name', 'Test Branch E2E')
    .single()

  if (existingBranch) {
    console.log('✅ Test branch already exists:', existingBranch.name)
    return existingBranch.id
  }

  // Create branch
  const { data: branchData, error: branchError } = await supabase
    .from('branches')
    .insert({
      name: 'Test Branch E2E',
      address: '123 Test Street, Bangkok',
      latitude: 13.7563,
      longitude: 100.5018
    })
    .select()
    .single()

  if (branchError) {
    console.error('❌ Error creating test branch:', branchError)
    throw branchError
  }

  console.log('✅ Created test branch:', branchData.name)
  return branchData.id
}

/**
 * Create test employees
 */
async function createTestEmployees(branchId: string) {
  console.log('📝 Creating test employees...')

  const testEmployees = [
    {
      email: 'employee1@test.com',
      password: 'Employee123!',
      full_name: 'Test Employee 1',
      employee_id: 'EMP001',
      hourly_rate: 100,
      daily_rate: 800,
      branch_id: branchId
    },
    {
      email: 'employee2@test.com',
      password: 'Employee123!',
      full_name: 'Test Employee 2',
      employee_id: 'EMP002',
      hourly_rate: 120,
      daily_rate: 900,
      branch_id: branchId
    },
    {
      email: 'employee3@test.com',
      password: 'Employee123!',
      full_name: 'Test Employee 3',
      employee_id: 'EMP003',
      hourly_rate: 150,
      daily_rate: 1000,
      branch_id: branchId
    }
  ]

  const createdEmployees = []

  for (const employee of testEmployees) {
    // Check if employee exists
    const { data: existingEmployee } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', employee.email)
      .single()

    if (existingEmployee) {
      console.log('✅ Employee already exists:', employee.email)
      createdEmployees.push(existingEmployee)
      continue
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: employee.email,
      password: employee.password,
      email_confirm: true,
      user_metadata: {
        full_name: employee.full_name
      }
    })

    if (authError) {
      console.error('❌ Error creating employee auth user:', authError)
      continue
    }

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: employee.email,
        full_name: employee.full_name,
        employee_id: employee.employee_id,
        role: 'employee',
        branch_id: employee.branch_id,
        hourly_rate: employee.hourly_rate,
        daily_rate: employee.daily_rate,
        is_active: true,
        hire_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating employee user profile:', userError)
      continue
    }

    console.log('✅ Created employee:', userData.email)
    createdEmployees.push(userData)
  }

  return createdEmployees
}

/**
 * Create sample time entries for employees
 */
async function createSampleTimeEntries(employees: Array<{ id: string }>, branchId: string) {
  console.log('📝 Creating sample time entries...')

  const today = new Date()
  const timeEntries = []

  // Create time entries for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Skip weekends (optional)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue
    }

    for (const employee of employees) {
      const checkInTime = new Date(date)
      checkInTime.setHours(9, 0, 0, 0) // 9:00 AM

      const checkOutTime = new Date(date)
      checkOutTime.setHours(18, 0, 0, 0) // 6:00 PM

      timeEntries.push({
        user_id: employee.id,
        branch_id: branchId,
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime.toISOString(),
        break_duration: 60, // 1 hour break
        total_hours: 8
      })
    }
  }

  // Insert time entries in batches
  const batchSize = 50
  for (let i = 0; i < timeEntries.length; i += batchSize) {
    const batch = timeEntries.slice(i, i + batchSize)
    const { error } = await supabase
      .from('time_entries')
      .insert(batch)

    if (error) {
      console.error('❌ Error creating time entries batch:', error)
    }
  }

  console.log(`✅ Created ${timeEntries.length} time entries`)
}

/**
 * Clean up old test data (optional)
 */
async function cleanupOldTestData() {
  console.log('🧹 Cleaning up old test data...')

  // Delete old test payroll cycles
  const { error: cycleError } = await supabase
    .from('payroll_cycles')
    .delete()
    .like('cycle_name', 'Test Cycle %')

  if (cycleError) {
    console.error('⚠️  Error cleaning up test cycles:', cycleError)
  }

  console.log('✅ Cleanup completed')
}

/**
 * Main setup function
 */
async function setupTestData() {
  console.log('🚀 Starting test data setup...\n')

  try {
    // Cleanup old data first
    await cleanupOldTestData()

    // Create admin
    await createTestAdmin()

    // Create branch
    const branchId = await createTestBranch()

    // Create employees
    const employees = await createTestEmployees(branchId)

    // Create time entries
    if (employees.length > 0) {
      await createSampleTimeEntries(employees, branchId)
    }

    console.log('\n✅ Test data setup completed successfully!')
    console.log('\n📋 Test Credentials:')
    console.log('   Admin: admin@test.com / SecureAdmin2024!@#')
    console.log('   Employee 1: employee1@test.com / Employee123!')
    console.log('   Employee 2: employee2@test.com / Employee123!')
    console.log('   Employee 3: employee3@test.com / Employee123!')

  } catch (error) {
    console.error('\n❌ Test data setup failed:', error)
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestData()
}

export { setupTestData }
