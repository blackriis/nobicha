# การปรับปรุงระบบ Login ให้รองรับทั้ง Username และ Email

## สรุปการเปลี่ยนแปลง

ระบบ authentication ได้รับการปรับปรุงให้ผู้ใช้สามารถเข้าสู่ระบบด้วย **Username** หรือ **Email** ก็ได้

---

## ไฟล์ที่มีการเปลี่ยนแปลง

### 1. Database Schema
- **[packages/database/types.ts](packages/database/types.ts:19)** - เพิ่ม `username?: string` field ใน User interface

### 2. Database Migration
- **[supabase/migrations/20251201_add_username_to_users.sql](supabase/migrations/20251201_add_username_to_users.sql)** (ไฟล์ใหม่)
  - เพิ่ม `username` column (VARCHAR(50), UNIQUE)
  - สร้าง index สำหรับ username lookups
  - Username เป็น optional field

### 3. Validation Logic
- **[apps/web/src/lib/validation.ts](apps/web/src/lib/validation.ts)**
  - เพิ่ม `USERNAME_REGEX` pattern
  - เพิ่มฟังก์ชัน `validateUsername()` - ตรวจสอบ username (3-50 ตัวอักษร, อนุญาตเฉพาะ a-z, A-Z, 0-9, _, -)
  - เพิ่มฟังก์ชัน `isEmail()` - ตรวจสอบว่า input เป็น email หรือไม่
  - ปรับปรุง `validateSignInData()` - รองรับทั้ง email และ username

### 4. API Route
- **[apps/web/src/app/api/auth/lookup-username/route.ts](apps/web/src/app/api/auth/lookup-username/route.ts)** (ไฟล์ใหม่)
  - API endpoint สำหรับค้นหา email จาก username
  - ใช้ admin client เพื่อ bypass RLS
  - Return email ของ user ถ้าพบ username

### 5. Authentication Logic
- **[apps/web/src/lib/auth.ts](apps/web/src/lib/auth.ts:18)**
  - เปลี่ยนชื่อ parameter จาก `email` เป็น `identifier`
  - ตรวจสอบว่า input เป็น email หรือ username
  - ถ้าเป็น username จะเรียก API `/api/auth/lookup-username` เพื่อแปลงเป็น email ก่อน login
  - ใช้ email ในการ authenticate กับ Supabase

### 6. Login Form UI
- **[apps/web/src/components/auth/LoginForm.tsx](apps/web/src/components/auth/LoginForm.tsx:20)**
  - เปลี่ยน state จาก `email` เป็น `identifier`
  - เปลี่ยน label เป็น "Username หรืออีเมล"
  - เปลี่ยน placeholder เป็น "กรุณากรอก username หรืออีเมล"
  - เปลี่ยน input type จาก `email` เป็น `text`
  - อัพเดท error message ให้ครอบคลุมทั้ง username และ email

---

## วิธีการใช้งาน

### 1. Run Database Migration

คุณต้อง run migration เพื่อเพิ่ม `username` column ในตาราง `users`:

```bash
# ถ้าใช้ Supabase CLI
supabase db push

# หรือ run migration ผ่าน Supabase Dashboard:
# 1. เปิด Supabase Dashboard
# 2. ไปที่ SQL Editor
# 3. Copy content จากไฟล์ supabase/migrations/20251201_add_username_to_users.sql
# 4. Run SQL
```

### 2. เพิ่ม Username ให้กับ Users ที่มีอยู่แล้ว (Optional)

ถ้าต้องการให้ users ที่มีอยู่แล้วมี username:

```sql
-- ตัวอย่าง: ตั้ง username จากส่วนแรกของ email
UPDATE users
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- หรือ set username manually
UPDATE users
SET username = 'admin_user'
WHERE email = 'admin@example.com';
```

### 3. ทดสอบการ Login

หลังจาก run migration แล้ว ผู้ใช้สามารถ login ได้ 2 วิธี:

#### Login ด้วย Email (เหมือนเดิม):
- Username/Email: `user@example.com`
- Password: `********`

#### Login ด้วย Username (ใหม่):
- Username/Email: `john_doe`
- Password: `********`

---

## Technical Flow

### Login ด้วย Email:
1. User กรอก email + password
2. Validation ตรวจสอบว่าเป็น email format
3. เรียก `supabase.auth.signInWithPassword()` โดยตรง

### Login ด้วย Username:
1. User กรอก username + password
2. Validation ตรวจสอบว่าไม่ใช่ email format → เป็น username
3. เรียก API `/api/auth/lookup-username` เพื่อค้นหา email
4. API query database: `SELECT email FROM users WHERE username = ?`
5. ได้ email แล้วเรียก `supabase.auth.signInWithPassword()`

---

## Security Considerations

1. **Username Lookup API** ใช้ admin client (service role key) เพื่อ bypass RLS
2. API ไม่เปิดเผยว่า username มีอยู่หรือไม่ (return "Invalid credentials" ในทุกกรณี)
3. Username ต้อง unique ในฐานข้อมูล
4. Username validation อนุญาตเฉพาะตัวอักษร, ตัวเลข, underscore และ hyphen
5. ไม่มี rate limiting ที่ API level (อาจต้องเพิ่มในอนาคต)

---

## การทดสอบ

### Manual Testing:
```bash
# 1. Start development server
npm run dev

# 2. เปิดหน้า login
# http://localhost:3000

# 3. ทดสอบ login ด้วย:
#    - Email: user@example.com
#    - Username: john_doe (ถ้ามี)
```

### E2E Testing:
```bash
# Run existing login tests (should still work with email)
npm run test:e2e
```

---

## TODO (Optional Improvements)

- [ ] เพิ่ม rate limiting ที่ `/api/auth/lookup-username`
- [ ] เพิ่ม audit logging สำหรับ username lookups
- [ ] เพิ่ม username field ในหน้า Sign Up
- [ ] เพิ่ม username field ในหน้า Profile/Settings เพื่อให้ user สามารถตั้งค่า username ได้
- [ ] เพิ่ม validation ป้องกัน reserved usernames (เช่น 'admin', 'root', 'system')
- [ ] เพิ่ม test cases สำหรับ username login flow

---

## Rollback Instructions

ถ้าต้องการยกเลิกการเปลี่ยนแปลง:

```sql
-- Drop username column
ALTER TABLE users DROP COLUMN IF EXISTS username;
DROP INDEX IF EXISTS idx_users_username;
```

จากนั้น revert code changes ด้วย git:
```bash
git checkout HEAD -- apps/web/src
git checkout HEAD -- packages/database/types.ts
```
