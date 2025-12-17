# แก้ไขปัญหา Camera Stream Infinite Loop

## ปัญหาที่พบ
```
Stream is not active, requesting new stream
at SelfieCapture.useEffect (src/components/employee/SelfieCapture.tsx:57:17)
```

**สาเหตุ**: การตรวจสอบ `stream.active` ใน useEffect ทำให้เกิด infinite loop เพราะ:
1. useEffect ตรวจพบ stream ไม่ active
2. เรียก `requestCameraAccess()` ใหม่ 
3. ได้ stream ใหม่แต่ยังไม่ active ทันที
4. useEffect ทำงานอีกครั้งและเกิด loop

## การแก้ไข

### 1. ลบการตรวจสอบ stream.active ใน useEffect

**ก่อนแก้ไข:**
```typescript
// Check if stream is active
if (!stream.active) {
  console.error('Stream is not active, requesting new stream');
  requestCameraAccess(); // ← สาเหตุของ infinite loop
  return;
}
```

**หลังแก้ไข:**
```typescript
// ลบการตรวจสอบออก - ให้ video element handle stream โดยตรง
videoRef.current.srcObject = stream;
```

### 2. ลบการตรวจสอบ active หลัง getUserMedia

**ก่อนแก้ไข:**
```typescript
if (!mediaStream.active) {
  throw new Error('Stream is not active after creation');
}
```

**หลังแก้ไข:**
```typescript
// เก็บแค่ logging ไม่ throw error
console.log('New stream received:', { /* stream info */ });
```

### 3. ปรับปรุง Debug Overlay

เพิ่มข้อมูล debug ที่มีประโยชน์มากขึ้น:
```typescript
<div>Tracks: {liveTracksCount}/{totalTracksCount}</div>
<div>Video: {readyStateText}</div>
<div>Paused: {videoRef.current?.paused ? '✗' : '✓'}</div>
```

### 4. ลบ Stream Status Monitor

ลบ `setInterval` ที่ monitor stream status เพราะ:
- ทำให้เกิด memory leaks
- ไม่จำเป็นเพราะ video element จัดการ stream lifecycle ได้เอง

## ผลลัพธ์

✅ **หยุด infinite loop** - ไม่มี console error ซ้ำๆ อีกแล้ว  
✅ **กล้องทำงานปกติ** - แสดงภาพได้โดยไม่มี interruption  
✅ **Debug info ดีขึ้น** - แสดงสถานะ stream และ video ชัดเจน  
✅ **Performance ดีขึ้น** - ไม่มี unnecessary re-renders  

## หมายเหตุ

การที่ `stream.active` เป็น `false` ในช่วงแรกเป็นเรื่องปกติในบาง browsers เพราะ:
1. Stream อาจยังไม่ initialize เสร็จ
2. Tracks อาจยัง pending การ activate
3. Browser อาจ lazy-load stream จนกว่า video element จะใช้งานจริง

**วิธีการที่ถูก**: ให้ video element handle stream lifecycle และใช้ video events (`loadedmetadata`, `canplay`) ในการตรวจสอบสถานะแทน