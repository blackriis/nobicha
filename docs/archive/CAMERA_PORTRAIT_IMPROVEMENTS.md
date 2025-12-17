# การปรับปรุงกล้องเป็นแนวตั้งพร้อมกรอบวงรี

## การปรับปรุงที่ทำ

### 1. เปลี่ยนเป็น Portrait Orientation 📱

#### Video Element
```typescript
style={{
  width: '280px',      // ลดขนาดจากเดิม
  height: '420px',     // เพิ่มความสูง (อัตราส่วน 2:3)
  borderRadius: '140px', // ทำให้เป็นวงรี
  objectFit: 'cover',
  margin: '0 auto'
}}
```

#### Camera Constraints
```typescript
// เปลี่ยนจาก landscape เป็น portrait
video: {
  facingMode: 'user',
  width: { ideal: 720, max: 1080 },   // Portrait width
  height: { ideal: 1280, max: 1920 }  // Portrait height
}
```

### 2. กรอบวงรีสำหรับจัดท่า 🎯

#### Overlay Elements
```typescript
// กรอบวงรีหลัก
<div 
  style={{
    background: 'radial-gradient(ellipse 130px 200px at center, transparent 70%, rgba(0,0,0,0.3) 71%)',
    borderRadius: '140px'
  }}
/>

// กรอบวงรีนำทาง
<div 
  style={{
    width: '260px',
    height: '390px',
    border: '2px dashed rgba(59, 130, 246, 0.6)',
    borderRadius: '130px',
  }}
/>
```

#### UI Indicators
- 🔴 LIVE indicator ย้ายไปด้านล่าง
- กล้องหน้า label ย้ายไปด้านบน  
- Debug info ย้ายไปมุมขวาบน
- ทั้งหมดใช้ `transform: translate` เพื่อจัดกลาง

### 3. แก้ไขปัญหา Auto-Start 🔧

#### Delayed Initialization
```typescript
useEffect(() => {
  if (step === 'permission') {
    const timer = setTimeout(() => {
      requestCameraAccess(); // เริ่มหลังจาก DOM พร้อม
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [step]);
```

#### Auto-Retry Mechanism
```typescript
// ลอง play ซ้ำถ้าไม่สำเร็จ
videoElement.play().catch(err => {
  setTimeout(() => {
    if (videoElement && stream) {
      videoElement.play().catch(() => {
        setError('ไม่สามารถเริ่มการแสดงผลวิดีโอได้ กรุณากด Restart');
      });
    }
  }, 1000);
});

// Auto-retry หลังจาก 3 วินาทีถ้ายัง paused
const autoRetryTimer = setTimeout(() => {
  if (videoElement.paused && videoElement.readyState < 3 && autoRetryCount < 2) {
    setAutoRetryCount(prev => prev + 1);
    videoElement.load();
    setTimeout(() => {
      videoElement.play();
    }, 500);
  }
}, 3000);
```

### 4. ปรับปรุง UX/UI 🎨

#### คำแนะนำใหม่
```typescript
<div className="text-center text-sm text-gray-600 mb-4">
  <div className="font-medium text-blue-600 mb-2">📱 จัดท่าเซลฟี่</div>
  <div>• วางหน้าให้อยู่ในกรอบวงรี</div>
  <div>• ระยะห่างประมาณ 30-40 ซม.</div>
  <div>• แสงสว่างเพียงพอ</div>
</div>
```

#### Enhanced Debug Info
- แสดงจำนวน live tracks / total tracks
- แสดง readyState เป็นข้อความ
- แสดงสถานะ Paused/Playing

### 5. การจัดการ State ✅

#### Auto-Retry Counter
```typescript
const [autoRetryCount, setAutoRetryCount] = useState(0);

// Reset เมื่อเริ่มใหม่
const retakePhoto = () => {
  setAutoRetryCount(0);
  // ... other resets
};
```

## ผลลัพธ์ที่คาดหวัง

✅ **กล้องแนวตั้ง** - เหมาะสำหรับ selfie portrait  
✅ **กรอบวงรีชัดเจน** - ช่วยให้ผู้ใช้จัดท่าได้ถูกต้อง  
✅ **Auto-start ทำงาน** - ไม่ต้องกด restart ในกรณีปกติ  
✅ **Retry mechanism** - จัดการ edge cases อัตโนมัติ  
✅ **UX ดีขึ้น** - คำแนะนำชัดเจน visual cues ดี  

## หมายเหตุ

- Portrait constraints อาจไม่ work ใน browser บางตัว (จะ fallback เป็น landscape)
- Auto-retry จะพยายาม 2 ครั้งก่อนให้ user กด restart
- กรอบวงรีใช้ CSS `radial-gradient` และ `border-radius` 
- Debug overlay ยังคงมีไว้สำหรับการ troubleshoot