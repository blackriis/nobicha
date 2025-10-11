/**
 * Debug script to test deeplink functionality
 * Run this in browser console on http://localhost:3000
 */

// Test 1: Direct access to protected route (should trigger middleware)
console.log('=== Test 1: Direct access to protected route ===')
window.location.href = 'http://localhost:3000/admin/employees'

// Test 2: Manual redirect with query parameter
console.log('=== Test 2: Manual redirect with query param ===')
setTimeout(() => {
  window.location.href = 'http://localhost:3000/login/employee?redirectTo=/admin/reports'
}, 2000)

// Test 3: Check cookies after redirect
console.log('=== Test 3: Check cookies ===')
setTimeout(() => {
  console.log('All cookies:', document.cookie)
  console.log('RedirectTo cookie:', document.cookie.split('; ').find(c => c.startsWith('redirectTo=')))
}, 4000)

// Test 4: Simulate login (fill form and submit)
console.log('=== Test 4: Simulate login ===')
setTimeout(() => {
  const emailInput = document.querySelector('[data-testid="email-input"]')
  const passwordInput = document.querySelector('[data-testid="password-input"]')
  const loginButton = document.querySelector('[data-testid="login-button"]')
  
  if (emailInput && passwordInput && loginButton) {
    emailInput.value = 'admin@test.com'
    passwordInput.value = 'password123'
    loginButton.click()
    console.log('Login form submitted')
  } else {
    console.error('Login form elements not found')
  }
}, 6000)