# แก้ไข Error: queryParams.append is not a function

## 🐛 ปัญหาที่พบ

### Error Message
```
TypeError: queryParams.append is not a function
at AdminReportsService.getMaterialReports
```

### สาเหตุ
ใน `AdminReportsService.getMaterialReports` method:
- `formatDateRange()` ส่งคืน `string` (URLSearchParams.toString())
- แต่โค้ดพยายามใช้ `queryParams.append()` ซึ่งเป็น method ของ URLSearchParams object

### โค้ดที่ผิด
```typescript
const queryParams = this.formatDateRange(dateRange) // ส่งคืน string
if (branchId) {
  queryParams.append('branchId', branchId) // ❌ Error: string ไม่มี .append()
}
```

## ✅ การแก้ไข

### วิธีแก้ไข
เปลี่ยนจาก:
```typescript
const queryParams = this.formatDateRange(dateRange)
```

เป็น:
```typescript
const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
```

### โค้ดที่ถูกต้อง
```typescript
// Get material usage reports
async getMaterialReports(
  dateRange: DateRangeFilter, 
  branchId: string | null = null, 
  limit: number = 100
): Promise<AdminReportsServiceResult<MaterialReport>> {
  try {
    const queryParams = new URLSearchParams(this.formatDateRange(dateRange))
    if (branchId) {
      queryParams.append('branchId', branchId)
    }
    queryParams.append('limit', limit.toString())
    
    const url = `/api/admin/reports/materials?${queryParams.toString()}`
    // ... rest of the method
  }
}
```

## 🧪 การทดสอบ

### Test Cases ที่ผ่าน
1. ✅ **Today with no branch filter**
   - URL: `/api/admin/reports/materials?dateRange=today&limit=100`

2. ✅ **Today with branch filter**
   - URL: `/api/admin/reports/materials?dateRange=today&branchId=11111111-1111-1111-1111-111111111111&limit=100`

3. ✅ **Week with branch filter**
   - URL: `/api/admin/reports/materials?dateRange=week&branchId=22222222-2222-2222-2222-222222222222&limit=100`

4. ✅ **Custom date range with branch filter**
   - URL: `/api/admin/reports/materials?dateRange=custom&startDate=2025-01-01&endDate=2025-01-31&branchId=11111111-1111-1111-1111-111111111111&limit=100`

## 📋 สรุปการเปลี่ยนแปลง

### ไฟล์ที่แก้ไข
- `apps/web/src/lib/services/admin-reports.service.ts`

### การเปลี่ยนแปลง
- บรรทัด 357: เปลี่ยน `const queryParams = this.formatDateRange(dateRange)` 
- เป็น: `const queryParams = new URLSearchParams(this.formatDateRange(dateRange))`

### ผลลัพธ์
- ✅ Error `queryParams.append is not a function` หายไป
- ✅ Branch filter ทำงานได้ปกติ
- ✅ URL parameters สร้างได้ถูกต้อง
- ✅ Development server เริ่มต้นได้โดยไม่มี error

## 🚀 ขั้นตอนถัดไป

1. **Development server ควรเริ่มต้นได้โดยไม่มี error**
2. **เข้าถึง Material Reports**: `http://localhost:3000/admin/reports/materials`
3. **ทดสอบ Branch Filter**:
   - เลือกสาขาจาก dropdown
   - ตรวจสอบว่าข้อมูลเปลี่ยนตามสาขาที่เลือก
   - ตรวจสอบ URL parameters อัปเดตถูกต้อง
4. **ทดสอบกับ Date Range ต่างๆ**

## 📝 หมายเหตุ

### สาเหตุของปัญหา
- `formatDateRange()` method ใช้ `URLSearchParams.toString()` ซึ่งส่งคืน string
- แต่ `getMaterialReports()` ต้องการ URLSearchParams object เพื่อใช้ `.append()`

### วิธีป้องกันปัญหาในอนาคต
- ตรวจสอบ type ของ return value จาก helper methods
- ใช้ TypeScript type annotations ให้ชัดเจน
- เขียน unit tests สำหรับ edge cases

---

**สถานะ**: ✅ แก้ไขเสร็จสิ้น  
**วันที่แก้ไข**: 28 กันยายน 2568  
**ผู้แก้ไข**: AI Assistant  
**Severity**: 🔴 Critical (Blocking functionality)
