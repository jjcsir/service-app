
;
const { insert, getAll, getById, updateById, count } = require("../db/datastore");

// 管理员登录
function adminLogin(req, res) {
  const { username, password } = req.body || {};
  
  const admins = getAll('admins', {});
  // Default: admin/admin123
  const defaultAdmin = admins.length === 0 
    ? insert('admins', { username: 'admin', password: '$2a$10$N9qo8uLOickgx2ZMRZoMye1jQHQm6fYiVcWHMxOyXbWl9r3dK3zS2', role: 'superadmin', status: 1 })
    : null;

  const user = admins.find(a => a.username === username && a.password === password);
  if (!user) {
    return res.json({ code: 401, message: '用户名或密码错误' });
  }
  
  // Return simplified token without JWT for simplicity (JWT auth already in middleware)
  res.json({ code: 0, data: { admin: { id: user.id, username: user.username, role: user.role } }, message: '登录成功' });
}

// 数据概览
function dashboard(req, res) {
  const allOrders = getAll('orders', {});
  const allUsers = getAll('users', {});
  const allRiders = getAll('riders', {});
  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(today));
  const todayRevenue = allOrders.filter(o => o.paid_amount > 0).reduce((sum, o) => sum + parseFloat(o.paid_amount || 0), 0);
  const weekOrders = allOrders.filter(o => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  
  // Revenue by status
  const revenueByStatus = {
    pending: allOrders.filter(o => [0, 1].includes(o.status)).length,
    doing: allOrders.filter(o => o.status === 2).length,
    completed: allOrders.filter(o => o.status === 3).length,
    cancelled: allOrders.filter(o => o.status === 4).length,
  };
  
  res.json({ code: 0, data: {
    totalOrders: allOrders.length,
    todayOrders: todayOrders.length,
    weekOrders,
    totalUsers: allUsers.length,
    totalRiders: allRiders.length,
    todayRevenue: todayRevenue.toFixed(2),
    totalRevenue: allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2),
    revenueByStatus,
  } });
}

// 订单管理
function orderList(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 20;
  const status = req.query.status !== undefined ? parseInt(req.query.status) : '';
  const keyword = req.query.keyword || '';
  
  let orders = getAll('orders', {});
  
  if (status !== '') {
    orders = orders.filter(o => o.status === parseInt(status));
  }
  if (keyword) {
    orders = orders.filter(o => 
      (o.order_no && o.order_no.includes(keyword)) || 
      (o.title && o.title.includes(keyword)) ||
      (o.start_address && o.start_address.includes(keyword))
    );
  }
  
  orders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  
  const total = orders.length;
  const paged = orders.slice((page - 1) * perPage, page * perPage);
  
  // Enrich
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const users = getAll('users', {});
  const riders = getAll('riders', {});
  
  for (const order of paged) {
    const svc = services.find(s => s.id === order.service_id);
    const usr = users.find(u => u.id === order.user_id);
    const rider = order.rider_id ? riders.find(r => r.id === order.rider_id) : null;
    
    order.service_name = svc?.name || '';
    order.category_name = categories.find(c => c.id === order.category_id)?.name || '';
    order.user_nickname = usr?.nickname || '';
    order.user_phone = usr?.phone || '';
    order.rider_name = rider?.realname || '';
    
    const statusLabels = { 0: '待抢单', 1: '已接单', 2: '进行中', 3: '已完成', 4: '已取消', 5: '待确认' };
    order.status_label = statusLabels[order.status] || '未知';
  }
  
  res.json({ code: 0, data: { orders: paged, total, page, perPage } });
}

// 订单详情
function orderDetail(req, res) {
  const orderNo = req.params.id;
  const orders = getAll('orders', {});
  const order = orders.find(o => o.order_no === orderNo);
  
  if (!order) return res.json({ code: 404, message: '订单不存在' });
  
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const users = getAll('users', {});
  const riders = getAll('riders', {});
  
  const svc = services.find(s => s.id === order.service_id);
  const usr = users.find(u => u.id === order.user_id);
  const rider = order.rider_id ? riders.find(r => r.id === order.rider_id) : null;
  
  const dispatchLogs = getAll('dispatch_records', {});
  const logs = dispatchLogs.filter(d => d.order_id === orderNo);
  
  const statusLabels = { 0: '待抢单', 1: '已接单', 2: '进行中', 3: '已完成', 4: '已取消', 5: '待确认' };
  
  res.json({ code: 0, data: {
    ...order,
    service_name: svc?.name || '',
    category_name: categories.find(c => c.id === order.category_id)?.name || '',
    user_nickname: usr?.nickname || '',
    user_phone: usr?.phone || '',
    rider_name: rider?.realname || '',
    status_label: statusLabels[order.status] || '未知',
    dispatch_logs: logs
  }});
}

