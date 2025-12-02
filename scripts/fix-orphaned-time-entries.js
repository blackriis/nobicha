#!/usr/bin/env node
/**
 * Fix orphaned time entries - entries with branch_id that doesn't exist in branches table
 * This script finds and fixes time entries that reference non-existent branches
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/web/.env.local' });
dotenv.config({ path: './.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixOrphanedTimeEntries() {
  console.log('🔧 Fixing orphaned time entries...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Get all time entries with check_out_time = null (active entries)
    const { data: activeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('id, user_id, branch_id, check_in_time')
      .is('check_out_time', null);

    if (entriesError) {
      console.error('❌ Error fetching time entries:', entriesError);
      return;
    }

    console.log(`📊 Found ${activeEntries?.length || 0} active time entries\n`);

    // Get all valid branch IDs
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
      return;
    }

    const validBranchIds = new Set(branches?.map(b => b.id) || []);
    console.log(`📋 Found ${validBranchIds.size} valid branches:`, branches?.map(b => b.name).join(', '));
    console.log('');

    // Find orphaned entries
    const orphanedEntries = activeEntries?.filter(entry => !validBranchIds.has(entry.branch_id)) || [];

    if (orphanedEntries.length === 0) {
      console.log('✅ No orphaned time entries found!');
      return;
    }

    console.log(`⚠️  Found ${orphanedEntries.length} orphaned time entries:\n`);
    orphanedEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. Entry ID: ${entry.id}`);
      console.log(`     User ID: ${entry.user_id}`);
      console.log(`     Invalid Branch ID: ${entry.branch_id}`);
      console.log(`     Check-in Time: ${entry.check_in_time}`);
      console.log('');
    });

    // Get first valid branch as fallback
    const fallbackBranchId = branches?.[0]?.id;
    if (!fallbackBranchId) {
      console.error('❌ No valid branches found to use as fallback!');
      return;
    }

    console.log(`🔧 Using branch "${branches[0].name}" (${fallbackBranchId}) as fallback\n`);

    // Update orphaned entries
    for (const entry of orphanedEntries) {
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ branch_id: fallbackBranchId })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`❌ Failed to update entry ${entry.id}:`, updateError);
      } else {
        console.log(`✅ Updated entry ${entry.id} to use branch ${fallbackBranchId}`);
      }
    }

    console.log('\n✅ Fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixOrphanedTimeEntries();

