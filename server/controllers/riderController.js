const { db } = require('../db/database');
const { generateToken } = require('../middleware/auth');
const { insert, getAll, getByField, updateById } = db.db;

function register(req, res) {
  const { user_id, realname, phone, id_card_front, id_card_back, vehicle_type, city, district } = req.body || {};
  
  const existing = getAll('riders', { where: { user_id }})[0];
  if (existing) {
    return res.json({ code: 0, data: { rider: existing, token: '' }, message: '已存在' });
  }
  
  const rider = insert('riders', { 
    user_id, realname, phone, id_card_front, id_card_back, vehicle_type, 
    city, district, cert_status: 1, status: 1, is_active: 1
  });
  
  const token = generateToken({ userId: rider.id, role: 'rider' });
  res.json({ code: 0, data: { token, rider } });
}

function login(req, res) {
  const { openid, phone } = req.body || {};
  
  let rider = null;
  if (phone) rider = getByField('riders', 'phone', phone);
  if (!rider && openid) {
    const user = getByField('users', 'openid', openid);
    if (user) rider = getByField('riders', 'user_id', user.id);
  }
  
  if (!rider) return res.json({ code: 404, message: '请先注册为骑手' });
  
  const token = generateToken({ userId: rider.id, role: 'rider' });
  res.json({ code: 0, data: { token, rider } });
}

function getProfile(req, res) {
  const rider = getByField('riders', 'id', req.user.userId);
  if (!rider) return res.json({ code: 404, message: '骑手不存在' });
  res.json({ code: 0, data: rider });
}

function updateStatus(req, res) {
  const updates = {};
  if (req.body.available !== undefined) updates.available = req.body.available;
  if (req.body.lat !== undefined) updates.lat = req.body.lat;
  if (req.body.lng !== undefined) updates.lng = req.body.lng;
  if (Object.keys(updates).length > 0) {
    updateById('riders', req.user.userId, updates);
  }
  res.json({ code: 0, message: '状态已更新' });
}

function grabPool(req, res) {
  const pendingOrders = getAll('orders', { 
    where: { status: 0 },
    orderBy: { col: 'created_at', dir: 'ASC' }
  });
  
  // Enrich with details
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const users = getAll('users', {});
  const riders = getAll('riders', {});
  
  for (const order of pendingOrders) {
    const svc = services.find(s => s.id === order.service_id);
    const cat = categories.find(c => c.id === order.category_id);
    const usr = users.find(u => u.id === order.user_id);
    const rid = riders.find(r => r.id === order.rider_id);
    order.service_name = svc?.name || '';
    order.category_name = cat?.name || '';
    order.user_nickname = usr?.nickname || '';
    order.rider_name = rid?.realname || '';
  }
  
  const activeRiders = getAll('riders', { where: { is_active: 1, available: 1, cert_status: 1 } });
  
  res.json({ code: 0, data: { orders: pendingOrders, available_riders: activeRiders } });
}

function grabOrder(req, res) {
  const { order_no } = req.body || {};
  const riderId = req.user.userId;
  
  const orders = getAll('orders', { where: { order_no, status: 0 } });
  const order = orders.find(o => !o.rider_id);
  
  if (!order) return res.json({ code: 400, message: '订单不存在或已被抢' });
  
  updateById('orders', order.id, { rider_id: riderId, status: 1 });
  
  const rider = getByField('riders', 'id', riderId);
  updateById('riders', riderId, { 
    total_orders: (rider.total_orders || 0) + 1,
    rank: (rider.rank || 0) + 10
  });
  
  res.json({ code: 0, data: { order_no, rider } });
}

function myOrders(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 20;
  const status = req.query.status;
  
  let allOrders = getAll('orders', { where: { rider_id: req.user.userId } });
  
  if (status !== undefined && status !== '') {
    allOrders = allOrders.filter(o => o.status === parseInt(status));
  }
  
  allOrders.sort((a, b) => b.created_at > a.created_at ? 1 : -1);
  
  const total = allOrders.length;
  const paged = allOrders.slice((page - 1) * perPage, page * perPage);
  
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const users = getAll('users', {});
  
  for (const order of paged) {
    const svc = services.find(s => s.id === order.service_id);
    const cat = categories.find(c => c.id === order.category_id);
    const usr = users.find(u => u.id === order.user_id);
    order.service_name = svc?.name || '';
    order.category_name = cat?.name || '';
    order.user_nickname = usr?.nickname || '';
  }
  
  res.json({ code: 0, data: { orders: paged, total, page, perPage } });
}

function updateOrderStatus(req, res) {
  const { status, order_id } = req.body || {};
  const riderId = req.user.userId;
  
  const statusMap = { pickup: 2, deliver: 3, complete: 4 };
  const statusVal = statusMap[status];
  
  if (!statusVal) return res.json({ code: 400, message: '无效的状态变更' });
  
  // Find order by numeric id or order_no
  let order = null;
  if (order_id) {
    const orders = getAll('orders', { where: { rider_id: riderId } });
    order = orders.find(o => o.id === parseInt(order_id) || o.order_no === order_id);
  }
  
  if (!order) return res.json({ code: 400, message: '订单不存在' });
  
  const updates = { status: statusVal };
  if (statusVal === 4) updates.complete_time = new Date().toISOString().split('T')[0];
  updateById('orders', order.id, updates);
  
  if (statusVal === 4) {
    const rider = getByField('riders', 'id', riderId);
    const newIncome = (parseFloat(rider.total_income) || 0) + parseFloat(order.paid_amount || 0) * 0.8;
    updateById('riders', riderId, { total_income: newIncome });
    
    insert('commission_logs', { 
      distributor_id: riderId, order_id: order.id, 
      amount: parseFloat(order.paid_amount || 0) * 0.8, type: 'rider_commission'
    });
  }
  
  res.json({ code: 0, message: '状态已更新' });
}

function stats(req, res) {
  const rider = getByField('riders', 'id', req.user.userId);
  if (!rider) return res.json({ code: 404, message: '骑手不存在' });
  
  const allOrders = getAll('orders', { where: { rider_id: req.user.userId } });
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(today) && [2,3,4].includes(o.status)).length;
  const logs = getAll('commission_logs', { where: { distributor_id: req.user.userId } });
  const weekIncome = logs.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  
  res.json({ code: 0, data: { 
    total_orders: rider.total_orders || 0,
    total_income: rider.total_income || 0,
    rating: rider.rating || 5.0,
    level: rider.level || 1,
    todayOrders,
    weekIncome: weekIncome.toFixed(2)
  } });
}

module.exports = { register, login, getProfile, updateStatus, grabPool, grabOrder, myOrders, updateOrderStatus, stats };
