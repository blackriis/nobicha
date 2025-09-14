# Test User Credentials - Employee Management System

## ข้อมูล Login ที่ใช้ได้

### 🔑 Admin Accounts

**Super Admin:**
- Email: `admin@test.com`
- Password: `SecureAdmin2024!@#`
- Role: Admin (สิทธิ์เต็ม)

**Branch Manager:**
- Email: `manager.silom@test.com`  
- Password: `Manager123!`
- Role: Admin (จัดการสาขาสีลม)

### 👤 Employee Accounts

**Employee 1:**
- Email: `employee.som@test.com`
- Password: `Employee123!`
- Name: สมใจ ใจดี
- Branch: สาขาสีลม

**Employee 2:**
- Email: `employee.malee@test.com`
- Password: `Employee123!`
- Name: มาลี ดีใจ
- Branch: สาขาสุขุมวิท

**Employee 3:**
- Email: `employee.chai@test.com`
- Password: `Employee123!`
- Name: ชาย กล้าหาญ
- Branch: สาขาจตุจักร

**Flexible Employee:**
- Email: `employee.nina@test.com`
- Password: `Employee123!`
- Name: นิน่า สวยงาม
- Branch: สามารถทำงานหลายสาขา

## 🌐 Login URLs

- **Admin Login:** `/login/admin`
- **Employee Login:** `/login/employee`

## 🔧 การแก้ไขปัญหาที่พบ

**ปัญหา:** `Invalid login credentials`

**สาเหตุ:** Password ใน test scripts ไม่ตรงกับข้อมูลใน seed data

**วิธีแก้ไข:**
1. อัปเดต password ใน Supabase Auth ใช้ script `update-user-passwords.js`
2. ใช้ credentials ตามที่ระบุข้างต้น
3. ตรวจสอบการทำงานด้วย `node test-supabase-connection.js`

## 📝 หมายเหตุ

- Passwords เป็น case-sensitive
- ทุก email ต้องเป็น lowercase
- หากยังไม่สามารถ login ได้ ให้รัน `node create-test-users.js` ใหม่
- ตรวจสอบว่า RLS policies ถูก disable แล้ว