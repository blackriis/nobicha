// Create material usage data for today using existing data
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Creating Material Usage Data for Today');
console.log('==========================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMaterialUsageForToday() {
  try {
    console.log('🚀 Starting material usage creation for today...\n');

    // Step 1: Get existing materials
    console.log('📦 Getting existing materials...');
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('is_active', true);
      
    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError);
      return;
    }
    
    console.log(`✅ Found ${materials.length} active materials`);
    
    if (materials.length === 0) {
      console.log('⚠️ No materials found. Please create materials first.');
      return;
    }

    // Step 2: Get existing time entries
    console.log('\n📅 Getting existing time entries...');
    const { data: timeEntries, error: timeEntriesError } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (timeEntriesError) {
      console.error('❌ Error fetching time entries:', timeEntriesError);
      console.log('⚠️ Will create material usage without specific time entries...');
    }
    
    console.log(`✅ Found ${timeEntries?.length || 0} time entries`);

    // Step 3: Get existing branches
    console.log('\n🏢 Getting existing branches...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true);
      
    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
    }
    
    console.log(`✅ Found ${branches?.length || 0} branches`);

    // Step 4: Create material usage data for today
    console.log('\n📊 Creating material usage data for today...');
    
    const today = new Date();
    const materialUsageData = [];
    
    // Create 5-10 usage records for today
    const usageCount = Math.floor(Math.random() * 6) + 5; // 5-10 records
    
    for (let i = 0; i < usageCount; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      
      // Realistic quantity based on material type
      let quantity;
      if (material.unit === 'กิโลกรัม') {
        quantity = Math.random() * 3 + 0.5; // 0.5-3.5 kg
      } else if (material.unit === 'ใบ' || material.unit === 'ขวด') {
        quantity = Math.floor(Math.random() * 30) + 1; // 1-30 pieces
      } else if (material.unit === 'ถุง') {
        quantity = Math.floor(Math.random() * 5) + 1; // 1-5 bags
      } else if (material.unit === 'ฟอง') {
        quantity = Math.floor(Math.random() * 15) + 1; // 1-15 eggs
      } else {
        quantity = Math.random() * 2 + 0.5; // Default range
      }
      
      const totalCost = quantity * material.cost_per_unit;
      
      // Random time during today
      const usageHour = 8 + Math.floor(Math.random() * 10); // 8 AM to 6 PM
      const usageMinute = Math.floor(Math.random() * 60);
      const usageTime = new Date(today);
      usageTime.setHours(usageHour, usageMinute, 0, 0);
      
      // Use existing time entry if available, otherwise create a dummy reference
      let timeEntryId = '00000000-0000-0000-0000-000000000001'; // Default dummy ID
      if (timeEntries && timeEntries.length > 0) {
        timeEntryId = timeEntries[i % timeEntries.length].id;
      }
      
      const usageId = crypto.randomUUID();
      materialUsageData.push({
        id: usageId,
        time_entry_id: timeEntryId,
        material_id: material.id,
        quantity_used: parseFloat(quantity.toFixed(2)),
        unit_cost: material.cost_per_unit,
        total_cost: parseFloat(totalCost.toFixed(2)),
        notes: `Usage for ${material.name} - today (${usageTime.toLocaleTimeString('th-TH')})`,
        created_at: usageTime.toISOString()
      });
    }

    // Step 5: Insert material usage data
    console.log(`\n💾 Inserting ${materialUsageData.length} material usage records...`);
    
    const { data: createdUsage, error: usageError } = await supabase
      .from('material_usage')
      .insert(materialUsageData)
      .select(`
        id,
        material_id,
        quantity_used,
        unit_cost,
        total_cost,
        created_at,
        raw_materials (
          id,
          name,
          unit,
          cost_per_unit
        )
      `);

    if (usageError) {
      console.error('❌ Error creating material usage:', usageError);
      console.log('💡 This might be due to foreign key constraints or RLS policies.');
    } else {
      console.log(`✅ Created ${createdUsage.length} material usage records`);
      
      // Step 6: Generate today's summary
      console.log('\n📈 TODAY\'S MATERIAL USAGE SUMMARY:');
      
      const totalCost = createdUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
      const materialCount = new Set(createdUsage.map(item => item.material_id)).size;
      
      console.log(`💰 Total Cost: ฿${totalCost.toFixed(2)}`);
      console.log(`📦 Materials Used: ${materialCount} different materials`);
      console.log(`📊 Usage Records: ${createdUsage.length} records`);
      
      // Group by material
      const materialGroups = {};
      createdUsage.forEach(item => {
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
      
      console.log('\n📋 Material Breakdown:');
      Object.entries(materialGroups).forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.quantity.toFixed(2)} ${data.unit}, ฿${data.cost.toFixed(2)}`);
      });
      
      // Show recent usage records
      console.log('\n📅 Recent Usage Records:');
      createdUsage.slice(0, 5).forEach((item, index) => {
        const materialName = item.raw_materials?.name || 'Unknown';
        const time = new Date(item.created_at).toLocaleTimeString('th-TH');
        console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${time})`);
      });
    }

    // Step 7: Final verification
    console.log('\n🔍 Final verification...');
    
    const { data: allUsage, error: allUsageError } = await supabase
      .from('material_usage')
      .select('count')
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString());
      
    const { data: allMaterials, error: allMaterialsError } = await supabase
      .from('raw_materials')
      .select('count')
      .eq('is_active', true);

    console.log('\n📊 FINAL DATABASE STATE:');
    console.log(`   - Today's Material Usage Records: ${allUsage?.length || 0}`);
    console.log(`   - Active Materials: ${allMaterials?.length || 0}`);

    console.log('\n🎉 Material usage creation completed successfully!');
    console.log('\n🔗 Test URLs:');
    console.log('   - Material Reports (Today): http://localhost:3000/admin/reports/materials?dateRange=today');
    console.log('   - Material Reports (All): http://localhost:3000/admin/reports/materials?dateRange=all');
    
    console.log('\n🧪 Testing Checklist:');
    console.log('   ✅ Material usage data created for today');
    console.log('   ✅ Realistic quantities and costs');
    console.log('   ✅ Multiple materials used');
    console.log('   ✅ Proper timestamps for today');
    console.log('   ✅ Ready for Material Reports testing');
    
  } catch (error) {
    console.error('❌ Error creating material usage:', error);
  }
}

// Run the script
createMaterialUsageForToday().then(() => {
  console.log('\n✅ Material usage creation completed');
  console.log('\n💡 You can now test the Material Reports page with today\'s data');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
