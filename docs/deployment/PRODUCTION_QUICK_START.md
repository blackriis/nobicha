# 🚀 Production Deployment - Quick Start Guide

## สรุป 5 ขั้นตอนหลัก

### 1️⃣ เตรียม Supabase Production Database (15-30 นาที)

```bash
# ไปที่ supabase.com
# 1. สร้าง New Project สำหรับ production
# 2. ไปที่ SQL Editor
# 3. รัน migrations ตามลำดับ (ยกเว้น 003_seed_test_users.sql):
#    - 001_initial_schema.sql
#    - 002_auth_setup.sql
#    - 004_audit_trail_system.sql
#    - 005_payroll_details_bonus_deduction_fields.sql
#    - 006_storage_setup.sql
#    - 007_sales_slips_storage.sql
#    - 008_add_slip_image_url_to_sales_reports.sql
#    - 009_add_employee_rate_fields.sql
#
# 4. รัน scripts/production-admin-setup.sql (สร้าง admin user)
# 5. รัน scripts/production-data-setup.sql (สร้างข้อมูลพื้นฐาน)
```

**เก็บข้อมูลเหล่านี้จาก Supabase:**
- Project URL (เช่น https://xxxxx.supabase.co)
- anon/public key (เริ่มต้นด้วย eyJhbGciOi...)
- service_role key (เริ่มต้นด้วย eyJhbGciOi...)

---

### 2️⃣ ตั้งค่า Vercel (10-15 นาที)

```bash
# 1. ไปที่ vercel.com และ login
# 2. New Project > Import Git Repository
# 3. เลือก repository: nobi_new
# 4. Configure Project:

Framework Preset: Next.js
Root Directory: . (ว่างเปล่า)

Build Command:
cd apps/web && npm run build

Install Command:
cd apps/web && npm install

Output Directory:
apps/web/.next

# 5. Add Environment Variables (ใช้ข้อมูลจาก Supabase):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NODE_ENV=production

# 6. Deploy!
```

---

### 3️⃣ รัน Pre-deployment Checks (5-10 นาที)

```bash
# ที่ local machine
cd /Users/blackriis/Dev/nobi_new

# รัน deployment script
./scripts/deploy-production.sh

# Script จะตรวจสอบ:
# ✅ On main branch
# ✅ No uncommitted changes
# ✅ Type check
# ✅ Lint check
# ✅ Tests pass
# ✅ Build succeeds
```

---

### 4️⃣ Deploy to Production (1-3 นาที)

```bash
# ถ้า deploy-production.sh ผ่านหมด
git push origin main

# Vercel จะ auto-deploy
# ดู progress ที่ https://vercel.com/dashboard
```

---

### 5️⃣ Verify Production (10-15 นาที)

```bash
# รัน verification script
./scripts/verify-production.sh

# หรือตรวจสอบ manually:
# 1. เข้า production URL
# 2. Login ด้วย admin account
# 3. ทดสอบ features หลัก:
#    - Check-in/Check-out
#    - Material Usage
#    - Sales Reports
#    - Image Uploads
```

---

## 📊 Timeline Overview

```
Total Time: 45-75 นาที

┌─────────────────────────────────────────────────┐
│ Supabase Setup     ████████████████  15-30 min │
│ Vercel Setup       ██████████        10-15 min │
│ Pre-checks         ████              5-10 min  │
│ Deploy             ██                1-3 min   │
│ Verify             ██████████        10-15 min │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Quick Links

### เอกสารสำคัญ
- 📘 [Full Deployment Guide](./PRODUCTION_DEPLOYMENT_V1.md) - คู่มือละเอียดทุกขั้นตอน
- 📗 [Supabase Setup](./SUPABASE_SETUP_GUIDE.md) - วิธีตั้งค่า Supabase
- 📙 [CI/CD Setup](./docs/ci-cd-setup.md) - Environment variables และ automation

### Scripts
- 🔧 [Deploy Script](./scripts/deploy-production.sh) - Pre-deployment checks
- ✅ [Verify Script](./scripts/verify-production.sh) - Post-deployment verification
- 👤 [Admin Setup SQL](./scripts/production-admin-setup.sql) - สร้าง admin users
- 📊 [Data Setup SQL](./scripts/production-data-setup.sql) - สร้างข้อมูลพื้นฐาน

### External Links
- 🔗 [Vercel Dashboard](https://vercel.com/dashboard)
- 🔗 [Supabase Dashboard](https://supabase.com/dashboard)
- 🔗 [GitHub Repository](https://github.com/your-repo/nobi_new)

---

## ⚠️ Critical Reminders

### ❌ อย่าลืม!
- [ ] อย่ารัน `003_seed_test_users.sql` บน production
- [ ] ใช้ production Supabase project แยกจาก development
- [ ] เปลี่ยน admin password ให้แข็งแรง
- [ ] ตรวจสอบ GPS coordinates ถูกต้องก่อนสร้างสาขา
- [ ] เก็บ service_role_key ให้ปลอดภัย

### ✅ ควรทำ!
- [ ] Backup database ก่อน deploy (ถ้ามีข้อมูลแล้ว)
- [ ] ทดสอบ features หลักทั้งหมดหลัง deploy
- [ ] Monitor logs ใน 24 ชั่วโมงแรก
- [ ] เก็บ deployment date และ notes
- [ ] Document lessons learned

---

## 🆘 ถ้าเกิดปัญหา

### Build Failed
```bash
# ดู error logs บน Vercel
# แก้ไข errors
# Push again

git add .
git commit -m "Fix: [describe fix]"
git push origin main
```

### Database Connection Failed
```bash
# ตรวจสอบ environment variables บน Vercel
# Settings > Environment Variables
# ตรวจสอบว่าค่าถูกต้องและ production Supabase project active
```

### Tests Failed
```bash
# รันที่ local
npm run test

# แก้ไข tests ที่ fail
# รัน pre-deployment script อีกครั้ง
./scripts/deploy-production.sh
```

### 502/503 Errors
```bash
# รอ 1-2 นาที (Vercel กำลัง deploy)
# ถ้ายังไม่หาย:
# 1. ดู Vercel deployment logs
# 2. ตรวจสอบ Supabase status
# 3. Rollback to previous deployment ถ้าจำเป็น
```

---

## 📞 Support

### ขอความช่วยเหลือ
- 📧 GitHub Issues: [Create Issue](https://github.com/your-repo/nobi_new/issues)
- 📚 Vercel Docs: https://vercel.com/docs
- 📚 Supabase Docs: https://supabase.com/docs

### Emergency Rollback
```bash
# บน Vercel Dashboard:
# 1. ไปที่ Deployments
# 2. เลือก previous deployment
# 3. คลิก "Promote to Production"
```

---

## ✅ Success Criteria

Production deployment ประสบความสำเร็จเมื่อ:

- ✅ Application accessible via production URL
- ✅ Admin และ employees login ได้
- ✅ Check-in/check-out ทำงานได้พร้อม selfie และ GPS
- ✅ Image uploads ทำงานได้
- ✅ Reports แสดงข้อมูลถูกต้อง
- ✅ No critical errors in logs (24 ชม.แรก)
- ✅ Database performance ดี
- ✅ HTTPS และ security features ทำงานถูกต้อง

---

## 📅 Deployment Log

```markdown
### Deployment v1.0

**Date**: _______________
**Time**: _______________
**Deployed By**: _______________
**Vercel URL**: _______________
**Supabase Project**: _______________

**Pre-deployment Checklist**:
- [ ] All tests passed
- [ ] Database ready
- [ ] Environment variables set
- [ ] Pre-deployment script passed

**Post-deployment Verification**:
- [ ] Application accessible
- [ ] Login works
- [ ] Features tested
- [ ] No critical errors

**Notes**:
_________________
_________________
_________________

**Issues Encountered**:
_________________
_________________

**Next Steps**:
_________________
_________________
```

---

## 🎯 Next Steps After Deployment

### Immediate (Day 1)
- [ ] Monitor error rates (every 30 min)
- [ ] Test all features with real data
- [ ] Collect initial user feedback
- [ ] Document any bugs

### Short-term (Week 1)
- [ ] Analyze usage patterns
- [ ] Optimize performance bottlenecks
- [ ] Address user feedback
- [ ] Plan improvements

### Long-term (Month 1)
- [ ] Review analytics
- [ ] Plan v1.1 features
- [ ] Scale infrastructure if needed
- [ ] Update documentation

---

**🎉 ขอให้การ deploy สำเร็จ! 🎉**

*ถ้ามีคำถาม ดูเพิ่มเติมที่ [PRODUCTION_DEPLOYMENT_V1.md](./PRODUCTION_DEPLOYMENT_V1.md)*

