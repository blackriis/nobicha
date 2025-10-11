#!/bin/bash

echo "=== Creating Test Users ==="

# Create admin user
echo "Creating admin user..."
curl -X POST http://localhost:3000/api/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "role": "admin"
  }' | jq .

echo

# Create employee user
echo "Creating employee user..."
curl -X POST http://localhost:3000/api/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@test.com", 
    "password": "password123",
    "role": "employee"
  }' | jq .

echo
echo "Test users created:"
echo "Admin: admin@test.com / password123"
echo "Employee: employee@test.com / password123"
echo
echo "Now test deeplink:"
echo "1. Go to http://localhost:3000/admin/employees"
echo "2. Login with admin@test.com / password123"
echo "3. Should redirect to /admin/employees"