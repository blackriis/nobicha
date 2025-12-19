# E2E Tests - Payroll Cycle Workflow

This directory contains End-to-End (E2E) tests for the Employee Management System, specifically focusing on the complete payroll cycle workflow.

## 📋 Overview

The E2E tests cover the following scenarios:

### Complete Payroll Cycle Workflow
1. ✅ Login as admin
2. ✅ Create a new payroll cycle
3. ✅ Calculate payroll for all employees
4. ✅ View and verify payroll summary
5. ✅ Add bonus/deduction adjustments
6. ✅ Finalize the payroll cycle
7. ✅ Export payroll data (CSV/JSON)
8. ✅ Verify cycle cannot be modified after finalization

### Additional Test Cases
- ✅ Reset and recalculation before finalization
- ✅ Prevent duplicate calculations
- ✅ Validate date ranges when creating cycles
- ⚠️ Validation errors for negative net pay (requires special setup)

## 🛠️ Setup

### Prerequisites
- Node.js 18+ installed
- Supabase project configured
- Environment variables set in `.env.local`:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

### Install Dependencies
```bash
cd apps/web
npm install
```

### Setup Test Data
Before running E2E tests, you need to create test data:

```bash
npm run test:e2e:setup-data
```

This will create:
- ✅ Test admin user (`admin@test.com` / `SecureAdmin2024!@#`)
- ✅ Test employees with hourly/daily rates
- ✅ Test branch
- ✅ Sample time entries for the past 30 days

## 🚀 Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Payroll Cycle Tests Only
```bash
npm run test:e2e:payroll
```

### Run with UI Mode (Interactive)
```bash
npm run test:e2e:payroll:ui
```

### Run in Headed Mode (See Browser)
```bash
npm run test:e2e:payroll:headed
```

### Debug Mode
```bash
npm run test:e2e:payroll:debug
```

## 📁 File Structure

```
apps/web/e2e/
├── README.md                      # This file
├── payroll-cycle.spec.ts          # Main test file for payroll workflow
├── helpers/
│   ├── auth.helper.ts             # Authentication helper functions
│   └── payroll.helper.ts          # Payroll-specific helper functions
└── setup/
    └── test-data.setup.ts         # Test data creation script
```

## 🧪 Test Helpers

### AuthHelper
Helper for authentication operations:
- `loginAsAdmin()` - Login as admin user
- `loginAsEmployee()` - Login as employee user
- `logout()` - Logout current user
- `isAuthenticated()` - Check if user is authenticated

### PayrollHelper
Helper for payroll operations:
- `navigateToPayrollPage()` - Navigate to payroll page
- `createPayrollCycle()` - Create a new payroll cycle
- `calculatePayroll()` - Calculate payroll for a cycle
- `viewPayrollSummary()` - View payroll summary
- `addBonus()` - Add bonus to an employee
- `addDeduction()` - Add deduction to an employee
- `finalizePayroll()` - Finalize payroll cycle
- `exportPayroll()` - Export payroll data
- `resetPayroll()` - Reset payroll calculation
- `getPayrollSummaryData()` - Get summary statistics

## 📝 Test Credentials

After running `npm run test:e2e:setup-data`, you can use these credentials:

**Admin:**
- Email: `admin@test.com`
- Password: `SecureAdmin2024!@#`

**Employees:**
- Email: `employee1@test.com` / Password: `Employee123!`
- Email: `employee2@test.com` / Password: `Employee123!`
- Email: `employee3@test.com` / Password: `Employee123!`

## 🔧 Configuration

### Playwright Configuration
See `apps/web/playwright.config.ts` for detailed configuration:
- Test directory: `./e2e`
- Base URL: `http://localhost:3000`
- Browser: Chromium (Desktop Chrome)
- Retries: 2 in CI, 0 in local
- Reporter: HTML

### Test Timeouts
- Default timeout: 30 seconds
- Navigation timeout: 15 seconds
- Assertion timeout: 10 seconds

## 🐛 Troubleshooting

### Test Setup Data Failed
If test data setup fails, check:
1. Supabase credentials in `.env.local`
2. Database schema is up-to-date
3. Service role key has proper permissions

### Tests Failing on Selector Not Found
The tests use data-testid attributes as primary selectors with fallbacks to text content. If your UI doesn't have data-testid attributes, the tests will use text-based selectors (e.g., `button:has-text("คำนวณ")`).

**Recommended:** Add data-testid attributes to your UI components:
```tsx
<button data-testid="calculate-button">คำนวณ</button>
<button data-testid="finalize-button">ปิดรอบ</button>
<button data-testid="export-button">ส่งออก</button>
```

### Dev Server Not Starting
Make sure you have the dev server running:
```bash
npm run dev
```

Or rely on Playwright's webServer config to auto-start it.

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## 🔄 Continuous Integration

For CI environments, tests will:
- Run with retries (2 attempts)
- Use single worker
- Auto-start web server
- Generate HTML reports

Add to your CI pipeline:
```yaml
- name: Install dependencies
  run: npm install

- name: Setup test data
  run: npm run test:e2e:setup-data

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

## 📖 Writing New Tests

To add new test cases:

1. Create a new spec file in `e2e/`:
```typescript
import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'
import { PayrollHelper } from './helpers/payroll.helper'

test.describe('My New Test Suite', () => {
  test('should do something', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    const payrollHelper = new PayrollHelper(page)

    await authHelper.loginAsAdmin()
    // ... your test logic
  })
})
```

2. Add new helper methods to `helpers/` if needed

3. Update this README with new test cases

## 🔗 Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## 📞 Support

If you encounter issues with E2E tests, please:
1. Check this README for troubleshooting tips
2. Review test logs and screenshots in `test-results/`
3. Open an issue with test output and error messages
