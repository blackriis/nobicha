# 🧪 GPS Error Testing Guide
## การทดสอบและแก้ไขปัญหา CoreLocation Errors

### 🚨 ปัญหาที่พบ: `kCLErrorLocationUnknown`

Error message: `CoreLocationProvider: CoreLocation framework reported a kCLErrorLocationUnknown failure.`

นี่เป็น error จาก iOS/macOS CoreLocation framework ที่เกิดขึ้นในระดับ system ไม่ใช่จากโค้ดของเรา

### 📋 Test Checklist

#### ✅ Pre-Testing Setup

- [ ] ตรวจสอบว่าใช้ HTTPS (geolocation ต้องการ secure context)
- [ ] เปิด Developer Tools (F12) เพื่อดู console logs
- [ ] ตรวจสอบ browser location permission settings
- [ ] ทดสอบในพื้นที่ที่มี GPS signal ดี (พื้นที่เปิดโล่ง)

#### 🔍 Testing Scenarios

**1. Normal GPS Test**
```javascript
// ทดสอบ basic geolocation
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('✅ GPS Success:', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
  },
  (error) => {
    console.error('❌ GPS Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
  },
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000
  }
);
```

**2. Permission Status Test**
```javascript
// ตรวจสอบ permission status
navigator.permissions.query({name: 'geolocation'})
  .then(result => {
    console.log('Permission Status:', result.state);
    // granted, denied, prompt
  });
```

**3. Error Code Testing**

| Error Code | ความหมาย | การทดสอบ |
|------------|-----------|-----------|
| 1 | PERMISSION_DENIED | ปฏิเสธ permission ใน browser |
| 2 | POSITION_UNAVAILABLE | ปิด GPS หรืออยู่ในพื้นที่ที่ GPS ไม่ทำงาน |
| 3 | TIMEOUT | รอนานเกินไป (timeout) |

### 🛠️ Troubleshooting Steps

#### Step 1: ตรวจสอบ Browser Settings

**Safari (iOS/macOS):**
```
Settings > Privacy & Security > Location Services
- เปิด Location Services
- เปิดสำหรับ Safari
- เลือก "While Using App" หรือ "Ask Next Time"
```

**Chrome:**
```
Settings > Privacy and Security > Site Settings > Location
- เลือก "Sites can ask for your location"
- ตรวจสอบว่าเว็บไซต์ไม่อยู่ใน "Blocked" list
```

#### Step 2: ทดสอบในสภาพแวดล้อมต่างๆ

- [ ] **Indoor Test**: ทดสอบในอาคาร (อาจมี GPS signal อ่อน)
- [ ] **Outdoor Test**: ทดสอบในพื้นที่เปิดโล่ง
- [ ] **Different Browsers**: ทดสอบใน Safari, Chrome, Firefox
- [ ] **Private Mode**: ทดสอบใน private/incognito mode

#### Step 3: Manual Location Input Test

หากยังไม่ได้ผล ให้ทดสอบ manual location input:

```javascript
// Test coordinates สำหรับแต่ละสาขา
const testLocations = {
  silom: { lat: 13.7563, lng: 100.5018 },
  sukhumvit: { lat: 13.7398, lng: 100.5612 },
  chatuchak: { lat: 13.8077, lng: 100.5538 }
};
```

### 🔧 Error Handling Implementation

ระบบมีการจัดการ error แล้วดังนี้:

#### 1. Enhanced Error Detection
```typescript
// ตรวจสอบ empty object error
if (error && typeof error === 'object' && Object.keys(error).length === 0) {
  console.error('🔥 Empty object error detected - browser serialization issue');
  errorMessage = 'ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาตรวจสอบการอนุญาต GPS';
}
```

#### 2. Specific Error Messages
```typescript
switch (error.code) {
  case 1: // PERMISSION_DENIED
    errorMessage = 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์';
    break;
  case 2: // POSITION_UNAVAILABLE
    errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง';
    break;
  case 3: // TIMEOUT
    errorMessage = 'หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง';
    break;
}
```

#### 3. Recovery Options
- ปุ่ม "ลองใหม่" สำหรับ retry GPS
- ปุ่ม "ป้อนตำแหน่งเอง" สำหรับ manual input
- ข้อความแนะนำการแก้ไขปัญหา

