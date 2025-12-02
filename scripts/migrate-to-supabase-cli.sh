#!/bin/bash

# Script to migrate existing migration files from database/migrations/ to supabase/migrations/
# This script helps convert existing migration files to Supabase CLI format

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Supabase Migration Converter${NC}"
echo "=================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the project root
if [ ! -d "database/migrations" ]; then
    echo -e "${RED}❌ database/migrations/ directory not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}⚠️  supabase/ directory not found. Running supabase init...${NC}"
    supabase init
fi

echo -e "${GREEN}✓ Supabase CLI is installed${NC}"
echo -e "${GREEN}✓ Found database/migrations/ directory${NC}"
echo ""

# List existing migration files
echo "📋 Existing migration files in database/migrations/:"
ls -1 database/migrations/*.sql | while read file; do
    basename "$file"
done

echo ""
read -p "Do you want to create Supabase migration files from these? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create migration files with proper timestamps
echo ""
echo -e "${GREEN}📝 Creating Supabase migration files...${NC}"
echo ""

# Base timestamp (adjust this to match your project start date)
# Format: YYYYMMDDHHMMSS
BASE_DATE="20251201"
COUNTER=0

for file in database/migrations/*.sql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Extract migration number and name
        # Format: 001_initial_schema.sql -> initial_schema
        migration_name=$(echo "$filename" | sed 's/^[0-9]*_//' | sed 's/\.sql$//')
        
        # Create timestamp: BASE_DATE + counter (increment by 1 hour)
        hour=$(printf "%02d" $COUNTER)
        timestamp="${BASE_DATE}${hour}0000"
        
        # Create migration file
        echo -e "${YELLOW}Creating: ${timestamp}_${migration_name}.sql${NC}"
        supabase migration new "${migration_name}" --timestamp "$timestamp" 2>/dev/null || {
            # If timestamp option doesn't work, create manually
            migration_file="supabase/migrations/${timestamp}_${migration_name}.sql"
            cp "$file" "$migration_file"
            echo "  ✓ Copied to $migration_file"
        }
        
        COUNTER=$((COUNTER + 1))
    fi
done

echo ""
echo -e "${GREEN}✅ Migration files created!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Review the migration files in supabase/migrations/"
echo "2. Test migrations locally (if Docker is running):"
echo "   supabase db reset"
echo "3. Link to your remote project:"
echo "   supabase link --project-ref your-project-ref"
echo "4. Push migrations to remote:"
echo "   supabase db push"
echo ""
echo -e "${YELLOW}⚠️  Note: Make sure to review and test migrations before pushing to production!${NC}"

