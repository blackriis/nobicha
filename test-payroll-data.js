// Script to test and add payroll sample data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking database data...\n')
  
  // Check tables exist
  console.log('📋 Checking tables...')
  
  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate, is_active')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
    } else {
      console.log('✅ Users table:', users?.length || 0, 'records')
      console.log('   Sample users:', users?.map(u => ({
        name: u.full_name, 
        role: u.role, 
        hourly_rate: u.hourly_rate, 
        daily_rate: u.daily_rate,
        active: u.is_active
      })))
    }
    
    // Check payroll_cycles table
    const { data: cycles, error: cyclesError } = await supabase
      .from('payroll_cycles')
      .select('id, cycle_name, status, start_date, end_date')
      .limit(5)
    
    if (cyclesError) {
      console.error('❌ Payroll cycles table error:', cyclesError.message)
    } else {
      console.log('✅ Payroll cycles table:', cycles?.length || 0, 'records')
      console.log('   Sample cycles:', cycles?.map(c => ({
        name: c.cycle_name, 
        status: c.status,
        period: `${c.start_date} to ${c.end_date}`
      })))
    }
    
    // Check time_entries table
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('id, user_id, check_in_time, check_out_time')
      .limit(5)
    
    if (entriesError) {
      console.error('❌ Time entries table error:', entriesError.message)
    } else {
      console.log('✅ Time entries table:', entries?.length || 0, 'records')
      console.log('   Sample entries:', entries?.map(e => ({
        user_id: e.user_id.substring(0, 8) + '...', 
        check_in: e.check_in_time,
        check_out: e.check_out_time
      })))
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
  }
}

async function addSampleData() {
  console.log('\n🔧 Adding sample data...\n')
  
  try {
    // Add sample branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .upsert({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'สาขาหลัก',
        address: '123 ถนนสุขุมวิท กรุงเทพฯ',
        latitude: 13.7563,
        longitude: 100.5018
      })
      .select()
      .single()
    
    if (branchError && !branchError.message.includes('duplicate')) {
      console.error('❌ Branch creation error:', branchError.message)
      return
    } else {
      console.log('✅ Branch created/exists')
    }
    
    // Add sample employees with rates
    const sampleUsers = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        email: 'employee1@test.com',
        full_name: 'พนักงาน ทดสอบ 1',
        role: 'employee',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        employee_id: 'EMP001',
        hourly_rate: 65,
        daily_rate: 500,
        is_active: true
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        email: 'employee2@test.com',
        full_name: 'พนักงาน ทดสอบ 2', 
        role: 'employee',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        employee_id: 'EMP002',
        hourly_rate: 70,
        daily_rate: 600,
        is_active: true
      }
    ]
    
    for (const user of sampleUsers) {
      const { error: userError } = await supabase
        .from('users')
        .upsert(user)
      
      if (userError && !userError.message.includes('duplicate')) {
        console.error(`❌ User ${user.full_name} creation error:`, userError.message)
      } else {
        console.log(`✅ User ${user.full_name} created/exists`)
      }
    }
    
    // Add sample payroll cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('payroll_cycles')
      .upsert({
        id: 'cycle-2024-12',
        cycle_name: 'ธันวาคม 2024',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        pay_date: '2025-01-05',
        status: 'active',
        total_amount: 0
      })
      .select()
      .single()
    
    if (cycleError && !cycleError.message.includes('duplicate')) {
      console.error('❌ Payroll cycle creation error:', cycleError.message)
      return
    } else {
      console.log('✅ Payroll cycle created/exists')
    }
    
    // Add sample time entries
    const timeEntries = [
      {
        user_id: '11111111-2222-3333-4444-555555555555',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        check_in_time: '2024-12-19T08:00:00Z',
        check_out_time: '2024-12-19T17:00:00Z',
        break_duration: 60,
        total_hours: 8
      },
      {
        user_id: '22222222-3333-4444-5555-666666666666',
        branch_id: '123e4567-e89b-12d3-a456-426614174000',
        check_in_time: '2024-12-19T09:00:00Z',
        check_out_time: '2024-12-19T18:00:00Z',
        break_duration: 60,
        total_hours: 8
      }
    ]
    
    for (const entry of timeEntries) {
      const { error: entryError } = await supabase
        .from('time_entries')
        .insert(entry)
      
      if (entryError && !entryError.message.includes('duplicate')) {
        console.error('❌ Time entry creation error:', entryError.message)
      } else {
        console.log('✅ Time entry created')
      }
    }
    
    console.log('\n✅ Sample data setup completed!')
    
  } catch (error) {
    console.error('❌ Sample data creation error:', error.message)
  }
}

async function main() {
  await checkData()
  await addSampleData()
  await checkData()
  
  console.log('\n🎯 Try calculating payroll with cycle ID: cycle-2024-12')
}

main().catch(console.error)