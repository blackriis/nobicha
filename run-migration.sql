-- เปิดใช้ slip_image_url functionality
-- รันไฟล์นี้ใน Supabase SQL Editor

-- ขั้นตอนที่ 1: เพิ่ม column
ALTER TABLE sales_reports ADD COLUMN slip_image_url TEXT;

-- ขั้นตอนที่ 2: อัพเดทข้อมูลเก่า (ถ้ามี)
UPDATE sales_reports 
SET slip_image_url = 'https://placeholder.com/slip.jpg' 
WHERE slip_image_url IS NULL;

-- ขั้นตอนที่ 3: ตั้งค่า NOT NULL constraint
ALTER TABLE sales_reports ALTER COLUMN slip_image_url SET NOT NULL;

-- ขั้นตอนที่ 4: ตรวจสอบผลลัพธ์
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
AND column_name = 'slip_image_url';

-- ขั้นตอนที่ 5: ตรวจสอบข้อมูลตัวอย่าง
SELECT id, user_id, total_sales, slip_image_url, created_at
FROM sales_reports 
ORDER BY created_at DESC 
LIMIT 5;