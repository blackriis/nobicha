# CheckInOutCard Unit Tests

ไฟล์ unit tests สำหรับ CheckInOutCard component ที่ครอบคลุมการทดสอบฟังก์ชันหลักๆ และสถานะต่างๆ

## ไฟล์ที่เกี่ยวข้อง

- `CheckInOutCard.test.tsx` - Unit tests หลัก
- `CheckInOutCard.integration.test.tsx` - Integration tests
- `test-utils.tsx` - Test utilities และ helper functions
- `setup.ts` - Test setup และ mocks
- `vitest.config.ts` - Vitest configuration

## การรัน Tests

```bash
# รัน tests ทั้งหมด
npm run test

# รัน tests แบบ watch mode
npm run test:ui

# รัน tests แบบ one-time
npm run test:run

# รัน tests เฉพาะ CheckInOutCard
npm run test CheckInOutCard

# รัน tests พร้อม coverage
npm run test -- --coverage
```

## Test Coverage

### Unit Tests (`CheckInOutCard.test.tsx`)

1. **Initial Render**
   - ✅ แสดง main card พร้อม title และ description
   - ✅ แสดง TimeEntryStatus component
   - ✅ แสดง TimeEntryActionButtons เมื่อไม่ได้อยู่ในสถานะพิเศษ
   - ✅ แสดง loading spinner เมื่อไม่มี employeeId

2. **Network Status**
   - ✅ แสดง offline warning เมื่อเครือข่ายออฟไลน์

3. **Check In Flow**
   - ✅ แสดง branch selector เมื่อคลิกปุ่ม check in
   - ✅ ไปยัง selfie capture หลังจากเลือกสาขา
   - ✅ เช็คอินสำเร็จ
   - ✅ จัดการการยกเลิกการเช็คอิน

4. **Check Out Flow**
   - ✅ แสดง selfie capture โดยตรงสำหรับ check out
   - ✅ เช็คเอาท์สำเร็จ
   - ✅ แสดง confirmation dialog สำหรับชั่วโมงทำงานสั้น
   - ✅ แสดง confirmation dialog สำหรับชั่วโมงทำงานยาว
   - ✅ ดำเนินการต่อหลัง confirmation

5. **Error Handling**
   - ✅ แสดง geolocation permission error
   - ✅ แสดง geolocation timeout error
   - ✅ แสดง service error ระหว่างเช็คอิน
   - ✅ ให้ตัวเลือก retry สำหรับ GPS errors
   - ✅ จัดการ retry button click

6. **Step Progress**
   - ✅ แสดง step progress ที่ถูกต้องสำหรับ check in flow
   - ✅ แสดง step progress ที่ถูกต้องสำหรับ check out flow

7. **Success Animation**
   - ✅ แสดง success animation หลังเช็คอิน
   - ✅ เสร็จสิ้น success animation เมื่อ onComplete ถูกเรียก

8. **Auto-hide Messages**
   - ✅ ซ่อน success message อัตโนมัติหลัง 5 วินาที

### Integration Tests (`CheckInOutCard.integration.test.tsx`)

1. **Complete Check In Flow**
   - ✅ ดำเนินการเช็คอินเต็มรูปแบบสำเร็จ
   - ✅ จัดการการยกเลิกที่ branch selection
   - ✅ จัดการการยกเลิกที่ selfie capture

2. **Complete Check Out Flow**
   - ✅ ดำเนินการเช็คเอาท์เต็มรูปแบบสำเร็จ
   - ✅ แสดง confirmation dialog สำหรับชั่วโมงทำงานสั้น
   - ✅ แสดง confirmation dialog สำหรับชั่วโมงทำงานยาว
   - ✅ ดำเนินการต่อหลัง confirmation
   - ✅ ยกเลิกเช็คเอาท์หลัง confirmation dialog

3. **Error Handling Integration**
   - ✅ จัดการ geolocation permission denied error
   - ✅ จัดการ geolocation timeout error
   - ✅ จัดการ service error ระหว่างเช็คอิน
   - ✅ retry GPS หลัง error

4. **Network Status Integration**
   - ✅ แสดง offline warning เมื่อเครือข่ายออฟไลน์

5. **Step Progress Integration**
   - ✅ แสดง step progress ที่ถูกต้องตลอด check in flow
   - ✅ แสดง step progress ที่ถูกต้องสำหรับ check out flow

6. **Success Animation Integration**
   - ✅ เสร็จสิ้น success animation flow

## Mock Components

Tests ใช้ mocked components เพื่อแยกการทดสอบ CheckInOutCard ออกจาก dependencies:

- `TimeEntryStatus` - แสดงสถานะการบันทึกเวลา
- `BranchSelector` - เลือกสาขาสำหรับเช็คอิน
- `SelfieCapture` - ถ่ายรูปยืนยันตัวตน
- `TimeEntryActionButtons` - ปุ่มเช็คอิน/เช็คเอาท์
- `StepProgress` - แสดงขั้นตอนการทำงาน
- `ConfirmationDialog` - dialog ยืนยันการทำงาน
- `SuccessAnimation` - animation เมื่อสำเร็จ
- `LoadingSpinner` - แสดง loading states

## Test Utilities

`test-utils.tsx` มี helper functions:

- `renderCheckInOutCard()` - Custom render function
- `createMockGeolocationPosition()` - สร้าง mock geolocation data
- `createMockTimeEntryStatus()` - สร้าง mock time entry status
- `userInteractions` - Helper functions สำหรับ user interactions
- `waitForStates` - Helper functions สำหรับรอ states
- `assertions` - Helper functions สำหรับ assertions

## Mock Services

- `timeEntryService` - Mock service สำหรับ time entry operations
- `navigator.geolocation` - Mock geolocation API
- `navigator.onLine` - Mock network status

## การทดสอบ Error Scenarios

Tests ครอบคลุม error scenarios ต่างๆ:

1. **Geolocation Errors**
   - Permission denied (code: 1)
   - Position unavailable (code: 2)
   - Timeout (code: 3)

2. **Service Errors**
   - Network connection failed
   - API timeout
   - Upload failures

3. **User Cancellation**
   - Cancel branch selection
   - Cancel selfie capture
   - Cancel confirmation dialog

## การทดสอบ Edge Cases

1. **Working Hours Validation**
   - Short working hours (< 2 hours)
   - Long working hours (> 12 hours)
   - Normal working hours (2-12 hours)

2. **Network Status**
   - Online/offline transitions
   - Network error handling

3. **Component States**
   - Loading states
   - Error states
   - Success states
   - Idle states

## Best Practices ที่ใช้

1. **Arrange-Act-Assert Pattern**
2. **Descriptive Test Names**
3. **Mock External Dependencies**
4. **Test User Interactions**
5. **Test Error Scenarios**
6. **Test Edge Cases**
7. **Use WaitFor for Async Operations**
8. **Clean Up After Each Test**

## การเพิ่ม Tests ใหม่

เมื่อเพิ่มฟีเจอร์ใหม่ใน CheckInOutCard:

1. เพิ่ม unit test ใน `CheckInOutCard.test.tsx`
2. เพิ่ม integration test ใน `CheckInOutCard.integration.test.tsx`
3. อัปเดต test utilities ถ้าจำเป็น
4. อัปเดต mock components ถ้าจำเป็น
5. รัน tests เพื่อให้แน่ใจว่าผ่านทั้งหมด

## การ Debug Tests

```bash
# รัน tests แบบ verbose
npm run test -- --reporter=verbose

# รัน tests เฉพาะไฟล์
npm run test CheckInOutCard.test.tsx

# รัน tests พร้อม debug
npm run test -- --inspect-brk
```
