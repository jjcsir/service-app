const http = require('http');

const BASE = 'http://localhost:5000';
let results = [];
let token = '';
let riderToken = '';
let orderId = '';
let orderNo = '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token && !path.startsWith('/api/auth/') && !path.startsWith('/api/rider/')) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

function pass(testName, status, detail) {
  const icon = status >= 200 && status < 300 ? '✅' : '❌';
  console.log(`${icon} [${testName}] HTTP ${status}`);
  results.push({ name: testName, status, passed: status >= 200 && status < 300, detail });
}

async function run() {
  // ===== 1. AUTH =====
  section('1. 认证模块');
  
  let r = await request('POST', '/api/auth/login', { openid: 'test_user1', nickname: '张三' });
  pass('POST /api/auth/login', r.status, r.body.code === 0 ? '返回token' : JSON.stringify(r.body));
  token = r.body?.data?.token || '';
  console.log(`   → Token: ${token.slice(0, 15)}...`);
  
  // ===== 2. USER MODULE =====
  section('2. 用户模块');
  
  r = await request('GET', '/api/users/me');
  pass('GET /api/users/me', r.status, r.body?.data?.nickname);
  
  r = await request('PUT', '/api/users/me', { phone: '13800000001', realname: '张三' });
  pass('PUT /api/users/me', r.status, r.body?.message);
  
  r = await request('GET', '/api/users/me/wallet');
  pass('GET /api/users/me/wallet', r.status, `余额:${r.body?.data?.balance}`);
  
  r = await request('POST', '/api/users/me/wallet/topup', { amount: 100, method: 'wechat' });
  pass('POST /api/users/me/wallet/topup', r.status, `余额:${r.body?.data?.balance}`);
  
  // ===== 3. SERVICES =====
  section('3. 服务/分类模块');
  
  r = await request('GET', '/api/categories');
  pass('GET /api/categories', r.status, `${(r.body?.data||[]).length}个分类, ${(r.body?.data||[]).reduce((s,c)=>s+(c.services?c.services.length:0),0)}个服务`);
  
  r = await request('GET', '/api/services');
  pass('GET /api/services', r.status, `${(r.body?.data||[]).length}个服务`);
  
  r = await request('GET', '/api/banners');
  pass('GET /api/banners', r.status, `${(r.body?.data||[]).length}张轮播图`);
  
  r = await request('GET', '/api/faqs');
  pass('GET /api/faqs', r.status, `${(r.body?.data||[]).length}个常见问题`);
  
  r = await request('GET', '/api/coupons');
  pass('GET /api/coupons', r.status, `${(r.body?.data||[]).length}个优惠券`);
  
  // ===== 4. ORDERS =====
  section('4. 订单模块');
  
  r = await request('POST', '/api/orders', {
    service_id: 1, category_id: 1, title: '深度保洁测试单',
    start_address: '北京市朝阳区xxx', end_address: '北京市海淀区yyy',
    total_amount: 199
  });
  pass('POST /api/orders', r.status, r.body?.data?.order_no || r.body?.message);
  orderNo = r.body?.data?.order_no;
  orderId = r.body?.data?.id;
  console.log(`   → 订单号: ${orderNo}`);
  
  r = await request('GET', '/api/orders');
  pass('GET /api/orders', r.status, `${(r.body?.data?.orders||[]).length}条订单, 总计:${r.body?.data?.total}`);
  
  r = await request('GET', `/api/orders/${orderNo}`);
  pass('GET /api/orders/:id', r.status, r.body?.data?.service_name || r.body?.message);
  
  // ===== 5. RIDER MODULE =====
  section('5. 骑手模块');
  
  r = await request('POST', '/api/rider/register', {
    user_id: 1, realname: '李四', phone: '13800001111',
    vehicle_type: '电动车', city: '北京', district: '朝阳'
  });
  pass('POST /api/rider/register', r.status, r.body?.data?.rider?.realname || JSON.stringify(r.body));
  riderToken = r.body?.data?.token || '';
  
  // Login as rider
  r = await request('POST', '/api/rider/login', { phone: '13800001111' });
  pass('POST /api/rider/login', r.status, r.body?.data?.rider?.realname);
  
  // Re-auth to use riderToken for subsequent calls
  token = riderToken;
  
  r = await request('GET', '/api/rider/me');
  pass('GET /api/rider/me', r.status, r.body?.data?.realname);
  
  r = await request('PUT', '/api/rider/status', { available: true, lat: 39.9, lng: 116.4 });
  pass('PUT /api/rider/status', r.status, r.body?.message);
  
  // Temporarily use the original admin token for dispatch test, or just test grab-pool which needs rider auth
  // Grab pool uses riderAuth
  r = await request('GET', '/api/rider/grab-pool');
  pass('GET /api/rider/grab-pool', r.status, `${(r.body?.data?.orders||[]).length}个待抢订单`);
  
  // Stats - needs rider auth but let's try both tokens
  r = await request('GET', '/api/rider/stats');
  pass('GET /api/rider/stats', r.status, r.body?.data?.total_orders !== undefined ? `接单:${r.body.data.total_orders}` : JSON.stringify(r.body));
  
  // Test order status update
  r = await request('PUT', `/api/rider/orders/1/status`, { status: 'pickup' });
  pass('PUT /api/rider/orders/1/status', r.status, r.body?.message || JSON.stringify(r.body));
  
  // ===== 6. DISPATCH =====
  section('6. 调度模块（需要管理员token）');
  
  // Admin needs login first - but our system only has user/rider roles
  // Let's test without auth first, then see
  r = await request('GET', '/api/dispatch/pool');
  pass('GET /api/dispatch/pool', r.status, typeof r.body?.code === 'number' ? (r.body.code===401?'需认证':JSON.stringify(r.body)) : '无响应');
  
  // Auto dispatch - needs rider auth, let's try that
  r = await request('POST', '/api/dispatch/auto', {});
  pass('POST /api/dispatch/auto', r.status, JSON.stringify(r.body));
  
  // ===== 7. ADMIN STATS =====
  section('7. 管理统计');
  
  r = await request('GET', '/api/admin/stats');
  pass('GET /api/admin/stats', r.status, JSON.stringify(r.body));
  
  // ===== REPORT =====
  section('📊 测试报告汇总');
  
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  
  console.log(`\n总计: ${total} 个接口测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  
  if (failed > 0) {
    console.log('\n失败明细:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name} [${r.status}] — ${r.detail}`);
    });
  }
  
  // Save report
  require('fs').writeFileSync('api-test-report.txt', JSON.stringify({
    timestamp: new Date().toISOString(),
    total, passed, failed,
    results: results.map(r => ({ name: r.name, passed: r.passed, status: r.status, detail: r.detail }))
  }, null, 2));
  console.log('\n📄 报告已保存至 server/api-test-report.json');
}

run().catch(e => {
  console.error('Test error:', e.message);
  process.exit(1);
});
