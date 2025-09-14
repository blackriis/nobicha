#!/usr/bin/env node

/**
 * Environment Variables Checker
 * ตรวจสอบ environment variables ที่จำเป็นสำหรับ Supabase
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 ตรวจสอบ Environment Variables...\n')

// ตรวจสอบไฟล์ .env.local
const envPath = path.join(__dirname, 'apps/web/.env.local')
const envExamplePath = path.join(__dirname, 'apps/web/.env.local.example')

console.log('📁 ตรวจสอบไฟล์ Environment:')
console.log(`   .env.local: ${fs.existsSync(envPath) ? '✅ พบ' : '❌ ไม่พบ'}`)
console.log(`   .env.local.example: ${fs.existsSync(envExamplePath) ? '✅ พบ' : '❌ ไม่พบ'}`)

if (fs.existsSync(envPath)) {
  console.log('\n📋 เนื้อหา .env.local:')
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  
  lines.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      const displayValue = key.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value
      console.log(`   ${key}: ${displayValue}`)
    }
  })
} else {
  console.log('\n❌ ไม่พบไฟล์ .env.local')
  console.log('📝 กรุณาสร้างไฟล์ .env.local ตามขั้นตอนต่อไปนี้:')
  console.log('')
  console.log('1. คัดลอกไฟล์ตัวอย่าง:')
  console.log('   cp apps/web/.env.local.example apps/web/.env.local')
  console.log('')
  console.log('2. แก้ไขค่าข้างในด้วย Supabase credentials จริง')
  console.log('')
  console.log('3. รับค่า credentials จาก:')
  console.log('   https://supabase.com/dashboard/project/[your-project]/settings/api')
}

console.log('\n🔧 ขั้นตอนการแก้ไข:')
console.log('1. ตั้งค่า environment variables ใน .env.local')
console.log('2. รัน: node test-supabase-connection.js')
console.log('3. รัน: npm run dev')
console.log('')
console.log('📖 ดูรายละเอียดเพิ่มเติมได้ที่:')
console.log('   - SUPABASE_SETUP_GUIDE.md')
console.log('   - PROFILE_API_ERROR_FIX.md')