### 📊 Test Results Documentation

#### Expected Behaviors

**✅ Success Case:**
- GPS coordinates ได้รับสำเร็จ
- Accuracy < 100 เมตร (ในพื้นที่เปิดโล่ง)
- Check-in/out ทำงานปกติ

**⚠️ Warning Case:**
- GPS coordinates ได้รับแต่ accuracy > 1000 เมตร
- แสดง warning แต่ยังสามารถใช้งานได้
- แนะนำให้ย้ายไปพื้นที่ที่ GPS signal ดีกว่า

**❌ Error Case:**
- ไม่สามารถได้รับ GPS coordinates
- แสดงข้อความ error ที่เข้าใจง่าย
- มีปุ่ม recovery options

### 🧪 Test Script

สร้างไฟล์ `test-gps-errors.html` สำหรับทดสอบ:

```html
<!DOCTYPE html>
<html>
<head>
    <title>GPS Error Testing</title>
</head>
<body>
    <h1>GPS Error Testing</h1>
    
    <button onclick="testNormalGPS()">Test Normal GPS</button>
    <button onclick="testPermissionStatus()">Check Permission</button>
    <button onclick="testWithTimeout()">Test with Timeout</button>
    
    <div id="results"></div>
    
    <script>
        function testNormalGPS() {
            navigator.geolocation.getCurrentPosition(
                (pos) => showResult('✅ GPS Success', pos.coords),
                (err) => showResult('❌ GPS Error', err),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
            );
        }
        
        function testPermissionStatus() {
            navigator.permissions.query({name: 'geolocation'})
                .then(result => showResult('Permission Status', result.state));
        }
        
        function testWithTimeout() {
            navigator.geolocation.getCurrentPosition(
                (pos) => showResult('✅ GPS Success (Fast)', pos.coords),
                (err) => showResult('❌ GPS Timeout', err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
        
        function showResult(title, data) {
            const results = document.getElementById('results');
            results.innerHTML += `<h3>${title}</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    </script>
</body>
</html>
```

### 📝 Test Report Template

```markdown
## GPS Error Test Report

**Date:** [วันที่ทดสอบ]
**Tester:** [ชื่อผู้ทดสอบ]
**Device:** [อุปกรณ์ที่ใช้ทดสอบ]
**Browser:** [เบราว์เซอร์และเวอร์ชัน]
**Location:** [สถานที่ทดสอบ]

### Test Results

| Test Case | Result | Notes |
|-----------|--------|-------|
| Normal GPS | ✅/❌ | [หมายเหตุ] |
| Permission Check | ✅/❌ | [หมายเหตุ] |
| Indoor Test | ✅/❌ | [หมายเหตุ] |
| Outdoor Test | ✅/❌ | [หมายเหตุ] |
| Error Handling | ✅/❌ | [หมายเหตุ] |
| Recovery Options | ✅/❌ | [หมายเหตุ] |

### Issues Found
- [รายการปัญหาที่พบ]

### Recommendations
- [ข้อเสนอแนะการปรับปรุง]
```

### 🎯 Key Points สำหรับ Testers

1. **Error นี้เป็นเรื่องปกติ** - `kCLErrorLocationUnknown` เป็น system-level error ที่ไม่สามารถป้องกันได้ 100%

2. **ระบบจัดการได้แล้ว** - มีการ handle error และแสดงข้อความที่เหมาะสม

3. **มี Fallback Options** - ผู้ใช้สามารถป้อนตำแหน่งเองได้หาก GPS ไม่ทำงาน

4. **ทดสอบในสภาพแวดล้อมจริง** - ทดสอบทั้งในอาคารและพื้นที่เปิดโล่ง

5. **Document ผลการทดสอบ** - บันทึกผลการทดสอบเพื่อการปรับปรุงต่อไป

### 📞 Support

หากพบปัญหาที่ไม่สามารถแก้ไขได้:
1. ตรวจสอบ browser console logs
2. ทดสอบใน browser อื่น
3. ทดสอบในอุปกรณ์อื่น
4. ใช้ manual location input เป็น workaround