# คู่มือการใช้ Supabase Migration ผ่าน CLI

## 📋 สารบัญ
1. [การติดตั้งและตั้งค่า](#การติดตั้งและตั้งค่า)
2. [การเชื่อมต่อกับ Remote Project](#การเชื่อมต่อกับ-remote-project)
3. [การจัดการ Migration Files](#การจัดการ-migration-files)
4. [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
5. [Workflow แนะนำ](#workflow-แนะนำ)

---

## การติดตั้งและตั้งค่า

### 1. ตรวจสอบการติดตั้ง Supabase CLI

```bash
# ตรวจสอบว่ามี Supabase CLI ติดตั้งอยู่หรือไม่
supabase --version

# ถ้ายังไม่มี ติดตั้งด้วย npm (global)
npm install -g supabase
```

### 2. Login เข้า Supabase

```bash
# Login เข้า Supabase account
supabase login

# ระบบจะเปิดเบราว์เซอร์ให้คุณ login
```

### 3. Link กับ Remote Project

```bash
# ดูรายการ projects ที่มี
supabase projects list

# Link กับ Supabase project ของคุณ
# ใช้ project reference ID (20 ตัวอักษร) จาก Supabase Dashboard
supabase link --project-ref your-project-ref-id

# ตัวอย่าง: ถ้า project ref คือ nyhwnafkybuxneqiaffq
supabase link --project-ref nyhwnafkybuxneqiaffq

# หรือใช้ connection string
supabase link --db-url "postgresql://postgres:[password]@[host]:5432/postgres"
```

**วิธีหา Project Reference ID:**
1. ใช้คำสั่ง `supabase projects list` เพื่อดูรายการ projects
2. หรือไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
3. เลือกโปรเจคของคุณ
4. ไปที่ **Settings** > **General**
5. คัดลอก **Reference ID** (20 ตัวอักษร เช่น `nyhwnafkybuxneqiaffq`)

**หมายเหตุ:** Project Reference ID ต้องเป็น 20 ตัวอักษรเท่านั้น ไม่มีเครื่องหมายพิเศษ

---

## การจัดการ Migration Files

### โครงสร้าง Migration Files

Supabase CLI ใช้รูปแบบการตั้งชื่อ migration files ดังนี้:

```
supabase/migrations/
├── YYYYMMDDHHMMSS_migration_name.sql
├── 20251201120000_initial_schema.sql
├── 20251201130000_add_users_table.sql
└── ...
```

**รูปแบบชื่อไฟล์:** `YYYYMMDDHHMMSS_description.sql`

### การย้าย Migration Files จาก `database/migrations/`

คุณมี migration files อยู่ใน `database/migrations/` ที่ต้องย้ายไปยัง `supabase/migrations/`:

```bash
# 1. ดู migration files ที่มีอยู่
ls -la database/migrations/

# 2. สร้าง migration files ใหม่ใน supabase/migrations/ ด้วย timestamp ที่ถูกต้อง
# ตัวอย่าง: สร้าง migration ใหม่จากไฟล์เดิม
```

**คำแนะนำ:** ใช้ timestamp ที่เรียงลำดับตามวันที่สร้างไฟล์เดิม

---

## คำสั่งที่ใช้บ่อย

### 1. สร้าง Migration ใหม่

```bash
# สร้าง migration file ใหม่พร้อม timestamp อัตโนมัติ
supabase migration new migration_name

# ตัวอย่าง
supabase migration new add_payroll_details_bonus_fields
# จะสร้างไฟล์: supabase/migrations/20251201234500_add_payroll_details_bonus_fields.sql
```

### 2. ดู Migration Status

```bash
# ดู migration ที่รันแล้วและยังไม่ได้รัน
supabase migration list

# ดู migration status รายละเอียด (pull จาก remote)
supabase db pull

# หมายเหตุ: คำสั่ง `db remote commit` ถูก deprecated แล้ว ใช้ `db pull` แทน
```

### 3. Push Migrations ไปยัง Remote Database

```bash
# Push migrations ทั้งหมดที่ยังไม่ได้รันไปยัง remote database
supabase db push

# Push พร้อม reset (ระวัง: จะลบข้อมูลทั้งหมด!)
supabase db push --include-all
```

### 4. Pull Migrations จาก Remote Database

```bash
# Pull migration state จาก remote database
supabase db pull

# Pull และสร้าง migration file จาก schema changes
supabase db pull --schema public
```

### 5. Reset Local Database

```bash
# Reset local database และรัน migrations ใหม่ทั้งหมด
# จะ seed ข้อมูลอัตโนมัติจาก supabase/seed.sql
supabase db reset

# Reset โดยไม่ seed
supabase db reset --no-seed

# Reset พร้อม seed (ถ้า seed ถูก disable)
supabase db reset --seed
```

**หมายเหตุ:** `supabase db reset` จะรัน `supabase/seed.sql` อัตโนมัติถ้า seed enabled ใน config.toml

### 6. Diff: สร้าง Migration จาก Schema Changes

```bash
# สร้าง migration จากความแตกต่างระหว่าง local และ remote
supabase db diff -f migration_name

# ตัวอย่าง
supabase db diff -f add_new_column_to_users
```

### 7. ตรวจสอบ Migration Files

```bash
# ตรวจสอบ syntax ของ migration files
supabase migration list --local

# ตรวจสอบ migration ที่จะรัน
supabase db push --dry-run
```

---

## Workflow แนะนำ

### Workflow 1: สร้าง Migration ใหม่

```bash
# 1. สร้าง migration file ใหม่
supabase migration new add_new_feature

# 2. แก้ไขไฟล์ที่สร้างขึ้นใน supabase/migrations/
# 3. ทดสอบ migration ใน local (ถ้ามี Docker)
supabase db reset

# 4. Push ไปยัง remote
supabase db push
```

### Workflow 2: ย้าย Migration Files เดิม

```bash
# 1. ดู migration files เดิม
ls -la database/migrations/

# 2. สร้าง migration ใหม่สำหรับแต่ละไฟล์
supabase migration new initial_schema
supabase migration new auth_setup
# ... ฯลฯ

# 3. คัดลอกเนื้อหาจาก database/migrations/ ไปยัง supabase/migrations/
# 4. ตรวจสอบและ push
supabase db push
```

### Workflow 3: Sync กับ Remote Database

```bash
# 1. Pull migration state จาก remote
supabase db pull

# 2. ตรวจสอบความแตกต่าง
supabase db diff

# 3. สร้าง migration สำหรับ changes (ถ้ามี)
supabase db diff -f sync_changes

# 4. Push migrations ใหม่
supabase db push
```

---

## การจัดการ Migration Files ที่มีอยู่

### Migration Files ใน `database/migrations/`

คุณมี migration files ต่อไปนี้ที่ต้องย้าย:

1. `001_initial_schema.sql` - Schema เริ่มต้น
2. `002_auth_setup.sql` - การตั้งค่า Auth
3. `003_seed_test_users.sql` - Seed data สำหรับ test users
4. `004_audit_trail_system.sql` - ระบบ Audit Trail
5. `005_payroll_details_bonus_deduction_fields.sql` - เพิ่ม bonus/deduction fields
6. `006_storage_setup.sql` - การตั้งค่า Storage
7. `007_sales_slips_storage.sql` - Storage สำหรับ sales slips
8. `008_add_slip_image_url_to_sales_reports.sql` - เพิ่ม slip image URL
9. `009_add_employee_rate_fields.sql` - เพิ่ม employee rate fields

### ขั้นตอนการย้าย

```bash
# 1. สร้าง migration files ใหม่พร้อม timestamp ที่เรียงลำดับ
supabase migration new 001_initial_schema
supabase migration new 002_auth_setup
supabase migration new 003_seed_test_users
supabase migration new 004_audit_trail_system
supabase migration new 005_payroll_details_bonus_deduction_fields
supabase migration new 006_storage_setup
supabase migration new 007_sales_slips_storage
supabase migration new 008_add_slip_image_url_to_sales_reports
supabase migration new 009_add_employee_rate_fields

# 2. คัดลอกเนื้อหาจาก database/migrations/ ไปยัง supabase/migrations/
# 3. ตรวจสอบ syntax
supabase migration list

# 4. Push ไปยัง remote database
supabase db push
```

---

## คำสั่งเพิ่มเติม

### ดู Help

```bash
# ดู help สำหรับคำสั่ง migration
supabase migration --help

# ดู help สำหรับ db commands
supabase db --help
```

### ตรวจสอบ Connection

```bash
# ตรวจสอบว่า link กับ project แล้วหรือยัง
supabase projects list

# ดู project ที่ link อยู่
cat supabase/.temp/project-ref
```

### Rollback Migration (Manual)

```bash
# Supabase ไม่มีคำสั่ง rollback อัตโนมัติ
# ต้องสร้าง migration ใหม่เพื่อ revert changes
supabase migration new revert_previous_change
# แล้วเขียน SQL เพื่อ revert changes
```

---

## ⚠️ ข้อควรระวัง

1. **Backup Database ก่อน Push:** ควร backup database ก่อน push migrations สำคัญ
2. **ทดสอบใน Local ก่อน:** ถ้าเป็นไปได้ ทดสอบ migration ใน local environment ก่อน
3. **ตรวจสอบ Migration Order:** Migration files จะรันตามลำดับ timestamp
4. **ไม่แก้ไข Migration ที่รันแล้ว:** อย่าแก้ไข migration files ที่รันไปแล้วใน production
5. **ใช้ Transaction:** ใช้ `BEGIN` และ `COMMIT` ใน migration files เพื่อความปลอดภัย

---

## 📚 เอกสารอ้างอิง

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

---

## 🆘 Troubleshooting

### ปัญหา: Cannot connect to Docker

```bash
# ตรวจสอบว่า Docker กำลังรันอยู่
docker ps

# ถ้าไม่รัน ให้ start Docker Desktop
# หรือใช้ remote database แทน local
supabase link --project-ref your-project-ref
```

### ปัญหา: Migration conflicts

```bash
# ตรวจสอบ migration state
supabase db remote commit

# Pull latest state
supabase db pull

# Resolve conflicts manually
```

### ปัญหา: Migration failed

```bash
# ดู error logs
supabase db push --debug

# ตรวจสอบ migration syntax
supabase migration list --local
```

