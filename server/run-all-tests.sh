#!/bin/bash
cd /Users/mac/.codex/worktrees/2f93/New project/server

# Kill any existing server
pkill -f "node index.js" 2>/dev/null
sleep 1

# Clear old data and restart
rm -rf .data/
mkdir -p .data
node index.js &
SERVER_PID=$!
sleep 3

# Wait for server
for i in $(seq 1 10); do
  if curl -s http://127.0.0.1:5000/api/health >/dev/null 2>&1; then
    echo "Server ready"
    break
  fi
  sleep 1
done

echo "=========================================="
echo "  API全面测试报告 - merchant订单管理专项"
echo "=========================================="

PASS=0
FAIL=0

test_api() {
  local name="$1" method="$2" url="$3" body="$4" expected="$5"
  local resp status_code
  
  if [ "$body" = "" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$body" "$url")
  fi
  
  status_code=$(echo "$resp" | tail -1)
  body_only=$(echo "$resp" | sed '$d')
  
  if [ "$status_code" = "$expected" ]; then
    echo "  ✅ $name (HTTP $status_code)"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name (Expected HTTP $expected, got $status_code)"
    echo "     Response: $body_only"
    FAIL=$((FAIL+1))
  fi
}

# First login to get a token
LOGIN_RESP=$(curl -s -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_merchant_user","nickname":"商户用户"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)

# Register merchant
MERCH_RESP=$(curl -s -X POST http://127.0.0.1:5000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"张三餐馆","contact":"张三","phone":"13800000001","address":"北京市朝阳区"}')
# Check if merchant endpoint exists (it might not be a POST endpoint yet)
# Skip if no POST endpoint, use ID=1 directly

echo ""
echo "📋 测试1: 商户订单列表 GET /api/merchants/1/orders"
test_api "merchant-orders-list" "GET" "http://127.0.0.1:5000/api/merchants/1/orders" "" "200"

echo ""
echo "📋 测试2: 带状态筛选 GET /api/merchants/1/orders?status=0"
test_api "merchant-orders-pending" "GET" "http://127.0.0.1:5000/api/merchants/1/orders?status=0" "" "200"

echo ""
echo "📋 测试3: 带关键词搜索 GET /api/merchants/1/orders?keyword=SO"
test_api "merchant-orders-search" "GET" "http://127.0.0.1:5000/api/merchants/1/orders?keyword=SO" "" "200"

echo ""
echo "📋 测试4: 分页 GET /api/merchants/1/orders?page=1&perPage=10"
test_api "merchant-orders-paginated" "GET" "http://127.0.0.1:5000/api/merchants/1/orders?page=1&perPage=10" "" "200"

echo ""
echo "📋 测试5: 获取商户信息 GET /api/merchants/1"
test_api "merchant-info" "GET" "http://127.0.0.1:5000/api/merchants/1" "" "200"

echo ""
echo "📋 测试6: 更新商户 PUT /api/merchants/1"
test_api "merchant-update" "PUT" "http://127.0.0.1:5000/api/merchants/1" '{"name":"新餐馆"}' "200"

echo ""
echo "📋 测试7: 商户店铺列表 GET /api/merchants/1/shops"
test_api "merchant-shops" "GET" "http://127.0.0.1:5000/api/merchants/1/shops" "" "200"

echo ""
echo "📋 测试8: 商户财务日志 GET /api/merchants/1/finance"
test_api "merchant-finance" "GET" "http://127.0.0.1:5000/api/merchants/1/finance" "" "200"

# Summary
echo ""
echo "=========================================="
echo "  📊 汇总: $(($PASS+$FAIL))个接口 | ✅:$PASS | ❌:$FAIL"
echo "=========================================="

# Clean up
kill $SERVER_PID 2>/dev/null
exit $FAIL
