# E2E Testing Best Practices - Data TestID Implementation

## ภาพรวม

เอกสารนี้อธิบายการปรับปรุง E2E testing ให้มีความเชื่อถือได้สูงขึ้นโดยใช้ `data-testid` attributes แทนการอาศัย text content

## ปัญหาของวิธีเดิม

### ❌ Text-based Selectors (ไม่แนะนำ)
```typescript
// ปัญหา: พึ่งพา text ที่เปลี่ยนแปลงได้ง่าย
await page.click('button:has-text("เข้างาน")')
await page.click('button:has-text("เช็คอิน")')
await page.locator('text=การเข้าถึงตำแหน่งถูกปฏิเสธ')

// ปัญหา:
// 1. เปลี่ยนภาษา = test พัง
// 2. เปลี่ยน UI text = test พัง  
// 3. Localization = test พัง
// 4. ไม่สามารถแยกแยะ element ที่มี text เหมือนกันได้
```

## วิธีการใหม่ที่แนะนำ

### ✅ Data-TestID Selectors
```typescript
// ✅ มั่นคงและเชื่อถือได้
await page.click('[data-testid="checkin-button"]')
await page.click('[data-testid="checkout-button"]')
await page.locator('[data-testid="location-error"]')

// ข้อดี:
// 1. ไม่ขึ้นกับการเปลี่ยนแปลง text
// 2. ชัดเจนและ specific
// 3. รองรับ internationalization
// 4. แยกแยะ elements ได้อย่างแม่นยำ
```

## การปรับใช้ในโปรเจค

### 1. อัพเดท Components

**ไฟล์**: `apps/web/src/components/employee/TimeEntryActionButtons.tsx`

```typescript
// ✅ เพิ่ม data-testid attributes
<Button
  onClick={onCheckIn}
  disabled={isButtonDisabled}
  data-testid="checkin-button"     // 🎯 Key improvement
  data-action="checkin"            // 🎯 Additional metadata
  className="..."
>
  <div>เช็คอิน + เซลฟี่</div>
</Button>
```

### 2. อัพเดท E2E Tests

**ไฟล์**: `apps/web/e2e/final-selfie-test.spec.ts`

```typescript
// ❌ เดิม - ไม่เชื่อถือได้
const checkInButton = await page.locator('button:has-text("เข้างาน")')

// ✅ ใหม่ - เชื่อถือได้
const checkInButton = await page.locator('[data-testid="checkin-button"]')
```

## TestID Naming Convention

### รูปแบบที่แนะนำ
```typescript
// Format: [component]-[action/purpose]-[type]
data-testid="checkin-button"
data-testid="checkout-button"  
data-testid="branch-selector"
data-testid="selfie-capture"
data-testid="location-error"
data-testid="upload-progress"

// Additional metadata attributes
data-action="checkin|checkout"
data-state="loading|success|error"
data-role="employee|admin"
```

### หลีกเลี่ยงรูปแบบเหล่านี้
```typescript
// ❌ ใช้ space หรือ special characters
data-testid="check in button"  

// ❌ ใช้ตัวพิมพ์ใหญ่
data-testid="CheckInButton"     

// ❌ ใช้ text content
data-testid="เช็คอิน"           

// ❌ ใช้ไม่เฉพาะเจาะจง  
data-testid="button1"           
```

## Strategic TestID Placement

### 1. Critical User Actions
```typescript
// ✅ Actions ที่สำคัญต้องมี testid
data-testid="login-submit"
data-testid="checkin-button" 
data-testid="checkout-button"
data-testid="selfie-capture"
data-testid="branch-select"
```

### 2. State Indicators
```typescript
// ✅ สถานะที่สำคัญ
data-testid="loading-spinner"
data-testid="success-message"
data-testid="error-alert"
data-testid="upload-progress"
```

### 3. Navigation Elements
```typescript
// ✅ การนำทาง
data-testid="dashboard-nav"
data-testid="profile-menu"
data-testid="logout-button"
```

## E2E Test Patterns

### 1. Element Waiting Pattern
```typescript
// ✅ รอให้ element ปรากฏก่อนโต้ตอบ
const button = page.locator('[data-testid="checkin-button"]')
await button.waitFor({ state: 'visible' })
await button.click()
```

### 2. State Verification Pattern  
```typescript
// ✅ ตรวจสอบสถานะด้วย testid + attribute
const button = page.locator('[data-testid="checkin-button"]')
await expect(button).toHaveAttribute('data-action', 'checkin')
await expect(button).toBeVisible()
await expect(button).not.toBeDisabled()
```

### 3. Multi-step Flow Pattern
```typescript
// ✅ ขั้นตอนการทำงานแบบ sequence
await page.click('[data-testid="checkin-button"]')
await page.waitForSelector('[data-testid="branch-selector"]')
await page.click('[data-testid="branch-option-first"]') 
await page.waitForSelector('[data-testid="selfie-capture"]')
```

## Benefits Achieved

### 1. Stability
- Tests ไม่พังเมื่อเปลี่ยน UI text
- ไม่ขึ้นกับ styling หรือ layout changes
- รองรับ internationalization

### 2. Maintainability  
- ง่ายต่อการ debug เมื่อ test ล้มเหลว
- ชัดเจนว่า test กำลัง interact กับ element ไหน
- Refactoring ง่ายขึ้น

### 3. Performance
- Selector ทำงานเร็วกว่า text-based queries
- ไม่ต้อง parse text content
- Playwright optimizations สำหรับ attribute selectors

## Migration Checklist

- [x] เพิ่ม `data-testid` ใน TimeEntryActionButtons
- [x] อัพเดท E2E tests ให้ใช้ testid selectors
- [ ] เพิ่ม testid ใน components อื่นๆ ตามต้องการ
- [ ] Review และ standardize naming convention
- [ ] อัพเดท team documentation

## ตัวอย่างการทดสอบ

```bash
# ทดสอบ E2E ใหม่
npm run test:e2e -- --grep "Final Selfie"

# ผลลัพธ์ที่คาดหวัง:
# ✅ checkInButton: true
# ✅ actionStarted: true  
# ✅ Test stability improved
```