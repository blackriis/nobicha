import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking Supabase Storage status...');
  
  // Check if bucket exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError.message);
    return;
  }
  
  console.log(`📁 Found ${buckets.length} storage buckets:`);
  buckets.forEach((bucket, i) => {
    console.log(`${i+1}. ${bucket.id} (Public: ${bucket.public})`);
  });
  
  // Check employee-selfies bucket specifically
  const employeeBucket = buckets.find(b => b.id === 'employee-selfies');
  
  if (!employeeBucket) {
    console.log('❌ employee-selfies bucket not found!');
    return;
  }
  
  console.log('\n✅ employee-selfies bucket exists');
  
  // List files in the bucket
  const { data: files, error: filesError } = await supabase.storage
    .from('employee-selfies')
    .list('', { limit: 10 });
  
  if (filesError) {
    console.error('❌ Error listing files:', filesError.message);
    return;
  }
  
  console.log(`\n📄 Files in employee-selfies bucket: ${files.length}`);
  
  if (files.length === 0) {
    console.log('📭 Bucket is empty - no selfie images uploaded yet');
    console.log('\n🎯 This is EXPECTED because:');
    console.log('1. E2E tests are using mock camera (no real uploads)');
    console.log('2. No real employee has completed check-in with selfie yet');
    console.log('3. API endpoint may have errors preventing upload');
    console.log('4. Real selfie capture requires actual browser camera interaction');
  } else {
    files.forEach((file, i) => {
      console.log(`${i+1}. ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
    });
  }
  
  // Test upload capability
  console.log('\n🧪 Testing upload capability...');
  
  const testData = 'test-selfie-data';
  const testFileName = `test-${Date.now()}.txt`;
  
  const { data: uploadResult, error: uploadError } = await supabase.storage
    .from('employee-selfies')
    .upload(testFileName, testData, {
      contentType: 'text/plain'
    });
  
  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError.message);
  } else {
    console.log('✅ Upload test successful:', uploadResult.path);
    
    // Clean up test file
    await supabase.storage
      .from('employee-selfies')
      .remove([testFileName]);
    
    console.log('🧹 Test file cleaned up');
  }
  
  // Check time_entries table for actual check-ins
  console.log('\n📊 Checking time_entries for check-ins with selfies...');
  
  const { data: timeEntries, error: timeError } = await supabase
    .from('time_entries')
    .select('id, user_id, check_in_time, check_in_selfie_url, check_out_selfie_url')
    .limit(5);
  
  if (timeError) {
    console.error('❌ Error checking time entries:', timeError.message);
  } else {
    console.log(`Found ${timeEntries.length} time entries:`);
    timeEntries.forEach((entry, i) => {
      console.log(`${i+1}. ID: ${entry.id}`);
      console.log(`   Check-in: ${entry.check_in_time}`);
      console.log(`   Check-in selfie: ${entry.check_in_selfie_url || 'None'}`);
      console.log(`   Check-out selfie: ${entry.check_out_selfie_url || 'None'}\n`);
    });
  }
})();