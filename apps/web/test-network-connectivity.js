#!/usr/bin/env node

/**
 * Network Connectivity Diagnostic Tool
 * Tests connection to Supabase and provides troubleshooting guidance
 */

const https = require('https');
const dns = require('dns');

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

function printHeader(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
}

async function testDNSResolution(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        log(`❌ DNS resolution failed for ${hostname}`, 'red');
        log(`   Error: ${err.message}`, 'red');
        resolve(false);
      } else {
        log(`✅ DNS resolution successful: ${hostname} → ${address}`, 'green');
        resolve(true);
      }
    });
  });
}

async function testHTTPSConnection(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = https.get(url, { timeout: 10000 }, (res) => {
      const duration = Date.now() - startTime;
      log(`✅ HTTPS connection successful (${duration}ms)`, 'green');
      log(`   Status: ${res.statusCode}`, 'blue');
      log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`, 'blue');
      res.resume(); // Consume response data to free up memory
      resolve(true);
    });

    req.on('timeout', () => {
      log(`❌ Connection timeout after 10s`, 'red');
      req.destroy();
      resolve(false);
    });

    req.on('error', (err) => {
      log(`❌ HTTPS connection failed`, 'red');
      log(`   Error: ${err.message}`, 'red');
      log(`   Code: ${err.code}`, 'red');
      resolve(false);
    });
  });
}

async function testSupabaseAPI(url, anonKey) {
  return new Promise((resolve) => {
    const apiUrl = `${url}/rest/v1/`;
    const options = {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      timeout: 10000,
    };

    const req = https.get(apiUrl, options, (res) => {
      log(`✅ Supabase API accessible`, 'green');
      log(`   Status: ${res.statusCode}`, 'blue');
      res.resume();
      resolve(true);
    });

    req.on('timeout', () => {
      log(`❌ Supabase API timeout`, 'red');
      req.destroy();
      resolve(false);
    });

    req.on('error', (err) => {
      log(`❌ Supabase API connection failed`, 'red');
      log(`   Error: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

async function runDiagnostics() {
  printHeader('Network Connectivity Diagnostic Tool');

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    log('❌ Environment variables not found', 'red');
    log('   Please ensure .env.local exists with:', 'yellow');
    log('   - NEXT_PUBLIC_SUPABASE_URL', 'yellow');
    log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow');
    return;
  }

  log('📋 Configuration:', 'cyan');
  log(`   Supabase URL: ${supabaseUrl}`, 'blue');
  log(`   Anon Key: ${anonKey.substring(0, 20)}...`, 'blue');

  // Extract hostname from URL
  let hostname;
  try {
    const url = new URL(supabaseUrl);
    hostname = url.hostname;
  } catch (err) {
    log(`❌ Invalid Supabase URL: ${supabaseUrl}`, 'red');
    return;
  }

  // Test 1: DNS Resolution
  printHeader('Test 1: DNS Resolution');
  const dnsSuccess = await testDNSResolution(hostname);

  if (!dnsSuccess) {
    log('\n💡 Possible causes:', 'yellow');
    log('   1. No internet connection', 'yellow');
    log('   2. DNS server issues', 'yellow');
    log('   3. Firewall blocking DNS queries', 'yellow');
    log('\n🔧 Troubleshooting steps:', 'cyan');
    log('   1. Check internet connection: ping google.com', 'cyan');
    log('   2. Try different DNS server (e.g., 8.8.8.8)', 'cyan');
    log('   3. Check /etc/hosts for DNS overrides', 'cyan');
    return;
  }

  // Test 2: HTTPS Connection
  printHeader('Test 2: HTTPS Connection');
  const httpsSuccess = await testHTTPSConnection(supabaseUrl);

  if (!httpsSuccess) {
    log('\n💡 Possible causes:', 'yellow');
    log('   1. Firewall blocking HTTPS traffic', 'yellow');
    log('   2. Proxy configuration issues', 'yellow');
    log('   3. SSL/TLS certificate problems', 'yellow');
    log('   4. Supabase project is paused/deleted', 'yellow');
    log('\n🔧 Troubleshooting steps:', 'cyan');
    log('   1. Test in browser: ' + supabaseUrl, 'cyan');
    log('   2. Check firewall settings', 'cyan');
    log('   3. Verify Supabase project status in dashboard', 'cyan');
    log('   4. Try disabling VPN/proxy', 'cyan');
    return;
  }

  // Test 3: Supabase API
  printHeader('Test 3: Supabase API Access');
  const apiSuccess = await testSupabaseAPI(supabaseUrl, anonKey);

  if (!apiSuccess) {
    log('\n💡 Possible causes:', 'yellow');
    log('   1. Invalid API key', 'yellow');
    log('   2. Project is paused', 'yellow');
    log('   3. API endpoint changed', 'yellow');
    log('\n🔧 Troubleshooting steps:', 'cyan');
    log('   1. Verify API key in Supabase dashboard', 'cyan');
    log('   2. Check project status', 'cyan');
    log('   3. Test API with curl or Postman', 'cyan');
    return;
  }

  // All tests passed
  printHeader('All Tests Passed! ✅');
  log('Your Supabase connection is working correctly.', 'green');
  log('\nIf you still experience issues:', 'cyan');
  log('   1. Restart your development server', 'cyan');
  log('   2. Clear browser cache and cookies', 'cyan');
  log('   3. Check browser console for specific errors', 'cyan');
}

// Run diagnostics
runDiagnostics().catch((err) => {
  log(`\n❌ Unexpected error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
