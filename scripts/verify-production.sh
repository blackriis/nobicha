#!/bin/bash

# 🔍 Production Verification Script
# ใช้สำหรับตรวจสอบว่า production พร้อมใช้งาน

set -e

echo "🔍 Production Verification Checklist"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for verification
check_item() {
    local item="$1"
    echo -e "${BLUE}Check: ${item}${NC}"
    read -p "   Is this complete? (y/n): " answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        echo -e "${RED}   ❌ Not completed${NC}"
        return 1
    else
        echo -e "${GREEN}   ✅ Completed${NC}"
        return 0
    fi
}

# Function to ask for URL and test it
test_url() {
    local description="$1"
    echo -e "${BLUE}Test: ${description}${NC}"
    read -p "   Enter production URL (or press Enter to skip): " url
    
    if [ -z "$url" ]; then
        echo -e "${YELLOW}   ⚠️  Skipped${NC}"
        return 0
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}   ✅ URL is accessible${NC}"
        return 0
    else
        echo -e "${RED}   ❌ URL is not accessible${NC}"
        return 1
    fi
}

FAILED_CHECKS=0

echo ""
echo "📋 Section 1: Database Setup"
echo "----------------------------------------"
check_item "Production Supabase project created" || ((FAILED_CHECKS++))
check_item "All migrations executed (001-009, except 003)" || ((FAILED_CHECKS++))
check_item "RLS policies enabled and tested" || ((FAILED_CHECKS++))
check_item "Storage buckets created (employee-photos, sales-slips)" || ((FAILED_CHECKS++))
check_item "Production admin user created" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 2: Vercel Setup"
echo "----------------------------------------"
check_item "Vercel project created and linked" || ((FAILED_CHECKS++))
check_item "Environment variables configured" || ((FAILED_CHECKS++))
check_item "Build settings configured correctly" || ((FAILED_CHECKS++))
check_item "First deployment successful" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 3: Production Data"
echo "----------------------------------------"
check_item "Real branches created with correct GPS coordinates" || ((FAILED_CHECKS++))
check_item "Work shifts configured" || ((FAILED_CHECKS++))
check_item "Raw materials added" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 4: URL Testing"
echo "----------------------------------------"
test_url "Production homepage" || ((FAILED_CHECKS++))
test_url "Login page" || ((FAILED_CHECKS++))
test_url "API health check" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 5: Functional Testing"
echo "----------------------------------------"
check_item "Admin can login successfully" || ((FAILED_CHECKS++))
check_item "Employee can login successfully" || ((FAILED_CHECKS++))
check_item "Check-in/Check-out works with selfie" || ((FAILED_CHECKS++))
check_item "GPS validation works" || ((FAILED_CHECKS++))
check_item "Material usage reporting works" || ((FAILED_CHECKS++))
check_item "Sales reports work" || ((FAILED_CHECKS++))
check_item "Image uploads work (selfies, receipts)" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 6: Security"
echo "----------------------------------------"
check_item "HTTPS enabled and working" || ((FAILED_CHECKS++))
check_item "Service role key not exposed on client" || ((FAILED_CHECKS++))
check_item "RLS policies prevent unauthorized access" || ((FAILED_CHECKS++))
check_item "Storage policies secure" || ((FAILED_CHECKS++))

echo ""
echo "📋 Section 7: Monitoring"
echo "----------------------------------------"
check_item "Vercel Analytics enabled" || ((FAILED_CHECKS++))
check_item "Supabase monitoring active" || ((FAILED_CHECKS++))
check_item "Error tracking setup" || ((FAILED_CHECKS++))

echo ""
echo "================================================"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Production is ready! 🎉${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor error rates for first 24 hours"
    echo "  2. Collect user feedback"
    echo "  3. Document any issues in GitHub"
else
    echo -e "${RED}⚠️  ${FAILED_CHECKS} check(s) failed${NC}"
    echo ""
    echo "Please complete the failed checks before going live."
    echo "Refer to PRODUCTION_DEPLOYMENT_V1.md for details."
fi
echo "================================================"

exit $FAILED_CHECKS

