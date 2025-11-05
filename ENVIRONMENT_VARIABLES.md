# 🔐 Environment Variables Guide

## Production Environment Variables

### ตัวแปรที่ต้องการสำหรับ Production

```bash
# ============================================
# Supabase Configuration (PRODUCTION)
# ============================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key

# ============================================
# Application Configuration
# ============================================

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## วิธีรับค่าจาก Supabase

### 1. เข้าสู่ Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2. เลือก Production Project

### 3. ไปที่ Settings > API
- **Project URL**: คัดลอกค่า URL
- **Project API keys**:
  - `anon` `public` key - สำหรับ client-side
  - `service_role` key - สำหรับ server-side

---

## การตั้งค่าบน Vercel

### Step 1: เข้า Project Settings
1. เข้า Vercel Dashboard
2. เลือก Project
3. ไปที่ **Settings** > **Environment Variables**

### Step 2: เพิ่ม Environment Variables

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[your-project-ref].supabase.co
Environment: 
  ✓ Production
  ☐ Preview
  ☐ Development
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-anon-key]
Environment: 
  ✓ Production
  ☐ Preview
  ☐ Development
```

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-service-role-key]
Environment: 
  ✓ Production
  ☐ Preview
  ☐ Development
```

#### Variable 4: NODE_ENV
```
Name: NODE_ENV
Value: production
Environment: 
  ✓ Production
  ☐ Preview
  ☐ Development
```

#### Variable 5: NEXT_PUBLIC_APP_URL (Optional)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://[your-domain].vercel.app
Environment: 
  ✓ Production
  ☐ Preview
  ☐ Development
```

### Step 3: Save และ Redeploy
- คลิก **Save** หลังเพิ่มแต่ละตัวแปร
- Vercel อาจขอ redeploy - คลิก **Redeploy**

---

## Development vs Production

### Development (.env.local)
```bash
# ใช้สำหรับ local development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)
```bash
# ใช้สำหรับ production deployment
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 🔒 Security Best Practices

### ✅ ปลอดภัย (Safe)
- **NEXT_PUBLIC_*** - ปลอดภัยสำหรับ client-side
  - เปิดเผยบน browser ได้
  - มี RLS (Row Level Security) ป้องกัน
  - ใช้สำหรับ authentication และ data access

### ⚠️ ระวัง (Dangerous)
- **SUPABASE_SERVICE_ROLE_KEY** - อันตราย!
  - ⚠️ ห้ามใช้บน client-side
  - ⚠️ ห้าม log หรือ console.log
  - ⚠️ ใช้เฉพาะใน API routes เท่านั้น
  - มีสิทธิ์เต็ม bypass RLS ทั้งหมด

### 📋 Checklist
- [ ] Service role key ใช้เฉพาะ server-side
- [ ] ไม่ commit .env files เข้า git
- [ ] ใช้ environment variables ต่างกันสำหรับ dev/prod
- [ ] เก็บ credentials ในที่ปลอดภัย (1Password, etc.)
- [ ] Rotate keys เป็นประจำ (3-6 เดือน)

---

## 🔍 Troubleshooting

### ปัญหา: "Failed to fetch" หรือ CORS errors

**สาเหตุ:**
- URL ไม่ถูกต้อง
- Keys หมดอายุหรือไม่ถูกต้อง
- Supabase project ไม่ active

**แก้ไข:**
1. ตรวจสอบ URL ไม่มี trailing slash: ❌ `https://xxx.supabase.co/` ✅ `https://xxx.supabase.co`
2. ตรวจสอบ keys คัดลอกครบทั้งหมด
3. ตรวจสอบ Supabase project status

### ปัญหา: Environment variables ไม่อัพเดท

**สาเหตุ:**
- Vercel cache environment variables
- ยังไม่ได้ redeploy

**แก้ไข:**
1. ไปที่ Vercel Deployments
2. คลิก **Redeploy** บน latest deployment
3. หรือ push commit ใหม่เพื่อ trigger deployment

### ปัญหา: Authentication ไม่ทำงาน

**สาเหตุ:**
- Service role key ถูกใช้บน client-side
- RLS policies ไม่ถูกต้อง
- Email confirmation settings

**แก้ไข:**
1. ใช้ anon key บน client-side เท่านั้น
2. ตรวจสอบ RLS policies
3. ตรวจสอบ Supabase auth settings

---

## 📝 Verification Checklist

หลังตั้งค่า environment variables:

- [ ] ตรวจสอบทุกตัวแปรถูกต้อง (ไม่มี typo)
- [ ] คัดลอก keys ครบทั้งหมด (ตั้งแต่ต้นจนจบ)
- [ ] เลือก Environment เป็น Production
- [ ] Save แต่ละตัวแปร
- [ ] Trigger redeploy
- [ ] ทดสอบ application ทำงาน
- [ ] ตรวจสอบ Vercel logs ไม่มี errors
- [ ] ทดสอบ authentication
- [ ] ทดสอบ database connections

---

## 🔄 Key Rotation Schedule

### ทุก 3-6 เดือน:
1. สร้าง keys ใหม่บน Supabase
2. อัพเดท Vercel environment variables
3. Redeploy application
4. ทดสอบว่าทำงานถูกต้อง
5. ลบ keys เก่า
6. บันทึก key rotation date

---

## 📚 เอกสารอ้างอิง

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**หมายเหตุ:** ตรวจสอบให้แน่ใจว่าใช้ Production Supabase Project แยกจาก Development!

