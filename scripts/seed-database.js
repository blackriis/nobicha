#!/usr/bin/env node

/**
 * Seed Database Script
 * 
 * This script seeds the database with test data using Supabase service role key.
 * 
 * Usage:
 *   node scripts/seed-database.js
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY in environment variables
 *   - NEXT_PUBLIC_SUPABASE_URL in environment variables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/web/.env.local' });
dotenv.config({ path: './.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedBranches() {
  console.log('📦 Seeding branches...');
  
  const branches = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'สาขาสีลม',
      address: '123 ถนนสีลม บางรัก กรุงเทพมหานคร 10500',
      latitude: 13.7563,
      longitude: 100.5018
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'สาขาสุขุมวิท',
      address: '456 ถนนสุขุมวิท วัฒนา กรุงเทพมหานคร 10110',
      latitude: 13.7398,
      longitude: 100.5612
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'สาขาจตุจักร',
      address: '789 ถนนพหลโยธิน จตุจักร กรุงเทพมหานคร 10900',
      latitude: 13.8077,
      longitude: 100.5538
    }
  ];

  for (const branch of branches) {
    const { data, error } = await supabase
      .from('branches')
      .upsert(branch, { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ Error seeding branch ${branch.name}:`, error.message);
    } else {
      console.log(`  ✅ Seeded branch: ${branch.name}`);
    }
  }
}

async function seedWorkShifts() {
  console.log('\n📦 Seeding work shifts...');
  
  const shifts = [
    // สาขาสีลม
    {
      branch_id: '00000000-0000-0000-0000-000000000001',
      shift_name: 'กะเช้า',
      start_time: '08:00:00',
      end_time: '16:00:00',
      days_of_week: [1, 2, 3, 4, 5]
    },
    {
      branch_id: '00000000-0000-0000-0000-000000000001',
      shift_name: 'กะบ่าย',
      start_time: '14:00:00',
      end_time: '22:00:00',
      days_of_week: [1, 2, 3, 4, 5]
    },
    {
      branch_id: '00000000-0000-0000-0000-000000000001',
      shift_name: 'กะวันหยุด',
      start_time: '09:00:00',
      end_time: '17:00:00',
      days_of_week: [0, 6]
    },
    // สาขาสุขุมวิท
    {
      branch_id: '00000000-0000-0000-0000-000000000002',
      shift_name: 'กะเช้า',
      start_time: '08:30:00',
      end_time: '16:30:00',
      days_of_week: [1, 2, 3, 4, 5]
    },
    {
      branch_id: '00000000-0000-0000-0000-000000000002',
      shift_name: 'กะบ่าย',
      start_time: '13:30:00',
      end_time: '21:30:00',
      days_of_week: [1, 2, 3, 4, 5]
    },
    // สาขาจตุจักร
    {
      branch_id: '00000000-0000-0000-0000-000000000003',
      shift_name: 'กะเช้า',
      start_time: '09:00:00',
      end_time: '17:00:00',
      days_of_week: [1, 2, 3, 4, 5]
    },
    {
      branch_id: '00000000-0000-0000-0000-000000000003',
      shift_name: 'กะดึก',
      start_time: '21:00:00',
      end_time: '05:00:00',
      days_of_week: [5, 6, 0]
    }
  ];

  let seeded = 0;
  for (const shift of shifts) {
    // Check if shift already exists
    const { data: existing } = await supabase
      .from('work_shifts')
      .select('id')
      .eq('branch_id', shift.branch_id)
      .eq('shift_name', shift.shift_name)
      .eq('start_time', shift.start_time)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⏭️  Skipped existing shift: ${shift.shift_name} (${shift.branch_id})`);
      continue;
    }

    const { data, error } = await supabase
      .from('work_shifts')
      .insert(shift);
    
    if (error) {
      console.error(`  ❌ Error seeding shift ${shift.shift_name}:`, error.message);
    } else {
      console.log(`  ✅ Seeded shift: ${shift.shift_name}`);
      seeded++;
    }
  }
  
  console.log(`  📊 Seeded ${seeded} new work shifts`);
}

async function seedRawMaterials() {
  console.log('\n📦 Seeding raw materials...');
  
  const materials = [
    {
      name: 'น้ำ',
      unit: 'ลิตร',
      cost_per_unit: 2.50,
      supplier: 'บริษัท น้ำดี จำกัด',
      description: 'น้ำดื่มสำหรับผลิตเครื่องดื่ม'
    },
    {
      name: 'น้ำตาล',
      unit: 'กิโลกรัม',
      cost_per_unit: 25.00,
      supplier: 'มิตรผล',
      description: 'น้ำตาลทรายขาว'
    },
    {
      name: 'กาแฟ',
      unit: 'กิโลกรัม',
      cost_per_unit: 450.00,
      supplier: 'คาเฟ่ เบลนด์',
      description: 'เมล็ดกาแฟอาราบิก้า'
    },
    {
      name: 'นม',
      unit: 'ลิตร',
      cost_per_unit: 42.00,
      supplier: 'ไดรี่ ฟาร์ม',
      description: 'นมสด 3.25%'
    },
    {
      name: 'ถ้วยกระดาษ',
      unit: 'ใบ',
      cost_per_unit: 1.20,
      supplier: 'แพค แอนด์ เซิร์ฟ',
      description: 'ถ้วยกระดาษ 12 oz'
    },
    {
      name: 'ฝาปิด',
      unit: 'ใบ',
      cost_per_unit: 0.80,
      supplier: 'แพค แอนด์ เซิร์ฟ',
      description: 'ฝาปิดถ้วยกระดาษ'
    }
  ];

  let seeded = 0;
  for (const material of materials) {
    // Check if material already exists
    const { data: existing } = await supabase
      .from('raw_materials')
      .select('id')
      .eq('name', material.name)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⏭️  Skipped existing material: ${material.name}`);
      continue;
    }

    const { data, error } = await supabase
      .from('raw_materials')
      .insert(material);
    
    if (error) {
      console.error(`  ❌ Error seeding material ${material.name}:`, error.message);
    } else {
      console.log(`  ✅ Seeded material: ${material.name}`);
      seeded++;
    }
  }
  
  console.log(`  📊 Seeded ${seeded} new raw materials`);
}

async function verifySeedData() {
  console.log('\n🔍 Verifying seed data...');
  
  const { count: branchesCount } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true });
  
  const { count: shiftsCount } = await supabase
    .from('work_shifts')
    .select('*', { count: 'exact', head: true });
  
  const { count: materialsCount } = await supabase
    .from('raw_materials')
    .select('*', { count: 'exact', head: true });
  
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  📊 Branches: ${branchesCount || 0}`);
  console.log(`  📊 Work Shifts: ${shiftsCount || 0}`);
  console.log(`  📊 Raw Materials: ${materialsCount || 0}`);
  console.log(`  📊 Users: ${usersCount || 0}`);
}

async function seedUsers() {
  console.log('\n👥 Seeding test users...');
  console.log('   (This will create users in Supabase Auth and profiles in users table)');
  
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'SecureAdmin2024!@#',
      fullName: 'ผู้ดูแลระบบ (Admin)',
      role: 'admin',
      branchId: null,
      employeeId: null,
      phoneNumber: '021234567'
    },
    {
      email: 'manager.silom@test.com',
      password: 'Manager123!',
      fullName: 'วิชัย จันทร์แสง',
      role: 'admin',
      branchId: '00000000-0000-0000-0000-000000000001', // สาขาสีลม
      employeeId: 'MGR001',
      phoneNumber: '021234568'
    },
    {
      email: 'employee.som@test.com',
      password: 'Employee123!',
      fullName: 'สมใจ ใจดี',
      role: 'employee',
      branchId: '00000000-0000-0000-0000-000000000001', // สาขาสีลม
      employeeId: 'EMP001',
      phoneNumber: '0812345671'
    },
    {
      email: 'employee.malee@test.com',
      password: 'Employee123!',
      fullName: 'มาลี ดีใจ',
      role: 'employee',
      branchId: '00000000-0000-0000-0000-000000000002', // สาขาสุขุมวิท
      employeeId: 'EMP002',
      phoneNumber: '0812345672'
    },
    {
      email: 'employee.chai@test.com',
      password: 'Employee123!',
      fullName: 'ชาย กล้าหาญ',
      role: 'employee',
      branchId: '00000000-0000-0000-0000-000000000003', // สาขาจตุจักร
      employeeId: 'EMP003',
      phoneNumber: '0812345673'
    },
    {
      email: 'employee.nina@test.com',
      password: 'Employee123!',
      fullName: 'นิน่า สวยงาม',
      role: 'employee',
      branchId: null, // สามารถทำงานหลายสาขา
      employeeId: 'EMP004',
      phoneNumber: '0812345674'
    }
  ];

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const userData of testUsers) {
    try {
      console.log(`\n  🔄 Processing: ${userData.email}`);
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        u => u.email?.toLowerCase() === userData.email.toLowerCase()
      );

      let authUserId = existingUser?.id;

      if (!existingUser) {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.fullName,
            role: userData.role
          }
        });

        if (authError) {
          console.error(`    ❌ Error creating auth user: ${authError.message}`);
          skipped++;
          continue;
        }

        authUserId = authData.user?.id;
        console.log(`    ✅ Created auth user: ${authUserId}`);
        created++;
      } else {
        // Update existing user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
          user_metadata: {
            full_name: userData.fullName,
            role: userData.role
          }
        });

        if (updateError) {
          console.warn(`    ⚠️  Could not update metadata: ${updateError.message}`);
        } else {
          console.log(`    ℹ️  User already exists, updated metadata`);
        }
        updated++;
      }

      // Generate username from email (before @ symbol)
      const username = userData.email.split('@')[0];

      // Create or update user profile
      const profileData = {
        id: authUserId,
        email: userData.email,
        username: username,
        full_name: userData.fullName,
        role: userData.role,
        branch_id: userData.branchId,
        employee_id: userData.employeeId,
        phone_number: userData.phoneNumber,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true
      };

      const { error: profileError } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error(`    ❌ Error updating profile: ${profileError.message}`);
      } else {
        console.log(`    ✅ Profile updated: ${userData.fullName}`);
      }

    } catch (error) {
      console.error(`    ❌ Error processing ${userData.email}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n  📊 Users Summary:`);
  console.log(`     ✅ Created: ${created}`);
  console.log(`     🔄 Updated: ${updated}`);
  console.log(`     ⏭️  Skipped: ${skipped}`);
}

async function main() {
  console.log('🌱 Starting database seed...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  try {
    await seedBranches();
    await seedWorkShifts();
    await seedRawMaterials();
    await seedUsers();
    await verifySeedData();
    
    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📝 Test Users Created:');
    console.log('   Admin:');
    console.log('     📧 admin@test.com / SecureAdmin2024!@#');
    console.log('     📧 manager.silom@test.com / Manager123!');
    console.log('   Employees:');
    console.log('     📧 employee.som@test.com / Employee123!');
    console.log('     📧 employee.malee@test.com / Employee123!');
    console.log('     📧 employee.chai@test.com / Employee123!');
    console.log('     📧 employee.nina@test.com / Employee123!');
    console.log('\n📚 See TEST_CREDENTIALS.md for more details');
  } catch (error) {
    console.error('\n❌ Error during seed:', error);
    process.exit(1);
  }
}

main();

