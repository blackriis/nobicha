#!/bin/bash

echo "=== Testing Deeplink Functionality ==="
echo

echo "1. Testing admin route redirect..."
curl -s -I "http://localhost:3000/admin/employees" | grep location

echo "2. Testing employee route redirect..."  
curl -s -I "http://localhost:3000/dashboard" | grep location

echo "3. Testing nested admin route..."
curl -s -I "http://localhost:3000/admin/employees/123/edit" | grep location

echo
echo "Expected behavior:"
echo "- Admin routes should redirect to /login/admin?redirectTo=/admin/..."
echo "- Employee routes should redirect to /login/employee?redirectTo=/..."
echo
echo "Now test in browser:"
echo "1. Open http://localhost:3000/admin/employees"
echo "2. Should redirect to login page with query parameter"
echo "3. Login with admin credentials"
echo "4. Should redirect back to /admin/employees"