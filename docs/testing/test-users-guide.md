# คู่มือ Test User Accounts
## สำหรับการทดสอบระบบ Employee Management System

### 🔑 Test Accounts ที่สร้างไว้

#### 👑 Admin Accounts

**1. Super Admin**
- **Email:** `admin@test.com`
- **Password:** `SecureAdmin2024!@#`
- **ชื่อ:** ผู้ดูแลระบบ (Admin)
- **Role:** `admin`
- **Branch:** ไม่มี (สามารถจัดการทุกสาขา)
- **สิทธิ์:** จัดการระบบทั้งหมด

**2. Branch Manager (สาขาสีลม)**
- **Email:** `manager.silom@test.com`
- **Password:** `Manager123!`
- **ชื่อ:** วิชัย จันทร์แสง
- **Role:** `admin`
- **Branch:** สาขาสีลม
- **Employee ID:** `MGR001`
- **เบอร์โทร:** 021234568
- **สิทธิ์:** จัดการสาขาสีลม

#### 👤 Employee Accounts

**1. พนักงานสาขาสีลม**
- **Email:** `employee.som@test.com`
- **Password:** `Employee123!`
- **ชื่อ:** สมใจ ใจดี
- **Role:** `employee`
- **Branch:** สาขาสีลม
- **Employee ID:** `EMP001`
- **เบอร์โทร:** 0812345671

**2. พนักงานสาขาสุขุมวิท**
- **Email:** `employee.malee@test.com`
- **Password:** `Employee123!`
- **ชื่อ:** มาลี ดีใจ
- **Role:** `employee`
- **Branch:** สาขาสุขุมวิท
- **Employee ID:** `EMP002`
- **เบอร์โทร:** 0812345672

**3. พนักงานสาขาจตุจักร**
- **Email:** `employee.chai@test.com`
- **Password:** `Employee123!`
- **ชื่อ:** ชาย กล้าหาญ
- **Role:** `employee`
- **Branch:** สาขาจตุจักร
- **Employee ID:** `EMP003`
- **เบอร์โทร:** 0812345673

**4. พนักงานหลายสาขา**
- **Email:** `employee.nina@test.com`
- **Password:** `Employee123!`
- **ชื่อ:** นิน่า สวยงาม
- **Role:** `employee`
- **Branch:** ไม่กำหนด (ทำงานได้หลายสาขา)
- **Employee ID:** `EMP004`
- **เบอร์โทร:** 0812345674

### 🏢 Test Branches

**1. สาขาสีลม**
- **ID:** `00000000-0000-0000-0000-000000000001`
- **ที่อยู่:** 123 ถนนสีลม บางรัก กรุงเทพมหานคร 10500
- **GPS:** 13.7563, 100.5018

**2. สาขาสุขุมวิท**
- **ID:** `00000000-0000-0000-0000-000000000002`
- **ที่อยู่:** 456 ถนนสุขุมวิท วัฒนา กรุงเทพมหานคร 10110
- **GPS:** 13.7398, 100.5612

**3. สาขาจตุจักร**
- **ID:** `00000000-0000-0000-0000-000000000003`
- **ที่อยู่:** 789 ถนนพหลโยธิน จตุจักร กรุงเทพมหานคร 10900
- **GPS:** 13.8077, 100.5538

### 🕐 Work Shifts

#### สาขาสีลม
- **กะเช้า:** 08:00-16:00 (จันทร์-ศุกร์)
- **กะบ่าย:** 14:00-22:00 (จันทร์-ศุกร์)
- **กะวันหยุด:** 09:00-17:00 (เสาร์-อาทิตย์)

#### สาขาสุขุมวิท
- **กะเช้า:** 08:30-16:30 (จันทร์-ศุกร์)
- **กะบ่าย:** 13:30-21:30 (จันทร์-ศุกร์)

#### สาขาจตุจักร
- **กะเช้า:** 09:00-17:00 (จันทร์-ศุกร์)
- **กะดึก:** 21:00-05:00 (ศุกร์-อาทิตย์)

### 🔧 การติดตั้งและใช้งาน

#### วิธีที่ 1: ใช้สคริปท์ (แนะนำ)

```bash
# ตั้งค่า environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# รันสคริปท์สร้าง test users
cd /Users/blackriis/Dev/nobi_new
node scripts/create-test-users.js
```

#### วิธีที่ 2: Manual Creation ผ่าน Supabase Dashboard

1. ไปที่ Supabase Dashboard > Authentication > Users
2. คลิก "Add user" 
3. กรอกข้อมูลตาม test accounts ข้างต้น
4. ตั้งค่า User Metadata:
   ```json
   {
     "full_name": "ชื่อเต็ม",
     "role": "admin หรือ employee"
   }
   ```

#### วิธีที่ 3: Import SQL Data

```sql
-- รัน SQL จากไฟล์ database/migrations/003_seed_test_users.sql
-- ในส่วนของ branches, work_shifts, และ raw_materials
```

### 🧪 การทดสอบ

#### Test Scenarios

**1. Admin Login Test**
- ล็อกอินด้วย `admin@test.com`
- ควรเข้าไปที่หน้า `/admin`
- สามารถเห็นการจัดการสาขา, พนักงาน, ข้อมูลทั้งหมด

**2. Employee Login Test**
- ล็อกอินด้วย `employee.som@test.com`
- ควรเข้าไปที่หน้า `/dashboard`
- เห็นเฉพาะข้อมูลของตัวเองและสาขาที่สังกัด

**3. Role-based Access Test**
- พยายามเข้าถึง `/admin` ด้วยบัญชี employee
- ควรถูกปฏิเสธการเข้าถึง

**4. Branch-specific Data Test**
- ล็อกอินด้วย employee ต่างสาขา
- ควรเห็นข้อมูลเฉพาะสาขาของตัวเอง

#### GPS Testing Location

สำหรับการทดสอบ GPS check-in สามารถใช้พิกัดนี้:
- **สาขาสีลม:** 13.7563, 100.5018
- **สาขาสุขุมวิท:** 13.7398, 100.5612
- **สาขาจตุจักร:** 13.8077, 100.5538

### 🔒 Security Notes

- รหัสผ่าน test accounts ใช้สำหรับ development เท่านั้น
- ใน production ห้ามใช้รหัสผ่านเหล่านี้
- ลบ test accounts ก่อนไป production
- เปลี่ยน Service Role Key ใน production

### 🆘 Troubleshooting

**ปัญหา: ไม่สามารถสร้าง test users ได้**
- ตรวจสอบ environment variables
- ตรวจสอบ Service Role Key permissions
- ตรวจสอบ database migrations ทำงานถูกต้อง

**ปัญหา: User profile ไม่ถูกสร้างอัตโนมัติ**
- ตรวจสอบ database trigger `handle_new_user()`
- รัน manual profile insertion จากไฟล์ SQL

**ปัญหา: Role-based access ไม่ทำงาน**
- ตรวจสอบ RLS policies ใน database
- ตรวจสอบ JWT token ที่ส่งมาจาก client

### 📞 Contact

หากมีปัญหาในการใช้งาน test accounts สามารถตรวจสอบ:
1. Database logs ใน Supabase Dashboard
2. Authentication logs
3. API response errors ใน browser console