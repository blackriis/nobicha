# 🚀 Production Deployment Checklist - v1.0

## 📋 Pre-Deployment Checklist

### 1. ✅ Code Quality & Testing
- [ ] รัน `npm run lint` แล้วไม่มี errors
- [ ] รัน `npm run typecheck` แล้วไม่มี type errors (หรือยอมรับ known issues)
- [ ] รัน `npm run test` แล้ว unit tests ผ่านหมด
- [ ] รัน `npm run test:e2e` แล้ว e2e tests ผ่านหมด
- [ ] ทดสอบ features หลักทั้งหมดบน staging/local
- [ ] ตรวจสอบ responsive design บน mobile/tablet/desktop

### 2. 🗄️ Database & Migrations
- [ ] Backup production database (ถ้ามี data อยู่แล้ว)
- [ ] ตรวจสอบ migrations ทั้งหมดใน `database/migrations/`:
  - [ ] 001_initial_schema.sql - โครงสร้างฐานข้อมูลหลัก
  - [ ] 002_auth_setup.sql - ระบบ authentication และ RLS
  - [ ] 003_seed_test_users.sql - ข้อมูลทดสอบ (ไม่ต้องรันบน production)
  - [ ] 004_audit_trail_system.sql - ระบบ audit logging
  - [ ] 005_payroll_details_bonus_deduction_fields.sql - เพิ่มฟิลด์ payroll
  - [ ] 006_storage_setup.sql - ตั้งค่า storage buckets
  - [ ] 007_sales_slips_storage.sql - storage สำหรับใบเสร็จ
  - [ ] 008_add_slip_image_url_to_sales_reports.sql - เพิ่มฟิลด์ URL รูปใบเสร็จ
  - [ ] 009_add_employee_rate_fields.sql - เพิ่มฟิลด์ค่าแรงพนักงาน
- [ ] รัน migrations บน production Supabase project
- [ ] ตรวจสอบ RLS policies ทำงานถูกต้อง
- [ ] ตรวจสอบ storage policies และ permissions

### 3. 🔐 Environment Variables
#### Production Supabase (ต้องสร้าง production project แยกจาก development)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key

