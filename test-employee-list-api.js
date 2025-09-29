#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from apps/web/.env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, 'apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEmployeeListAPI() {
  console.log('🧪 Testing Employee List API...')
  
  try {
    // Login as manager user (also has admin role)
    console.log('📝 Logging in as manager...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager.silom@test.com',
      password: 'manager123'
    })

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    console.log('✅ Login successful')
    console.log('👤 User ID:', authData.user.id)
    console.log('🔑 Access token:', authData.session.access_token.substring(0, 20) + '...')

    // Test the API endpoint
    console.log('\n🌐 Testing /api/admin/employees endpoint...')
    
    const response = await fetch('http://localhost:3003/api/admin/employees', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response:')
      console.log('📈 Success:', data.success)
      console.log('💬 Message:', data.message)
      console.log('👥 Total employees:', data.total)
      console.log('📄 Page:', data.page)
      console.log('📋 Limit:', data.limit)
      console.log('📊 Total pages:', data.totalPages)
      
      if (data.data && data.data.length > 0) {
        console.log('\n👤 Sample employees:')
        data.data.slice(0, 3).forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.full_name} (${emp.email}) - ${emp.role}`)
        })
      } else {
        console.log('⚠️  No employees found')
      }
    } else {
      const errorData = await response.json()
      console.error('❌ API Error:', errorData.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testEmployeeListAPI()
