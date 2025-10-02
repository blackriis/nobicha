#!/bin/bash

# CI/CD Test Runner Script
# This script runs all tests in the correct order for CI/CD pipeline

set -e  # Exit on any error

echo "🚀 Starting CI/CD Test Pipeline..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
    print_status "Running in CI environment"
    export NODE_ENV=test
else
    print_status "Running in local environment"
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed successfully"

# Step 2: Lint check
print_status "Running ESLint..."
npm run lint
print_success "Lint check passed"

# Step 3: Type check
print_status "Running TypeScript type check..."
npm run typecheck
print_success "Type check passed"

# Step 4: Unit tests
print_status "Running unit tests..."
npm run test:run
print_success "Unit tests passed"

# Step 5: Build application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Step 6: Install Playwright browsers (if not already installed)
print_status "Installing Playwright browsers..."
npx playwright install --with-deps
print_success "Playwright browsers installed"

# Step 7: Start application in background
print_status "Starting application..."
cd apps/web
npm run start &
APP_PID=$!
print_status "Application started with PID: $APP_PID"

# Wait for application to be ready
print_status "Waiting for application to be ready..."
sleep 15

# Check if application is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Application is ready"
else
    print_error "Application failed to start"
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

# Step 8: Run E2E tests
print_status "Running E2E tests..."
cd ../..

# Run different test suites based on environment
if [ "$CI" = "true" ]; then
    # In CI, run all tests with GitHub reporter
    npm run test:e2e -- --reporter=github
else
    # In local, run tests with HTML reporter
    npm run test:e2e
fi

print_success "E2E tests completed"

# Step 9: Cleanup
print_status "Cleaning up..."
kill $APP_PID 2>/dev/null || true
print_success "Application stopped"

# Step 10: Generate test summary
print_status "Generating test summary..."

# Count test results
if [ -d "apps/web/playwright-report" ]; then
    TEST_COUNT=$(find apps/web/playwright-report -name "*.html" | wc -l)
    print_success "Test report generated with $TEST_COUNT test files"
else
    print_warning "No test report found"
fi

print_success "🎉 CI/CD Test Pipeline completed successfully!"

# Exit with success
exit 0
