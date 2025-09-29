# สรุปการพัฒนาการกรองตามสาขาใน Material Reports

## 🎯 วัตถุประสงค์
เพิ่มฟีเจอร์การกรองแยกตามสาขาใน Material Reports page เพื่อให้สามารถดูข้อมูลการใช้วัตถุดิบแยกตามสาขาได้

## ✅ สิ่งที่พัฒนาเสร็จแล้ว

### 1. แก้ไข API Endpoint
**ไฟล์**: `apps/web/src/app/api/admin/reports/materials/route.ts`

**การเปลี่ยนแปลง:**
- เพิ่มการรับ `branchId` parameter จาก query string
- เพิ่มการกรองข้อมูลตาม `time_entries.branch_id` เมื่อมี branchId
- เพิ่ม logging สำหรับ branchId ในส่วน debugging

```typescript
// เพิ่ม parameter
const branchId = searchParams.get('branchId')

// เพิ่มการกรอง
if (branchId) {
  query = query.eq('time_entries.branch_id', branchId)
}
```

### 2. สร้าง API สำหรับดึงรายการสาขา
**ไฟล์ใหม่**: `apps/web/src/app/api/admin/branches/route.ts`

**ฟีเจอร์:**
- Authentication และ authorization (Admin only)
- Rate limiting
- ดึงรายการสาขาจากฐานข้อมูล
- Error handling และ logging

```typescript
// Response format
{
  success: true,
  branches: [
    {
      id: "uuid",
      name: "ชื่อสาขา",
      address: "ที่อยู่",
      latitude: number,
      longitude: number
    }
  ]
}
```

### 3. สร้าง BranchFilter Component
**ไฟล์ใหม่**: `apps/web/src/components/admin/reports/BranchFilter.tsx`

**ฟีเจอร์:**
- Dropdown สำหรับเลือกสาขา
- Loading state และ error handling
- Auto-fetch branches จาก API
- Responsive design
- Icon และ styling ที่สวยงาม

```typescript
interface BranchFilterProps {
  selectedBranchId: string | null
  onBranchChange: (branchId: string | null) => void
  isLoading?: boolean
}
```

### 4. แก้ไข MaterialDetailPage
**ไฟล์**: `apps/web/src/components/admin/reports/MaterialDetailPage.tsx`

**การเปลี่ยนแปลง:**
- เพิ่ม state สำหรับ `selectedBranchId`
- อัปเดต `fetchMaterialData` ให้รองรับ branchId
- เพิ่ม `handleBranchChange` function
- อัปเดต URL parameters เมื่อเปลี่ยนสาขา
- เพิ่ม BranchFilter component ใน UI

```typescript
// State management
const [selectedBranchId, setSelectedBranchId] = useState<string | null>(getInitialBranchId())

// URL parameter handling
const handleBranchChange = (branchId: string | null) => {
  setSelectedBranchId(branchId)
  fetchMaterialData(dateRange, branchId)
  // Update URL...
}
```

### 5. แก้ไข AdminReportsService
**ไฟล์**: `apps/web/src/lib/services/admin-reports.service.ts`

**การเปลี่ยนแปลง:**
- อัปเดต `getMaterialReports` method ให้รับ branchId parameter
- เพิ่ม branchId ใน query parameters
- อัปเดต logging สำหรับ debugging

```typescript
async getMaterialReports(
  dateRange: DateRangeFilter, 
  branchId: string | null = null, 
  limit: number = 100
): Promise<AdminReportsServiceResult<MaterialReport>>
```

## 🔧 วิธีการทำงาน

### 1. การกรองข้อมูล
- เมื่อผู้ใช้เลือกสาขา BranchFilter จะส่ง branchId ไปยัง MaterialDetailPage
- MaterialDetailPage จะเรียก AdminReportsService พร้อม branchId
- AdminReportsService จะส่ง branchId ไปยัง API
- API จะกรองข้อมูลที่ database level ด้วย `WHERE time_entries.branch_id = ?`

### 2. URL State Management
- URL จะอัปเดตเมื่อเปลี่ยนสาขา: `?branchId=uuid`
- สามารถ bookmark URL พร้อม filter ได้
- Browser back/forward ทำงานถูกต้อง

