/**
 * ทดสอบการ Upload รูปภาพจริงไปยัง Supabase Storage
 * หลังจากเปลี่ยนจาก Mock Upload เป็น Real Upload
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ข้อมูลการเชื่อมต่อ Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// สร้าง Supabase client ด้วย service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRealUpload() {
  console.log('🚀 เริ่มทดสอบการ Upload รูปภาพจริง');
  
  try {
    // 1. ตรวจสอบว่า bucket มีอยู่หรือไม่
    console.log('📋 ตรวจสอบ Storage Bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ bucket:', bucketError);
      return;
    }
    
    const employeeSelfieBucket = buckets.find(bucket => bucket.id === 'employee-selfies');
    if (!employeeSelfieBucket) {
      console.error('❌ ไม่พบ bucket "employee-selfies" กรุณารัน migration 006_storage_setup.sql');
      return;
    }
    
    console.log('✅ พบ bucket "employee-selfies" แล้ว');
    
    // 2. สร้างข้อมูลรูปภาพทดสอบ (1x1 pixel PNG)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, // compressed image data
      0x01, 0x00, 0x01, 0x1A, 0x5E, 0x2F, 0x4E, 0x00, // end of IDAT
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);
    
    // 3. สร้างข้อมูลการทดสอบ
    const testEmployeeId = '12345678-1234-1234-1234-123456789012'; // UUID format
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    const filename = `${testEmployeeId}_${timestamp}_checkin.jpg`;
    const filePath = `checkin/${testEmployeeId}/${filename}`;
    
    console.log('📤 กำลัง Upload ไฟล์ทดสอบ...');
    console.log(`   ไฟล์: ${filename}`);
    console.log(`   เส้นทาง: ${filePath}`);
    console.log(`   ขนาด: ${testImageData.length} bytes`);
    
    // 4. ทดสอบ Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-selfies')
      .upload(filePath, testImageData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ เกิดข้อผิดพลาดในการ Upload:', uploadError);
      return;
    }
    
    console.log('✅ Upload สำเร็จ!');
    console.log('   ข้อมูลที่ได้รับ:', uploadData);
    
    // 5. ทดสอบการดึง Public URL
    console.log('🔗 สร้าง Public URL...');
    const { data: urlData } = supabase.storage
      .from('employee-selfies')
      .getPublicUrl(filePath);
    
    console.log('✅ สร้าง Public URL สำเร็จ!');
    console.log(`   URL: ${urlData.publicUrl}`);
    
    // 6. ทดสอบการลบไฟล์ (ทำความสะอาด)
    console.log('🗑️ ลบไฟล์ทดสอบ...');
    const { error: deleteError } = await supabase.storage
      .from('employee-selfies')
      .remove([filePath]);
    
    if (deleteError) {
      console.warn('⚠️ ไม่สามารถลบไฟล์ทดสอบได้:', deleteError);
    } else {
      console.log('✅ ลบไฟล์ทดสอบเรียบร้อยแล้ว');
    }
    
    console.log('\n🎉 การทดสอบ Real Upload เสร็จสิ้น - ระบบพร้อมใช้งาน!');
    
  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดที่ไม่คาดคิด:', error);
  }
}

// เรียกใช้งานการทดสอบ
if (require.main === module) {
  testRealUpload();
}

module.exports = { testRealUpload };