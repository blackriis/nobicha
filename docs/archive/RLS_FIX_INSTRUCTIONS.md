# แก้ไข RLS Infinite Recursion Error

## ปัญหาที่พบ
```
infinite recursion detected in policy for relation "users"
```

## สาเหตุ
RLS (Row Level Security) policies มี infinite recursion เพราะ:
1. Policies อ้างอิงถึงตาราง `users` ในขณะที่ policy ของตาราง `users` เองก็อ้างอิงถึงตาราง `users`
2. สร้างวงจรการเรียกใช้ที่ไม่สิ้นสุด

## วิธีแก้ไข

### วิธีที่ 1: Disable RLS ชั่วคราว (แนะนำ)

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจคของคุณ
3. ไปที่ **SQL Editor**
4. คัดลอกและรัน SQL ต่อไปนี้:

```sql
-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
```

### วิธีที่ 2: แก้ไข Policies (สำหรับ Production)

1. ไปที่ **Authentication** > **Policies**
2. ลบ policies ทั้งหมดของตาราง `users`
3. สร้าง policies ใหม่ที่ไม่มี recursion:

```sql
-- Simple policies without recursion
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all users
CREATE POLICY "Service role can manage all users" ON users 
  FOR ALL USING (auth.role() = 'service_role');
```

## ทดสอบการแก้ไข

หลังจากแก้ไขแล้ว รันคำสั่ง:

```bash
node test-supabase-connection.js
```

ควรจะเห็น:
```
✅ เชื่อมต่อ Supabase สำเร็จ!
✅ เข้าสู่ระบบสำเร็จ!
```

## หมายเหตุ

- **Development**: ใช้วิธีที่ 1 (disable RLS) เพื่อความง่าย
- **Production**: ใช้วิธีที่ 2 (แก้ไข policies) เพื่อความปลอดภัย
- RLS policies จะถูกจัดการผ่าน API routes ที่ใช้ service role key

## ไฟล์ที่เกี่ยวข้อง

- `fix-rls-policies.sql` - SQL สำหรับแก้ไข policies
- `disable-rls-temp.sql` - SQL สำหรับ disable RLS ชั่วคราว
- `test-supabase-connection.js` - สคริปต์ทดสอบการเชื่อมต่อ
