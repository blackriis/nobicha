# 🚀 คู่มือ Deploy โปรเจกต์ขึ้น Vercel

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### ✅ Checklist ก่อนเริ่ม
- [ ] มี GitHub account และ push code ขึ้น GitHub repository แล้ว
- [ ] มี Vercel account (สมัครฟรีที่ https://vercel.com)
- [ ] มี Supabase Production project พร้อม (แยกจาก Development)
- [ ] เตรียม Environment Variables จาก Supabase

---

## 🎯 ขั้นตอนการ Deploy (ใช้เวลาประมาณ 15-20 นาที)

### Step 1: เตรียม Supabase Production Project (10-15 นาที)

#### 1.1 สร้าง Production Project
1. เข้า https://supabase.com/dashboard
2. คลิก **New Project**
3. ตั้งชื่อ: `employee-management-prod` (ตั้งชื่ออะไรก็ได้)
4. สร้าง **Database Password** ที่แข็งแรง (เก็บไว้ในที่ปลอดภัย!)
5. เลือก Region ที่ใกล้ที่สุด (แนะนำ: Singapore หรือ Tokyo)
6. คลิก **Create new project**
7. รอให้ project สร้างเสร็จ (ประมาณ 2-3 นาที)

#### 1.2 รัน Database Migrations
1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. รัน migrations ตามลำดับ:
   - `supabase/migrations/001_create_tables.sql`
   - `supabase/migrations/002_setup_rls.sql`
   - **ข้าม** `003_seed_data.sql` (ไม่ต้องรันใน production)
   - `supabase/migrations/004_add_timestamps.sql`
   - และ migrations อื่นๆ ตามลำดับ

#### 1.3 รัน Production Data Setup
```bash
# 1. แก้ไขไฟล์ scripts/production-admin-setup.sql
#    - เปลี่ยน email และ password ของ admin

# 2. คัดลอก SQL และรันใน Supabase SQL Editor
#    - ไปที่ SQL Editor
#    - Paste และ Run SQL

# 3. รัน scripts/production-data-setup.sql
#    - แก้ไข GPS coordinates ให้ตรงกับสาขาจริง
#    - แก้ไขข้อมูลวัตถุดิบตามธุรกิจ
#    - รัน SQL ทีละ section
```

#### 1.4 เก็บ Supabase Credentials
1. ไปที่ **Settings** > **API**
2. คัดลอกค่าเหล่านี้ (จะใช้ใน Step 3):
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Step 2: Import โปรเจกต์เข้า Vercel (2-3 นาที)

#### 2.1 เข้าสู่ Vercel Dashboard
1. ไปที่ https://vercel.com/dashboard
2. คลิก **Add New...** > **Project**

#### 2.2 Import GitHub Repository
1. เลือก **Import Git Repository**
2. ค้นหา repository ของคุณ: `employee-management-system`
3. คลิก **Import**

#### 2.3 Configure Project Settings
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build (ใช้ค่า default)
Output Directory: apps/web/.next (ระบบจะอ่านจาก vercel.json)
Install Command: npm install (ใช้ค่า default)
```

**⚠️ สำคัญ:**
- ✅ **อย่ากด Deploy ก่อน!**
- ต้องตั้งค่า Environment Variables ก่อน

---

### Step 3: ตั้งค่า Environment Variables (3-5 นาที)

#### 3.1 เพิ่ม Environment Variables
ใน Vercel Project Settings:

1. **NEXT_PUBLIC_SUPABASE_URL**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://[your-project-ref].supabase.co
   Environment: ✓ Production
   ```

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-anon-key]
   Environment: ✓ Production
   ```

3. **SUPABASE_SERVICE_ROLE_KEY**
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-service-role-key]
   Environment: ✓ Production
   ```

4. **NODE_ENV**
   ```
   Name: NODE_ENV
   Value: production
   Environment: ✓ Production
   ```

#### 3.2 บันทึก Environment Variables
- คลิก **Save** หลังจากเพิ่มแต่ละตัวแปร
- ตรวจสอบว่าเลือก **Production** environment

---

### Step 4: Deploy โปรเจกต์ (1-3 นาที)

#### 4.1 เริ่ม Deployment
1. คลิก **Deploy** ใน Vercel Dashboard
2. รอ build process (ประมาณ 2-3 นาที)
3. ดู build logs เพื่อตรวจสอบว่าไม่มี error

#### 4.2 ตรวจสอบ Build Status
```
Building... ⏳
✓ Dependencies installed
✓ TypeScript compiled
✓ Next.js build completed
✓ Deployment ready
```

#### 4.3 รับ Production URL
เมื่อ deployment สำเร็จ คุณจะได้:
- Production URL: `https://your-project.vercel.app`
- คลิก **Visit** เพื่อดู application

---

### Step 5: Verify Production (5-10 นาที)

#### 5.1 ทดสอบ Application
- [ ] **URL accessible**: เข้า `https://your-project.vercel.app` ได้
- [ ] **Login page**: แสดงหน้า login ปกติ
- [ ] **Admin login**: ทดสอบ login ด้วย admin account ที่สร้างไว้
- [ ] **Employee login**: ทดสอบ login ด้วย employee account
- [ ] **Check-in/out**: ทดสอบ check-in และ check-out พร้อม selfie
- [ ] **GPS verification**: ทดสอบ GPS location checking
- [ ] **Reports**: ดูรายงานต่างๆ
- [ ] **Image upload**: ทดสอบอัปโหลดรูปภาพ

