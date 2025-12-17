# 📋 คำแนะนำการตั้งค่า Supabase Migration

## ✅ สถานะปัจจุบัน

- ✅ **Login:** สำเร็จแล้ว
- ✅ **Link Project:** nobicha (`nyhwnafkybuxneqiaffq`)
- ⚠️ **Database Password:** ต้องตั้งค่า password สำหรับ CLI

## 🔐 การตั้งค่า Database Password

Supabase CLI ต้องการ database password เพื่อเชื่อมต่อกับ remote database

### วิธีที่ 1: ตั้งค่า Password ผ่าน Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq/settings/database)
2. ไปที่ **Settings** > **Database**
3. ไปที่ส่วน **Database Password**
4. ตั้ง password ใหม่ (หรือใช้ password ที่มีอยู่)
5. เก็บ password ไว้ใช้กับ CLI

### วิธีที่ 2: ใช้ Connection String

```bash
# Link ด้วย connection string แทน (ไม่ต้องใช้ password)
supabase link --db-url "postgresql://postgres:[YOUR_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

## 🚀 ขั้นตอนการใช้งาน Migration

### 1. ตรวจสอบ Migration Files ปัจจุบัน

```bash
# ดู migration files ที่มีอยู่ใน supabase/migrations/
ls -la supabase/migrations/

# ตอนนี้มี:
# - 20251201_add_username_to_users.sql
```

### 2. ย้าย Migration Files จาก `database/migrations/`

คุณมี migration files 9 ไฟล์ที่ต้องย้าย:

```bash
# สร้าง migration files ใหม่
supabase migration new 001_initial_schema
supabase migration new 002_auth_setup
supabase migration new 003_seed_test_users
supabase migration new 004_audit_trail_system
supabase migration new 005_payroll_details_bonus_deduction_fields
supabase migration new 006_storage_setup
supabase migration new 007_sales_slips_storage
supabase migration new 008_add_slip_image_url_to_sales_reports
supabase migration new 009_add_employee_rate_fields
```

**หมายเหตุ:** Migration files จะถูกสร้างด้วย timestamp อัตโนมัติ เช่น:
- `20251201234500_001_initial_schema.sql`
- `20251201234501_002_auth_setup.sql`
- ... ฯลฯ

### 3. คัดลอกเนื้อหา Migration

หลังจากสร้างไฟล์แล้ว ให้คัดลอกเนื้อหาจาก `database/migrations/` ไปยังไฟล์ใหม่ใน `supabase/migrations/`

**ตัวอย่าง:**
```bash
# คัดลอกเนื้อหาจาก database/migrations/001_initial_schema.sql
# ไปยัง supabase/migrations/20251201234500_001_initial_schema.sql
```

### 4. Push Migrations ไปยัง Remote Database

```bash
# Push migrations ทั้งหมด
supabase db push

# หรือ push พร้อมตรวจสอบก่อน (dry-run)
supabase db push --dry-run
```

## 📝 ตัวอย่างการใช้งาน

### สร้าง Migration ใหม่

```bash
# สร้าง migration file ใหม่
supabase migration new add_new_feature

# แก้ไขไฟล์ที่สร้างขึ้น
# แล้ว push
supabase db push
```

### ดู Migration Status

```bash
# ดูรายการ migrations
supabase migration list

# Pull migration state จาก remote (ถ้าต้องการ)
supabase db pull
```

## ⚠️ ข้อควรระวัง

1. **Database Password:** ต้องมี database password เพื่อใช้ CLI commands
2. **Migration Order:** Migration files จะรันตามลำดับ timestamp
3. **Backup:** ควร backup database ก่อน push migrations สำคัญ
4. **ไม่แก้ไข Migration ที่รันแล้ว:** อย่าแก้ไข migration files ที่รันไปแล้ว

## 🔄 Alternative: ใช้ Supabase Dashboard

ถ้าไม่ต้องการใช้ CLI สามารถ:

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq)
2. ไปที่ **SQL Editor**
3. คัดลอก SQL จาก migration files
4. รัน SQL โดยตรง

## 📚 เอกสารเพิ่มเติม

- `SUPABASE_MIGRATION_GUIDE.md` - คู่มือฉบับเต็ม
- `QUICK_START_MIGRATION.md` - Quick start guide


