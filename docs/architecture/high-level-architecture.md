# สถาปัตยกรรมภาพรวม (High Level Architecture)

เราจะสร้างแอปพลิเคชัน Full-stack บนสถาปัตยกรรมแบบ **Serverless** โดยใช้ **Next.js** เป็นหลักในการพัฒนาทั้งส่วน Frontend และ Backend (API Routes) ข้อมูลทั้งหมดจะถูกจัดการผ่าน **Supabase** ซึ่งทำหน้าที่เป็นทั้งฐานข้อมูล (PostgreSQL), ระบบยืนยันตัวตน (Auth), และที่เก็บไฟล์ (Storage) โครงสร้างโปรเจกต์จะอยู่ในรูปแบบ **Monorepo** และจะถูก Deploy บน **Vercel** เพื่อประสิทธิภาพสูงสุด

* **Platform and Infrastructure:**  
  * **Platform:** Vercel  
  * **Key Services:** Vercel (Hosting, Serverless Functions, CDN), Supabase (Database, Auth, Storage)  
  * **Supabase Database Region:** Singapore (ap-southeast-1)  
* **Repository Structure:** Monorepo (จัดการด้วย npm workspaces)  
* **แผนภาพสถาปัตยกรรม:**  
  ข้อมูลโค้ด  
  graph TD  
      User([User's Browser]) --> Vercel[Vercel Edge Network / CDN]  
      Vercel --> Frontend[Next.js Frontend on Vercel];  
      Frontend --> API[Next.js API Routes on Vercel];  
      API --> Supabase[Supabase];

      subgraph Supabase Platform  
          Supabase_DB[(PostgreSQL Database)]  
          Supabase_Auth[/Authentication/]  
          Supabase_Storage[(File Storage)]  
      end

      Supabase --> Supabase_DB;  
      Supabase --> Supabase_Auth;  
      Supabase --> Supabase_Storage;