# คู่มือการเชื่อมต่อ Supabase - Employee Management System

## ขั้นตอนการตั้งค่า Supabase

### 1. สร้างไฟล์ Environment Variables

สร้างไฟล์ `apps/web/.env.local` ด้วยเนื้อหาดังนี้:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

### 2. วิธีรับค่า Supabase Credentials

1. ไปที่ [supabase.com](https://supabase.com) และเข้าสู่ระบบ
2. เลือกโปรเจคของคุณ (หรือสร้างใหม่)
3. ไปที่ **Settings** > **API**
4. คัดลอกค่าต่อไปนี้:
   - **Project URL** (เริ่มต้นด้วย `https://`)
   - **anon/public key** (เริ่มต้นด้วย `eyJhbGciOi...`)
   - **service_role key** (เริ่มต้นด้วย `eyJhbGciOi...`)

### 3. ตั้งค่าฐานข้อมูล

รัน migrations ที่มีอยู่แล้ว:

```bash
# ติดตั้ง Supabase CLI (ถ้ายังไม่มี)
npm install -g supabase

# Login เข้า Supabase
supabase login

# Link กับโปรเจค
supabase link --project-ref your-project-ref

# รัน migrations
supabase db push
```

### 4. ตรวจสอบการเชื่อมต่อ

```bash
cd apps/web
npm run dev
```

### 5. ทดสอบการทำงาน

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
2. ทดสอบเข้าสู่ระบบด้วย test users:
   - **Admin**: admin@example.com / password123
   - **Employee**: employee@example.com / password123

## โครงสร้างฐานข้อมูล

### ตารางหลัก
- `users` - ข้อมูลผู้ใช้และบทบาท
- `branches` - ข้อมูลสาขาและตำแหน่ง
- `work_shifts` - ข้อมูลกะการทำงาน
- `time_entries` - ข้อมูลการเช็คอิน/เอาท์
- `payroll_cycles` - ข้อมูลรอบการจ่ายเงินเดือน
- `payroll_details` - รายละเอียดเงินเดือน
- `raw_materials` - ข้อมูลวัตถุดิบ
- `material_usage` - การใช้วัตถุดิบ
- `sales_reports` - รายงานการขาย

### Test Users
ดูรายละเอียด test users ได้ที่ `docs/testing/test-users-guide.md`

## การแก้ไขปัญหา

### ปัญหา "Failed to fetch"
- ตรวจสอบว่า environment variables ถูกต้อง
- ตรวจสอบว่า Supabase project เปิดใช้งานอยู่
- ตรวจสอบ network connection

### ปัญหา Authentication
- ตรวจสอบ RLS policies ใน Supabase
- ตรวจสอบ user roles และ permissions
- ดู logs ใน Supabase dashboard

## Security Notes

- อย่า commit `.env.local` เข้า version control
- ใช้ service role key เฉพาะใน API routes (server-side)
- anon key ปลอดภัยสำหรับ client-side usage
