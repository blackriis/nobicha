// Test direct database migration using PostgreSQL client
const { createClient } = require('@supabase/supabase-js')

async function testDirectMigration() {
  console.log('🧪 Testing Direct Database Migration...')
  
  // Initialize Supabase client with service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyhwnafkybuxneqiaffq.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Step 1: Check if slip_image_url exists by querying the sales_reports table
  console.log('📊 Checking if slip_image_url column exists...')
  try {
    const { data, error } = await supabase
      .from('sales_reports')
      .select('slip_image_url')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ slip_image_url column does not exist - need to run migration')
        console.log('Error details:', error.message)
      } else {
        console.error('❌ Unexpected error:', error)
        return
      }
    } else {
      console.log('✅ slip_image_url column exists')
      return
    }
  } catch (err) {
    console.error('❌ Column check failed:', err)
    return
  }
  
  // Step 2: Try to test current sales_reports structure
  console.log('🔍 Testing sales_reports table structure...')
  try {
    const { data, error } = await supabase
      .from('sales_reports')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Table query error:', error)
    } else {
      console.log('✅ Sales reports data structure:', data ? Object.keys(data[0] || {}) : 'No data')
    }
  } catch (err) {
    console.error('❌ Table query failed:', err)
  }
  
  console.log('\n📝 Manual migration needed:')
  console.log('Please run these SQL commands in Supabase SQL Editor:')
  console.log('\n1. ALTER TABLE sales_reports ADD COLUMN slip_image_url TEXT;')
  console.log('2. UPDATE sales_reports SET slip_image_url = \'https://placeholder.com/slip.jpg\' WHERE slip_image_url IS NULL;')
  console.log('3. ALTER TABLE sales_reports ALTER COLUMN slip_image_url SET NOT NULL;')
}

// Run the test
testDirectMigration().catch(console.error)