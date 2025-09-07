

### **เอกสารสถาปัตยกรรมระบบ Fullstack (Fullstack Architecture Document)**

* **โครงการ:** ระบบบริหารจัดการพนักงาน  
* **เวอร์ชัน:** 1.0  
* **วันที่:** 7 กันยายน 2025  
* **ผู้จัดทำ:** Winston (Architect)

---

#### **1\. บทนำ (Introduction)**

เอกสารนี้สรุปภาพรวมสถาปัตยกรรมทั้งหมดสำหรับโครงการ **ระบบบริหารจัดการพนักงาน** ครอบคลุมทั้งระบบ Backend, Frontend, และการเชื่อมต่อระหว่างกัน โดยจะเป็นเอกสารอ้างอิงหลักเพียงฉบับเดียว (Single Source of Truth) สำหรับทีมพัฒนาเพื่อให้การทำงานเป็นไปในทิศทางเดียวกัน

* **Starter Template:** สร้างขึ้นใหม่โดยใช้ create-next-app เป็นจุดเริ่มต้น

---

#### **2\. สถาปัตยกรรมภาพรวม (High Level Architecture)**

เราจะสร้างแอปพลิเคชัน Full-stack บนสถาปัตยกรรมแบบ **Serverless** โดยใช้ **Next.js** เป็นหลักในการพัฒนาทั้งส่วน Frontend และ Backend (API Routes) ข้อมูลทั้งหมดจะถูกจัดการผ่าน **Supabase** ซึ่งทำหน้าที่เป็นทั้งฐานข้อมูล (PostgreSQL), ระบบยืนยันตัวตน (Auth), และที่เก็บไฟล์ (Storage) โครงสร้างโปรเจกต์จะอยู่ในรูปแบบ **Monorepo** และจะถูก Deploy บน **Vercel** เพื่อประสิทธิภาพสูงสุด

* **Platform and Infrastructure:**  
  * **Platform:** Vercel  
  * **Key Services:** Vercel (Hosting, Serverless Functions, CDN), Supabase (Database, Auth, Storage)  
  * **Supabase Database Region:** Singapore (ap-southeast-1)  
* **Repository Structure:** Monorepo (จัดการด้วย npm workspaces)  
* **แผนภาพสถาปัตยกรรม:**  
  ข้อมูลโค้ด  
  graph TD  
      User(\[User's Browser\]) \--\> Vercel\[Vercel Edge Network / CDN\]  
      Vercel \--\> Frontend\[Next.js Frontend on Vercel\];  
      Frontend \--\> API\[Next.js API Routes on Vercel\];  
      API \--\> Supabase\[Supabase\];

      subgraph Supabase Platform  
          Supabase\_DB\[(PostgreSQL Database)\]  
          Supabase\_Auth\[/Authentication/\]  
          Supabase\_Storage\[(File Storage)\]  
      end

      Supabase \--\> Supabase\_DB;  
      Supabase \--\> Supabase\_Auth;  
      Supabase \--\> Supabase\_Storage;

---

#### **3\. Tech Stack**

| Category | Technology | Version | Purpose |
| :---- | :---- | :---- | :---- |
| **ภาษาหลัก** | TypeScript | \~5.4 | ภาษาหลักในการพัฒนา |
| **Frontend Framework** | Next.js | \~15.0 | โครงสร้างหลักของแอปพลิเคชัน |
| **UI Library** | Shadcn UI | latest | ชุด Components สำเร็จรูป |
| **CSS Framework** | Tailwind CSS | \~3.4 | สำหรับการทำ Styling |
| **State Management** | Zustand | \~4.5 | จัดการสถานะที่ซับซ้อนใน Frontend |
| **Backend Framework** | Next.js (API Routes) | \~15.0 | สร้าง Backend API |
| **Database** | Supabase (PostgreSQL) | latest | ฐานข้อมูลหลัก |
| **Authentication** | Supabase Auth | latest | ระบบยืนยันตัวตน |
| **File Storage** | Supabase Storage | latest | จัดเก็บไฟล์ |
| **Testing** | Vitest \+ RTL | latest | Unit & Integration Testing |
| **E2E Testing** | Playwright | \~1.4 | ทดสอบการทำงานทั้งระบบ |
| **Deployment** | Vercel | N/A | แพลตฟอร์มสำหรับ Deploy |

---

#### **4\. Data Models & 8\. Database Schema**

โครงสร้างข้อมูลทั้งหมดจะถูกสร้างตามโค้ด SQL DDL ด้านล่างนี้ ซึ่งได้กำหนดความสัมพันธ์และข้อจำกัดต่างๆ ไว้อย่างครบถ้วนแล้ว

SQL

CREATE TYPE user\_role AS ENUM ('employee', 'admin');  
CREATE TYPE payroll\_status AS ENUM ('active', 'completed');

CREATE TABLE branches ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), name TEXT NOT NULL, latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE users ( id UUID PRIMARY KEY REFERENCES auth.users(id), email TEXT UNIQUE, full\_name TEXT, role user\_role NOT NULL DEFAULT 'employee', home\_branch\_id UUID REFERENCES branches(id), hourly\_rate NUMERIC(10, 2), daily\_rate NUMERIC(10, 2), created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE work\_shifts ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), branch\_id UUID NOT NULL REFERENCES branches(id), name TEXT NOT NULL, start\_time TIME NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE time\_entries ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), employee\_id UUID NOT NULL REFERENCES users(id), branch\_id UUID NOT NULL REFERENCES branches(id), check\_in\_time TIMESTAMPTZ NOT NULL, check\_out\_time TIMESTAMPTZ, check\_in\_selfie\_url TEXT NOT NULL, check\_out\_selfie\_url TEXT, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE raw\_materials ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), name TEXT NOT NULL UNIQUE, unit TEXT NOT NULL, cost\_price NUMERIC(10, 2) NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE material\_usage ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), time\_entry\_id UUID NOT NULL REFERENCES time\_entries(id), raw\_material\_id UUID NOT NULL REFERENCES raw\_materials(id), quantity\_used NUMERIC(10, 2) NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE sales\_reports ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), branch\_id UUID NOT NULL REFERENCES branches(id), employee\_id UUID NOT NULL REFERENCES users(id), report\_date DATE NOT NULL, total\_sales NUMERIC(12, 2) NOT NULL, slip\_image\_url TEXT NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE payroll\_cycles ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), name TEXT NOT NULL, start\_date DATE NOT NULL, end\_date DATE NOT NULL, status payroll\_status NOT NULL DEFAULT 'active', created\_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE payroll\_details ( id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), payroll\_cycle\_id UUID NOT NULL REFERENCES payroll\_cycles(id), employee\_id UUID NOT NULL REFERENCES users(id), base\_pay NUMERIC(12, 2) NOT NULL, bonus NUMERIC(10, 2) DEFAULT 0, bonus\_reason TEXT, deduction NUMERIC(10, 2) DEFAULT 0, deduction\_reason TEXT, net\_pay NUMERIC(12, 2) NOT NULL, created\_at TIMESTAMPTZ DEFAULT now() );

