const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('ตรวจสอบ NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runEmployeeRateMigration() {
  console.log('🚀 เริ่มรัน migration: เพิ่ม hourly_rate และ daily_rate columns...');
  
  try {
    // อ่าน migration file
    const migrationPath = path.join(__dirname, 'database/migrations/009_add_employee_rate_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration content:');
    console.log(migrationSQL);
    console.log('');
    
    // แยกคำสั่ง SQL (split by semicolon and filter empty)
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 จะรัน ${sqlCommands.length} คำสั่ง SQL...`);
    
    // รันคำสั่ง SQL ทีละคำสั่ง
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`\n[${i + 1}/${sqlCommands.length}] กำลังรัน:`, sql.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`❌ Error รันคำสั่งที่ ${i + 1}:`, error);
        // ถ้า error เป็น column already exists ให้ continue
        if (error.message.includes('already exists')) {
          console.log('⚠️  Column มีอยู่แล้ว - ข้าม...');
          continue;
        }
        throw error;
      }
      
      console.log(`✅ รันสำเร็จ!`);
    }
    
    console.log('\n🎉 Migration เสร็จสิ้น! ตรวจสอบผลลัพธ์...');
    
    // ตรวจสอบว่า columns ถูกเพิ่มแล้ว
    const { data: tableInfo, error: infoError } = await supabase
      .from('users')
      .select('id, full_name, role, hourly_rate, daily_rate')
      .eq('role', 'employee')
      .limit(3);
    
    if (infoError) {
      console.error('❌ Error ตรวจสอบ table:', infoError);
      return;
    }
    
    console.log('\n✅ ตรวจสอบ users table:');
    console.log('พนักงานตัวอย่าง:', tableInfo?.length || 0, 'คน');
    
    if (tableInfo && tableInfo.length > 0) {
      tableInfo.forEach(user => {
        console.log(`- ${user.full_name}: hourly_rate=${user.hourly_rate}, daily_rate=${user.daily_rate}`);
      });
      
      const hasRates = tableInfo.some(user => user.hourly_rate || user.daily_rate);
      if (hasRates) {
        console.log('\n🎉 Migration สำเร็จ! พนักงานมีข้อมูลค่าแรงแล้ว');
        console.log('ตอนนี้ Payroll Calculation ควรทำงานได้แล้ว');
      } else {
        console.log('\n⚠️  Migration รันแล้วแต่ยังไม่มีข้อมูลค่าแรง ต้องเพิ่มข้อมูลด้วยตนเอง');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Details:', error.message);
  }
}

// รัน migration
runEmployeeRateMigration();