# แก้ไข Profile API Error

## ปัญหาที่พบ
```
Profile API error: {}
at getUserProfile (src/lib/auth.ts:195:15)
```

## สาเหตุ
1. **Environment Variables ไม่ได้ตั้งค่า** - Supabase credentials หายไป
2. **Supabase Server Client Error** - ฟังก์ชัน `createSupabaseServerClient` มีปัญหา

## การแก้ไข

### 1. แก้ไข Supabase Server Client ✅
ได้แก้ไขไฟล์ `apps/web/src/lib/supabase-server.ts` แล้ว:
- เปลี่ยน `createSupabaseServerClient` จาก `async` เป็น sync function
- แก้ไขการเรียกใช้ `cookies()` ให้ถูกต้อง

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `apps/web/.env.local` ด้วยเนื้อหาดังนี้:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

### 3. วิธีรับค่า Supabase Credentials

1. ไปที่ [supabase.com](https://supabase.com) และเข้าสู่ระบบ
2. เลือกโปรเจคของคุณ
3. ไปที่ **Settings** > **API**
4. คัดลอกค่าต่อไปนี้:
   - **Project URL** (เริ่มต้นด้วย `https://`)
   - **anon/public key** (เริ่มต้นด้วย `eyJhbGciOi...`)
   - **service_role key** (เริ่มต้นด้วย `eyJhbGciOi...`)

### 4. ทดสอบการแก้ไข

```bash
# ทดสอบการเชื่อมต่อ
node test-supabase-connection.js

# เริ่ม development server
npm run dev
```

### 5. ตรวจสอบ Test Users

ตรวจสอบว่ามี test users ในฐานข้อมูล:
- **Admin**: admin@example.com / password123
- **Employee**: employee@example.com / password123

ดูรายละเอียดได้ที่ `docs/testing/test-users-guide.md`

## สาเหตุของ Error

1. **Environment Variables หายไป** → API ไม่สามารถเชื่อมต่อ Supabase ได้
2. **Server Client Error** → การสร้าง Supabase client ล้มเหลว
3. **Authentication Failed** → ไม่สามารถดึงข้อมูล user profile ได้

## การป้องกัน

1. ตรวจสอบ environment variables ก่อน deploy
2. ใช้ test script เพื่อตรวจสอบการเชื่อมต่อ
3. ตรวจสอบ Supabase project status
4. ตรวจสอบ RLS policies ในฐานข้อมูล

## ไฟล์ที่แก้ไข

- ✅ `apps/web/src/lib/supabase-server.ts` - แก้ไข server client
- 📝 `apps/web/.env.local` - ต้องสร้างด้วย credentials จริง
- 📋 `PROFILE_API_ERROR_FIX.md` - คู่มือการแก้ไขนี้
