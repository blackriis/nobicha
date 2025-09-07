# โครงสร้างและแผนผังระบบ (Information Architecture)

* **แผนผังหน้าจอ (Site Map):** 6

  ข้อมูลโค้ด  
  graph TD  
      A[Login Page] --> B{Role Check};  
      B --> C[Employee Dashboard];  
      B --> D[Admin Dashboard];

      subgraph Employee View  
          C --> C1[Check-in/out UI];  
          C --> C2[Material Report Form];  
          C --> C3[Sales Report Form];  
      end

      subgraph Admin View  
          D --> E[Reports];  
          D --> F[Payroll Management];  
          D --> G[Settings];  
          D --> H[Employee Management];  
      end

* **โครงสร้างการนำทาง (Navigation Structure):** 7

  * **พนักงาน:** การนำทางทั้งหมดรวมศูนย์อยู่ที่ Dashboard หลักที่เดียว  
  * **ผู้ดูแลระบบ:** มีแถบเมนูด้านข้าง (Sidebar) ที่แสดงอยู่ตลอดเวลา ประกอบด้วยเมนูหลัก (Dashboard, Reports, Payroll, etc.)