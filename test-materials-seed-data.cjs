// Test script for materials seed data
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: './apps/web/.env.local' });
} catch (error) {
  console.log('ℹ️ dotenv not available, using process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Materials Seed Data');
console.log('================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('Please ensure you have:');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL in apps/web/.env.local');
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local');
  console.log('');
  console.log('If you don\'t have .env.local, create it with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMaterialsData() {
  console.log('🔍 ตรวจสอบ raw_materials data...');
  
  try {
    // Test raw_materials table
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError);
      return;
    }
    
    console.log('📊 ข้อมูล raw_materials:');
    console.log('จำนวนรายการ:', materials.length);
    
    if (materials.length > 0) {
      console.log('\nรายละเอียด materials:');
      materials.forEach((material, index) => {
        console.log(`${index + 1}. ${material.name}`);
        console.log(`   - หน่วย: ${material.unit}`);
        console.log(`   - ราคาต่อหน่วย: ฿${material.cost_per_unit}`);
        console.log(`   - ผู้จำหน่าย: ${material.supplier}`);
        console.log(`   - สถานะ: ${material.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}`);
        console.log(`   - สร้างเมื่อ: ${material.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️ ไม่พบข้อมูล raw_materials');
      console.log('💡 คุณสามารถรัน seed data ได้ด้วย:');
      console.log('   node -e "require(\'./seed-database.sql\')"');
      console.log('   หรือใช้ Supabase SQL Editor');
    }
    
    // Test material_usage table
    console.log('\n🔍 ตรวจสอบ material_usage data...');
    const { data: usage, error: usageError } = await supabase
      .from('material_usage')
      .select('*, raw_materials(name), time_entries(*)')
      .order('created_at', { ascending: false });
      
    if (usageError) {
      console.error('❌ Error fetching material_usage:', usageError);
      return;
    }
    
    console.log('📊 ข้อมูล material_usage:');
    console.log('จำนวนรายการ:', usage.length);
    
    if (usage.length > 0) {
      console.log('\nรายละเอียด material usage:');
      usage.forEach((item, index) => {
        console.log(`${index + 1}. ${item.raw_materials?.name || 'Unknown Material'}`);
        console.log(`   - จำนวนที่ใช้: ${item.quantity_used}`);
        console.log(`   - ต้นทุนต่อหน่วย: ฿${item.unit_cost}`);
        console.log(`   - ต้นทุนรวม: ฿${item.total_cost}`);
        console.log(`   - วันที่ใช้: ${item.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️ ไม่พบข้อมูล material_usage');
    }
    
    // Test branches table (for context)
    console.log('\n🔍 ตรวจสอบ branches data...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
      return;
    }
    
    console.log('📊 ข้อมูล branches:');
    console.log('จำนวนรายการ:', branches.length);
    
    if (branches.length > 0) {
      console.log('\nรายละเอียด branches:');
      branches.forEach((branch, index) => {
        console.log(`${index + 1}. ${branch.name}`);
        console.log(`   - ที่อยู่: ${branch.address}`);
        console.log(`   - สถานะ: ${branch.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ ไม่พบข้อมูล branches');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testMaterialsData().then(() => {
  console.log('\n✅ การทดสอบเสร็จสิ้น');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