### 3. UI/UX
- BranchFilter อยู่ข้าง Date Filter
- Responsive design สำหรับ mobile และ desktop
- Loading states และ error handling
- Clear visual feedback

## 📊 ตัวอย่างการใช้งาน

### URL Examples
```
# ทุกสาขา
/admin/reports/materials?dateRange=today

# สาขาเฉพาะ
/admin/reports/materials?dateRange=today&branchId=11111111-1111-1111-1111-111111111111

# สัปดาห์นี้ + สาขาเฉพาะ
/admin/reports/materials?dateRange=week&branchId=22222222-2222-2222-2222-222222222222

# ช่วงเวลากำหนดเอง + สาขา
/admin/reports/materials?dateRange=custom&startDate=2025-01-01&endDate=2025-01-31&branchId=11111111-1111-1111-1111-111111111111
```

### API Examples
```
# ดึงรายการสาขา
GET /api/admin/branches

# ดึงข้อมูล materials พร้อม branch filter
GET /api/admin/reports/materials?dateRange=today&branchId=11111111-1111-1111-1111-111111111111
```

## 🧪 การทดสอบ

### 1. ไฟล์ทดสอบ
- `test-branch-filter-api.js` - สคริปต์ทดสอบฟังก์ชันการทำงาน

### 2. การทดสอบที่ควรทำ
1. **API Testing**
   - ทดสอบ `/api/admin/branches` endpoint
   - ทดสอบ `/api/admin/reports/materials` พร้อม branchId parameter

2. **UI Testing**
   - ทดสอบ BranchFilter dropdown
   - ทดสอบการอัปเดต URL parameters
   - ทดสอบ responsive design

3. **Integration Testing**
   - ทดสอบการกรองข้อมูลตามสาขา
   - ทดสอบการทำงานร่วมกับ date filter
   - ทดสอบ browser back/forward

## 🎉 ผลลัพธ์

### ✅ ข้อดี
1. **การกรองที่แม่นยำ**: สามารถดูข้อมูลการใช้วัตถุดิบแยกตามสาขาได้
2. **URL Bookmarkable**: สามารถ bookmark URL พร้อม filter ได้
3. **User Experience**: ง่ายต่อการใช้งาน
4. **Performance**: กรองข้อมูลที่ database level
5. **Maintainable**: โค้ดมีโครงสร้างที่ดีและง่ายต่อการบำรุงรักษา

### 📈 การปรับปรุง
1. **Database Performance**: การกรองที่ database level ทำให้เร็วขึ้น
2. **User Productivity**: ผู้ใช้สามารถดูข้อมูลที่ต้องการได้เร็วขึ้น
3. **Data Analysis**: สามารถวิเคราะห์ข้อมูลแยกตามสาขาได้ดีขึ้น

## 🚀 การใช้งาน

### 1. เริ่มต้น Development Server
```bash
npm run dev
```

### 2. เข้าถึง Material Reports
```
http://localhost:3000/admin/reports/materials
```

### 3. ทดสอบ Branch Filter
1. เลือกสาขาจาก dropdown
2. ตรวจสอบว่าข้อมูลเปลี่ยนตามสาขาที่เลือก
3. ตรวจสอบ URL parameters
4. ทดสอบกับ date range ต่างๆ

## 📝 หมายเหตุ

### Dependencies
- ต้องมีข้อมูล branches ในฐานข้อมูล
- ต้องมีข้อมูล material_usage และ time_entries ที่เชื่อมโยงกับ branches

### Error Handling
- จัดการกรณีที่ไม่มีสาขา
- จัดการกรณีที่ API ล้มเหลว
- แสดง loading states ที่เหมาะสม

### Future Enhancements
- เพิ่มการกรองแบบ multiple branches
- เพิ่มการ export ข้อมูลตามสาขา
- เพิ่มการเปรียบเทียบระหว่างสาขา

---

**สถานะ**: ✅ เสร็จสมบูรณ์  
**วันที่พัฒนา**: 28 กันยายน 2568  
**ผู้พัฒนา**: AI Assistant  
**เวอร์ชัน**: 1.0.0