// 指派订单
function assignOrder(req, res) {
  const { order_no, rider_id } = req.body || {};
  
  const orders = getAll('orders', {});
  const order = orders.find(o => o.order_no === order_no && [0, 5].includes(o.status));
  
  if (!order) {
    return res.json({ code: 400, message: '订单无效或已有骑手' });
  }
  
  updateById('orders', order.id, { rider_id, status: 5 });
  insert('dispatch_records', { order_id: order_no, to_rider_id: rider_id, method: 'assign', reason: '后台指派' });
  
  res.json({ code: 0, message: '指派成功' });
}

// 取消订单（后台）
function cancelOrder(req, res) {
  const orderNo = req.params.id;
  const orders = getAll('orders', {});
  const order = orders.find(o => o.order_no === orderNo);
  
  if (!order) return res.json({ code: 404, message: '订单不存在' });
  
  updateById('orders', order.id, { status: 4, cancel_reason: req.body.reason || '后台取消' });
  res.json({ code: 0, message: '订单已取消' });
}

// 接单员管理
function riderList(req, res) {
  const status = req.query.status || '';
  let riders = getAll('riders', {});
  
  if (status === 'certified') riders = riders.filter(r => r.cert_status === 1);
  else if (status === 'pending') riders = riders.filter(r => r.cert_status === 0);
  
  const sorted = riders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  res.json({ code: 0, data: { riders: sorted } });
}

// 审核骑手认证
function certifyRider(req, res) {
  const { rider_id, approved } = req.body || {};
  
  updateById('riders', parseInt(rider_id), { cert_status: approved ? 1 : 2 });
  res.json({ code: 0, message: approved ? '认证通过' : '认证拒绝' });
}

// 分类/服务管理
function serviceManagement(req, res) {
  const action = req.query.action || 'list';
  
  if (action === 'categories') {
    const cats = getAll('categories', { orderBy: { col: 'sort_order', dir: 'ASC' } });
    res.json({ code: 0, data: { type: 'categories', items: cats } });
  } else if (action === 'services') {
    const svcs = getAll('services', { orderBy: { col: 'sort_order', dir: 'DESC' } });
    const cats = getAll('categories', {});
    for (const svc of svcs) {
      const cat = cats.find(c => c.id === svc.category_id);
      svc.category_name = cat?.name || '';
    }
    res.json({ code: 0, data: { type: 'services', items: svcs } });
  } else if (action === 'addCategory') {
    const item = insert('categories', req.body || {});
    res.json({ code: 0, data: item });
  } else if (action === 'editService') {
    updateById('services', parseInt(req.body.id), req.body);
    res.json({ code: 0, message: '更新成功' });
  }
}

// 用户管理
function userList(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 20;
  
  const users = getAll('users', { orderBy: { col: 'created_at', dir: 'DESC' } });
  const total = users.length;
  const paged = users.slice((page - 1) * perPage, page * perPage);
  
  const orders = getAll('orders', {});
  for (const user of paged) {
    user.total_orders = orders.filter(o => o.user_id === user.id).length;
  }
  
  res.json({ code: 0, data: { users: paged, total, page, perPage } });
}

// ==================== 优惠券管理 ====================

/**
 * 获取所有优惠券列表
 * GET /api/admin/coupons
 */
function couponList(req, res) {
  const coupons = getAll('coupons', { orderBy: { col: 'created_at', dir: 'DESC' } });
  
  // 补充显示字段
  for (const c of coupons) {
    c.typeLabel = c.type === 'cash' ? '现金券' : c.type === 'discount' ? '折扣券' : '普通券';
    c.statusLabel = c.status === 0 ? '禁用' : c.status === 1 ? '进行中' : '已结束';
  }
  
  res.json({ code: 0, data: { coupons } });
}

/**
 * 创建新优惠券
 * POST /api/admin/coupon
 */
function couponAdd(req, res) {
  const body = req.body || {};
  const { name, type, value, min_amount, valid_days, total_count, description, status } = body;
  
  if (!name || !value) {
    return res.json({ code: 400, message: '缺少必填参数：name, value' });
  }
  
  const newCoupon = insert('coupons', {
    name,
    type: type || 'cash',         // 'normal' | 'cash' | 'discount'
    value: parseFloat(value),     // 金额(现金券) 或 折扣比例(如8.5表示85折)
    min_amount: min_amount ? parseFloat(min_amount) : 0,
    valid_days: valid_days ? parseInt(valid_days) : 30,
    total_count: total_count ? parseInt(total_count) : 1000,
    claimed_count: 0,
    description: description || '',
    status: status !== undefined ? parseInt(status) : 1,
    start_date: body.start_date || new Date().toISOString().split('T')[0],
    end_date: body.end_date || ''
  });
  
  res.json({ code: 0, data: newCoupon, message: '优惠券创建成功' });
}

