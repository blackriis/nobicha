# 🔧 การตั้งค่าเชื่อมต่อฐานข้อมูล Supabase

## สถานการณ์ปัจจุบัน
- ✅ API Routes เชื่อมต่อฐานข้อมูลจริงอยู่แล้ว (ไม่ใช่ mock)
- ❌ ขาด Environment Variables สำหรับการเชื่อมต่อ Supabase

## ขั้นตอนการแก้ไข

### 1. หาข้อมูลจาก Supabase Dashboard
1. เข้าไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก project ของคุณ
3. ไปที่ **Settings > API**
4. คัดลอกข้อมูลต่อไปนี้:
   - **Project URL** (ขึ้นต้นด้วย https://...)
   - **anon public key** (ขึ้นต้นด้วย eyJhbGci...)
   - **service_role key** (ขึ้นต้นด้วย eyJhbGci... แต่เป็นแบบ service_role)

### 2. อัปเดตไฟล์ Environment Variables
แก้ไขไฟล์ `.env.local` ในโฟลเดอร์หลัก:

```bash
# แทนที่ค่าเหล่านี้ด้วยค่าจริงจาก Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key
NODE_ENV=development
```

### 3. Restart Development Server
```bash
npm run dev
```

## API Routes ที่พร้อมใช้งาน
เมื่อตั้งค่า environment variables แล้ว API routes เหล่านี้จะเชื่อมต่อ Supabase ได้ทันที:

### Payroll Management APIs
- `POST /api/admin/payroll-cycles` - สร้างรอบเงินเดือน
- `GET /api/admin/payroll-cycles` - ดึงรายการรอบเงินเดือน
- `POST /api/admin/payroll-cycles/[id]/calculate` - คำนวณเงินเดือน
- `GET /api/admin/payroll-cycles/[id]/summary` - สรุปข้อมูลรอบ
- `POST /api/admin/payroll-cycles/[id]/finalize` - ปิดรอบเงินเดือน
- `GET /api/admin/payroll-cycles/[id]/export` - ส่งออกรายงาน

### Bonus/Deduction APIs  
- `PUT /api/admin/payroll-details/[id]/bonus` - อัปเดตโบนัส
- `DELETE /api/admin/payroll-details/[id]/bonus` - ลบโบนัส
- `PUT /api/admin/payroll-details/[id]/deduction` - อัปเดตหักเงิน
- `DELETE /api/admin/payroll-details/[id]/deduction` - ลบหักเงิน

## ฟีเจอร์ที่มีอยู่แล้ว
- ✅ Authentication & Authorization (Admin role checking)
- ✅ Rate Limiting
- ✅ Audit Logging
- ✅ Error Handling
- ✅ Data Validation
- ✅ Database Transaction Handling

## การทดสอบ
หลังจากตั้งค่า environment variables แล้ว ให้ทดสอบด้วย:

```bash
# ทดสอบการเชื่อมต่อฐานข้อมูล
curl -X GET http://localhost:3000/api/test-db

# ทดสอบ Payroll API (ต้อง login เป็น admin ก่อน)
curl -X GET http://localhost:3000/api/admin/payroll-cycles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## หมายเหตุ
- ไฟล์ `.env.local` ได้ถูกสร้างแล้วในโฟลเดอร์หลักและ `apps/web/`
- กรุณาอัปเดตค่า environment variables ด้วยข้อมูลจริงจาก Supabase Dashboard
- ระบบจะเชื่อมต่อฐานข้อมูลจริงทันทีหลังจากตั้งค่าเสร็จ