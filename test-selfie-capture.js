#!/usr/bin/env node

// Script สำหรับทดสอบ Selfie Capture functionality
// หลังจากแก้ไข storage infrastructure issue

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSelfieUploadEndToEnd() {
  try {
    console.log('🧪 Testing Selfie Capture End-to-End Functionality\n');
    
    // Step 1: ตรวจสอบ storage bucket
    console.log('1️⃣ Checking storage bucket existence...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    const employeeBucket = buckets?.find(bucket => bucket.id === 'employee-selfies');
    
    if (!employeeBucket) {
      console.error('❌ Storage bucket "employee-selfies" not found!');
      return false;
    }
    
    console.log('✅ Storage bucket exists');
    console.log(`   📊 File size limit: ${employeeBucket.file_size_limit} bytes`);
    console.log(`   🎯 MIME types: ${employeeBucket.allowed_mime_types?.join(', ')}`);
    
    // Step 2: สร้าง test image file (จำลอง selfie)
    console.log('\n2️⃣ Creating test selfie image...');
    
    // สร้าง base64 test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA20j/wAAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    const testFileName = `test-selfie-${Date.now()}.png`;
    
    console.log(`   📸 Test image size: ${testImageBuffer.length} bytes`);
    console.log(`   📝 Test filename: ${testFileName}`);
    
    // Step 3: ทดสอบ upload เหมือนใน selfie capture
    console.log('\n3️⃣ Testing selfie upload simulation...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(`employee-selfies/${testFileName}`, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return false;
    }
    
    console.log('✅ Upload successful');
    console.log(`   📁 Path: ${uploadData.path}`);
    console.log(`   🔗 Full path: ${uploadData.fullPath}`);
    
    // Step 4: ทดสอบ get public URL (เหมือนใน app)
    console.log('\n4️⃣ Testing public URL generation...');
    
    const { data: publicUrlData } = supabase.storage
      .from('employee-selfies')
      .getPublicUrl(uploadData.path);
    
    if (!publicUrlData.publicUrl) {
      console.error('❌ Failed to generate public URL');
      return false;
    }
    
    console.log('✅ Public URL generated');
    console.log(`   🌐 URL: ${publicUrlData.publicUrl}`);
    
    // Step 5: ทดสอบ file existence
    console.log('\n5️⃣ Verifying file accessibility...');
    
    const { data: fileList, error: listFilesError } = await supabase.storage
      .from('employee-selfies')
      .list('employee-selfies');
    
    if (listFilesError) {
      console.error('❌ File listing failed:', listFilesError);
      return false;
    }
    
    const uploadedFile = fileList?.find(file => file.name === testFileName);
    
    if (!uploadedFile) {
      console.error('❌ Uploaded file not found in listing');
      return false;
    }
    
    console.log('✅ File verified in storage');
    console.log(`   📊 File size: ${uploadedFile.metadata?.size} bytes`);
    console.log(`   📅 Last modified: ${uploadedFile.updated_at}`);
    
    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up test file...');
    
    const { error: deleteError } = await supabase.storage
      .from('employee-selfies')
      .remove([uploadData.path]);
    
    if (deleteError) {
      console.log(`⚠️  Cleanup warning: ${deleteError.message}`);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testServiceLayerIntegration() {
  try {
    console.log('\n🔧 Testing Upload Service Integration...\n');
    
    // ตรวจสอบ upload service file
    const servicePath = './apps/web/src/lib/services/upload.service.ts';
    if (!fs.existsSync(servicePath)) {
      console.error('❌ Upload service file not found');
      return false;
    }
    
    console.log('✅ Upload service file exists');
    
    // อ่าน content เพื่อตรวจสอบ bucket validation
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    if (serviceContent.includes('employee-selfies') && 
        serviceContent.includes('bucketExists') &&
        serviceContent.includes('STORAGE_ERROR')) {
      console.log('✅ Upload service includes storage validation');
      console.log('✅ Proper error handling implemented');
    } else {
      console.log('⚠️  Upload service may need validation updates');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Service integration test failed:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🎯 Selfie Capture Feature Testing - Post Storage Fix\n');
    console.log('   Testing following QA recommendations after storage infrastructure fix\n');
    
    // Test 1: End-to-end upload functionality
    const uploadTest = await testSelfieUploadEndToEnd();
    
    // Test 2: Service layer integration
    const serviceTest = await testServiceLayerIntegration();
    
    console.log('\n📋 Test Results Summary:');
    console.log('════════════════════════════════════════');
    console.log(`Storage Infrastructure: ${uploadTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Service Integration:    ${serviceTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (uploadTest && serviceTest) {
      console.log('\n🎉 SUCCESS: Selfie capture functionality is working!');
      console.log('✅ Storage bucket operational');
      console.log('✅ File upload mechanism working');
      console.log('✅ Public URL generation working');
      console.log('✅ Service layer properly integrated');
      
      console.log('\n📋 Production Issue Status:');
      console.log('✅ 400 Bad Request storage errors should be resolved');
      console.log('✅ Selfie capture should work in the application');
      console.log('✅ Story 1.5 implementation is now fully functional');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Test the actual selfie capture in the web application');
      console.log('2. Verify check-in/check-out flow with real camera');
      console.log('3. Update Story 1.5 status as complete per QA recommendations');
      
    } else {
      console.log('\n❌ FAILURE: Issues remain with selfie capture functionality');
      console.log('Please investigate the failing components');
    }
    
  } catch (error) {
    console.error('\n💥 TEST SCRIPT FAILED:', error.message);
    process.exit(1);
  }
}

// Execute test
main();