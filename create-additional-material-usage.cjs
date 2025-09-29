// Script to create additional material usage data for testing
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Creating Additional Material Usage Data');
console.log('==========================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdditionalMaterialUsage() {
  try {
    // First, get existing materials and branches
    console.log('🔍 Getting existing materials and branches...');
    
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('is_active', true);
      
    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError);
      return;
    }
    
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*');
      
    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
      return;
    }
    
    console.log(`✅ Found ${materials.length} materials and ${branches.length} branches`);
    
    if (materials.length === 0 || branches.length === 0) {
      console.log('⚠️ No materials or branches found. Cannot create usage data.');
      return;
    }
    
    // Create some time entries first (we need them for material_usage)
    console.log('\n📅 Creating time entries...');
    
    const timeEntries = [];
    const today = new Date();
    
    // Create time entries for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const startTime = new Date(date);
      startTime.setHours(8, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(17, 0, 0, 0);
      
      timeEntries.push({
        user_id: '00000000-0000-0000-0000-000000000001', // Assuming this user exists
        branch_id: branches[i % branches.length].id,
        check_in_time: startTime.toISOString(),
        check_out_time: endTime.toISOString(),
        total_hours: 9.0,
        notes: `Test time entry for ${date.toDateString()}`
      });
    }
    
    const { data: createdTimeEntries, error: timeEntriesError } = await supabase
      .from('time_entries')
      .insert(timeEntries)
      .select();
      
    if (timeEntriesError) {
      console.error('❌ Error creating time entries:', timeEntriesError);
      // Continue anyway, we might have existing time entries
    } else {
      console.log(`✅ Created ${createdTimeEntries.length} time entries`);
    }
    
    // Get time entries for material usage
    const { data: existingTimeEntries, error: getTimeEntriesError } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (getTimeEntriesError) {
      console.error('❌ Error fetching time entries:', getTimeEntriesError);
      return;
    }
    
    console.log(`📋 Found ${existingTimeEntries.length} time entries to use`);
    
    if (existingTimeEntries.length === 0) {
      console.log('⚠️ No time entries found. Cannot create material usage data.');
      return;
    }
    
    // Create material usage data
    console.log('\n📦 Creating material usage data...');
    
    const materialUsageData = [];
    
    // Create usage data for each time entry
    existingTimeEntries.forEach((timeEntry, index) => {
      // Use 1-3 materials per time entry
      const numMaterials = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numMaterials; j++) {
        const material = materials[j % materials.length];
        const quantity = Math.random() * 5 + 0.5; // 0.5 to 5.5
        const totalCost = quantity * material.cost_per_unit;
        
        materialUsageData.push({
          time_entry_id: timeEntry.id,
          material_id: material.id,
          quantity_used: parseFloat(quantity.toFixed(2)),
          unit_cost: material.cost_per_unit,
          total_cost: parseFloat(totalCost.toFixed(2)),
          notes: `Test usage for ${material.name} on ${new Date(timeEntry.check_in_time).toDateString()}`
        });
      }
    });
    
    const { data: createdUsage, error: usageError } = await supabase
      .from('material_usage')
      .insert(materialUsageData)
      .select();
      
    if (usageError) {
      console.error('❌ Error creating material usage:', usageError);
    } else {
      console.log(`✅ Created ${createdUsage.length} material usage records`);
      
      // Show summary
      const totalCost = createdUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
      console.log(`💰 Total cost: ฿${totalCost.toFixed(2)}`);
      
      // Group by material
      const materialGroups = {};
      createdUsage.forEach(item => {
        const material = materials.find(m => m.id === item.material_id);
        if (material) {
          if (!materialGroups[material.name]) {
            materialGroups[material.name] = { quantity: 0, cost: 0 };
          }
          materialGroups[material.name].quantity += parseFloat(item.quantity_used);
          materialGroups[material.name].cost += parseFloat(item.total_cost);
        }
      });
      
      console.log('\n📊 Material usage summary:');
      Object.entries(materialGroups).forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.quantity.toFixed(2)} units, ฿${data.cost.toFixed(2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createAdditionalMaterialUsage().then(() => {
  console.log('\n✅ การสร้างข้อมูลทดสอบเสร็จสิ้น');
  console.log('\n💡 ตอนนี้คุณสามารถทดสอบ Material Reports page ได้แล้ว');
  console.log('🔗 URL: http://localhost:3000/admin/reports/materials');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
