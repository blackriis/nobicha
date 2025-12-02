# 🌱 คู่มือการ Seed ข้อมูลทั้งหมด (รวม Users)

## 🎯 วิธีที่ง่ายที่สุด: ใช้ Script

### ขั้นตอน

1. **ตรวจสอบ Environment Variables**
   ```bash
   # ตรวจสอบว่าไฟล์ apps/web/.env.local มีค่าต่อไปนี้:
   NEXT_PUBLIC_SUPABASE_URL=https://nyhwnafkybuxneqiaffq.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **รัน Script**
   ```bash
   node scripts/seed-database.js
   ```

   Script นี้จะ seed:
   - ✅ Branches (3 สาขา)
   - ✅ Work Shifts (7 กะ)
   - ✅ Raw Materials (6 รายการ)
   - ✅ **Test Users (6 users - 2 admin, 4 employees)**

3. **ตรวจสอบผลลัพธ์**
   - Script จะแสดงสถานะการ seed แต่ละส่วน
   - จะแสดงจำนวนข้อมูลที่ seed แล้ว
   - จะแสดงรายการ users ที่สร้าง

---

## 📋 ข้อมูลที่จะ Seed

### 1. Branches (3 สาขา)
- สาขาสีลม
- สาขาสุขุมวิท
- สาขาจตุจักร

### 2. Work Shifts (7 กะ)
- สาขาสีลม: กะเช้า, กะบ่าย, กะวันหยุด
- สาขาสุขุมวิท: กะเช้า, กะบ่าย
- สาขาจตุจักร: กะเช้า, กะดึก

### 3. Raw Materials (6 รายการ)
- น้ำ, น้ำตาล, กาแฟ, นม, ถ้วยกระดาษ, ฝาปิด

### 4. Test Users (6 users)

#### Admin Accounts (2 users)
- **Super Admin**
  - Email: `admin@test.com`
  - Password: `SecureAdmin2024!@#`
  - Role: `admin`
  - Branch: ไม่มี (สิทธิ์เต็ม)

- **Branch Manager**
  - Email: `manager.silom@test.com`
  - Password: `Manager123!`
  - Role: `admin`
  - Branch: สาขาสีลม
  - Employee ID: `MGR001`

#### Employee Accounts (4 users)
- **Employee 1**
  - Email: `employee.som@test.com`
  - Password: `Employee123!`
  - Name: สมใจ ใจดี
  - Branch: สาขาสีลม
  - Employee ID: `EMP001`

- **Employee 2**
  - Email: `employee.malee@test.com`
  - Password: `Employee123!`
  - Name: มาลี ดีใจ
  - Branch: สาขาสุขุมวิท
  - Employee ID: `EMP002`

- **Employee 3**
  - Email: `employee.chai@test.com`
  - Password: `Employee123!`
  - Name: ชาย กล้าหาญ
  - Branch: สาขาจตุจักร
  - Employee ID: `EMP003`

- **Employee 4**
  - Email: `employee.nina@test.com`
  - Password: `Employee123!`
  - Name: นิน่า สวยงาม
  - Branch: ไม่มี (สามารถทำงานหลายสาขา)
  - Employee ID: `EMP004`

---

## 🔄 การ Seed แยกส่วน

### Seed เฉพาะข้อมูล (ไม่รวม Users)

```bash
# ใช้ Supabase SQL Editor
# คัดลอกเนื้อหาจาก supabase/seed.sql
# Paste และ Run ใน SQL Editor
```

### Seed เฉพาะ Users

```bash
# ใช้ script สำหรับ users เท่านั้น
node scripts/create-test-users.js
```

---

## 🔍 ตรวจสอบผลลัพธ์

### ผ่าน Script

Script จะแสดงสรุปผลลัพธ์:
```
📊 Branches: 3
📊 Work Shifts: 7
📊 Raw Materials: 6
📊 Users: 6
```

### ผ่าน Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard/project/nyhwnafkybuxneqiaffq)
2. ตรวจสอบ:
   - **Table Editor** → `branches`, `work_shifts`, `raw_materials`
   - **Authentication** → **Users** → ควรเห็น 6 users

### ผ่าน SQL

```sql
-- ตรวจสอบจำนวนข้อมูล
SELECT 'Branches:' as table_name, count(*) as count FROM branches
UNION ALL
SELECT 'Work Shifts:', count(*) FROM work_shifts
UNION ALL
SELECT 'Raw Materials:', count(*) FROM raw_materials
UNION ALL
SELECT 'Users:', count(*) FROM users;

-- ดูรายละเอียด users
SELECT email, full_name, role, branch_id, employee_id 
FROM users 
ORDER BY role, email;
```

---

## 🆘 Troubleshooting

### ปัญหา: Missing Environment Variables

**Error:** `Missing required environment variables`

**วิธีแก้:**
1. ตรวจสอบว่าไฟล์ `apps/web/.env.local` มีอยู่
2. ตรวจสอบว่ามี `NEXT_PUBLIC_SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY`
3. รับค่า `SUPABASE_SERVICE_ROLE_KEY` จาก:
   - Supabase Dashboard → Settings → API → `service_role` key

### ปัญหา: User Already Exists

**Error:** `User already registered`

**วิธีแก้:**
- Script จะอัปเดตข้อมูล user ที่มีอยู่แล้วอัตโนมัติ
- ไม่ต้องกังวลเรื่อง duplicate

### ปัญหา: Table Not Found

**Error:** `relation "branches" does not exist`

**วิธีแก้:**
```bash
# Push migrations ก่อน
supabase db push
```

### ปัญหา: Permission Denied

**Error:** `permission denied for table users`

**วิธีแก้:**
- ตรวจสอบว่าใช้ `SUPABASE_SERVICE_ROLE_KEY` (ไม่ใช่ anon key)
- Service role key มีสิทธิ์ bypass RLS

---

## 📚 เอกสารเพิ่มเติม

- `SEED_INSTRUCTIONS.md` - คำแนะนำการ seed แบบละเอียด
- `SEED_DATA_GUIDE.md` - คู่มือการ seed ข้อมูลฉบับเต็ม
- `TEST_CREDENTIALS.md` - รายละเอียด test users
- `SUPABASE_MIGRATION_GUIDE.md` - คู่มือ migration

---

## ✅ Checklist หลัง Seed

- [ ] Branches: 3 สาขา
- [ ] Work Shifts: 7 กะ
- [ ] Raw Materials: 6 รายการ
- [ ] Users: 6 users (2 admin, 4 employees)
- [ ] ทดสอบ login ด้วย test users
- [ ] ตรวจสอบว่า users สามารถเข้าถึงข้อมูลได้ถูกต้อง

