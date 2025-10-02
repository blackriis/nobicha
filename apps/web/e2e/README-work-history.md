# Employee Work History E2E Tests

การทดสอบ E2E สำหรับหน้าประวัติการทำงานของพนักงานโดยใช้ Playwright

## 📋 Overview

ชุดการทดสอบ E2E นี้ครอบคลุมการทำงานของหน้าประวัติการทำงานพนักงาน รวมถึง:

- การแสดงข้อมูลประวัติการทำงาน
- การกรองข้อมูลตามช่วงเวลา
- การดูรายละเอียดการทำงาน
- การจัดการสถานะการทำงาน
- การทดสอบความปลอดภัยและประสิทธิภาพ

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm หรือ yarn
- Playwright browsers installed

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all work history tests
npm run test:e2e:work-history

# Run comprehensive work history tests
npm run test:e2e:work-history-comprehensive

# Run tests with UI
npm run test:e2e:work-history:ui

# Run tests in specific browser
npx playwright test employee-work-history.spec.ts --project=chromium-desktop

# Run tests in mobile viewport
npx playwright test employee-work-history.spec.ts --project=chromium-mobile
```

## 📁 Test Structure

```
e2e/
├── employee-work-history.spec.ts              # Basic work history tests
├── employee-work-history-comprehensive.spec.ts # Comprehensive test suite
├── helpers/
│   └── work-history-test-helper.ts           # Test helper functions
├── global-setup.ts                           # Global test setup
└── global-teardown.ts                        # Global test cleanup
```

## 🧪 Test Categories

### 1. Basic Functionality Tests
- ✅ Page loading and structure
- ✅ Date range filtering
- ✅ Data refresh functionality
- ✅ Time entries display
- ✅ Empty state handling

### 2. Data Validation Tests
- ✅ Date format validation (DD/MM/YYYY)
- ✅ Time format validation (HH:MM)
- ✅ Working hours format validation
- ✅ Status badge validation
- ✅ Data consistency across filters

### 3. Error Handling Tests
- ✅ Network error handling
- ✅ Empty state handling
- ✅ Invalid data handling
- ✅ Authentication error handling

### 4. Performance Tests
- ✅ Page load performance (< 3 seconds)
- ✅ Filter performance (< 1 second)
- ✅ Refresh performance (< 2 seconds)
- ✅ Memory usage monitoring

### 5. Responsive Design Tests
- ✅ Mobile viewport (375x667)
- ✅ Tablet viewport (768x1024)
- ✅ Desktop viewport (1920x1080)
- ✅ Cross-browser compatibility

### 6. Accessibility Tests
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA attributes
- ✅ Color contrast validation

### 7. Security Tests
- ✅ Authentication requirements
- ✅ Data isolation
- ✅ Sensitive data protection
- ✅ XSS protection

### 8. Integration Tests
- ✅ Dashboard navigation
- ✅ Time entry status integration
- ✅ Profile page integration
- ✅ Cross-feature consistency

## 🔧 Test Configuration

### Playwright Configuration

```typescript
// playwright-work-history.config.ts
export default defineConfig({
  testDir: './e2e',
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['iPhone 12'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
})
```

### Environment Variables

```bash
TEST_ENV=e2e
TEST_USER_EMAIL=test.employee@test.com
TEST_USER_PASSWORD=testpassword123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=password123
```

## 🛠️ Test Helper Functions

### WorkHistoryTestHelper

```typescript
const helper = new WorkHistoryTestHelper(page);

// Login as employee
await helper.loginAsEmployee(email, password);

// Navigate to work history
await helper.navigateToWorkHistory();

// Select date range
await helper.selectDateRange('today');

// Refresh data
await helper.refreshData();

// Verify time entry card
await helper.verifyTimeEntryCard(0);

// Open time entry detail
await helper.openTimeEntryDetail(0);
```

### TestDataFactory

```typescript
// Generate test employee
const testEmployee = TestDataFactory.generateTestEmployee();

// Generate time entry data
const timeEntryData = TestDataFactory.generateTimeEntryData();
```

### MockAPIResponses

```typescript
// Mock empty response
await page.route('**/api/employee/time-entries/history**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify(MockAPIResponses.getEmptyTimeEntriesResponse())
  });
});
```

## 📊 Test Data

### Test Employee
- **Email**: `test.employee.workhistory@test.com`
- **Password**: `testpassword123`
- **Name**: `พนักงานทดสอบประวัติการทำงาน`
- **Role**: `employee`

### Test Time Entries
- **Check-in Time**: 8:00 AM
- **Check-out Time**: 5:00 PM
- **Total Hours**: 8 hours
- **Status**: `completed`
- **Branch**: Test branch

## 🔍 Debugging

### Running Tests in Debug Mode

```bash
# Run with debug mode
npx playwright test employee-work-history.spec.ts --debug

# Run specific test with debug
npx playwright test employee-work-history.spec.ts --grep "Work History - Basic Functionality" --debug
```

### Viewing Test Results

```bash
# Open test results
npx playwright show-report

# View test videos
npx playwright show-report --video
```

### Common Issues

1. **Test Timeout**: Increase timeout in config
2. **Element Not Found**: Check data-testid attributes
3. **Authentication Issues**: Verify test user credentials
4. **Network Errors**: Check API endpoints and mock responses

## 📈 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Work History E2E Tests
  run: |
    cd apps/web
    npm run test:e2e:work-history -- --reporter=github
```

### Test Reports

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`

## 🎯 Best Practices

### Test Writing
- ✅ Use descriptive test names
- ✅ Group related tests in describe blocks
- ✅ Use helper functions for common operations
- ✅ Mock external dependencies
- ✅ Clean up test data after tests

### Data Management
- ✅ Use unique test data per test run
- ✅ Clean up test data in teardown
- ✅ Use factories for test data generation
- ✅ Mock API responses when appropriate

### Performance
- ✅ Set appropriate timeouts
- ✅ Use parallel execution when possible
- ✅ Monitor test execution time
- ✅ Optimize test data setup

## 📝 Contributing

### Adding New Tests

1. Create test file in `e2e/` directory
2. Use existing helper functions
3. Follow naming conventions
4. Add proper documentation
5. Update this README

### Test Naming Convention

```typescript
test('Work History - [Feature Name] - [Specific Test Case]', async ({ page }) => {
  // Test implementation
});
```

### Helper Function Guidelines

- Keep functions focused and single-purpose
- Use descriptive names
- Handle errors gracefully
- Return meaningful values
- Document complex logic

## 🐛 Troubleshooting

### Common Problems

1. **Port 3000 already in use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Test user not found**
   ```bash
   # Check if test user exists in database
   npm run test:setup-users
   ```

3. **Playwright browsers not installed**
   ```bash
   # Install browsers
   npx playwright install
   ```

4. **Test data conflicts**
   ```bash
   # Clean up test data
   npm run test:cleanup
   ```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Test Automation Guidelines](https://playwright.dev/docs/test-assertions)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 📞 Support

หากมีปัญหาหรือข้อสงสัยเกี่ยวกับการทดสอบ E2E:

1. ตรวจสอบ logs ใน test results
2. ดู test videos สำหรับ debugging
3. ตรวจสอบ test configuration
4. ติดต่อทีมพัฒนา

---

**หมายเหตุ**: การทดสอบ E2E นี้ใช้ข้อมูลทดสอบที่สร้างขึ้นเฉพาะสำหรับการทดสอบเท่านั้น และจะถูกทำความสะอาดหลังการทดสอบเสร็จสิ้น
