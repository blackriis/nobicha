#!/bin/bash

# Work History E2E Test Data Setup Script
# สคริปต์สำหรับตั้งค่าข้อมูลทดสอบสำหรับ E2E testing ของประวัติการทำงานพนักงาน

set -e

echo "🔧 Setting up Work History E2E Test Data..."

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

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Parse command line arguments
ACTION="setup"
CLEANUP="false"
VERBOSE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --action)
            ACTION="$2"
            shift 2
            ;;
        --cleanup)
            CLEANUP="true"
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
            echo "  --action ACTION     Action: setup, cleanup, reset (default: setup)"
            echo "  --cleanup          Clean up existing test data before setup"
            echo "  --verbose          Enable verbose output"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Setup test data"
            echo "  $0 --action cleanup                   # Clean up test data"
            echo "  $0 --action reset --cleanup           # Reset test data (cleanup + setup)"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Test Data Setup Configuration:"
print_status "  Action: $ACTION"
print_status "  Cleanup: $CLEANUP"
print_status "  Verbose: $VERBOSE"

# Function to create test employee
create_test_employee() {
    print_status "Creating test employee for work history tests..."
    
    # Create test employee data
    cat > test-employee-data.json << EOF
{
  "fullName": "พนักงานทดสอบประวัติการทำงาน",
  "email": "test.employee.workhistory@test.com",
  "password": "testpassword123",
  "confirmPassword": "testpassword123",
  "branchId": "test-branch-id",
  "hourlyRate": 100,
  "dailyRate": 800,
  "role": "employee",
  "isActive": true
}
EOF

    print_success "Test employee data created"
}

# Function to create test time entries
create_test_time_entries() {
    print_status "Creating test time entries..."
    
    # Create test time entries data
    cat > test-time-entries-data.json << EOF
[
  {
    "id": "test-entry-1",
    "userId": "test-user-id",
    "branchId": "test-branch-id",
    "checkInTime": "2024-01-15T08:00:00Z",
    "checkOutTime": "2024-01-15T17:00:00Z",
    "totalHours": 8,
    "status": "completed",
    "checkInSelfieUrl": "https://example.com/selfie1.jpg",
    "checkOutSelfieUrl": "https://example.com/selfie2.jpg",
    "notes": "Test time entry 1"
  },
  {
    "id": "test-entry-2",
    "userId": "test-user-id",
    "branchId": "test-branch-id",
    "checkInTime": "2024-01-16T08:30:00Z",
    "checkOutTime": null,
    "totalHours": 0,
    "status": "active",
    "checkInSelfieUrl": "https://example.com/selfie3.jpg",
    "checkOutSelfieUrl": null,
    "notes": "Test time entry 2 - active"
  },
  {
    "id": "test-entry-3",
    "userId": "test-user-id",
    "branchId": "test-branch-id",
    "checkInTime": "2024-01-17T09:00:00Z",
    "checkOutTime": "2024-01-17T18:00:00Z",
    "totalHours": 8.5,
    "status": "completed",
    "checkInSelfieUrl": "https://example.com/selfie4.jpg",
    "checkOutSelfieUrl": "https://example.com/selfie5.jpg",
    "notes": "Test time entry 3"
  }
]
EOF

    print_success "Test time entries data created"
}

# Function to create test branch
create_test_branch() {
    print_status "Creating test branch..."
    
    # Create test branch data
    cat > test-branch-data.json << EOF
{
  "name": "สาขาทดสอบประวัติการทำงาน",
  "address": "123 ถนนทดสอบ กรุงเทพฯ 10110",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "isActive": true
}
EOF

    print_success "Test branch data created"
}

# Function to setup test data
setup_test_data() {
    print_status "Setting up test data..."
    
    # Create test data files
    create_test_employee
    create_test_time_entries
    create_test_branch
    
    # Create test data directory
    mkdir -p test-data
    
    # Move test data files to test-data directory
    mv test-employee-data.json test-data/
    mv test-time-entries-data.json test-data/
    mv test-branch-data.json test-data/
    
    print_success "Test data setup completed"
}

# Function to cleanup test data
cleanup_test_data() {
    print_status "Cleaning up test data..."
    
    # Remove test data files
    rm -f test-employee-data.json
    rm -f test-time-entries-data.json
    rm -f test-branch-data.json
    
    # Remove test data directory
    rm -rf test-data
    
    print_success "Test data cleanup completed"
}

# Function to reset test data
reset_test_data() {
    print_status "Resetting test data..."
    
    # Cleanup existing data
    cleanup_test_data
    
    # Setup new data
    setup_test_data
    
    print_success "Test data reset completed"
}

# Function to validate test data
validate_test_data() {
    print_status "Validating test data..."
    
    # Check if test data directory exists
    if [ ! -d "test-data" ]; then
        print_error "Test data directory not found"
        return 1
    fi
    
    # Check if test data files exist
    if [ ! -f "test-data/test-employee-data.json" ]; then
        print_error "Test employee data file not found"
        return 1
    fi
    
    if [ ! -f "test-data/test-time-entries-data.json" ]; then
        print_error "Test time entries data file not found"
        return 1
    fi
    
    if [ ! -f "test-data/test-branch-data.json" ]; then
        print_error "Test branch data file not found"
        return 1
    fi
    
    # Validate JSON files
    if ! node -e "JSON.parse(require('fs').readFileSync('test-data/test-employee-data.json', 'utf8'))" 2>/dev/null; then
        print_error "Invalid JSON in test employee data file"
        return 1
    fi
    
    if ! node -e "JSON.parse(require('fs').readFileSync('test-data/test-time-entries-data.json', 'utf8'))" 2>/dev/null; then
        print_error "Invalid JSON in test time entries data file"
        return 1
    fi
    
    if ! node -e "JSON.parse(require('fs').readFileSync('test-data/test-branch-data.json', 'utf8'))" 2>/dev/null; then
        print_error "Invalid JSON in test branch data file"
        return 1
    fi
    
    print_success "Test data validation passed"
    return 0
}

# Main execution
case $ACTION in
    "setup")
        if [ "$CLEANUP" = "true" ]; then
            cleanup_test_data
        fi
        setup_test_data
        validate_test_data
        ;;
    "cleanup")
        cleanup_test_data
        ;;
    "reset")
        reset_test_data
        validate_test_data
        ;;
    "validate")
        validate_test_data
        ;;
    *)
        print_error "Invalid action: $ACTION"
        print_error "Valid actions: setup, cleanup, reset, validate"
        exit 1
        ;;
esac

print_success "Work History E2E Test Data Setup Completed! 🎉"

# Show test data summary
if [ -d "test-data" ]; then
    print_status "Test Data Summary:"
    print_status "  Employee: test.employee.workhistory@test.com"
    print_status "  Password: testpassword123"
    print_status "  Time Entries: 3 entries (2 completed, 1 active)"
    print_status "  Branch: สาขาทดสอบประวัติการทำงาน"
    print_status ""
    print_status "Test data files created in: test-data/"
    print_status "  - test-employee-data.json"
    print_status "  - test-time-entries-data.json"
    print_status "  - test-branch-data.json"
fi
