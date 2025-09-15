// Test script to run database migration for slip_image_url column
const { createClient } = require('@supabase/supabase-js')

async function testMigration() {
  console.log('🧪 Testing Database Migration...')
  
  // Initialize Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyhwnafkybuxneqiaffq.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Step 1: Check current schema
  console.log('📊 Checking current sales_reports schema...')
  try {
    const { data: columns, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'sales_reports' 
              ORDER BY ordinal_position;`
      })
    
    if (schemaError) {
      console.error('❌ Schema check error:', schemaError)
    } else {
      console.log('✅ Current schema:', columns)
      
      // Check if slip_image_url exists
      const hasSlipImageUrl = columns?.some(col => col.column_name === 'slip_image_url')
      
      if (hasSlipImageUrl) {
        console.log('✅ slip_image_url column already exists')
        return
      }
      
      console.log('❌ slip_image_url column missing - running migration...')
    }
  } catch (err) {
    console.error('❌ Schema check failed:', err)
    return
  }
  
  // Step 2: Run migration
  console.log('🔄 Running migration to add slip_image_url column...')
  
  try {
    // Add column
    console.log('1. Adding slip_image_url column...')
    const { error: addError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE sales_reports ADD COLUMN slip_image_url TEXT;'
      })
    
    if (addError) {
      console.error('❌ Add column error:', addError)
      return
    }
    
    // Update existing records
    console.log('2. Updating existing records...')
    const { error: updateError } = await supabase
      .rpc('exec_sql', { 
        sql: `UPDATE sales_reports 
              SET slip_image_url = 'https://placeholder.com/slip.jpg' 
              WHERE slip_image_url IS NULL;`
      })
    
    if (updateError) {
      console.error('❌ Update records error:', updateError)
      return
    }
    
    // Make column NOT NULL
    console.log('3. Setting NOT NULL constraint...')
    const { error: notNullError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE sales_reports ALTER COLUMN slip_image_url SET NOT NULL;'
      })
    
    if (notNullError) {
      console.error('❌ NOT NULL constraint error:', notNullError)
      return
    }
    
    console.log('✅ Migration completed successfully!')
    
  } catch (err) {
    console.error('❌ Migration failed:', err)
  }
  
  // Step 3: Verify migration
  console.log('🔍 Verifying migration...')
  try {
    const { data: finalSchema, error: verifyError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'sales_reports' 
              AND column_name = 'slip_image_url';`
      })
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
    } else {
      console.log('✅ Final schema for slip_image_url:', finalSchema)
    }
  } catch (err) {
    console.error('❌ Verification failed:', err)
  }
}

// Run the test
testMigration().catch(console.error)