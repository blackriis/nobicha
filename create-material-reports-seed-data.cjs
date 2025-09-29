// Enhanced seed data for material reports testing
// Creates comprehensive material usage data for various date ranges
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

console.log('🔧 Creating Enhanced Material Reports Seed Data');
console.log('================================================');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced materials data with more realistic items
const enhancedMaterials = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'แป้งข้าวโพด',
    unit: 'กิโลกรัม',
    cost_per_unit: 25.50,
    supplier: 'บริษัท แป้งไทย จำกัด',
    description: 'แป้งข้าวโพดคุณภาพดี สำหรับทำขนมและอาหาร'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'น้ำตาลทราย',
    unit: 'กิโลกรัม',
    cost_per_unit: 18.00,
    supplier: 'น้ำตาลมิตรไทย',
    description: 'น้ำตาลทรายขาว สำหรับทำขนมและเครื่องดื่ม'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'เนื้อหมูสับ',
    unit: 'กิโลกรัม',
    cost_per_unit: 180.00,
    supplier: 'ฟาร์มหมูสดใส',
    description: 'เนื้อหมูสับสด คุณภาพดี'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'แก้วกระดาษ',
    unit: 'ใบ',
    cost_per_unit: 1.70,
    supplier: 'บรรจุภัณฑ์กรีน',
    description: 'แก้วกระดาษรักษ์สิ่งแวดล้อม'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'นมสด',
    unit: 'ขวด',
    cost_per_unit: 100.00,
    supplier: 'นมฟาร์มดี',
    description: 'นมสดคุณภาพพรีเมียม'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'ชาเขียวผง',
    unit: 'ถุง',
    cost_per_unit: 180.00,
    supplier: 'ชาโอชะ',
    description: 'ชาเขียวผงสำหรับทำเครื่องดื่ม'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'กาแฟบด',
    unit: 'กิโลกรัม',
    cost_per_unit: 320.00,
    supplier: 'กาแฟอโรม่า',
    description: 'กาแฟบดคุณภาพพรีเมียม'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'ไข่ไก่',
    unit: 'ฟอง',
    cost_per_unit: 8.50,
    supplier: 'ฟาร์มไข่สด',
    description: 'ไข่ไก่สดใหม่'
  }
];

// Enhanced branches data
const enhancedBranches = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'สาขาสีลม',
    address: '123 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500',
    latitude: 13.728,
    longitude: 100.534
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'สาขาสุขุมวิท',
    address: '456 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110',
    latitude: 13.736,
    longitude: 100.560
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'สาขาจตุจักร',
    address: '789 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900',
    latitude: 13.813,
    longitude: 100.553
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'สาขาเซ็นทรัลลาดพร้าว',
    address: '1695 ถนนลาดพร้าว เขตจตุจักร กรุงเทพฯ 10900',
    latitude: 13.814,
    longitude: 100.564
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'สาขา MBK Center',
    address: '444 ถนนพญาไท เขตราชเทวี กรุงเทพฯ 10400',
    latitude: 13.747,
    longitude: 100.532
  }
];

// Enhanced users data
const enhancedUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'employee1@example.com',
    full_name: 'สมชาย ใจดี',
    role: 'employee',
    branch_id: '11111111-1111-1111-1111-111111111111',
    employee_id: 'EMP001',
    phone_number: '0812345678',
    hire_date: '2024-01-01',
    is_active: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'employee2@example.com',
    full_name: 'สมหญิง รักงาน',
    role: 'employee',
    branch_id: '22222222-2222-2222-2222-222222222222',
    employee_id: 'EMP002',
    phone_number: '0812345679',
    hire_date: '2024-01-02',
    is_active: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    full_name: 'ผู้จัดการ ระบบ',
    role: 'admin',
    branch_id: '11111111-1111-1111-1111-111111111111',
    employee_id: 'ADM001',
    phone_number: '0812345680',
    hire_date: '2024-01-01',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'employee3@example.com',
    full_name: 'วิชัย ทำงาน',
    role: 'employee',
    branch_id: '33333333-3333-3333-3333-333333333333',
    employee_id: 'EMP003',
    phone_number: '0812345681',
    hire_date: '2024-01-03',
    is_active: true
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'employee4@example.com',
    full_name: 'มาลัย สวยงาม',
    role: 'employee',
    branch_id: '44444444-4444-4444-4444-444444444444',
    employee_id: 'EMP004',
    phone_number: '0812345682',
    hire_date: '2024-01-04',
    is_active: true
  }
];

