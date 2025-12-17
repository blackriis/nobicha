# Deeplink Testing - Final Instructions

## การทดสอบ Deeplink (อัปเดตแล้ว)

### ✅ การแก้ไขที่ทำไป:

1. **Middleware แก้ไขแล้ว**:
   - Redirect admin routes → `/login/admin?redirectTo=/admin/...`
   - Redirect employee routes → `/login/employee?redirectTo=/...`
   - Set HTTP-only cookie พร้อม query parameter

2. **LoginForm แก้ไขแล้ว**:
   - อ่าน redirect path จาก query parameters และ cookies
   - ตรวจสอบความปลอดภัย (path ต้องขึ้นต้นด้วย '/')
   - Logging เพิ่มเติมสำหรับ debugging

### 🧪 วิธีการทดสอง:

#### ขั้นที่ 1: สร้าง Test Users (ถ้ายังไม่มี)
```bash
./create-test-users.sh
```

#### ขั้นที่ 2: ทดสอบ Middleware Redirect
```bash
./test-deeplink.sh
```
ควรเห็น:
- `/admin/employees` → redirect ไป `/login/admin?redirectTo=%2Fadmin%2Femployees`
- `/dashboard` → redirect ไป `/login/employee?redirectTo=%2Fdashboard`

#### ขั้นที่ 3: ทดสอบใน Browser
1. **เปิด Incognito Window**
2. **ไปที่**: `http://localhost:3000/admin/employees`
3. **ควร redirect ไป**: `http://localhost:3000/login/admin?redirectTo=/admin/employees`
4. **Login ด้วย**: `admin@test.com` / `password123`
5. **ควร redirect ไป**: `http://localhost:3000/admin/employees` (ไม่ใช่ `/admin`)

#### ขั้นที่ 4: ตรวจสอบ Console Logs
เปิด Dev Tools และดู console ควรเห็น:
- Middleware logs: `🔐 Middleware: Redirecting unauthenticated user`
- LoginForm logs: `🔍 LoginForm: Found redirectTo in query`
- Login logs: `🚀 LoginForm: Redirecting to`

### 🔍 ถ้ายังไม่ทำงาน:

1. **ตรวจสอบ Console Logs** ใน browser dev tools
2. **ตรวจสอบ Server Logs** ใน terminal
3. **ตรวจสอบ Cookies**:
   ```javascript
   console.log('Cookies:', document.cookie)
   ```
4. **ตรวจสอบ Query Parameters**:
   ```javascript
   console.log('URL:', window.location.search)
   ```

### 🎯 Expected Behavior:
- ✅ Admin routes → admin login → redirect กลับ admin route
- ✅ Employee routes → employee login → redirect กลับ employee route  
- ✅ Security: ปฏิเสธ external URLs
- ✅ Cookie cleanup หลังใช้งาน

### 📝 Test Cases:
1. `http://localhost:3000/admin/employees` → login → `/admin/employees`
2. `http://localhost:3000/admin/employees/123/edit` → login → `/admin/employees/123/edit`
3. `http://localhost:3000/dashboard/daily-sales` → login → `/dashboard/daily-sales`
4. `http://localhost:3000/login/admin?redirectTo=https://evil.com` → login → `/admin` (security block)