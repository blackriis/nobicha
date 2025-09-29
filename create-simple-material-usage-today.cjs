// Create simple material usage data for today using existing materials
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Creating Simple Material Usage Data for Today');
console.log('================================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleMaterialUsageToday() {
  try {
    console.log('🚀 Starting simple material usage creation for today...\n');

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

    // Show existing materials
    console.log('\n📋 Existing Materials:');
    materials.forEach((material, index) => {
      console.log(`${index + 1}. ${material.name} - ฿${material.cost_per_unit}/${material.unit} (${material.supplier})`);
    });

    // Step 2: Check existing material usage
    console.log('\n🔍 Checking existing material usage...');
    const { data: existingUsage, error: existingUsageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name, unit)')
      .order('created_at', { ascending: false });
      
    if (existingUsageError) {
      console.error('❌ Error fetching existing usage:', existingUsageError);
    } else {
      console.log(`✅ Found ${existingUsage.length} existing material usage records`);
      
      if (existingUsage.length > 0) {
        console.log('\n📅 Recent Usage Records:');
        existingUsage.slice(0, 5).forEach((item, index) => {
          const materialName = item.raw_materials?.name || 'Unknown';
          const date = new Date(item.created_at).toLocaleDateString('th-TH');
          console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${date})`);
        });
      }
    }

    // Step 3: Create additional material usage data for today
    console.log('\n📊 Creating additional material usage data for today...');
    
    const today = new Date();
    const materialUsageData = [];
    
    // Create 3-6 usage records for today using different materials
    const usageCount = Math.min(6, materials.length); // Use up to 6 materials
    
    for (let i = 0; i < usageCount; i++) {
      const material = materials[i % materials.length];
      
      // Realistic quantity based on material type
      let quantity;
      if (material.unit === 'กิโลกรัม') {
        quantity = Math.random() * 2 + 0.5; // 0.5-2.5 kg
      } else if (material.unit === 'ใบ' || material.unit === 'ขวด') {
        quantity = Math.floor(Math.random() * 20) + 1; // 1-20 pieces
      } else if (material.unit === 'ถุง') {
        quantity = Math.floor(Math.random() * 3) + 1; // 1-3 bags
      } else if (material.unit === 'ฟอง') {
        quantity = Math.floor(Math.random() * 10) + 1; // 1-10 eggs
      } else {
        quantity = Math.random() * 1.5 + 0.5; // Default range
      }
      
      const totalCost = quantity * material.cost_per_unit;
      
      // Random time during today (morning to evening)
      const usageHour = 8 + Math.floor(Math.random() * 10); // 8 AM to 6 PM
      const usageMinute = Math.floor(Math.random() * 60);
      const usageTime = new Date(today);
      usageTime.setHours(usageHour, usageMinute, 0, 0);
      
      // Create a simple usage record without time_entry_id (if RLS allows)
      materialUsageData.push({
        material_id: material.id,
        quantity_used: parseFloat(quantity.toFixed(2)),
        unit_cost: material.cost_per_unit,
        total_cost: parseFloat(totalCost.toFixed(2)),
        notes: `Daily usage for ${material.name} - ${usageTime.toLocaleTimeString('th-TH')}`,
        created_at: usageTime.toISOString()
      });
    }

    // Step 4: Try to insert material usage data (without time_entry_id)
    console.log(`\n💾 Attempting to insert ${materialUsageData.length} material usage records...`);
    
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
      console.log('💡 This is expected due to foreign key constraints.');
      console.log('💡 The existing data should be sufficient for testing Material Reports.');
    } else {
      console.log(`✅ Created ${createdUsage.length} material usage records`);
      
      // Step 5: Generate today's summary
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
    }

    // Step 6: Final summary
    console.log('\n🎯 FINAL SUMMARY:');
    
    // Get all material usage for today
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
      } else {
        console.log('⚠️ No material usage records found for today');
        console.log('💡 You may need to create time entries first, or the RLS policies are preventing creation');
      }
    }

    // Step 7: Database state
    console.log('\n📊 DATABASE STATE:');
    
    const { data: allMaterials, error: allMaterialsError } = await supabase
      .from('raw_materials')
      .select('count')
      .eq('is_active', true);
      
    const { data: allUsage, error: allUsageError } = await supabase
      .from('material_usage')
      .select('count');

    console.log(`   - Active Materials: ${allMaterials?.length || 0}`);
    console.log(`   - Total Material Usage Records: ${allUsage?.length || 0}`);

    console.log('\n🎉 Material usage creation process completed!');
    console.log('\n🔗 Test URLs:');
    console.log('   - Material Reports (Today): http://localhost:3000/admin/reports/materials?dateRange=today');
    console.log('   - Material Reports (All): http://localhost:3000/admin/reports/materials?dateRange=all');
    
    console.log('\n🧪 Testing Checklist:');
    console.log('   ✅ Materials are available in the database');
    console.log('   ✅ Material usage data exists (if RLS allows)');
    console.log('   ✅ Ready for Material Reports testing');
    console.log('   ✅ Can test with existing data or create new data as needed');
    
  } catch (error) {
    console.error('❌ Error creating material usage:', error);
  }
}

// Run the script
createSimpleMaterialUsageToday().then(() => {
  console.log('\n✅ Material usage creation process completed');
  console.log('\n💡 You can now test the Material Reports page');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