async function createEnhancedSeedData() {
  try {
    console.log('🚀 Starting enhanced seed data creation...\n');

    // Step 1: Create enhanced raw materials
    console.log('📦 Creating enhanced raw materials...');
    const { data: createdMaterials, error: materialsError } = await supabase
      .from('raw_materials')
      .upsert(enhancedMaterials, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (materialsError) {
      console.error('❌ Error creating materials:', materialsError);
    } else {
      console.log(`✅ Created/updated ${createdMaterials.length} materials`);
    }

    // Step 2: Create enhanced branches
    console.log('\n🏢 Creating enhanced branches...');
    const { data: createdBranches, error: branchesError } = await supabase
      .from('branches')
      .upsert(enhancedBranches, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (branchesError) {
      console.error('❌ Error creating branches:', branchesError);
    } else {
      console.log(`✅ Created/updated ${createdBranches.length} branches`);
    }

    // Step 3: Create enhanced users
    console.log('\n👥 Creating enhanced users...');
    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .upsert(enhancedUsers, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (usersError) {
      console.error('❌ Error creating users:', usersError);
    } else {
      console.log(`✅ Created/updated ${createdUsers.length} users`);
    }

    // Step 4: Create realistic time entries for the last 7 days
    console.log('\n📅 Creating realistic time entries...');
    const timeEntries = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      // Create 2-4 time entries per day
      const entriesPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let entryIndex = 0; entryIndex < entriesPerDay; entryIndex++) {
        const user = enhancedUsers[entryIndex % enhancedUsers.length];
        const branch = enhancedBranches[entryIndex % enhancedBranches.length];
        
        // Random check-in time between 7-9 AM
        const checkInHour = 7 + Math.floor(Math.random() * 3);
        const checkInMinute = Math.floor(Math.random() * 60);
        
        const checkInTime = new Date(date);
        checkInTime.setHours(checkInHour, checkInMinute, 0, 0);
        
        // Check-out time 8-10 hours later
        const workHours = 8 + Math.floor(Math.random() * 3);
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(checkInTime.getHours() + workHours);
        
        // Generate proper UUID for time entry
        const timeEntryId = crypto.randomUUID();
        timeEntries.push({
          id: timeEntryId,
          user_id: user.id,
          branch_id: branch.id,
          check_in_time: checkInTime.toISOString(),
          check_out_time: checkOutTime.toISOString(),
          total_hours: workHours,
          notes: `Work shift on ${date.toLocaleDateString('th-TH')}`
        });
      }
    }

    const { data: createdTimeEntries, error: timeEntriesError } = await supabase
      .from('time_entries')
      .upsert(timeEntries, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (timeEntriesError) {
      console.error('❌ Error creating time entries:', timeEntriesError);
    } else {
      console.log(`✅ Created/updated ${createdTimeEntries.length} time entries`);
    }

    // Step 5: Create comprehensive material usage data
    console.log('\n📊 Creating comprehensive material usage data...');
    const materialUsageData = [];
    
    // Create usage data for each day
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      // Get time entries for this day
      const dayTimeEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.check_in_time);
        return entryDate.toDateString() === date.toDateString();
      });
      
      // Create 3-8 material usage records per day
      const usagePerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let usageIndex = 0; usageIndex < usagePerDay; usageIndex++) {
        const material = enhancedMaterials[Math.floor(Math.random() * enhancedMaterials.length)];
        const timeEntry = dayTimeEntries[usageIndex % dayTimeEntries.length];
        
        if (!timeEntry) continue;
        
        // Realistic quantity based on material type
        let quantity;
        if (material.unit === 'กิโลกรัม') {
          quantity = Math.random() * 5 + 0.5; // 0.5-5.5 kg
        } else if (material.unit === 'ใบ' || material.unit === 'ขวด') {
          quantity = Math.floor(Math.random() * 50) + 1; // 1-50 pieces
        } else if (material.unit === 'ถุง') {
          quantity = Math.floor(Math.random() * 10) + 1; // 1-10 bags
        } else if (material.unit === 'ฟอง') {
          quantity = Math.floor(Math.random() * 20) + 1; // 1-20 eggs
        } else {
          quantity = Math.random() * 3 + 0.5; // Default range
        }
        
        const totalCost = quantity * material.cost_per_unit;
        
        // Random time during work hours
        const usageHour = 8 + Math.floor(Math.random() * 8);
        const usageMinute = Math.floor(Math.random() * 60);
        const usageTime = new Date(date);
        usageTime.setHours(usageHour, usageMinute, 0, 0);
        
        // Generate proper UUID for material usage
        const usageId = crypto.randomUUID();
        materialUsageData.push({
          id: usageId,
          time_entry_id: timeEntry.id,
          material_id: material.id,
          quantity_used: parseFloat(quantity.toFixed(2)),
          unit_cost: material.cost_per_unit,
          total_cost: parseFloat(totalCost.toFixed(2)),
          notes: `Usage for ${material.name} on ${date.toLocaleDateString('th-TH')}`,
          created_at: usageTime.toISOString()
        });
      }
    }

    const { data: createdUsage, error: usageError } = await supabase
      .from('material_usage')
      .upsert(materialUsageData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (usageError) {
      console.error('❌ Error creating material usage:', usageError);
    } else {
      console.log(`✅ Created/updated ${createdUsage.length} material usage records`);
    }

    // Step 6: Generate summary report
    console.log('\n📈 Generating summary report...');
    
    // Today's summary
    const todayUsage = createdUsage ? createdUsage.filter(usage => {
      const usageDate = new Date(usage.created_at);
      return usageDate.toDateString() === today.toDateString();
    }) : [];
    
    const todayTotalCost = todayUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
    const todayMaterialCount = new Set(todayUsage.map(item => item.material_id)).size;
    
    console.log('\n🎯 TODAY\'S MATERIAL USAGE SUMMARY:');
    console.log(`💰 Total Cost: ฿${todayTotalCost.toFixed(2)}`);
    console.log(`📦 Materials Used: ${todayMaterialCount} different materials`);
    console.log(`📊 Usage Records: ${todayUsage.length} records`);
    
    // Group by material for today
    const todayMaterialGroups = {};
    todayUsage.forEach(item => {
      const material = enhancedMaterials.find(m => m.id === item.material_id);
      if (material) {
        if (!todayMaterialGroups[material.name]) {
          todayMaterialGroups[material.name] = { quantity: 0, cost: 0, unit: material.unit };
        }
        todayMaterialGroups[material.name].quantity += parseFloat(item.quantity_used);
        todayMaterialGroups[material.name].cost += parseFloat(item.total_cost);
      }
    });
    
    console.log('\n📋 Today\'s Material Breakdown:');
    Object.entries(todayMaterialGroups).forEach(([name, data]) => {
      console.log(`   - ${name}: ${data.quantity.toFixed(2)} ${data.unit}, ฿${data.cost.toFixed(2)}`);
    });
    
    // Week summary
    const weekTotalCost = createdUsage ? createdUsage.reduce((sum, item) => sum + parseFloat(item.total_cost), 0) : 0;
    const weekMaterialCount = createdUsage ? new Set(createdUsage.map(item => item.material_id)).size : 0;
    
    console.log('\n📅 WEEK\'S MATERIAL USAGE SUMMARY:');
    console.log(`💰 Total Cost: ฿${weekTotalCost.toFixed(2)}`);
    console.log(`📦 Materials Used: ${weekMaterialCount} different materials`);
    console.log(`📊 Usage Records: ${createdUsage ? createdUsage.length : 0} records`);
    
    // Branch breakdown for today
    console.log('\n🏢 Today\'s Branch Breakdown:');
    const branchUsage = {};
    todayUsage.forEach(item => {
      const timeEntry = timeEntries.find(te => te.id === item.time_entry_id);
      if (timeEntry) {
        const branch = enhancedBranches.find(b => b.id === timeEntry.branch_id);
        if (branch) {
          if (!branchUsage[branch.name]) {
            branchUsage[branch.name] = { cost: 0, records: 0 };
          }
          branchUsage[branch.name].cost += parseFloat(item.total_cost);
          branchUsage[branch.name].records += 1;
        }
      }
    });
    
    Object.entries(branchUsage).forEach(([name, data]) => {
      console.log(`   - ${name}: ฿${data.cost.toFixed(2)} (${data.records} records)`);
    });

    // Step 7: Final verification
    console.log('\n🔍 Final verification...');
    
    const { data: finalMaterials, error: finalMaterialsError } = await supabase
      .from('raw_materials')
      .select('count')
      .eq('is_active', true);
      
    const { data: finalUsage, error: finalUsageError } = await supabase
      .from('material_usage')
      .select('count');
      
    const { data: finalBranches, error: finalBranchesError } = await supabase
      .from('branches')
      .select('count');
      
    const { data: finalTimeEntries, error: finalTimeEntriesError } = await supabase
      .from('time_entries')
      .select('count');

    console.log('\n📊 FINAL DATABASE STATE:');
    console.log(`   - Active Materials: ${finalMaterials?.length || 0}`);
    console.log(`   - Material Usage Records: ${finalUsage?.length || 0}`);
    console.log(`   - Branches: ${finalBranches?.length || 0}`);
    console.log(`   - Time Entries: ${finalTimeEntries?.length || 0}`);

    console.log('\n🎉 Enhanced seed data creation completed successfully!');
    console.log('\n🔗 Test URLs:');
    console.log('   - Material Reports (Today): http://localhost:3000/admin/reports/materials?dateRange=today');
    console.log('   - Material Reports (All): http://localhost:3000/admin/reports/materials?dateRange=all');
    console.log('   - Material Reports (Week): http://localhost:3000/admin/reports/materials?dateRange=week');
    console.log('   - Material Reports (Month): http://localhost:3000/admin/reports/materials?dateRange=month');
    
    console.log('\n🧪 Testing Checklist:');
    console.log('   ✅ Enhanced materials with realistic prices and suppliers');
    console.log('   ✅ Multiple branches with different usage patterns');
    console.log('   ✅ Comprehensive time entries for the last 7 days');
    console.log('   ✅ Realistic material usage data with proper quantities');
    console.log('   ✅ Today\'s data for immediate testing');
    console.log('   ✅ Historical data for date range testing');
    
  } catch (error) {
    console.error('❌ Error creating enhanced seed data:', error);
  }
}

// Run the script
createEnhancedSeedData().then(() => {
  console.log('\n✅ Enhanced seed data creation completed');
  console.log('\n💡 You can now test the Material Reports page with comprehensive data');
}).catch((error) => {
  console.error('❌ Script failed:', error);
});