/**
 * 更新优惠券状态
 * PUT /api/admin/coupon/:id
 */
function couponUpdate(req, res) {
  const couponId = parseInt(req.params.id);
  const coupon = getById('coupons', couponId);
  if (!coupon) {
    return res.json({ code: 404, message: '优惠券不存在' });
  }
  
  const updates = {};
  for (const f of ['name', 'type', 'value', 'min_amount', 'valid_days', 'total_count', 
                   'description', 'status', 'start_date', 'end_date']) {
    if (req.body[f] !== undefined) {
      updates[f] = f === 'value' || f === 'min_amount' ? parseFloat(req.body[f]) 
                 : f === 'valid_days' || f === 'total_count' ? parseInt(req.body[f])
                 : req.body[f];
    }
  }
  
  updateById('coupons', couponId, updates);
  res.json({ code: 0, message: '更新成功' });
}

/**
 * 删除优惠券
 * DELETE /api/admin/coupon/:id
 */
function couponDelete(req, res) {
  const couponId = parseInt(req.params.id);
  const coupons = getAll('coupons', {});
  const coupon = coupons.find(c => c.id === couponId);
  
  if (!coupon) {
    return res.json({ code: 404, message: '优惠券不存在' });
  }
  
  // 软删除：设置 status = -1
  updateById('coupons', couponId, { status: -1 });
  res.json({ code: 0, message: '已下架' });
}

// ==================== 分销管理 ====================

/**
 * 获取分销商列表
 * GET /api/admin/distributors
 */
function distributorList(req, res) {
  const distributors = getAll('distributors', { orderBy: { col: 'created_at', dir: 'DESC' } });
  const users = getAll('users', {});
  const commissionLogs = getAll('commission_logs', {});
  
  for (const d of distributors) {
    // 关联用户信息
    const user = users.find(u => u.id === d.user_id);
    d.user_nickname = user?.nickname || '未知用户';
    d.user_phone = user?.phone || '';
    d.user_avatar = user?.avatar || '';
    
    // 下级人数
    const downlines = distributors.filter(sub => sub.parent_id === d.user_id);
    d.downline_count = downlines.length;
    
    // 累计佣金
    const myLogs = commissionLogs.filter(l => l.distributor_id === d.id);
    d.total_commission = myLogs.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    d.pending_commission = myLogs.filter(l => l.status === 0).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    d.paid_commission = myLogs.filter(l => l.status === 1).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  }
  
  res.json({ code: 0, data: { distributors } });
}

/**
 * 查看分销商详情
 * GET /api/admin/distributor/:id
 */
function distributorDetail(req, res) {
  const distId = parseInt(req.params.id);
  const distributors = getAll('distributors', {});
  const dist = distributors.find(d => d.id === distId);
  
  if (!dist) {
    return res.json({ code: 404, message: '分销商不存在' });
  }
  
  const users = getAll('users', {});
  const commissionLogs = getAll('commission_logs', {});
  
  // 关联用户信息
  const user = users.find(u => u.id === dist.user_id);
  
  // 下级分销商
  const downlines = distributors.filter(sub => sub.parent_id === dist.user_id);
  const downlineDetails = [];
  for (const dl of downlines) {
    const dlUser = users.find(u => u.id === dl.user_id);
    const dlLogs = commissionLogs.filter(l => l.distributor_id === dl.id);
    downlineDetails.push({
      ...dl,
      nickname: dlUser?.nickname || '',
      phone: dlUser?.phone || '',
      total_earned: dlLogs.reduce((s, l) => s + parseFloat(l.amount || 0), 0)
    });
  }
  
  // 佣金记录
  const myLogs = commissionLogs.filter(l => l.distributor_id === distId).sort(
    (a, b) => (b.created_at || '').localeCompare(a.created_at || '')
  );
  
  res.json({ code: 0, data: {
    ...dist,
    user_info: user || {},
    downline_count: downlines.length,
    downlines: downlineDetails,
    total_commission: myLogs.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0),
    pending_commission: myLogs.filter(l => l.status === 0).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0),
    paid_commission: myLogs.filter(l => l.status === 1).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0),
    commission_logs: myLogs
  }});
}

module.exports = { 
  adminLogin, dashboard, orderList, orderDetail, assignOrder, cancelOrder, 
  riderList, certifyRider, serviceManagement, userList,
  // 优惠券管理
  couponList, couponAdd, couponUpdate, couponDelete,
  // 分销管理
  distributorList, distributorDetail
};
