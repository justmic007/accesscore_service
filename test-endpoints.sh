#!/bin/bash

# AccessCore API Test Script
# Tests all endpoints to ensure everything works

BASE_URL="http://localhost:3000"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPass123!"

echo "=================================="
echo "AccessCore API Endpoint Tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    local expected_code=$6
    
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" $headers)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        FAILED=$((FAILED + 1))
        echo "$body"
    fi
    echo ""
}

# 1. Health Check
echo "=== 1. HEALTH CHECK ==="
test_endpoint "Health Check" "GET" "/health" "" "" "200"

# 2. API Info
echo "=== 2. API INFO ==="
test_endpoint "API Info" "GET" "/" "" "" "200"

# 3. Register User
echo "=== 3. USER REGISTRATION ==="
REGISTER_DATA="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Register User... "
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    USER_ID=$(echo "$body" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "User ID: $USER_ID"
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 4. Register Duplicate User (Should Fail)
echo "=== 4. DUPLICATE REGISTRATION (Should Fail) ==="
test_endpoint "Duplicate Email" "POST" "/auth/register" "$REGISTER_DATA" "" "409"

# 5. Login
echo "=== 5. USER LOGIN ==="
LOGIN_DATA="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: User Login... "
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    JWT_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "JWT Token: ${JWT_TOKEN:0:50}..."
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
    exit 1
fi
echo ""

# 6. Login with Wrong Password (Should Fail)
echo "=== 6. WRONG PASSWORD (Should Fail) ==="
WRONG_LOGIN="{\"email\":\"$EMAIL\",\"password\":\"WrongPass123!\"}"
test_endpoint "Wrong Password" "POST" "/auth/login" "$WRONG_LOGIN" "" "401"

# 7. Generate API Key #1
echo "=== 7. GENERATE API KEY #1 ==="
KEY1_DATA="{\"name\":\"Test Key 1\",\"rateLimit\":100}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$KEY1_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Generate API Key #1... "
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    API_KEY_1=$(echo "$body" | grep -o '"key":"[^"]*' | cut -d'"' -f4)
    API_KEY_ID_1=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "API Key: $API_KEY_1"
    echo "Key ID: $API_KEY_ID_1"
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 8. Generate API Key #2
echo "=== 8. GENERATE API KEY #2 ==="
KEY2_DATA="{\"name\":\"Test Key 2\",\"rateLimit\":200}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$KEY2_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Generate API Key #2... "
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    API_KEY_ID_2=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Key ID: $API_KEY_ID_2"
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 9. Generate API Key #3
echo "=== 9. GENERATE API KEY #3 ==="
KEY3_DATA="{\"name\":\"Test Key 3\",\"rateLimit\":300}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$KEY3_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Generate API Key #3... "
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    API_KEY_ID_3=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Key ID: $API_KEY_ID_3"
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 10. Generate API Key #4 (Should Fail - Max 3)
echo "=== 10. GENERATE API KEY #4 (Should Fail - Max 3) ==="
KEY4_DATA="{\"name\":\"Test Key 4\",\"rateLimit\":400}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d "$KEY4_DATA")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Max Keys Exceeded... "
if [ "$http_code" = "403" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 403, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 11. List API Keys
echo "=== 11. LIST API KEYS ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: List API Keys... "
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 12. List API Keys Without Auth (Should Fail)
echo "=== 12. LIST WITHOUT AUTH (Should Fail) ==="
test_endpoint "Unauthorized Access" "GET" "/api-keys" "" "" "401"

# 13. Revoke API Key
echo "=== 13. REVOKE API KEY ==="
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api-keys/$API_KEY_ID_2" \
    -H "Authorization: Bearer $JWT_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Revoke Key #2... "
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 14. Rotate API Key
echo "=== 14. ROTATE API KEY ==="
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys/$API_KEY_ID_1/rotate" \
    -H "Authorization: Bearer $JWT_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Rotate Key #1... "
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    NEW_API_KEY=$(echo "$body" | grep -o '"key":"[^"]*' | cut -d'"' -f4)
    echo "New API Key: $NEW_API_KEY"
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 201, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 15. Get Access Logs
echo "=== 15. GET ACCESS LOGS ==="
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/access-logs" \
    -H "Authorization: Bearer $JWT_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Access Logs... "
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 200, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# 16. Invalid API Key ID
echo "=== 16. INVALID KEY ID (Should Fail) ==="
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api-keys/invalid_id_123" \
    -H "Authorization: Bearer $JWT_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo -n "Testing: Invalid Key ID... "
if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - Bad Request)"
    PASSED=$((PASSED + 1))
    echo "$body"
else
    echo -e "${RED}✗ FAILED${NC} (Expected 400, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "$body"
fi
echo ""

# Summary
echo ""
echo "=================================="
echo "TEST SUMMARY"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
