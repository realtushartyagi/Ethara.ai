#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api/v1"

# Helper to format JSON output
function format_json() {
  jq -c '{statusCode, message, error}' 2>/dev/null || cat
  echo ""
}

echo "========================================="
echo "       COMPREHENSIVE RBAC TEST           "
echo "========================================="

echo -e "\n--- SETUP ---"

# 1. Create Users
echo "Creating users..."
curl -s -X POST $BASE_URL/auth/signup -H "Content-Type: application/json" -d '{"name":"Admin Two","email":"admin2@test.com","password":"password123"}' > /dev/null || true
curl -s -X POST $BASE_URL/auth/signup -H "Content-Type: application/json" -d '{"name":"Member Two","email":"member2@test.com","password":"password123"}' > /dev/null || true
curl -s -X POST $BASE_URL/auth/signup -H "Content-Type: application/json" -d '{"name":"Outsider","email":"outsider@test.com","password":"password123"}' > /dev/null || true

# 2. Login
A_RES=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"admin2@test.com","password":"password123"}')
ADMIN_TOKEN=$(echo $A_RES | jq -r .accessToken)
ADMIN_ID=$(echo $A_RES | jq -r .user.id)

M_RES=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"member2@test.com","password":"password123"}')
MEMBER_TOKEN=$(echo $M_RES | jq -r .accessToken)
MEMBER_ID=$(echo $M_RES | jq -r .user.id)

O_RES=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"outsider@test.com","password":"password123"}')
OUTSIDER_TOKEN=$(echo $O_RES | jq -r .accessToken)
OUTSIDER_ID=$(echo $O_RES | jq -r .user.id)

echo "Admin ID: $ADMIN_ID"
echo "Member ID: $MEMBER_ID"
echo "Outsider ID: $OUTSIDER_ID"

# 3. Create Project & Add Member (by Admin)
P_RES=$(curl -s -X POST $BASE_URL/projects -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"RBAC Project","description":"Testing RBAC"}')
PROJECT_ID=$(echo $P_RES | jq -r .id)
echo "Project ID: $PROJECT_ID"

curl -s -X POST $BASE_URL/projects/$PROJECT_ID/members -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"userId\":\"$MEMBER_ID\"}" > /dev/null

# 4. Create Tasks (by Admin)
T1_RES=$(curl -s -X POST $BASE_URL/tasks -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Member Task\",\"projectId\":\"$PROJECT_ID\",\"priority\":\"LOW\",\"assignedToId\":\"$MEMBER_ID\"}")
TASK_MEMBER_ID=$(echo $T1_RES | jq -r .id)

T2_RES=$(curl -s -X POST $BASE_URL/tasks -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Admin Task\",\"projectId\":\"$PROJECT_ID\",\"priority\":\"HIGH\",\"assignedToId\":\"$ADMIN_ID\"}")
TASK_ADMIN_ID=$(echo $T2_RES | jq -r .id)

echo "Task (Member): $TASK_MEMBER_ID"
echo "Task (Admin): $TASK_ADMIN_ID"

echo -e "\n========================================="
echo "             RBAC TESTS                  "
echo "========================================="

echo -e "\n[TEST 1] Outsider tries to view Project X (Should be 403 Forbidden)"
curl -s -X GET $BASE_URL/projects/$PROJECT_ID -H "Authorization: Bearer $OUTSIDER_TOKEN" | format_json

echo -e "\n[TEST 2] Outsider tries to view Task 1 (Should be 403 Forbidden)"
curl -s -X GET $BASE_URL/tasks/$TASK_MEMBER_ID -H "Authorization: Bearer $OUTSIDER_TOKEN" | format_json

echo -e "\n[TEST 3] Member tries to add Outsider to Project X (Should be 403 Forbidden)"
curl -s -X POST $BASE_URL/projects/$PROJECT_ID/members -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d "{\"userId\":\"$OUTSIDER_ID\"}" | format_json

echo -e "\n[TEST 4] Member tries to delete Project X (Should be 403 Forbidden)"
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID -H "Authorization: Bearer $MEMBER_TOKEN" | format_json

echo -e "\n[TEST 5] Member tries to create a Task in Project X (Should be 403 Forbidden)"
curl -s -X POST $BASE_URL/tasks -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Hacked Task\",\"projectId\":\"$PROJECT_ID\"}" | format_json

echo -e "\n[TEST 6] Member tries to update Task 2 (assigned to Admin) (Should be 403 Forbidden)"
curl -s -X PATCH $BASE_URL/tasks/$TASK_ADMIN_ID -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"status":"DONE"}' | format_json

echo -e "\n[TEST 7] Member tries to update Task 1 Priority (Not allowed, should be 403 Forbidden)"
curl -s -X PATCH $BASE_URL/tasks/$TASK_MEMBER_ID -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"priority":"URGENT"}' | format_json

echo -e "\n[TEST 8] Member tries to update Task 1 Status (Allowed, should return 200 OK)"
curl -s -X PATCH $BASE_URL/tasks/$TASK_MEMBER_ID -H "Authorization: Bearer $MEMBER_TOKEN" -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}' | jq -c '{id, title, status, priority}'

echo -e "\n[TEST 9] Admin tries to update Task 1 priority (assigned to Member) (Allowed, should return 200 OK)"
curl -s -X PATCH $BASE_URL/tasks/$TASK_MEMBER_ID -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"priority":"URGENT"}' | jq -c '{id, title, status, priority}'

echo -e "\n[TEST 10] Admin tries to delete Task 1 (Allowed, should return 200 OK)"
curl -s -X DELETE $BASE_URL/tasks/$TASK_MEMBER_ID -H "Authorization: Bearer $ADMIN_TOKEN" | jq -c '{id, title}'

echo -e "\n[TEST 11] Admin tries to remove Member from Project X (Allowed, should return 200 OK)"
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/members/$MEMBER_ID -H "Authorization: Bearer $ADMIN_TOKEN" | jq -c '{projectId, userId}'

echo -e "\n========================================="
echo "             TESTS COMPLETE              "
echo "========================================="
