# Deeplink Testing Guide

## การเปิดใช้งาน Deeplink - คู่มือการทดสอบ

### รายละเอียดการทำงาน

Deeplink ถูกเปิดใช้งานแล้วในระบบ โดยมีกลไกการทำงานดังนี้:

1. **Middleware** จะเก็บ path ที่ผู้ใช้พยายามเข้าถึงไว้ใน query parameter และ cookie
2. **LoginForm** จะอ่าน path ที่เก็บไว้และ redirect ไปยังหน้านั้นหลังจาก login สำเร็จ
3. **Security** - ตรวจสอบว่า path เป็น internal path เท่านั้น (ขึ้นต้นด้วย '/')

### วิธีการทดสอบ

#### 1. ทดสอบ Query Parameter Redirect
```bash
# เปิด browser ไปที่ URL ที่ต้องการทดสอบ
http://localhost:3000/admin/employees?redirectTo=/admin/reports
```

#### 2. ทดสอบ Direct Access (Middleware Redirect)
1. เปิด browser และไปที่ protected route โดยตรง:
   ```
   http://localhost:3000/admin/employees/123
   ```
2. ระบบจะ redirect ไป login page พร้อม query parameter:
   ```
   http://localhost:3000/login/employee?redirectTo=/admin/employees/123
   ```
3. Login ด้วยบัญชี admin
4. ระบบควร redirect ไปที่ `/admin/employees/123` แทนที่จะเป็น `/admin`

#### 3. ทดสอบ Cookie Persistence
1. ปิดแท็บ browser หลังจากถูก redirect ไป login page
2. เปิด browser ใหม่และไปที่ login page โดยตรง
3. Cookie ควรยังคงอยู่และ redirect ไป path เดิมหลัง login

#### 4. ทดสอบ Security Validation
1. พยายามใช้ external URL:
   ```
   http://localhost:3000/login/employee?redirectTo=https://evil.com
   ```
2. ระบบควร ignore external URL และ redirect ไป default dashboard

#### 5. ทดสอบ Cookie Cleanup
1. ทำการ login สำเร็จด้วย saved redirect path
2. ตรวจสอบว่า cookie `redirectTo` ถูกลบแล้ว
3. ลอง login ใหม่ - ควร redirect ไป default dashboard

### Expected Behavior
- ✅ Redirect ไปหน้าที่ต้องการหลัง login
- ✅ Cookie ถูกลบหลังใช้งาน
- ✅ Security validation ป้องกัน external URLs
- ✅ Fallback ไป default dashboard ถ้าไม่มี saved path

### Troubleshooting
- ถ้า redirect ไม่ทำงาน: ตรวจสอบ console log ใน browser dev tools
- ถ้า cookie ไม่ทำงาน: ตรวจสอบว่า browser อนุญาต cookie
- ถ้า security block: ตรวจสอบว่า path ขึ้นต้นด้วย '/' เท่านั้น