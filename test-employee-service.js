import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment variables:')
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
console.log('ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')

// Test with service role
console.log('\n🔧 Testing with SERVICE ROLE:')
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

const { data: serviceData, error: serviceError } = await supabaseService
  .from('users')
  .select('id, email, full_name')
  .eq('id', 'b5917cd9-bd48-4715-be70-5fdf0cca0764')
  .single()

console.log('Service role result:')
console.log('Data:', serviceData)
console.log('Error:', serviceError)

// Test with anon key
console.log('\n👤 Testing with ANON KEY:')
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

const { data: anonData, error: anonError } = await supabaseAnon
  .from('users')
  .select('id, email, full_name')
  .eq('id', 'b5917cd9-bd48-4715-be70-5fdf0cca0764')
  .single()

console.log('Anon key result:')
console.log('Data:', anonData)
console.log('Error:', anonError)

// Test the exact query from EmployeeService
console.log('\n🎯 Testing exact EmployeeService query:')
const { data: exactData, error: exactError } = await supabaseService
  .from('users')
  .select(`
    id,
    email,
    full_name,
    role,
    branch_id,
    employee_id,
    phone_number,
    hire_date,
    is_active,
    created_at,
    branches:branch_id(id,name,address)
  `)
  .eq('id', 'b5917cd9-bd48-4715-be70-5fdf0cca0764')
  .single()

console.log('Exact query result:')
console.log('Data:', exactData)
console.log('Error:', exactError)
