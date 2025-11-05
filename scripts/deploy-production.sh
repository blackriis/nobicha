#!/bin/bash

# 🚀 Production Deployment Script
# ใช้สำหรับ deploy v1 ขึ้น production

set -e

echo "🚀 Starting Production Deployment Process..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "You must be on 'main' branch to deploy to production"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi
print_success "On main branch"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status -s
    exit 1
fi
print_success "No uncommitted changes"

# Pull latest changes
echo ""
echo "📥 Pulling latest changes..."
git pull origin main
print_success "Pulled latest changes"

# Navigate to web app
echo ""
echo "📁 Navigating to web app..."
cd apps/web

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
print_success "Dependencies installed"

# Run type check
echo ""
echo "🔍 Running type check..."
if npm run typecheck; then
    print_success "Type check passed"
else
    print_warning "Type check has warnings (continuing due to ignoreBuildErrors: true)"
fi

# Run linting
echo ""
echo "🔍 Running linter..."
if npm run lint; then
    print_success "Lint check passed"
else
    print_warning "Lint check has warnings (continuing due to ignoreDuringBuilds: true)"
fi

# Run tests
echo ""
echo "🧪 Running tests..."
if npm run test:run; then
    print_success "All tests passed"
else
    print_error "Tests failed. Please fix before deploying to production."
    exit 1
fi

# Build the application
echo ""
echo "🏗️  Building application..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# Back to root
cd ../..

echo ""
echo "================================================"
print_success "Pre-deployment checks completed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Review PRODUCTION_DEPLOYMENT_V1.md checklist"
echo "  2. Ensure production Supabase database is ready"
echo "  3. Ensure Vercel environment variables are set"
echo "  4. Push to GitHub to trigger Vercel deployment:"
echo ""
echo "     git push origin main"
echo ""
print_warning "Remember to monitor the deployment on Vercel dashboard!"
echo "================================================"

