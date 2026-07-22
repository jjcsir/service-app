const ds = require('../db/datastore');
const { generateToken } = require('../middleware/auth');

function register(req, res) {
  const { user_id, realname, phone, id_card_front, id_card_back, vehicle_type, city, district } = req.body || {};
  const existing = ds.getAll('riders', { where: { user_id }})[0];
  if (existing) return res.json({ code: 0, data: { rider: existing, token: '' }, message: '已存在' });
  const rider = ds.insert('riders', { user_id, realname, phone, vehicle_type, city, district, cert_status: 1, status: 1, is_active: 1 });
  res.json({ code: 0, data: { token: generateToken({ userId: rider.id, role: 'rider' }), rider } });
}

function login(req, res) {
  const { openid, phone } = req.body || {};
  let rider = null;
  if (phone) rider = ds.getByField('riders', 'phone', phone);
  if (!rider && openid) { const user = ds.getByField('users', 'openid', openid); if (user) rider = ds.getByField('riders', 'user_id', user.id); }
  if (!rider) return res.json({ code: 404, message: '请先注册为骑手' });
  res.json({ code: 0, data: { token: generateToken({ userId: rider.id, role: 'rider' }), rider } });
}

function getProfile(req, res) {
  const rider = ds.getByField('riders', 'id', req.user.userId);
  if (!rider) return res.json({ code: 404, message: '骑手不存在' });
  res.json({ code: 0, data: rider });
}

function updateStatus(req, res) {
  const updates = {};
  if (req.body.available !== undefined) updates.available = req.body.available;
  if (req.body.lat !== undefined) updates.lat = req.body.lat;
  if (req.body.lng !== undefined) updates.lng = req.body.lng;
  if (Object.keys(updates).length > 0) ds.updateById('riders', req.user.userId, updates);
  res.json({ code: 0, message: '状态已更新' });
}

function grabPool(req, res) {
  const pendingOrders = ds.getAll('orders', { where: { status: 0 }, orderBy: { col: 'created_at', dir: 'ASC' } });
  const svcMap = {}, catMap = {}, usrMap = {}, ridMap = {};
  for (const s of ds.getAll('services', {})) svcMap[s.id] = s.name;
  for (const c of ds.getAll('categories', {})) catMap[c.id] = c.name;
  for (const u of ds.getAll('users', {})) usrMap[u.id] = u;
  for (const r of ds.getAll('riders', {})) ridMap[r.id] = r;
  for (const o of pendingOrders) {
    o.service_name = svcMap[o.service_id] || '';
    o.category_name = catMap[o.category_id] || '';
    if (usrMap[o.user_id]) o.user_nickname = usrMap[o.user_id].nickname || '';
    if (o.rider_id && ridMap[o.rider_id]) o.rider_name = ridMap[o.rider_id].realname || '';
  }
  const activeRiders = ds.getAll('riders', { where: { is_active: 1, available: 1, cert_status: 1 } });
  res.json({ code: 0, data: { orders: pendingOrders, available_riders: activeRiders } });
}

function grabOrder(req, res) {
  const { order_no } = req.body || {};
  const riderId = req.user.userId;
  const orders = ds.getAll('orders', { where: { status: 0 } }).filter(o => !o.rider_id);
  const order = orders.find(o => o.order_no === order_no) || orders[0];
  if (!order) return res.json({ code: 400, message: '订单不存在或已被抢' });
  ds.updateById('orders', order.id, { rider_id: riderId, status: 1 });
  const rider = ds.getByField('riders', 'id', riderId);
  ds.updateById('riders', riderId, { total_orders: (rider.total_orders || 0) + 1 });
  res.json({ code: 0, data: { order_no: order.order_no, rider } });
}

function myOrders(req, res) {
  const page = parseInt(req.query.page) || 1, perPage = parseInt(req.query.perPage) || 20;
  let allOrders = ds.getAll('orders', { where: { rider_id: req.user.userId } });
  if (req.query.status) allOrders = allOrders.filter(o => o.status === parseInt(req.query.status));
  allOrders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const total = allOrders.length;
  const paged = allOrders.slice((page - 1) * perPage, page * perPage);
  const svcMap = {}, catMap = {}, usrMap = {};
  for (const s of ds.getAll('services', {})) svcMap[s.id] = s.name;
  for (const c of ds.getAll('categories', {})) catMap[c.id] = c.name;
  for (const u of ds.getAll('users', {})) usrMap[u.id] = u;
  for (const o of paged) { o.service_name = svcMap[o.service_id] || ''; o.category_name = catMap[o.category_id] || ''; if (usrMap[o.user_id]) o.user_nickname = usrMap[o.user_id].nickname || ''; }
  res.json({ code: 0, data: { orders: paged, total, page, perPage } });
}

function updateOrderStatus(req, res) {
  const { status, order_id } = req.body || {};
  const riderId = req.user.userId;
  const statusMap = { pickup: 2, deliver: 3, complete: 4 };
  const statusVal = statusMap[status];
  if (!statusVal) return res.json({ code: 400, message: '无效的状态变更' });
  const targetId = order_id || req.params.id;
  const orders = ds.getAll('orders', { where: { rider_id: riderId } });
  const order = orders.find(o => o.id === parseInt(targetId) || o.order_no === String(targetId));
  if (!order) return res.json({ code: 400, message: '订单不存在' });
  const updates = { status: statusVal };
  if (statusVal === 4) updates.complete_time = new Date().toISOString().split('T')[0];
  ds.updateById('orders', order.id, updates);
  if (statusVal === 4) {
    const rider = ds.getByField('riders', 'id', riderId);
    ds.updateById('riders', riderId, { total_income: (parseFloat(rider.total_income) || 0) + parseFloat(order.paid_amount || 0) * 0.8 });
    ds.insert('commission_logs', { distributor_id: riderId, order_id: order.id, amount: parseFloat(order.paid_amount || 0) * 0.8, type: 'rider_commission' });
  }
  res.json({ code: 0, message: '状态已更新' });
}

function stats(req, res) {
  const rider = ds.getByField('riders', 'id', req.user.userId);
  if (!rider) return res.json({ code: 404, message: '骑手不存在' });
  const today = new Date().toISOString().split('T')[0];
  const allOrders = ds.getAll('orders', { where: { rider_id: req.user.userId } });
  const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(today) && [2,3,4].includes(o.status)).length;
  const logs = ds.getAll('commission_logs', { where: { distributor_id: req.user.userId } });
  const weekIncome = logs.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  res.json({ code: 0, data: { total_orders: rider.total_orders||0, total_income: rider.total_income||0, rating: rider.rating||5.0, level: rider.level||1, todayOrders, weekIncome: weekIncome.toFixed(2) } });
}

module.exports = { register, login, getProfile, updateStatus, grabPool, grabOrder, myOrders, updateOrderStatus, stats };
