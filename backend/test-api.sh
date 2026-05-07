#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api/v1"

echo "=== 1. Auth Tests ==="
# Login Admin
ADMIN_RES=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password123"}')
ADMIN_TOKEN=$(echo $ADMIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
ADMIN_ID=$(echo $ADMIN_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Login Member
MEMBER_RES=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"member@example.com","password":"password123"}')
MEMBER_TOKEN=$(echo $MEMBER_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
MEMBER_ID=$(echo $MEMBER_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "Admin Token: ${ADMIN_TOKEN:0:15}..."
echo "Member Token: ${MEMBER_TOKEN:0:15}..."

# Test Signup Duplicate (Edge Case)
echo "Testing Duplicate Signup..."
curl -s -X POST $BASE_URL/auth/signup -H "Content-Type: application/json" -d '{"name":"Test","email":"admin@example.com","password":"password123"}' | jq .

echo -e "\n=== 2. Project Tests ==="
# Admin creates project
PROJECT_RES=$(curl -s -X POST $BASE_URL/projects -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"New Test Project","description":"API Test"}')
PROJECT_ID=$(echo $PROJECT_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Created Project: $PROJECT_ID"

# Member tries to create project (Should be allowed based on current setup? Wait, let's check RBAC)
# Ah! RBAC in ProjectsController wasn't strictly checked for CREATE. Let's see what happens.
echo "Member creating project..."
curl -s -X POST $BASE_URL/projects -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Member Project"}' | jq .

# Add member to project (Admin)
echo "Admin adding member..."
curl -s -X POST $BASE_URL/projects/$PROJECT_ID/members -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"userId\":\"$MEMBER_ID\"}" | jq .

# Add member again (Duplicate edge case)
echo "Admin adding member twice..."
curl -s -X POST $BASE_URL/projects/$PROJECT_ID/members -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"userId\":\"$MEMBER_ID\"}" | jq .

# Remove admin (Edge case)
echo "Admin trying to remove themselves..."
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/members/$ADMIN_ID -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo -e "\n=== 3. Task Tests ==="
# Admin creates task
TASK_RES=$(curl -s -X POST $BASE_URL/tasks -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Task\",\"projectId\":\"$PROJECT_ID\",\"priority\":\"MEDIUM\",\"dueDate\":\"2026-12-31T00:00:00Z\",\"assignedToId\":\"$MEMBER_ID\"}")
TASK_ID=$(echo $TASK_RES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Created Task: $TASK_ID"

# Member tries to create task (Should fail)
echo "Member creating task..."
curl -s -X POST $BASE_URL/tasks -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Hacked Task\",\"projectId\":\"$PROJECT_ID\",\"priority\":\"LOW\"}" | jq .

# Member updates their task status
echo "Member updating task status..."
curl -s -X PATCH $BASE_URL/tasks/$TASK_ID -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}' | jq .

# Member updates other fields (Should fail or ignore?)
echo "Member updating task priority..."
curl -s -X PATCH $BASE_URL/tasks/$TASK_ID -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"priority":"URGENT"}' | jq .

# Member deletes task (Should fail)
echo "Member deleting task..."
curl -s -X DELETE $BASE_URL/tasks/$TASK_ID -H "Authorization: Bearer $MEMBER_TOKEN" | jq .

echo -e "\n=== 4. Dashboard Tests ==="
echo "Admin Dashboard..."
curl -s -X GET $BASE_URL/dashboard -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "Member Dashboard..."
curl -s -X GET $BASE_URL/dashboard -H "Authorization: Bearer $MEMBER_TOKEN" | jq .

echo -e "\n=== 5. Users Tests ==="
echo "Get Users..."
curl -s -X GET "$BASE_URL/users?page=1&limit=5" -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "Testing completed."
