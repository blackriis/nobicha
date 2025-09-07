# Data Models & Database Schema

โครงสร้างข้อมูลทั้งหมดจะถูกสร้างตามโค้ด SQL DDL ด้านล่างนี้ ซึ่งได้กำหนดความสัมพันธ์และข้อจำกัดต่างๆ ไว้อย่างครบถ้วนแล้ว

```sql
CREATE TYPE user_role AS ENUM ('employee', 'admin');  
CREATE TYPE payroll_status AS ENUM ('active', 'completed');

CREATE TABLE branches ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE users ( id UUID PRIMARY KEY REFERENCES auth.users(id), email TEXT UNIQUE, full_name TEXT, role user_role NOT NULL DEFAULT 'employee', home_branch_id UUID REFERENCES branches(id), hourly_rate NUMERIC(10, 2), daily_rate NUMERIC(10, 2), created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE work_shifts ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), branch_id UUID NOT NULL REFERENCES branches(id), name TEXT NOT NULL, start_time TIME NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE time_entries ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_id UUID NOT NULL REFERENCES users(id), branch_id UUID NOT NULL REFERENCES branches(id), check_in_time TIMESTAMPTZ NOT NULL, check_out_time TIMESTAMPTZ, check_in_selfie_url TEXT NOT NULL, check_out_selfie_url TEXT, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE raw_materials ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, unit TEXT NOT NULL, cost_price NUMERIC(10, 2) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE material_usage ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), time_entry_id UUID NOT NULL REFERENCES time_entries(id), raw_material_id UUID NOT NULL REFERENCES raw_materials(id), quantity_used NUMERIC(10, 2) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE sales_reports ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), branch_id UUID NOT NULL REFERENCES branches(id), employee_id UUID NOT NULL REFERENCES users(id), report_date DATE NOT NULL, total_sales NUMERIC(12, 2) NOT NULL, slip_image_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE payroll_cycles ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, status payroll_status NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now() );  
CREATE TABLE payroll_details ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payroll_cycle_id UUID NOT NULL REFERENCES payroll_cycles(id), employee_id UUID NOT NULL REFERENCES users(id), base_pay NUMERIC(12, 2) NOT NULL, bonus NUMERIC(10, 2) DEFAULT 0, bonus_reason TEXT, deduction NUMERIC(10, 2) DEFAULT 0, deduction_reason TEXT, net_pay NUMERIC(12, 2) NOT NULL, created_at TIMESTAMPTZ DEFAULT now() );
```