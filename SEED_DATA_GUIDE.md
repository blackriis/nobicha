# 🌱 คู่มือการ Seed ข้อมูลด้วย Supabase CLI

## 📋 สารบัญ
1. [การ Seed ข้อมูลอัตโนมัติ](#การ-seed-ข้อมูลอัตโนมัติ)
2. [การ Seed ข้อมูลด้วยตนเอง](#การ-seed-ข้อมูลด้วยตนเอง)
3. [การสร้าง Test Users](#การสร้าง-test-users)
4. [การตรวจสอบ Seed Data](#การตรวจสอบ-seed-data)

---

## การ Seed ข้อมูลอัตโนมัติ

### 1. ใช้ `supabase db reset` (Local Development)

คำสั่งนี้จะ:
- Reset local database
- รัน migrations ทั้งหมด
- **รัน seed.sql อัตโนมัติ**

```bash
# Reset database และ seed ข้อมูล
supabase db reset

# Reset พร้อม seed (ถ้า seed ถูก disable)
supabase db reset --seed
```

**หมายเหตุ:** ต้องมี Docker running สำหรับ local development

### 2. Seed File Location

Seed file อยู่ที่: `supabase/seed.sql`

ไฟล์นี้จะถูกรันอัตโนมัติเมื่อ:
- รัน `supabase db reset` (local)
- Seed enabled ใน `config.toml` (`[db.seed] enabled = true`)

---

## การ Seed ข้อมูลด้วยตนเอง

### 1. Seed ไปยัง Remote Database

```bash
# ใช้ psql หรือ Supabase SQL Editor
# หรือใช้ supabase db execute

# วิธีที่ 1: ใช้ Supabase Dashboard
# 1. ไปที่ https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq
# 2. ไปที่ SQL Editor
# 3. คัดลอกเนื้อหาจาก supabase/seed.sql
# 4. รัน SQL

# วิธีที่ 2: ใช้ psql
psql "postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" -f supabase/seed.sql
```

### 2. Seed เฉพาะบางส่วน

```bash
# Seed เฉพาะ branches
psql [CONNECTION_STRING] -c "INSERT INTO branches ..."

# หรือใช้ Supabase SQL Editor
```

---

## การสร้าง Test Users

### ⚠️ สำคัญ: Users ต้องสร้างผ่าน Supabase Auth

Seed file **ไม่สามารถสร้าง auth users ได้โดยตรง** ต้องสร้างผ่าน:

1. **Supabase Dashboard**
2. **Supabase Auth API**
3. **Script ที่ใช้ Supabase Admin API**

### Test Users ที่ต้องสร้าง

#### Admin Accounts

**Super Admin:**
- Email: `admin@test.com`
- Password: `SecureAdmin2024!@#`
- Role: `admin`

**Branch Manager:**
- Email: `manager.silom@test.com`
- Password: `Manager123!`
- Role: `admin`
- Branch: สาขาสีลม

#### Employee Accounts

**Employee 1:**
- Email: `employee.som@test.com`
- Password: `Employee123!`
- Name: สมใจ ใจดี
- Branch: สาขาสีลม
- Employee ID: `EMP001`

**Employee 2:**
- Email: `employee.malee@test.com`
- Password: `Employee123!`
- Name: มาลี ดีใจ
- Branch: สาขาสุขุมวิท
- Employee ID: `EMP002`

**Employee 3:**
- Email: `employee.chai@test.com`
- Password: `Employee123!`
- Name: ชาย กล้าหาญ
- Branch: สาขาจตุจักร
- Employee ID: `EMP003`

**Employee 4:**
- Email: `employee.nina@test.com`
- Password: `Employee123!`
- Name: นิน่า สวยงาม
- Branch: null (หลายสาขา)
- Employee ID: `EMP004`

### วิธีสร้าง Users

#### วิธีที่ 1: ใช้ Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq/auth/users)
2. คลิก **Add User** > **Create new user**
3. ใส่ email และ password
4. หลังจากสร้าง auth user แล้ว profile จะถูกสร้างอัตโนมัติผ่าน trigger
5. หรือแก้ไข profile ใน `users` table เพื่อเพิ่มข้อมูลเพิ่มเติม

#### วิธีที่ 2: ใช้ Script

```bash
# ใช้ script ที่มีอยู่แล้ว
node create-test-users.js

# หรือ
node update-user-passwords.js
```

---

## การตรวจสอบ Seed Data

### 1. ตรวจสอบผ่าน SQL

```sql
-- ตรวจสอบจำนวนข้อมูลที่ seed แล้ว
SELECT 'Branches:' as table_name, count(*) as count FROM branches
UNION ALL
SELECT 'Work Shifts:', count(*) FROM work_shifts
UNION ALL
SELECT 'Raw Materials:', count(*) FROM raw_materials
UNION ALL
SELECT 'Users:', count(*) FROM users;

-- ดูรายละเอียด branches
SELECT id, name, address FROM branches;

-- ดูรายละเอียด raw materials
SELECT name, unit, cost_per_unit, supplier FROM raw_materials;
```

### 2. ตรวจสอบผ่าน Supabase CLI

```bash
# ดู migration และ seed status
supabase db pull

# ตรวจสอบ connection
supabase db remote commit
```

### 3. ตรวจสอบผ่าน Dashboard

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq)
2. ไปที่ **Table Editor**
3. ตรวจสอบ tables:
   - `branches`
   - `work_shifts`
   - `raw_materials`
   - `users`

---

## 📝 Seed Data ที่รวมอยู่ใน seed.sql

### 1. Branches (3 สาขา)
- สาขาสีลม
- สาขาสุขุมวิท
- สาขาจตุจักร

### 2. Work Shifts (7 กะ)
- กะเช้า, กะบ่าย, กะวันหยุด (สาขาสีลม)
- กะเช้า, กะบ่าย (สาขาสุขุมวิท)
- กะเช้า, กะดึก (สาขาจตุจักร)

### 3. Raw Materials (6 รายการ)
- น้ำ, น้ำตาล, กาแฟ, นม, ถ้วยกระดาษ, ฝาปิด

### 4. Users
- ต้องสร้างผ่าน Supabase Auth (ดูด้านบน)

---

## 🔄 การ Reset และ Seed ใหม่

### Local Development

```bash
# Reset database และ seed ใหม่ทั้งหมด
supabase db reset

# Reset โดยไม่ seed
supabase db reset --no-seed
```

### Remote Database

```bash
# ⚠️ ระวัง: การ reset remote database จะลบข้อมูลทั้งหมด!

# วิธีที่ปลอดภัย: ลบข้อมูลเฉพาะที่ต้องการ
psql [CONNECTION_STRING] -c "DELETE FROM branches; DELETE FROM work_shifts; ..."

# แล้ว seed ใหม่
psql [CONNECTION_STRING] -f supabase/seed.sql
```

---

## ⚠️ ข้อควรระวัง

1. **ON CONFLICT:** Seed file ใช้ `ON CONFLICT DO NOTHING` เพื่อป้องกันการ insert ซ้ำ
2. **Users:** ไม่สามารถ seed users ผ่าน SQL โดยตรง ต้องใช้ Supabase Auth
3. **Production:** อย่า seed test data ไปยัง production database
4. **Backup:** Backup database ก่อน seed ข้อมูลสำคัญ

---

## 🆘 Troubleshooting

### ปัญหา: Seed ไม่ทำงาน

```bash
# ตรวจสอบว่า seed enabled ใน config.toml
cat supabase/config.toml | grep -A 5 "\[db.seed\]"

# ตรวจสอบว่า seed.sql มีอยู่
ls -la supabase/seed.sql
```

### ปัญหา: Duplicate Key Error

```bash
# Seed file ใช้ ON CONFLICT DO NOTHING แล้ว
# ถ้ายังมีปัญหา ให้ลบข้อมูลเก่าก่อน
DELETE FROM branches;
DELETE FROM work_shifts;
DELETE FROM raw_materials;
```

### ปัญหา: Users ไม่ถูกสร้าง

```bash
# Users ต้องสร้างผ่าน Supabase Auth
# ใช้ Dashboard หรือ script
node create-test-users.js
```

---

## 📚 เอกสารเพิ่มเติม

- `TEST_CREDENTIALS.md` - รายละเอียด test users
- `SUPABASE_MIGRATION_GUIDE.md` - คู่มือ migration
- `QUICK_START_MIGRATION.md` - Quick start guide

