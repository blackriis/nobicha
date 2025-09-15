#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to fix Next.js 15 async cookies() issue in API routes
 * This script will:
 * 1. Find all API route files that use createClient() or createSupabaseServerClient()
 * 2. Add await before the function call
 * 3. Update the file
 */

const apiDir = '/Users/blackriis/Dev/nobi_new/apps/web/src/app/api';

// Get all route.ts files in API directory
const routeFiles = glob.sync(`${apiDir}/**/route.ts`);

console.log(`Found ${routeFiles.length} API route files to process`);

let fixedFiles = 0;
let alreadyFixed = 0;

routeFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains createClient() or createSupabaseServerClient() without await
    const hasUnawaitedCreateClient = content.includes('createClient()') && !content.includes('await createClient()');
    const hasUnawaitedCreateSupabase = content.includes('createSupabaseServerClient()') && !content.includes('await createSupabaseServerClient()');
    
    if (hasUnawaitedCreateClient || hasUnawaitedCreateSupabase) {
      console.log(`\nFixing: ${path.relative(process.cwd(), filePath)}`);
      
      let newContent = content;
      
      // Replace createClient() with await createClient()
      if (hasUnawaitedCreateClient) {
        newContent = newContent.replace(/const\s+(\w+)\s*=\s*createClient\(\)/g, 'const $1 = await createClient()');
        console.log('  ✓ Fixed createClient()');
      }
      
      // Replace createSupabaseServerClient() with await createSupabaseServerClient()
      if (hasUnawaitedCreateSupabase) {
        newContent = newContent.replace(/const\s+(\w+)\s*=\s*createSupabaseServerClient\(\)/g, 'const $1 = await createSupabaseServerClient()');
        console.log('  ✓ Fixed createSupabaseServerClient()');
      }
      
      // Write the updated content back
      fs.writeFileSync(filePath, newContent);
      fixedFiles++;
    } else if (content.includes('await createClient()') || content.includes('await createSupabaseServerClient()')) {
      alreadyFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary:`);
console.log(`  Files fixed: ${fixedFiles}`);
console.log(`  Already fixed: ${alreadyFixed}`);
console.log(`  Total processed: ${routeFiles.length}`);
console.log(`\nDone! 🎉`);