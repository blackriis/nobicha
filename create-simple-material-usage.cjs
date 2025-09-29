// Simple script to create material usage data for testing
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Creating Simple Material Usage Data');
console.log('======================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleMaterialUsage() {
  try {
    // Get existing materials
    console.log('🔍 Getting existing materials...');
    
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('is_active', true);
      
    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError);
      return;
    }
    
    console.log(`✅ Found ${materials.length} materials`);
    
    if (materials.length === 0) {
      console.log('⚠️ No materials found. Cannot create usage data.');
      return;
    }
    
    // Create dummy time entries first (we need them for foreign key)
    console.log('\n📅 Creating dummy time entries...');
    
    const dummyTimeEntries = [];
    const today = new Date();
    
    // Create time entries for the last 5 days
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const startTime = new Date(date);
      startTime.setHours(8, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(17, 0, 0, 0);
      
      dummyTimeEntries.push({
        user_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000001',
        check_in_time: startTime.toISOString(),
        check_out_time: endTime.toISOString(),
        total_hours: 9.0,
        notes: `Test time entry ${i + 1}`
      });
    }
    
    // Try to insert time entries (might fail due to RLS, that's okay)
    const { data: createdTimeEntries, error: timeEntriesError } = await supabase
      .from('time_entries')
      .insert(dummyTimeEntries)
      .select();
      
    if (timeEntriesError) {
      console.log('⚠️ Cannot create time entries (RLS issue), using existing ones...');
    } else {
      console.log(`✅ Created ${createdTimeEntries.length} time entries`);
    }
    
    // Get any existing time entries
    const { data: existingTimeEntries, error: getTimeEntriesError } = await supabase
      .from('time_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (getTimeEntriesError) {
      console.error('❌ Error fetching time entries:', getTimeEntriesError);
      console.log('⚠️ Will create material usage without time entries...');
    }
    
    console.log(`📋 Found ${existingTimeEntries?.length || 0} time entries`);
    
    // Create material usage data for today and yesterday
    console.log('\n📦 Creating material usage data...');
    
    const materialUsageData = [];
    
    // Create usage data for today
    materials.slice(0, 3).forEach((material, index) => {
      const quantity = Math.random() * 3 + 1; // 1 to 4
      const totalCost = quantity * material.cost_per_unit;
      
      // Use first available time entry or create a dummy reference
      const timeEntryId = existingTimeEntries && existingTimeEntries.length > 0 
        ? existingTimeEntries[index % existingTimeEntries.length].id
        : '00000000-0000-0000-0000-000000000001'; // Dummy ID
        
      materialUsageData.push({
        time_entry_id: timeEntryId,
        material_id: material.id,
        quantity_used: parseFloat(quantity.toFixed(2)),
        unit_cost: material.cost_per_unit,
        total_cost: parseFloat(totalCost.toFixed(2)),
        notes: `Test usage for ${material.name} - today`,
        created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10 + index, 0, 0).toISOString()
      });
    });
    
    // Create usage data for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    materials.slice(1, 4).forEach((material, index) => {
      const quantity = Math.random() * 2 + 0.5; // 0.5 to 2.5
      const totalCost = quantity * material.cost_per_unit;
      
      const timeEntryId = existingTimeEntries && existingTimeEntries.length > 1
        ? existingTimeEntries[(index + 1) % existingTimeEntries.length].id
        : '00000000-0000-0000-0000-000000000001'; // Dummy ID
        
      materialUsageData.push({
        time_entry_id: timeEntryId,
        material_id: material.id,
        quantity_used: parseFloat(quantity.toFixed(2)),
        unit_cost: material.cost_per_unit,
        total_cost: parseFloat(totalCost.toFixed(2)),
        notes: `Test usage for ${material.name} - yesterday`,
        created_at: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14 + index, 0, 0).toISOString()
      });
    });
    
    // Try to insert material usage data
    const { data: createdUsage, error: usageError } = await supabase
      .from('material_usage')
      .insert(materialUsageData)
      .select();
      
    if (usageError) {
      console.error('❌ Error creating material usage:', usageError);
      console.log('💡 This might be due to RLS policies. The existing data should still work for testing.');
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
      
      console.log('\n📊 New material usage summary:');
      Object.entries(materialGroups).forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.quantity.toFixed(2)} units, ฿${data.cost.toFixed(2)}`);
      });
    }
    
    // Final check - show all material usage data
    console.log('\n🔍 Final check - all material usage data:');
    const { data: allUsage, error: allUsageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name, unit)')
      .order('created_at', { ascending: false });
      
    if (allUsageError) {
      console.error('❌ Error fetching all usage:', allUsageError);
    } else {
      console.log(`📊 Total material usage records: ${allUsage.length}`);
      
      if (allUsage.length > 0) {
        const totalCost = allUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
        console.log(`💰 Total cost across all records: ฿${totalCost.toFixed(2)}`);
        
        // Show recent usage
        console.log('\n📅 Recent material usage:');
        allUsage.slice(0, 5).forEach((item, index) => {
          const materialName = item.raw_materials?.name || 'Unknown';
          const date = new Date(item.created_at).toLocaleDateString('th-TH');
          console.log(`${index + 1}. ${materialName} - ${item.quantity_used} ${item.raw_materials?.unit || ''} - ฿${item.total_cost} (${date})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createSimpleMaterialUsage().then(() => {
  console.log('\n✅ การสร้างข้อมูลทดสอบเสร็จสิ้น');
  console.log('\n💡 ตอนนี้คุณสามารถทดสอบ Material Reports page ได้แล้ว');
  console.log('🔗 URL: http://localhost:3000/admin/reports/materials');
  console.log('\n🧪 ขั้นตอนการทดสอบ:');
  console.log('1. เปิด URL ด้านบน');
  console.log('2. ตรวจสอบว่า filter แสดง "วันนี้" เป็นค่าเริ่มต้น');
  console.log('3. ตรวจสอบข้อมูลที่แสดงใน Summary Cards');
  console.log('4. ทดสอบการเปลี่ยนช่วงเวลา');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
