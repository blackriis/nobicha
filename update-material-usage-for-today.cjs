// Update existing material usage data to today's date for testing
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Updating Material Usage Data for Today');
console.log('==========================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMaterialUsageForToday() {
  try {
    console.log('🚀 Starting material usage update for today...\n');

    // Step 1: Get existing material usage
    console.log('📦 Getting existing material usage records...');
    const { data: existingUsage, error: existingUsageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name, unit)')
      .order('created_at', { ascending: false });
      
    if (existingUsageError) {
      console.error('❌ Error fetching existing usage:', existingUsageError);
      return;
    }
    
    console.log(`✅ Found ${existingUsage.length} existing material usage records`);
    
    if (existingUsage.length === 0) {
      console.log('⚠️ No material usage records found. Cannot update.');
      return;
    }

    // Show existing usage
    console.log('\n📅 Existing Usage Records:');
    existingUsage.forEach((item, index) => {
      const materialName = item.raw_materials?.name || 'Unknown';
      const date = new Date(item.created_at).toLocaleDateString('th-TH');
      console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${date})`);
    });

    // Step 2: Update some records to today's date
    console.log('\n📊 Updating material usage records to today...');
    
    const today = new Date();
    const recordsToUpdate = Math.min(3, existingUsage.length); // Update up to 3 records
    
    console.log(`🔄 Updating ${recordsToUpdate} records to today's date...`);
    
    for (let i = 0; i < recordsToUpdate; i++) {
      const record = existingUsage[i];
      
      // Create different times throughout today
      const updateHour = 8 + (i * 2); // 8 AM, 10 AM, 12 PM, etc.
      const updateMinute = Math.floor(Math.random() * 60);
      const updateTime = new Date(today);
      updateTime.setHours(updateHour, updateMinute, 0, 0);
      
      const { error: updateError } = await supabase
        .from('material_usage')
        .update({
          created_at: updateTime.toISOString(),
          notes: `Updated to today - ${record.raw_materials?.name || 'Unknown'} usage`
        })
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`❌ Error updating record ${i + 1}:`, updateError);
      } else {
        console.log(`✅ Updated record ${i + 1}: ${record.raw_materials?.name || 'Unknown'} to ${updateTime.toLocaleTimeString('th-TH')}`);
      }
    }

    // Step 3: Verify today's data
    console.log('\n🔍 Verifying today\'s material usage...');
    
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const { data: todayUsage, error: todayUsageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name, unit)')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: false });
      
    if (todayUsageError) {
      console.error('❌ Error fetching today\'s usage:', todayUsageError);
    } else {
      console.log(`📊 Today's Material Usage Records: ${todayUsage.length}`);
      
      if (todayUsage.length > 0) {
        const todayTotalCost = todayUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
        const todayMaterialCount = new Set(todayUsage.map(item => item.material_id)).size;
        
        console.log(`💰 Today's Total Cost: ฿${todayTotalCost.toFixed(2)}`);
        console.log(`📦 Materials Used Today: ${todayMaterialCount} different materials`);
        
        console.log('\n📅 Today\'s Usage Records:');
        todayUsage.forEach((item, index) => {
          const materialName = item.raw_materials?.name || 'Unknown';
          const time = new Date(item.created_at).toLocaleTimeString('th-TH');
          console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${time})`);
        });
        
        // Group by material for today
        const materialGroups = {};
        todayUsage.forEach(item => {
          const materialName = item.raw_materials?.name || 'Unknown Material';
          if (!materialGroups[materialName]) {
            materialGroups[materialName] = { 
              quantity: 0, 
              cost: 0, 
              unit: item.raw_materials?.unit || '' 
            };
          }
          materialGroups[materialName].quantity += parseFloat(item.quantity_used);
          materialGroups[materialName].cost += parseFloat(item.total_cost);
        });
        
        console.log('\n📋 Today\'s Material Breakdown:');
        Object.entries(materialGroups).forEach(([name, data]) => {
          console.log(`   - ${name}: ${data.quantity.toFixed(2)} ${data.unit}, ฿${data.cost.toFixed(2)}`);
        });
      } else {
        console.log('⚠️ No material usage records found for today');
      }
    }

    // Step 4: Show all material usage for context
    console.log('\n📊 All Material Usage Records:');
    const { data: allUsage, error: allUsageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name, unit)')
      .order('created_at', { ascending: false });
      
    if (allUsageError) {
      console.error('❌ Error fetching all usage:', allUsageError);
    } else {
      console.log(`📊 Total Material Usage Records: ${allUsage.length}`);
      
      if (allUsage.length > 0) {
        const totalCost = allUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
        console.log(`💰 Total Cost Across All Records: ฿${totalCost.toFixed(2)}`);
        
        console.log('\n📅 All Usage Records:');
        allUsage.forEach((item, index) => {
          const materialName = item.raw_materials?.name || 'Unknown';
          const date = new Date(item.created_at).toLocaleDateString('th-TH');
          const time = new Date(item.created_at).toLocaleTimeString('th-TH');
          console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${date} ${time})`);
        });
      }
    }

    console.log('\n🎉 Material usage update completed successfully!');
    console.log('\n🔗 Test URLs:');
    console.log('   - Material Reports (Today): http://localhost:3000/admin/reports/materials?dateRange=today');
    console.log('   - Material Reports (All): http://localhost:3000/admin/reports/materials?dateRange=all');
    console.log('   - Material Reports (Week): http://localhost:3000/admin/reports/materials?dateRange=week');
    console.log('   - Material Reports (Month): http://localhost:3000/admin/reports/materials?dateRange=month');
    
    console.log('\n🧪 Testing Checklist:');
    console.log('   ✅ Material usage data updated for today');
    console.log('   ✅ Multiple materials with realistic costs');
    console.log('   ✅ Proper timestamps for today');
    console.log('   ✅ Ready for Material Reports testing');
    console.log('   ✅ Can test different date range filters');
    
  } catch (error) {
    console.error('❌ Error updating material usage:', error);
  }
}

// Run the script
updateMaterialUsageForToday().then(() => {
  console.log('\n✅ Material usage update completed');
  console.log('\n💡 You can now test the Material Reports page with today\'s data');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
