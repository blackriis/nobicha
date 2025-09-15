# Next.js 15 Compatibility Guide - Async Cookies Implementation

## ภาพรวม

เอกสารนี้อธิบายการปรับปรุงระบบให้รองรับ Next.js 15 ที่เปลี่ยน `cookies()` function ให้เป็น async

## ปัญหาที่พบ

### ใน Next.js 14 และก่อนหน้า
```typescript
// ✅ ใน Next.js 14 - cookies() เป็น sync function
export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(/* ... */)
}
```

### ใน Next.js 15
```typescript
// ❌ ใน Next.js 15 - จะเกิด error
export const createClient = () => {
  const cookieStore = cookies() // Error: cookies() must be awaited
  return createServerClient(/* ... */)
}
```

## การแก้ไขที่ดำเนินการ

### 1. อัพเดท Supabase Server Client

**ไฟล์**: `apps/web/src/lib/supabase-server.ts`

```typescript
// ✅ หลังการแก้ไข
export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(/* ... */)
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(/* ... */)
}
```

### 2. อัพเดท API Routes ทั้งหมด

**ไฟล์ที่ได้รับการปรับปรุง**:
- `apps/web/src/app/api/user/profile/route.ts`
- `apps/web/src/app/api/employee/time-entries/check-in/route.ts`
- `apps/web/src/app/api/employee/time-entries/check-out/route.ts`
- `apps/web/src/app/api/employee/time-entries/status/route.ts`
- และ API routes อื่นๆ ทั้งหมด

**Pattern การแก้ไข**:
```typescript
// ❌ ก่อนแก้ไข
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  // ...
}

// ✅ หลังแก้ไข
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  // ...
}
```

## ผลลัพธ์

### Before ❌
```
Error: Route "/api/user/profile" used `cookies().get('sb-token')`. 
`cookies()` should be awaited before using its value.
```

### After ✅
- ไม่มี cookies error
- API routes ทำงานปกติ
- E2E tests ผ่าน

## Best Practices สำหรับ Next.js 15

1. **Always await cookies()**: ใช้ `await cookies()` เสมอใน server components/API routes
2. **Update function signatures**: เปลี่ยน function เป็น async เมื่อจำเป็น
3. **Consistent pattern**: ใช้ pattern เดียวกันทั่วทั้งโปรเจค

## Checklist การอัพเกรด

- [x] อัพเดท `supabase-server.ts` functions
- [x] แก้ไข API routes ทั้งหมด
- [x] ทดสอบ authentication flow
- [x] ทดสอบ E2E tests
- [x] ตรวจสอบ console errors

## การทดสอบ

```bash
# ทดสอบ API routes
npm run test:e2e -- --grep "authentication"

# ตรวจสอบ console errors
npm run dev
# เปิด browser console และดูว่าไม่มี cookies errors
```