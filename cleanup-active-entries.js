const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking active time entries...');
  
  // Find employee.som@test.com user ID
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'employee.som@test.com')
    .single();
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user.id);
  
  // Check active time entries
  const { data: activeEntries } = await supabase
    .from('time_entries')
    .select('id, check_in_time, check_out_time, branch_id')
    .eq('user_id', user.id)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false });
  
  console.log(`Found ${activeEntries?.length || 0} active entries:`);
  activeEntries?.forEach((entry, i) => {
    console.log(`${i+1}. ID: ${entry.id}, Check-in: ${entry.check_in_time}`);
  });
  
  if (activeEntries && activeEntries.length > 0) {
    console.log('\n🧹 Cleaning up active entries for testing...');
    
    // Add check-out time to complete the entries
    for (const entry of activeEntries) {
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          check_out_time: new Date().toISOString(),
          check_out_selfie_url: 'test-checkout-selfie'
        })
        .eq('id', entry.id);
      
      if (error) {
        console.error('Error updating entry:', error.message);
      } else {
        console.log('✅ Completed entry:', entry.id);
      }
    }
    
    console.log('\n✅ Active entries cleaned up. Employee can now check-in again.');
  } else {
    console.log('\n✅ No active entries found. Employee ready for check-in.');
  }
})();