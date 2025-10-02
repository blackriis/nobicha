#!/bin/bash

# Work History E2E Test Runner Script
# สคริปต์สำหรับรันการทดสอบ E2E ของประวัติการทำงานพนักงาน

set -e

echo "🚀 Starting Work History E2E Tests..."

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

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the web app directory."
    exit 1
fi

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js and npm."
    exit 1
fi

# Parse command line arguments
TEST_TYPE="basic"
BROWSER="chromium-desktop"
HEADLESS="true"
UI_MODE="false"
VERBOSE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TEST_TYPE="$2"
            shift 2
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --headed)
            HEADLESS="false"
            shift
            ;;
        --ui)
            UI_MODE="true"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --type TYPE        Test type: basic, comprehensive, all (default: basic)"
            echo "  --browser BROWSER   Browser: chromium-desktop, chromium-mobile, firefox-desktop, webkit-desktop (default: chromium-desktop)"
            echo "  --headed           Run tests in headed mode (show browser)"
            echo "  --ui               Run tests with Playwright UI"
            echo "  --verbose          Enable verbose output"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Run basic tests in headless mode"
            echo "  $0 --type comprehensive --headed     # Run comprehensive tests with browser visible"
            echo "  $0 --browser chromium-mobile          # Run tests on mobile viewport"
            echo "  $0 --ui                              # Run tests with Playwright UI"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Test Configuration:"
print_status "  Type: $TEST_TYPE"
print_status "  Browser: $BROWSER"
print_status "  Headless: $HEADLESS"
print_status "  UI Mode: $UI_MODE"
print_status "  Verbose: $VERBOSE"

# Check if development server is running
print_status "Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    print_warning "Development server not running. Starting server..."
    
    # Start development server in background
    npm run dev &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Development server started successfully"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "Failed to start development server"
            kill $DEV_SERVER_PID 2>/dev/null || true
            exit 1
        fi
    done
else
    print_success "Development server is running"
fi

# Install Playwright browsers if not already installed
print_status "Checking Playwright browsers..."
if ! npx playwright --version > /dev/null 2>&1; then
    print_error "Playwright not found. Please install it first:"
    echo "  npm install @playwright/test"
    exit 1
fi

# Check if browsers are installed
if ! npx playwright install --dry-run > /dev/null 2>&1; then
    print_status "Installing Playwright browsers..."
    npx playwright install
fi

# Prepare test command
TEST_COMMAND="npx playwright test"

# Add test file based on type
case $TEST_TYPE in
    "basic")
        TEST_COMMAND="$TEST_COMMAND employee-work-history.spec.ts"
        ;;
    "comprehensive")
        TEST_COMMAND="$TEST_COMMAND employee-work-history-comprehensive.spec.ts"
        ;;
    "all")
        TEST_COMMAND="$TEST_COMMAND employee-work-history*.spec.ts"
        ;;
    *)
        print_error "Invalid test type: $TEST_TYPE"
        print_error "Valid types: basic, comprehensive, all"
        exit 1
        ;;
esac

# Add browser project
TEST_COMMAND="$TEST_COMMAND --project=$BROWSER"

# Add headless option
if [ "$HEADLESS" = "true" ]; then
    TEST_COMMAND="$TEST_COMMAND --headed=false"
else
    TEST_COMMAND="$TEST_COMMAND --headed=true"
fi

# Add UI mode
if [ "$UI_MODE" = "true" ]; then
    TEST_COMMAND="$TEST_COMMAND --ui"
fi

# Add verbose output
if [ "$VERBOSE" = "true" ]; then
    TEST_COMMAND="$TEST_COMMAND --reporter=list"
fi

# Add configuration file
TEST_COMMAND="$TEST_COMMAND --config=playwright-work-history.config.ts"

print_status "Running command: $TEST_COMMAND"

# Run the tests
print_status "Starting E2E tests..."
echo ""

if eval $TEST_COMMAND; then
    print_success "All tests passed! 🎉"
    
    # Show test results
    if [ -d "playwright-report" ]; then
        print_status "Test report available at: playwright-report/index.html"
        print_status "Opening test report..."
        
        # Try to open report in browser
        if command -v open &> /dev/null; then
            open playwright-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open playwright-report/index.html
        else
            print_status "Please open playwright-report/index.html in your browser to view results"
        fi
    fi
    
    exit 0
else
    print_error "Some tests failed! ❌"
    
    # Show test results even on failure
    if [ -d "playwright-report" ]; then
        print_status "Test report available at: playwright-report/index.html"
        print_status "Please check the report for details on failed tests"
    fi
    
    exit 1
fi

# Cleanup function
cleanup() {
    if [ ! -z "$DEV_SERVER_PID" ]; then
        print_status "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT
