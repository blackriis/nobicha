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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEmployeeListDirect() {
  console.log('🧪 Testing Employee List Direct (Service Role)...')
  
  try {
    // Test direct query with service role
    console.log('📊 Fetching employees directly with service role...')
    
    const { data, error, count } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        is_active,
        created_at,
        branches:branch_id (
          id,
          name,
          address
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Direct query error:', error.message)
      return
    }

    console.log('✅ Direct query successful!')
    console.log(`📊 Total employees: ${count}`)
    
    if (data && data.length > 0) {
      console.log('\n👥 Employees found:')
      data.forEach((emp, index) => {
        console.log(`  ${index + 1}. ${emp.full_name} (${emp.email})`)
        console.log(`     Role: ${emp.role}, Active: ${emp.is_active}`)
        console.log(`     Branch: ${emp.branches?.name || 'ไม่ระบุสาขา'}`)
        console.log(`     ID: ${emp.id}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No employees found')
    }

    // Test the API endpoint with a mock token
    console.log('\n🌐 Testing /api/admin/employees endpoint...')
    
    // Create a mock JWT token for testing
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYmNlOWJmNS0zYWExLTQ0ZTItYmZiNC0yMjhiNGZlMmFjMTYiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwODY0MDB9.mock'
    
    const response = await fetch('http://localhost:3003/api/admin/employees', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 API Response status:', response.status)
    
    if (response.ok) {
      const apiData = await response.json()
      console.log('✅ API Response:')
      console.log('📈 Success:', apiData.success)
      console.log('💬 Message:', apiData.message)
      console.log('👥 Total employees:', apiData.total)
      console.log('📄 Page:', apiData.page)
      console.log('📋 Limit:', apiData.limit)
      console.log('📊 Total pages:', apiData.totalPages)
      
      if (apiData.data && apiData.data.length > 0) {
        console.log('\n👤 API Sample employees:')
        apiData.data.slice(0, 3).forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.full_name} (${emp.email}) - ${emp.role}`)
        })
      }
    } else {
      const errorData = await response.json()
      console.log('❌ API Error:', errorData.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testEmployeeListDirect()
