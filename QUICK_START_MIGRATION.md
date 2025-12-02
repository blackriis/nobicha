# 🚀 Quick Start: Supabase Migration CLI

## ✅ สถานะปัจจุบัน

คุณได้ login และ link กับ Supabase project แล้ว:
- **Project:** nobicha
- **Reference ID:** `nyhwnafkybuxneqiaffq`
- **Status:** ✅ Linked

## 📝 ขั้นตอนถัดไป

### 1. อัปเดต Supabase CLI (แนะนำ)

```bash
# อัปเดต Supabase CLI ไปยังเวอร์ชันล่าสุด
npm install -g supabase@latest

# หรือใช้ homebrew (macOS)
brew upgrade supabase
```

**เวอร์ชันปัจจุบัน:** v2.39.2  
**เวอร์ชันล่าสุด:** v2.62.10

### 2. ตรวจสอบ Migration Status

```bash
# ดู migration status ของ remote database (pull จาก remote)
supabase db pull

# ดูรายการ migrations ทั้งหมด
supabase migration list

# หมายเหตุ: คำสั่ง `db remote commit` ถูก deprecated แล้ว ใช้ `db pull` แทน
```

### 3. ย้าย Migration Files จาก `database/migrations/`

คุณมี migration files อยู่ใน `database/migrations/` ที่ต้องย้ายไปยัง `supabase/migrations/`:

#### วิธีที่ 1: สร้าง Migration ใหม่ทีละไฟล์

```bash
# สร้าง migration files ใหม่พร้อม timestamp
supabase migration new 001_initial_schema
supabase migration new 002_auth_setup
supabase migration new 003_seed_test_users
supabase migration new 004_audit_trail_system
supabase migration new 005_payroll_details_bonus_deduction_fields
supabase migration new 006_storage_setup
supabase migration new 007_sales_slips_storage
supabase migration new 008_add_slip_image_url_to_sales_reports
supabase migration new 009_add_employee_rate_fields

# แล้วคัดลอกเนื้อหาจาก database/migrations/ ไปยังไฟล์ใหม่ใน supabase/migrations/
```

#### วิธีที่ 2: ใช้สคริปต์อัตโนมัติ

```bash
# รันสคริปต์ที่สร้างไว้
./scripts/migrate-to-supabase-cli.sh
```

### 4. Push Migrations ไปยัง Remote Database

```bash
# Push migrations ทั้งหมดที่ยังไม่ได้รัน
supabase db push

# ตรวจสอบก่อน push (dry-run)
supabase db push --dry-run
```

### 5. Seed ข้อมูล

```bash
# สำหรับ local development: Reset และ seed อัตโนมัติ
supabase db reset

# สำหรับ remote: ใช้ Supabase SQL Editor หรือ psql
# ดูรายละเอียดใน SEED_DATA_GUIDE.md
```

## 🔄 การ Link กับ Project อื่น

ถ้าต้องการ link กับ project อื่น:

```bash
# ดูรายการ projects
supabase projects list

# Link กับ project อื่น (ใช้ reference ID ที่ถูกต้อง - 20 ตัวอักษร)
supabase link --project-ref xobiluwjwjrwcwwhmgrn  # botlms
# หรือ
supabase link --project-ref zmutniygjjanhuwjlqhs  # payroll
```

**⚠️ หมายเหตุ:** Project Reference ID ต้องเป็น **20 ตัวอักษร** เท่านั้น ไม่มีเครื่องหมายพิเศษ

## 📋 Migration Files ที่ต้องย้าย

1. ✅ `001_initial_schema.sql` - Schema เริ่มต้น
2. ✅ `002_auth_setup.sql` - การตั้งค่า Auth
3. ✅ `003_seed_test_users.sql` - Seed data
4. ✅ `004_audit_trail_system.sql` - Audit Trail
5. ✅ `005_payroll_details_bonus_deduction_fields.sql` - Bonus/Deduction
6. ✅ `006_storage_setup.sql` - Storage Setup
7. ✅ `007_sales_slips_storage.sql` - Sales Slips Storage
8. ✅ `008_add_slip_image_url_to_sales_reports.sql` - Slip Image URL
9. ✅ `009_add_employee_rate_fields.sql` - Employee Rate Fields

## 🎯 คำสั่งที่ใช้บ่อย

```bash
# ดู migration status
supabase db remote commit

# สร้าง migration ใหม่
supabase migration new migration_name

# Push migrations
supabase db push

# Pull migrations จาก remote
supabase db pull

# ดูรายการ migrations
supabase migration list

# ดู projects
supabase projects list
```

## ⚠️ ข้อควรระวัง

1. **Backup Database:** ควร backup database ก่อน push migrations สำคัญ
2. **ตรวจสอบ Migration Order:** Migration files จะรันตามลำดับ timestamp
3. **ไม่แก้ไข Migration ที่รันแล้ว:** อย่าแก้ไข migration files ที่รันไปแล้วใน production
4. **ใช้ Transaction:** ใช้ `BEGIN` และ `COMMIT` ใน migration files

## 📚 เอกสารเพิ่มเติม

ดูคู่มือฉบับเต็มได้ที่: `SUPABASE_MIGRATION_GUIDE.md`