#### Production Settings
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (เช่น https://your-domain.com)

### 4. 🌐 Vercel/Deployment Platform Setup
- [ ] สร้าง production project บน Vercel
- [ ] เชื่อม GitHub repository
- [ ] ตั้งค่า environment variables บน Vercel:
  - Settings > Environment Variables
  - เพิ่มทุกตัวแปรจาก section 3
  - เลือก Environment: "Production"
- [ ] ตั้งค่า build settings:
  - Build Command: `cd apps/web && npm run build`
  - Install Command: `cd apps/web && npm install`
  - Output Directory: `apps/web/.next`
  - Root Directory: `.` (เว้นว่าง)
- [ ] เปิดใช้ "Automatically expose System Environment Variables"

### 5. 👥 Production Users
⚠️ **สำคัญ**: อย่ารัน 003_seed_test_users.sql บน production!

สร้าง production admin users แทน:
```sql
-- สร้าง admin user จริงบน production Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@your-company.com', -- เปลี่ยนเป็น email จริง
  crypt('your-secure-password', gen_salt('bf')), -- เปลี่ยนเป็น password ที่ปลอดภัย
  now(),
  now(),
  now(),
  '{"role": "admin", "full_name": "Admin User"}'::jsonb
);

-- เพิ่มข้อมูลใน users table
INSERT INTO public.users (id, email, full_name, role, employee_code, status)
SELECT 
  id,
  email,
  (raw_user_meta_data->>'full_name')::text,
  'admin',
  'ADMIN001',
  'active'
FROM auth.users
WHERE email = 'admin@your-company.com';
```

### 6. 🏢 Production Data Setup
- [ ] สร้างสาขาจริงใน branches table
- [ ] สร้างข้อมูล work_shifts ที่ใช้จริง
- [ ] สร้างข้อมูล raw_materials ที่ใช้จริง
- [ ] ตรวจสอบ GPS coordinates ของสาขาถูกต้อง
- [ ] ตั้งค่า default branch สำหรับ employees

### 7. 📱 Features ที่ต้องทดสอบบน Production
- [ ] Login/Logout (Admin และ Employee)
- [ ] Employee Check-in/Check-out พร้อม Selfie
- [ ] GPS Location validation
- [ ] Branch Management
- [ ] Material Usage Reporting
- [ ] Sales Reports
- [ ] Work History/Time Entries
- [ ] Payroll Calculations
- [ ] Employee Management
- [ ] Image Upload (selfies, sales slips)

### 8. 🔒 Security Checklist
- [ ] SSL/HTTPS enabled และทำงานถูกต้อง
- [ ] RLS policies enabled บนทุก table
- [ ] Storage policies ป้องกัน unauthorized access
- [ ] Service role key ไม่ถูก expose บน client
- [ ] CORS settings ถูกต้อง
- [ ] Rate limiting พิจารณาใช้ (ถ้าจำเป็น)
- [ ] เปลี่ยน default passwords ทั้งหมด

### 9. 📊 Monitoring & Logging
- [ ] ตั้งค่า Vercel Analytics
- [ ] ตั้งค่า Supabase Monitoring
- [ ] ตรวจสอบ Error tracking (Sentry หรือทางเลือกอื่น)
- [ ] ตั้งค่า alerts สำหรับ critical errors
- [ ] ตรวจสอบ database performance metrics

### 10. 📝 Documentation
- [ ] อัพเดท README.md พร้อม production info
- [ ] เตรียม User Manual สำหรับ admins
- [ ] เตรียม User Guide สำหรับ employees
- [ ] จัดทำ Troubleshooting Guide
- [ ] บันทึก production credentials อย่างปลอดภัย

---

## 🚀 Deployment Steps

### Step 1: Prepare Supabase Production Database
```bash
# 1. สร้าง production project บน supabase.com
# 2. ไปที่ SQL Editor แล้วรัน migrations ตามลำดับ

# Migration files ที่ต้องรัน (ยกเว้น 003_seed_test_users.sql):
# - 001_initial_schema.sql
# - 002_auth_setup.sql
# - 004_audit_trail_system.sql
# - 005_payroll_details_bonus_deduction_fields.sql
# - 006_storage_setup.sql
# - 007_sales_slips_storage.sql
# - 008_add_slip_image_url_to_sales_reports.sql
# - 009_add_employee_rate_fields.sql

# 3. สร้าง admin user ด้วย SQL ด้านบน
# 4. ตรวจสอบ storage buckets:
#    - employee-photos
#    - sales-slips
```

### Step 2: Configure Vercel
```bash
# 1. ไปที่ vercel.com และ login
# 2. Import GitHub repository
# 3. เลือก project: nobi_new
# 4. ตั้งค่า:
#    - Framework Preset: Next.js
#    - Root Directory: . (blank)
#    - Build Command: cd apps/web && npm run build
#    - Install Command: cd apps/web && npm install
#    - Output Directory: apps/web/.next

# 5. เพิ่ม Environment Variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# 6. คลิก Deploy
```

### Step 3: Post-Deployment Verification
```bash
# 1. ตรวจสอบ deployment status บน Vercel
# 2. เข้าไปที่ production URL
# 3. ทดสอบ login ด้วย admin account
# 4. ทดสอบ features หลักทั้งหมด
# 5. ตรวจสอบ Vercel logs ว่าไม่มี errors
# 6. ตรวจสอบ Supabase logs ว่าไม่มี errors
```

### Step 4: Domain Setup (Optional)
```bash
# ถ้าต้องการใช้ custom domain:
# 1. ไปที่ Vercel Project Settings > Domains
# 2. เพิ่ม custom domain
# 3. ตั้งค่า DNS records ตามที่ Vercel แนะนำ
# 4. รอ DNS propagation (ใช้เวลา 24-48 ชม.)
# 5. อัพเดท NEXT_PUBLIC_APP_URL
```

---

## ⚠️ Known Issues & Workarounds

### Build Settings
- `ignoreDuringBuilds: true` สำหรับ ESLint
- `ignoreBuildErrors: true` สำหรับ TypeScript
- อาจมี type errors บางส่วนที่ไม่กระทบการทำงาน

### Mobile Camera
- ทำงานได้เฉพาะบน HTTPS (production จะใช้ HTTPS อัตโนมัติ)
- Safari บน iOS ต้อง allow camera permission

### GPS Location
- ต้อง enable location services บน device
- บาง browser อาจขอ permission หลายครั้ง

---

## 🆘 Rollback Plan

ถ้าเกิดปัญหาร้ายแรงบน production:

### Option 1: Rollback to Previous Deployment
```bash
# บน Vercel Dashboard:
# 1. ไปที่ Deployments tab
# 2. เลือก deployment ก่อนหน้า
# 3. คลิก "Promote to Production"
```

### Option 2: Restore Database
```bash
# บน Supabase Dashboard:
# 1. ไปที่ Database > Backups
# 2. เลือก backup point
# 3. คลิก "Restore"
```

---

## 📞 Support Contacts

### Technical Issues
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- GitHub Issues: https://github.com/your-repo/issues

### Emergency Contacts
- Tech Lead: [Your Contact]
- Database Admin: [Your Contact]
- DevOps: [Your Contact]

---

## ✅ Post-Launch Monitoring (First 48 Hours)

### Hour 1-6 (Critical)
- [ ] ตรวจสอบ error rates ทุก 30 นาที
- [ ] Monitor real user logins
- [ ] ตรวจสอบ API response times
- [ ] ตรวจสอบ database connections

### Hour 6-24
- [ ] ตรวจสอบ error rates ทุก 2 ชั่วโมง
- [ ] รวบรวม user feedback
- [ ] Monitor database performance
- [ ] ตรวจสอบ storage usage

### Hour 24-48
- [ ] ตรวจสอบ error rates ทุก 4 ชั่วโมง
- [ ] วิเคราะห์ usage patterns
- [ ] Optimize ตาม performance metrics
- [ ] Plan for improvements

---

## 🎯 Success Criteria

Production v1 ถือว่าสำเร็จเมื่อ:
- ✅ ไม่มี critical errors ใน 24 ชั่วโมงแรก
- ✅ User สามารถ login และใช้งานได้ปกติ
- ✅ Check-in/Check-out ทำงานถูกต้อง
- ✅ Reports แสดงผลถูกต้อง
- ✅ Image uploads ทำงานได้
- ✅ Database performance อยู่ในเกณฑ์ดี
- ✅ No data loss หรือ corruption

---

**📅 Deployment Date**: _________________
**👤 Deployed By**: _________________
**✅ Approved By**: _________________

---

*หมายเหตุ: เอกสารนี้ควรถูกอัพเดทหลังจาก deployment เสร็จสมบูรณ์พร้อม lessons learned*

