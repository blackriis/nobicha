#!/usr/bin/env node

/**
 * Check Seed Data Script
 * 
 * This script checks what data has been seeded in the database.
 * 
 * Usage:
 *   node scripts/check-seed-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/web/.env.local' });
dotenv.config({ path: './.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBranches() {
  console.log('📋 Checking Branches...\n');
  
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No branches found!');
    console.log('   Run: node scripts/seed-database.js\n');
    return;
  }
  
  console.log(`✅ Found ${data.length} branches:\n`);
  data.forEach((branch, index) => {
    console.log(`   ${index + 1}. ${branch.name}`);
    console.log(`      ID: ${branch.id}`);
    console.log(`      Address: ${branch.address}`);
    console.log(`      Location: ${branch.latitude}, ${branch.longitude}`);
    console.log('');
  });
}

async function checkWorkShifts() {
  console.log('📋 Checking Work Shifts...\n');
  
  const { data, error } = await supabase
    .from('work_shifts')
    .select('*, branches(name)')
    .order('branch_id');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`✅ Found ${data?.length || 0} work shifts\n`);
}

async function checkRawMaterials() {
  console.log('📋 Checking Raw Materials...\n');
  
  const { count, error } = await supabase
    .from('raw_materials')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`✅ Found ${count || 0} raw materials\n`);
}

async function checkUsers() {
  console.log('📋 Checking Users...\n');
  
  const { data, error } = await supabase
    .from('users')
    .select('email, full_name, role, branch_id, employee_id')
    .order('role, email');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  const admins = data?.filter(u => u.role === 'admin') || [];
  const employees = data?.filter(u => u.role === 'employee') || [];
  
  console.log(`✅ Found ${data?.length || 0} users:`);
  console.log(`   - Admin: ${admins.length}`);
  console.log(`   - Employee: ${employees.length}\n`);
  
  if (admins.length > 0) {
    console.log('   Admins:');
    admins.forEach(u => {
      console.log(`     📧 ${u.email} - ${u.full_name}`);
    });
    console.log('');
  }
  
  if (employees.length > 0) {
    console.log('   Employees:');
    employees.forEach(u => {
      console.log(`     📧 ${u.email} - ${u.full_name}`);
    });
    console.log('');
  }
}

async function main() {
  console.log('🔍 Checking Seed Data Status...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  console.log('='.repeat(60));
  console.log('');
  
  await checkBranches();
  console.log('='.repeat(60));
  console.log('');
  
  await checkWorkShifts();
  console.log('='.repeat(60));
  console.log('');
  
  await checkRawMaterials();
  console.log('='.repeat(60));
  console.log('');
  
  await checkUsers();
  console.log('='.repeat(60));
  console.log('');
  
  console.log('💡 Tips:');
  console.log('   - If data is missing, run: node scripts/seed-database.js');
  console.log('   - In Supabase Table Editor, check for active filters');
  console.log('   - Try refreshing the page (Cmd+R / Ctrl+R)');
  console.log('');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