#### 5.2 ตรวจสอบ Errors
1. เข้า Vercel Dashboard > **Logs**
2. ดู Real-time logs
3. ตรวจสอบว่าไม่มี critical errors

#### 5.3 ตรวจสอบ Database
1. เข้า Supabase Dashboard > **Table Editor**
2. ตรวจสอบ:
   - `users` table มีข้อมูล admin
   - `branches` table มีข้อมูลสาขา
   - `work_shifts` table มีข้อมูลกะการทำงาน
   - `raw_materials` table มีข้อมูลวัตถุดิบ

---

## 🔧 การตั้งค่าเพิ่มเติม (Optional)

### Custom Domain (ถ้าต้องการ)

1. ไปที่ Vercel Project > **Settings** > **Domains**
2. คลิก **Add Domain**
3. ใส่ domain ของคุณ: `yourdomain.com`
4. ทำตาม DNS configuration ที่ Vercel แนะนำ
5. รอ DNS propagation (5-48 ชั่วโมง)

### Environment Variables สำหรับ Preview/Development

ถ้าต้องการใช้ Preview deployments:

```
# เพิ่ม Environment Variables เดียวกัน แต่เลือก:
Environment: ✓ Preview  (สำหรับ PR previews)
Environment: ✓ Development  (สำหรับ development branch)
```

---

## 🐞 Troubleshooting

### ปัญหา: Build Failed

**อาการ:**
```
Error: Build failed with exit code 1
```

**แก้ไข:**
1. ตรวจสอบ build logs ใน Vercel
2. ดู error messages
3. แก้ไข code และ push ใหม่

### ปัญหา: Environment Variables ไม่ทำงาน

**อาการ:**
- ไม่สามารถเชื่อมต่อ database
- Authentication error

**แก้ไข:**
1. ตรวจสอบ Environment Variables ใน Vercel Settings
2. ตรวจสอบว่าเลือก **Production** environment
3. คัดลอก keys ให้ครบ (ไม่มี space หรือ newline)
4. **Redeploy** โปรเจกต์

### ปัญหา: 404 Not Found

**อาการ:**
- หน้าบางหน้าไม่เจอ (404)

**แก้ไข:**
1. ตรวจสอบ `vercel.json` configuration
2. ตรวจสอบ routing ใน Next.js
3. ดู build output ว่ามีหน้าที่ต้องการหรือไม่

### ปัญหา: Database Connection Error

**อาการ:**
```
Error: Failed to connect to database
```

**แก้ไข:**
1. ตรวจสอบ Supabase project status
2. ตรวจสอบ RLS policies
3. ตรวจสอบ API keys ถูกต้อง
4. ลอง restart Supabase project

---

## 📊 Monitoring & Maintenance

### ติดตาม Deployment

#### Vercel Analytics
- ดู page views และ performance metrics
- ตั้งค่าใน Settings > Analytics

#### Error Monitoring
- ตรวจสอบ logs เป็นประจำ
- ตั้งค่า alerts สำหรับ critical errors

#### Performance
- ดู build times
- ตรวจสอบ cold start times
- Monitor response times

### Regular Maintenance

**สัปดาห์ละครั้ง:**
- [ ] ตรวจสอบ Vercel logs
- [ ] ดู error rates
- [ ] ตรวจสอบ database performance

**เดือนละครั้ง:**
- [ ] Update dependencies
- [ ] Review environment variables
- [ ] Check storage usage (Supabase)
- [ ] Review RLS policies

**ทุก 3-6 เดือน:**
- [ ] Rotate Supabase API keys
- [ ] Review security settings
- [ ] Audit user access
- [ ] Database maintenance

---

## 🔐 Security Checklist

### ก่อน Go Live
- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ตรวจสอบ RLS policies ทุก table
- [ ] ปิด development/debug modes
- [ ] ตรวจสอบ CORS settings
- [ ] ทดสอบ authentication flow
- [ ] ตรวจสอบ file upload limits
- [ ] Review API endpoints security

### หลัง Go Live
- [ ] Monitor error logs
- [ ] ตั้งค่า rate limiting (ถ้าจำเป็น)
- [ ] Backup database เป็นประจำ
- [ ] Document emergency procedures
- [ ] เตรียม rollback plan

---

## 📝 Deployment Checklist Summary

### ก่อน Deploy
- [ ] Code pushed to GitHub
- [ ] Supabase production project ready
- [ ] Migrations run successfully
- [ ] Production data setup
- [ ] Environment variables prepared

### ระหว่าง Deploy
- [ ] Import repository to Vercel
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy and monitor build

### หลัง Deploy
- [ ] Test application thoroughly
- [ ] Verify database connections
- [ ] Check all features working
- [ ] Monitor logs for errors
- [ ] Document deployment notes

---

## 🎉 สำเร็จแล้ว!

ยินดีด้วย! โปรเจกต์ของคุณ deploy สำเร็จแล้ว 🚀

### Next Steps
1. แจ้ง Production URL ให้ทีม
2. เริ่มใช้งานและเก็บ feedback
3. Monitor application เป็นประจำ
4. Plan สำหรับ features ถัดไป

### Support
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 📞 Contact & Support

มีปัญหาหรือคำถาม?
1. ตรวจสอบ Troubleshooting section ข้างบน
2. ดู Vercel และ Supabase logs
3. ค้นหาใน documentation
4. สร้าง GitHub issue

---

*Last Updated: 2025-01-05*
*Version: 1.0*
