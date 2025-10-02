import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Employee Work History E2E Tests
 * การตั้งค่าเริ่มต้นสำหรับการทดสอบ E2E ของประวัติการทำงานพนักงาน
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Work History E2E tests...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Setup test data
    await setupTestData(page);
    
    // Setup test users
    await setupTestUsers(page);
    
    // Setup test time entries
    await setupTestTimeEntries(page);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test data for work history tests
 */
async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');
  
  // Navigate to admin login
  await page.goto('http://localhost:3000/login/admin');
  
  // Login as admin
  await page.fill('[data-testid="email-input"]', 'admin@test.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Wait for admin dashboard
  await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
  
  // Create test employee if not exists
  await createTestEmployee(page);
  
  console.log('✅ Test data setup completed');
}

/**
 * Create test employee for work history tests
 */
async function createTestEmployee(page: any) {
  console.log('👤 Creating test employee...');
  
  // Navigate to employees page
  await page.click('[data-testid="nav-employees"]');
  await page.waitForSelector('[data-testid="employees-page"]');
  
  // Check if test employee already exists
  const existingEmployee = await page.locator('text=test.employee.workhistory@test.com').isVisible();
  
  if (!existingEmployee) {
    // Click add employee button
    await page.click('[data-testid="add-employee-btn"]');
    await page.waitForSelector('h1:has-text("เพิ่มพนักงานใหม่")');
    
    // Fill employee form
    await page.fill('[data-testid="full-name-input"]', 'พนักงานทดสอบประวัติการทำงาน');
    await page.fill('[data-testid="email-input"]', 'test.employee.workhistory@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'testpassword123');
    
    // Select branch (assuming first branch is available)
    await page.click('[data-testid="branch-select"]');
    await page.click('[data-testid="branch-option"]:first-child');
    
    // Set hourly and daily rates
    await page.fill('[data-testid="hourly-rate-input"]', '100');
    await page.fill('[data-testid="daily-rate-input"]', '800');
    
    // Submit form
    await page.click('[data-testid="submit-employee-btn"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
    
    console.log('✅ Test employee created successfully');
  } else {
    console.log('ℹ️ Test employee already exists');
  }
}

/**
 * Setup test users for authentication
 */
async function setupTestUsers(page: any) {
  console.log('🔐 Setting up test users...');
  
  // Test users are already created in the database
  // This function can be extended to create additional test users if needed
  
  console.log('✅ Test users setup completed');
}

/**
 * Setup test time entries for work history tests
 */
async function setupTestTimeEntries(page: any) {
  console.log('⏰ Setting up test time entries...');
  
  // Navigate to employee detail page
  await page.goto('http://localhost:3000/admin/employees');
  await page.waitForSelector('[data-testid="employees-page"]');
  
  // Find test employee
  const employeeRow = page.locator('[data-testid="employee-row"]:has-text("test.employee.workhistory@test.com")');
  await employeeRow.locator('[data-testid="view-employee-btn"]').click();
  
  // Wait for employee detail page
  await page.waitForSelector('[data-testid="employee-detail-page"]');
  
  // Check if time entries exist
  const timeEntriesSection = page.locator('[data-testid="time-entries-section"]');
  await timeEntriesSection.click();
  
  // Check if there are existing time entries
  const timeEntriesTable = page.locator('[data-testid="time-entries-table"]');
  const hasTimeEntries = await timeEntriesTable.isVisible();
  
  if (!hasTimeEntries) {
    console.log('ℹ️ No existing time entries found - tests will use empty state');
  } else {
    console.log('ℹ️ Existing time entries found - tests will use real data');
  }
  
  console.log('✅ Test time entries setup completed');
}

export default globalSetup;
