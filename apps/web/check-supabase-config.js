#!/usr/bin/env node

/**
 * Supabase Configuration and Connectivity Checker
 * 
 * This script checks:
 * 1. Environment variables are set correctly
 * 2. Supabase URL is reachable
 * 3. Supabase API is responding
 * 4. Authentication endpoint is accessible
 */

const https = require('https');
const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVars() {
  log('\n📋 Checking Environment Variables...', 'cyan');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allPresent = true;
  
  // Check required vars
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      log(`❌ ${varName} is NOT set`, 'red');
      allPresent = false;
    } else if (value.includes('placeholder') || value.includes('YOUR_')) {
      log(`⚠️  ${varName} is set but contains placeholder value`, 'yellow');
      allPresent = false;
    } else {
      log(`✅ ${varName} is set`, 'green');
      log(`   Value: ${value.substring(0, 30)}...`, 'blue');
    }
  }
  
  // Check optional vars
  for (const varName of optionalVars) {
    const value = process.env[varName];
    
    if (!value) {
      log(`ℹ️  ${varName} is not set (optional)`, 'yellow');
    } else {
      log(`✅ ${varName} is set`, 'green');
    }
  }
  
  return allPresent;
}

function testHttpConnection(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Supabase-Config-Checker/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message,
        code: error.code
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT'
      });
    });
    
    req.end();
  });
}

async function checkSupabaseConnectivity() {
  log('\n🌐 Checking Supabase Connectivity...', 'cyan');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    log('❌ Cannot check connectivity - SUPABASE_URL is not properly set', 'red');
    return false;
  }
  
  // Test 1: Check if URL is reachable
  log('\n1️⃣  Testing base URL accessibility...', 'blue');
  try {
    const result = await testHttpConnection(supabaseUrl);
    
    if (result.success) {
      log(`✅ Base URL is reachable (Status: ${result.statusCode})`, 'green');
    } else {
      log(`❌ Base URL is not reachable`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Failed to reach base URL: ${error.error}`, 'red');
    log(`   Error Code: ${error.code}`, 'red');
    return false;
  }
  
  // Test 2: Check REST API endpoint
  log('\n2️⃣  Testing REST API endpoint...', 'blue');
  try {
    const restUrl = `${supabaseUrl}/rest/v1/`;
    const result = await testHttpConnection(restUrl);
    
    if (result.success) {
      log(`✅ REST API endpoint is accessible (Status: ${result.statusCode})`, 'green');
    } else {
      log(`⚠️  REST API endpoint returned status: ${result.statusCode}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Failed to reach REST API: ${error.error}`, 'red');
  }
  
  // Test 3: Check Auth endpoint
  log('\n3️⃣  Testing Auth endpoint...', 'blue');
  try {
    const authUrl = `${supabaseUrl}/auth/v1/health`;
    const result = await testHttpConnection(authUrl);
    
    if (result.success) {
      log(`✅ Auth endpoint is accessible (Status: ${result.statusCode})`, 'green');
    } else {
      log(`⚠️  Auth endpoint returned status: ${result.statusCode}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Failed to reach Auth endpoint: ${error.error}`, 'red');
    log(`   This is likely why login is failing!`, 'red');
  }
  
  return true;
}

function printRecommendations(envVarsOk, connectivityOk) {
  log('\n💡 Recommendations:', 'cyan');
  
  if (!envVarsOk) {
    log('\n❌ Environment Variables Issue:', 'red');
    log('   1. Create/update apps/web/.env.local file', 'yellow');
    log('   2. Add these variables:', 'yellow');
    log('      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co', 'blue');
    log('      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key', 'blue');
    log('   3. Get values from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api', 'yellow');
    log('   4. Restart the development server: npm run dev', 'yellow');
  }
  
  if (envVarsOk && !connectivityOk) {
    log('\n❌ Network Connectivity Issue:', 'red');
    log('   1. Check your internet connection', 'yellow');
    log('   2. Verify your Supabase project is active', 'yellow');
    log('   3. Check if firewall/proxy is blocking Supabase', 'yellow');
    log('   4. Try accessing Supabase dashboard in browser', 'yellow');
    log('   5. Verify the SUPABASE_URL is correct', 'yellow');
  }
  
  if (envVarsOk && connectivityOk) {
    log('\n✅ Configuration looks good!', 'green');
    log('   If you still have login issues:', 'yellow');
    log('   1. Check browser console for detailed errors', 'yellow');
    log('   2. Verify test user credentials are correct', 'yellow');
    log('   3. Check Supabase Auth settings in dashboard', 'yellow');
    log('   4. Try clearing browser cache and cookies', 'yellow');
  }
}

async function main() {
  log('═══════════════════════════════════════════════════', 'cyan');
  log('  Supabase Configuration & Connectivity Checker', 'cyan');
  log('═══════════════════════════════════════════════════', 'cyan');
  
  const envVarsOk = checkEnvVars();
  const connectivityOk = envVarsOk ? await checkSupabaseConnectivity() : false;
  
  printRecommendations(envVarsOk, connectivityOk);
  
  log('\n═══════════════════════════════════════════════════\n', 'cyan');
  
  process.exit(envVarsOk && connectivityOk ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

