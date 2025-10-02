#!/bin/bash

# Script สำหรับรัน tests เฉพาะ CheckInOutCard component

echo "🧪 Running CheckInOutCard Unit Tests..."
echo "======================================"

# รัน unit tests
echo "📋 Running Unit Tests..."
npm run test:run -- CheckInOutCard.test.tsx

echo ""
echo "🔗 Running Integration Tests..."
npm run test:run -- CheckInOutCard.integration.test.tsx

echo ""
echo "📊 Running Tests with Coverage..."
npm run test:run -- CheckInOutCard --coverage

echo ""
echo "✅ All CheckInOutCard tests completed!"
