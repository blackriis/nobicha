// Test payroll calculation with existing data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCalculation() {
  console.log('🧮 Testing payroll calculation...\n')
  
  // Get existing cycle
  const { data: cycle } = await supabase
    .from('payroll_cycles')
    .select('*')
    .eq('status', 'active')
    .single()
    
  if (!cycle) {
    console.error('❌ No active payroll cycle found')
    return
  }
  
  console.log('📋 Found cycle:', cycle.cycle_name, cycle.id)
  
  // Test calculation API call
  try {
    const response = await fetch(`http://localhost:3000/api/admin/payroll-cycles/${cycle.id}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}` // Using service role for testing
      }
    })
    
    const result = await response.text()
    console.log('🔄 API Response status:', response.status)
    
    if (response.ok) {
      const data = JSON.parse(result)
      console.log('✅ Calculation successful!')
      console.log('📊 Summary:', data.calculation_summary)
      console.log('👥 Employees calculated:', data.employee_calculations?.length)
      console.log('💰 Total base pay:', data.calculation_summary.total_base_pay)
    } else {
      console.log('❌ API Error response:', result)
      
      if (response.status === 400) {
        const errorData = JSON.parse(result)
        if (errorData.error?.includes('ได้ทำไปแล้ว')) {
          console.log('ℹ️  Calculation already exists - checking summary instead...')
          await checkSummary(cycle.id)
        } else {
          console.log('⚠️  Validation error:', errorData.error)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message)
  }
}

async function checkSummary(cycleId) {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/payroll-cycles/${cycleId}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Summary retrieved!')
      console.log('📊 Total employees:', data.summary.totals.total_employees)
      console.log('💰 Total base pay:', data.summary.totals.total_base_pay)
      console.log('💰 Total net pay:', data.summary.totals.total_net_pay)
      console.log('👥 Employee details:', data.summary.employee_details?.map(e => ({
        name: e.employee_name,
        base_pay: e.base_pay,
        net_pay: e.net_pay
      })))
    } else {
      const error = await response.text()
      console.log('❌ Summary error:', error)
    }
  } catch (error) {
    console.error('❌ Summary request error:', error.message)
  }
}

testCalculation().catch(console.error)