const ds = require('../db/datastore');

function generateOrderNo() { return 'SO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,7).toUpperCase(); }

function createOrder(req, res) {
  const { service_id, category_id, scene, title, description, start_address, end_address, start_lat, start_lng, end_lat, end_lng, distance, remark, total_amount } = req.body || {};
  const svc = ds.getAll('services', { where: { id: service_id, is_active: 1 } })[0];
  let paidAmount = parseFloat(total_amount) || (svc ? svc.price : 0);
  
  // Apply coupon if provided
  const { coupon_code } = req.body || {};
  if (coupon_code) {
    const uc = ds.getAll('user_coupons', { where: { code: coupon_code, user_id: req.user.userId, status: 0 } })[0];
    if (uc) {
      const coupon = ds.getByField('coupons', 'id', uc.coupon_id);
      if (coupon) {
        let discount = 0;
        if (coupon.type === 1) discount = coupon.value;
        else if (coupon.type === 2 && paidAmount >= coupon.min_amount) discount = paidAmount * (coupon.value / 100);
        paidAmount = Math.max(0, paidAmount - discount);
        ds.updateById('user_coupons', uc.id, { status: 1 });
      }
    }
  }
  
  const order = ds.insert('orders', {
    order_no: generateOrderNo(), user_id: req.user.userId, service_id, category_id, scene,
    title: title||'', description: description||'', start_address, end_address,
    start_lat, start_lng, end_lat, end_lng, distance: distance||0,
    total_amount: paidAmount, paid_amount: paidAmount, dispatch_mode: 0, remark: remark||'', status: 0
  });
  
  // Update user stats
  const users = ds.getAll('users', { where: { id: req.user.userId } });
  if (users.length > 0) ds.updateById('users', users[0].id, { total_orders: (users[0].total_orders||0) + 1 });
  
  res.json({ code: 0, data: order, message: '下单成功，等待骑手接单' });
}

function listOrders(req, res) {
  const page = parseInt(req.query.page)||1, perPage = parseInt(req.query.perPage)||20;
  let allOrders = ds.getAll('orders', { where: { user_id: req.user.userId } });
  if (req.query.status) allOrders = allOrders.filter(o => o.status === parseInt(req.query.status));
  if (req.query.keyword) allOrders = allOrders.filter(o => String(o.order_no).includes(req.query.keyword));
  allOrders.sort((a,b) => b.created_at > a.created_at ? 1 : -1);
  const total = allOrders.length;
  const paged = allOrders.slice((page-1)*perPage, page*perPage);
  
  // Enrich
  const svcMap={}, catMap={}, ridMap={}, usrMap={};
  for (const s of ds.getAll('services',{})) svcMap[s.id]=s.name;
  for (const c of ds.getAll('categories',{})) catMap[c.id]=c.name;
  for (const r of ds.getAll('riders',{})) ridMap[r.id]=r;
  for (const u of ds.getAll('users',{})) usrMap[u.id]=u;
  for (const o of paged) {
    o.service_name = svcMap[o.service_id]||'';
    o.category_name = catMap[o.category_id]||'';
    if (o.rider_id && ridMap[o.rider_id]) { o.rider_name=ridMap[o.rider_id].realname||''; o.rider_phone=ridMap[o.rider_id].phone||''; }
    if (usrMap[o.user_id]) { o.user_nickname=usrMap[o.user_id].nickname||''; o.user_phone=usrMap[o.user_id].phone||''; }
  }
  res.json({ code: 0, data: { orders: paged, total, page, perPage } });
}

function getOrderDetail(req, res) {
  const targetId = req.params.id;
  const allOrders = ds.getAll('orders', { where: { user_id: req.user.userId } });
  const order = allOrders.find(o => o.order_no === targetId) || (allOrders.find(o => o.id === parseInt(targetId)));
  if (!order) return res.json({ code: 404, message: '订单不存在' });
  
  const svc = ds.getAll('services', { where: { id: order.service_id } })[0];
  const cat = ds.getAll('categories', { where: { id: order.category_id } })[0];
  const rider = ds.getAll('riders', { where: { id: order.rider_id } })[0];
  order.service_name = svc?.name||'';
  order.category_name = cat?.name||'';
  if (rider) { order.rider_name=rider.realname||''; order.rider_phone=rider.phone||''; }
  
  res.json({ code: 0, data: order });
}

function cancelOrder(req, res) {
  const allOrders = ds.getAll('orders', { where: { user_id: req.user.userId } });
  const order = allOrders.find(o => o.order_no === req.params.id);
  if (!order || ![0,1].includes(order.status)) return res.json({ code: 400, message: '无法取消该订单' });
  ds.updateById('orders', order.id, { status: 4, cancel_reason: req.body.reason||'' });
  res.json({ code: 0, message: '订单已取消' });
}

module.exports = { createOrder, listOrders, getOrderDetail, cancelOrder };
