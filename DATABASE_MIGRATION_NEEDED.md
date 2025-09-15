# Database Migration Required

## Problem
The `sales_reports` table is missing the `slip_image_url` column that is required by the application.

## Current Status
- ✅ API temporarily works without `slip_image_url` column
- ❌ Slip image upload functionality is disabled
- ❌ Sales reports don't store slip images

## Required Migration

**Run these SQL commands in Supabase SQL Editor:**

```sql
-- 1. Add the slip_image_url column
ALTER TABLE sales_reports ADD COLUMN slip_image_url TEXT;

-- 2. Update existing records with placeholder (if any exist)
UPDATE sales_reports 
SET slip_image_url = 'https://placeholder.com/slip.jpg' 
WHERE slip_image_url IS NULL;

-- 3. Make the column NOT NULL
ALTER TABLE sales_reports ALTER COLUMN slip_image_url SET NOT NULL;

-- 4. Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_reports' 
AND column_name = 'slip_image_url';
```

## After Migration

1. **Uncomment the slip_image_url code** in `/api/employee/sales-reports/route.ts`:
   - Add `slip_image_url` back to SELECT queries
   - Add `slip_image_url: publicUrl` back to INSERT statements

2. **Test the API** to ensure slip image upload works properly

3. **Remove this file** once migration is complete

## Files Modified for Temporary Fix
- `apps/web/src/app/api/employee/sales-reports/route.ts` - Removed slip_image_url from queries
- `database/migrations/008_add_slip_image_url_to_sales_reports.sql` - Migration script created
- `database/migrations/001_initial_schema.sql` - Updated with correct schema

## Test Commands
```bash
# Test API functionality
curl http://localhost:3001/api/employee/sales-reports

# Test database migration script
node test-direct-migration.js
```