# แก้ไขปัญหา "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย"

## สาเหตุที่พบบ่อย

### 1. Environment Variables ไม่ได้ตั้งค่า

#### วิธีตรวจสอบ:
```bash
# รันคำสั่งนี้เพื่อตรวจสอบ configuration
node apps/web/check-supabase-config.js
```

#### วิธีแก้ไข:
1. สร้างไฟล์ `apps/web/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. รับค่าจาก Supabase Dashboard:
   - ไปที่ https://supabase.com/dashboard
   - เลือก Project ของคุณ
   - ไปที่ Settings > API
   - คัดลอก:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

3. Restart development server:
```bash
npm run dev
```

### 2. Supabase Project ไม่ active หรือ paused

#### วิธีตรวจสอบ:
1. เข้า https://supabase.com/dashboard
2. ตรวจสอบสถานะ project
3. หาก project ถูก pause ให้ unpause

### 3. Network Connectivity Issues

#### วิธีตรวจสอบ:
```bash
# ทดสอบว่าเข้าถึง Supabase ได้หรือไม่
curl -I https://your-project-ref.supabase.co

# หรือใช้ script ของเรา
node apps/web/check-supabase-config.js
```

#### วิธีแก้ไข:
1. ตรวจสอบ internet connection
2. ตรวจสอบว่า firewall ไม่ได้ block Supabase
3. ลอง disable VPN/Proxy ชั่วคราว
4. ทดสอบใน browser ว่าเข้า Supabase Dashboard ได้หรือไม่

### 4. CORS Issues

#### วิธีแก้ไข:
1. เข้า Supabase Dashboard > Settings > API
2. ตรวจสอบ "Allowed Origins" ใน Auth settings
3. เพิ่ม `http://localhost:3000` สำหรับ development

### 5. API Key ไม่ถูกต้องหรือหมดอายุ

#### วิธีตรวจสอบ:
1. เข้า Supabase Dashboard > Settings > API
2. Regenerate API keys หากจำเป็น
3. อัปเดตใน `.env.local`
4. Restart server

## การ Debug เพิ่มเติม

### ดู detailed error logs:

1. เปิด Browser Developer Tools (F12)
2. ไปที่ Console tab
3. ลอง login อีกครั้ง
4. ดู full error stack trace

### ตรวจสอบ Network requests:

1. เปิด Browser Developer Tools (F12)
2. ไปที่ Network tab
3. Filter: XHR
4. ลอง login
5. ดูว่า request ไป Supabase สำเร็จหรือไม่
6. ตรวจสอบ:
   - Status Code (ควรเป็น 200)
   - Response body
   - Headers (Authorization ถูกส่งไปหรือไม่)

### ทดสอบโดยตรง:

```bash
# ทดสอบ Auth endpoint โดยตรง
curl -X POST \
  'https://your-project-ref.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "your-password"
  }'
```

## Quick Fix Checklist

- [ ] Environment variables ถูกต้อง (รัน `node apps/web/check-supabase-config.js`)
- [ ] Supabase project เป็น active (ไม่ใช่ paused)
- [ ] Internet connection ทำงานปกติ
- [ ] ไม่มี firewall/proxy ที่ block Supabase
- [ ] API keys ยังใช้งานได้ (ไม่หมดอายุ)
- [ ] CORS settings ถูกต้องใน Supabase Dashboard
- [ ] Restart development server แล้ว
- [ ] Clear browser cache และ cookies
- [ ] ทดสอบใน incognito/private window

## ยังแก้ไม่ได้?

หากลองทุกขั้นตอนแล้วยังมีปัญหา:

1. ตรวจสอบ Supabase Status Page: https://status.supabase.com
2. ลองสร้าง Supabase project ใหม่
3. ตรวจสอบ Supabase Community หรือ GitHub Issues
4. Contact Supabase Support

## การป้องกัน

1. **ใช้ `.env.local` แทน hardcode**
2. **เพิ่ม `.env.local` ใน `.gitignore`**
3. **Backup environment variables**
4. **ตรวจสอบ configuration ก่อน deploy**
5. **Monitor Supabase project status**
6. **Set up error tracking (Sentry, etc.)**

## สคริปต์ช่วยเหลือ

### ตรวจสอบ configuration อัตโนมัติ:
```bash
node apps/web/check-supabase-config.js
```

### ทดสอบ authentication:
```bash
node test-auth-flow.js
```

### ทดสอบ database connection:
```bash
node test-supabase-connection.js
```