---

#### **5\. API Specification**

API จะถูกสร้างโดยใช้ Next.js API Routes ตามมาตรฐาน OpenAPI 3.0 ที่ได้ร่างไว้ โดยมี Endpoint หลักๆ เช่น /api/auth/login, /api/time-entries/check-in, และ /api/admin/shifts

---

#### **6\. Components & 7\. Core Workflows**

ระบบถูกแบ่งออกเป็น Frontend และ Backend components ที่ทำงานร่วมกันตามแผนภาพ Sequence Diagram ที่ได้กำหนดไว้สำหรับ Workflow หลัก เช่น การเช็คอินของพนักงาน

---

#### **9\. Frontend Architecture & 10\. Backend Architecture**

โครงสร้างโค้ดทั้ง Frontend และ Backend จะยึดตามรูปแบบที่กำหนดไว้ โดยเน้นการแบ่งโค้ดตามฟีเจอร์ (Feature-based), การใช้ Service/Repository Layer ในการจัดการข้อมูล, และการใช้ Middleware สำหรับ Authentication

---

#### **11\. โครงสร้างโปรเจกต์ฉบับสมบูรณ์ (Unified Project Structure)**

Plaintext

employee-management-system/  
├── apps/  
│   └── web/  
│       ├── src/app/  
│       │   ├── api/  
│       │   ├── dashboard/  
│       │   └── admin/  
│       ├── src/components/  
│       └── src/features/  
├── packages/  
│   ├── ui/  
│   ├── config/  
│   └── database/  
└── package.json

---

#### **12\. Development Workflow & 13\. Deployment Architecture**

การพัฒนาจะเริ่มต้นจากการ Clone repository, ติดตั้ง dependencies, และตั้งค่าไฟล์ .env ด้วย Supabase keys การ Deploy ทั้งหมดจะเป็นไปโดยอัตโนมัติผ่าน Vercel Git Integration เมื่อมีการ Push code ไปยัง Git Repository

---

#### **14\. Coding Standards**

* **Type Sharing:** Type ทั้งหมดที่เกี่ยวกับฐานข้อมูลจะต้องถูก import มาจาก packages/database เท่านั้น  
* **Environment Variables:** ห้ามเรียกใช้ process.env โดยตรงใน Component หรือ Page ให้เรียกผ่านไฟล์ config กลางเท่านั้น  
* **API Calls:** การเรียกใช้ API ในฝั่ง Frontend ต้องทำผ่าน Service Layer ที่กำหนดไว้ ห้าม fetch โดยตรงจาก Component

---

#### **15\. Checklist Results Report**

เอกสารสถาปัตยกรรมฉบับนี้ได้ผ่านการตรวจสอบตาม Checklist แล้ว มีความพร้อมในระดับสูง (High Readiness) สำหรับการพัฒนา จุดแข็งคือการเลือกใช้ Tech Stack ที่ทันสมัยและทำงานร่วมกันได้อย่างลงตัว (Next.js, Supabase, Vercel) ซึ่งช่วยลดความซับซ้อนในการพัฒนาและ Deploy ความเสี่ยงหลักจะอยู่ที่ความซับซ้อนของ Logic การคำนวณเงินเดือน ซึ่งต้องมีการทดสอบอย่างละเอียด

---

เอกสารสถาปัตยกรรมฉบับนี้เสร็จสมบูรณ์แล้วครับ และพร้อมสำหรับให้ทีมพัฒนา (Developer Agents) นำไปใช้เป็นพิมพ์เขียวในการสร้างโปรเจกต์ต่อไป