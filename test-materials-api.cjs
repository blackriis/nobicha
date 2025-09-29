// Test script for materials API endpoints
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Materials API Endpoints');
console.log('==================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMaterialsAPI() {
  console.log('🔍 ทดสอบ API endpoints...');
  
  try {
    // Test 1: Raw Materials API
    console.log('\n1. ทดสอบ Raw Materials API...');
    const { data: rawMaterials, error: rawError } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (rawError) {
      console.error('❌ Raw materials API error:', rawError);
    } else {
      console.log('✅ Raw materials API ทำงานได้');
      console.log(`   พบ ${rawMaterials.length} รายการ`);
    }
    
    // Test 2: Material Usage API
    console.log('\n2. ทดสอบ Material Usage API...');
    const { data: usage, error: usageError } = await supabase
      .from('material_usage')
      .select(`
        *,
        raw_materials(name, unit, cost_per_unit),
        time_entries(
          check_in_time,
          user_id,
          branch_id,
          users(full_name),
          branches(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (usageError) {
      console.error('❌ Material usage API error:', usageError);
    } else {
      console.log('✅ Material usage API ทำงานได้');
      console.log(`   พบ ${usage.length} รายการ`);
      
      if (usage.length > 0) {
        console.log('\n   ตัวอย่างข้อมูล usage:');
        usage.slice(0, 3).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.raw_materials?.name || 'Unknown'}`);
          console.log(`      - จำนวน: ${item.quantity_used} ${item.raw_materials?.unit || ''}`);
          console.log(`      - ต้นทุน: ฿${item.total_cost}`);
          console.log(`      - ผู้ใช้: ${item.time_entries?.users?.full_name || 'Unknown'}`);
          console.log(`      - สาขา: ${item.time_entries?.branches?.name || 'Unknown'}`);
        });
      }
    }
    
    // Test 3: Material Reports API (simulate admin-reports service)
    console.log('\n3. ทดสอบ Material Reports API...');
    
    // Get today's date for testing
    const today = new Date().toISOString().split('T')[0];
    console.log(`   วันที่ทดสอบ: ${today}`);
    
    // Test material reports for today
    const { data: todayUsage, error: todayError } = await supabase
      .from('material_usage')
      .select(`
        *,
        raw_materials(name, unit, cost_per_unit),
        time_entries(
          check_in_time,
          branch_id,
          branches(name)
        )
      `)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false });
      
    if (todayError) {
      console.error('❌ Today material usage API error:', todayError);
    } else {
      console.log('✅ Today material usage API ทำงานได้');
      console.log(`   พบ ${todayUsage.length} รายการสำหรับวันนี้`);
      
      if (todayUsage.length > 0) {
        const totalCost = todayUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
        const uniqueMaterials = new Set(todayUsage.map(item => item.raw_materials?.name)).size;
        
        console.log(`   - ต้นทุนรวมวันนี้: ฿${totalCost.toFixed(2)}`);
        console.log(`   - จำนวนวัสดุที่ใช้: ${uniqueMaterials} ชนิด`);
        
        // Group by material
        const materialGroups = {};
        todayUsage.forEach(item => {
          const materialName = item.raw_materials?.name || 'Unknown';
          if (!materialGroups[materialName]) {
            materialGroups[materialName] = {
              totalQuantity: 0,
              totalCost: 0,
              unit: item.raw_materials?.unit || ''
            };
          }
          materialGroups[materialName].totalQuantity += parseFloat(item.quantity_used);
          materialGroups[materialName].totalCost += parseFloat(item.total_cost);
        });
        
        console.log('\n   สรุปการใช้วัสดุวันนี้:');
        Object.entries(materialGroups).forEach(([name, data]) => {
          console.log(`   - ${name}: ${data.totalQuantity} ${data.unit} (฿${data.totalCost.toFixed(2)})`);
        });
      }
    }
    
    // Test 4: Branch breakdown
    console.log('\n4. ทดสอบ Branch Breakdown...');
    const { data: branchUsage, error: branchError } = await supabase
      .from('material_usage')
      .select(`
        *,
        time_entries(
          branch_id,
          branches(name)
        )
      `)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);
      
    if (branchError) {
      console.error('❌ Branch usage API error:', branchError);
    } else {
      console.log('✅ Branch usage API ทำงานได้');
      
      // Group by branch
      const branchGroups = {};
      branchUsage.forEach(item => {
        const branchName = item.time_entries?.branches?.name || 'Unknown';
        if (!branchGroups[branchName]) {
          branchGroups[branchName] = 0;
        }
        branchGroups[branchName] += parseFloat(item.total_cost);
      });
      
      console.log('\n   สรุปการใช้วัสดุแยกตามสาขา:');
      Object.entries(branchGroups).forEach(([name, cost]) => {
        console.log(`   - ${name}: ฿${cost.toFixed(2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testMaterialsAPI().then(() => {
  console.log('\n✅ การทดสอบ API เสร็จสิ้น');
  console.log('\n💡 ข้อมูลเหล่านี้จะแสดงใน Material Reports page');
}).catch((error) => {
  console.error('❌ API test failed:', error);
});
