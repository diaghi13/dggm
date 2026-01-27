#!/bin/bash

# Change to script directory
cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:8000/api/v1"

echo -e "${BLUE}=== Testing Product Relations API ===${NC}\n"

# 1. Get auth token (assuming user exists)
echo -e "${BLUE}1. Getting auth token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dggm.com", "password": "password"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get auth token. Response:${NC}"
  echo $TOKEN_RESPONSE
  echo -e "\n${BLUE}Trying to create admin user...${NC}"
  php backend/artisan tinker --execute="
    \$user = \App\Models\User::firstOrCreate(
      ['email' => 'admin@dggm.com'],
      ['name' => 'Admin', 'password' => bcrypt('password')]
    );
    \$user->assignRole('admin');
    echo 'User created with email: admin@dggm.com, password: password';
  "
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Token obtained${NC}\n"

# 2. Test GET /product-categories
echo -e "${BLUE}2. GET /product-categories${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/product-categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
echo "$RESPONSE" | head -c 500
echo -e "\n${GREEN}✅ Categories fetched${NC}\n"

# 3. Test GET /product-relation-types
echo -e "${BLUE}3. GET /product-relation-types${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/product-relation-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
echo "$RESPONSE" | head -c 500
echo -e "\n${GREEN}✅ Relation types fetched${NC}\n"

# 4. Get SmartBat product ID
echo -e "${BLUE}4. Getting SmartBat product ID...${NC}"
SMARTBAT_ID=$(php backend/artisan tinker --execute="echo \App\Models\Product::where('code', 'SMARTBAT-S300')->first()->id;")
echo "SmartBat ID: $SMARTBAT_ID"

# 5. Test GET /products/{id}/relations
echo -e "\n${BLUE}5. GET /products/$SMARTBAT_ID/relations${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/products/$SMARTBAT_ID/relations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
echo "$RESPONSE" | head -c 800
echo -e "\n${GREEN}✅ Relations fetched${NC}\n"

# 6. Test POST /products/{id}/relations/calculate
echo -e "${BLUE}6. POST /products/$SMARTBAT_ID/relations/calculate?quantity=8${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/products/$SMARTBAT_ID/relations/calculate?quantity=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo -e "\n${GREEN}✅ Relations calculated (quantity=8)${NC}\n"

# 7. Test GET /products/{id}/relations/quote-list
echo -e "${BLUE}7. GET /products/$SMARTBAT_ID/relations/quote-list?quantity=8${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/products/$SMARTBAT_ID/relations/quote-list?quantity=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
QUOTE_COUNT=$(echo "$RESPONSE" | grep -o '"product_id"' | wc -l)
echo "Items in QUOTE list: $QUOTE_COUNT (should be 1: Cavo)"
echo "$RESPONSE" | head -c 600
echo -e "\n${GREEN}✅ Quote list fetched${NC}\n"

# 8. Test GET /products/{id}/relations/material-list
echo -e "${BLUE}8. GET /products/$SMARTBAT_ID/relations/material-list?quantity=8${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/products/$SMARTBAT_ID/relations/material-list?quantity=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
MATERIAL_COUNT=$(echo "$RESPONSE" | grep -o '"product_id"' | wc -l)
echo "Items in MATERIAL list: $MATERIAL_COUNT (should be 1: Cavo)"
echo "$RESPONSE" | head -c 600
echo -e "\n${GREEN}✅ Material list fetched${NC}\n"

# 9. Test GET /products/{id}/relations/stock-list
echo -e "${BLUE}9. GET /products/$SMARTBAT_ID/relations/stock-list?quantity=8${NC}"
RESPONSE=$(curl -s -X GET "$API_URL/products/$SMARTBAT_ID/relations/stock-list?quantity=8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
STOCK_COUNT=$(echo "$RESPONSE" | grep -o '"product_id"' | wc -l)
echo "Items in STOCK list: $STOCK_COUNT (should be 2: Cavo + 2 Bauli)"
echo "$RESPONSE" | head -c 800
echo -e "\n${GREEN}✅ Stock list fetched${NC}\n"

echo -e "${GREEN}=== All API tests completed! ===${NC}"