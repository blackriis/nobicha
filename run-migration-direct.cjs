const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 เริ่มเพิ่ม hourly_rate และ daily_rate columns...');
  
  try {
    // ขั้นตอนที่ 1: เพิ่ม columns
    console.log('\n📝 Step 1: เพิ่ม hourly_rate และ daily_rate columns...');
    
    const { data: alterData, error: alterError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2) DEFAULT NULL;
      `
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Error เพิ่ม columns:', alterError);
      // ลองเพิ่มทีละ column
      console.log('⚠️ ลองเพิ่มทีละ column...');
      
      try {
        // อัปเดตโดยตรงผ่าน Supabase Admin
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            hourly_rate: 50.00,
            daily_rate: 600.00 
          })
          .eq('role', 'employee');
          
        if (updateError) {
          console.log('❌ Columns ยังไม่มี - ต้องเพิ่มใน Supabase Dashboard ก่อน');
          console.log('\n📋 วิธีแก้ไขใน Supabase Dashboard:');
          console.log('1. เข้า https://supabase.com/dashboard');
          console.log('2. เลือกโปรเจ็กต์ของคุณ');
          console.log('3. ไป Table Editor > users table');
          console.log('4. เพิ่ม columns:');
          console.log('   - hourly_rate: DECIMAL(10,2), Default: NULL');
          console.log('   - daily_rate: DECIMAL(10,2), Default: NULL');
          console.log('5. รันคำสั่งนี้อีกครั้งหลังเพิ่ม columns');
          return;
        }
      } catch (directUpdateError) {
        console.log('❌ Columns ไม่มี - ต้องเพิ่มใน Database Schema ก่อน');
        console.log('\n🔧 วิธีแก้ไขด่วน:');
        console.log('ใช้ Supabase SQL Editor รันคำสั่ง:');
        console.log(`
ALTER TABLE users 
ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN daily_rate DECIMAL(10,2) DEFAULT NULL;

UPDATE users 
SET 
  hourly_rate = 50.00,
  daily_rate = 600.00
WHERE role = 'employee';
        `);
        return;
      }
    } else {
      console.log('✅ Columns เพิ่มสำเร็จ!');
    }
    
    // ขั้นตอนที่ 2: อัปเดตข้อมูลพนักงาน
    console.log('\n📝 Step 2: อัปเดตข้อมูลค่าแรงพนักงาน...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        hourly_rate: 50.00,
        daily_rate: 600.00 
      })
      .eq('role', 'employee')
      .is('hourly_rate', null);
    
    if (updateError) {
      console.error('❌ Error อัปเดตข้อมูล:', updateError);
    } else {
      console.log('✅ อัปเดตข้อมูลค่าแรงสำเร็จ!');
    }
    
    // ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
    console.log('\n📝 Step 3: ตรวจสอบผลลัพธ์...');
    
    const { data: employees, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .limit(5);
    
    if (checkError) {
      console.error('❌ Error ตรวจสอบ:', checkError);
      return;
    }
    
    console.log('\n✅ ผลลัพธ์:');
    console.log(`พนักงานทั้งหมด: ${employees?.length || 0} คน`);
    
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        console.log(`- ${emp.full_name}: ฿${emp.hourly_rate}/ชม, ฿${emp.daily_rate}/วัน`);
      });
      
      const hasRates = employees.some(emp => emp.hourly_rate && emp.daily_rate);
      if (hasRates) {
        console.log('\n🎉 สำเร็จ! ตอนนี้ Payroll Calculation ควรทำงานได้แล้ว');
      } else {
        console.log('\n⚠️ ยังไม่มีข้อมูลค่าแรง');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();