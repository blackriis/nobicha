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

async function checkUsersData() {
  console.log('🔍 Checking users data in database...')
  
  try {
    // Check all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      return
    }

    console.log(`📊 Total users found: ${users.length}`)
    
    if (users.length > 0) {
      console.log('\n👥 Users in database:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.full_name} (${user.email})`)
        console.log(`     Role: ${user.role}, Active: ${user.is_active}`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Created: ${user.created_at}`)
        console.log('')
      })
    } else {
      console.log('⚠️  No users found in database')
    }

    // Check auth users
    console.log('\n🔐 Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
    } else {
      console.log(`📊 Total auth users: ${authUsers.users.length}`)
      
      if (authUsers.users.length > 0) {
        console.log('\n👤 Auth users:')
        authUsers.users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email}`)
          console.log(`     ID: ${user.id}`)
          console.log(`     Created: ${user.created_at}`)
          console.log(`     Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
          console.log('')
        })
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

// Run the check
checkUsersData()