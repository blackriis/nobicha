# Coding Standards

* **Type Sharing:** Type ทั้งหมดที่เกี่ยวกับฐานข้อมูลจะต้องถูก import มาจาก packages/database เท่านั้น  
* **Environment Variables:** ห้ามเรียกใช้ process.env โดยตรงใน Component หรือ Page ให้เรียกผ่านไฟล์ config กลางเท่านั้น  
* **API Calls:** การเรียกใช้ API ในฝั่ง Frontend ต้องทำผ่าน Service Layer ที่กำหนดไว้ ห้าม fetch โดยตรงจาก Component