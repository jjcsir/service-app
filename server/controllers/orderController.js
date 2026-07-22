const ds = require('../db/datastore');
const { insert, getAll, getById, updateById, count } = ds;

function generateOrderNo() {
  return 'SO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function createOrder(req, res) {
  const { category_id, service_id, scene, title, description, start_address, end_address, 
    start_lat, start_lng, end_lat, end_lng, distance, remark, total_amount, coupon_code } = req.body || {};
  
  // Get service price if not provided
  const services = getAll('services', { where: { id: service_id, is_active: 1 } });
  const service = services[0];
  
  let paidAmount = parseFloat(total_amount) || (service ? service.price : 0);
  
  // Apply coupon
  if (coupon_code) {
    const coupons = getAll('user_coupons', { where: { code: coupon_code, user_id: req.user.userId, status: 0 } });
    const uc = coupons[0];
    if (uc) {
      const coupon = getById('coupons', uc.coupon_id);
      let discount = 0;
      if (coupon) {
        if (coupon.type === 1) discount = coupon.value; // fixed amount
        else if (coupon.type === 2 && paidAmount >= coupon.min_amount) discount = paidAmount * (coupon.value / 100);
      }
      paidAmount = Math.max(0, paidAmount - discount);
      updateById('user_coupons', uc.id, { status: 1, used_order_id: null });
    }
  }
  
  const orderNo = generateOrderNo();
  
  const order = insert('orders', {
    order_no: orderNo,
    user_id: req.user.userId,
    service_id, category_id, scene, title: title || '', description: description || '',
    start_address, end_address, start_lat, start_lng, end_lat, end_lng, distance: distance || 0,
    total_amount: paidAmount, paid_amount: paidAmount,
    dispatch_mode: 0,
    remark: remark || '',
    status: 0 // 0 = 待抢单
  });
  
  // Update user stats
  const users = getAll('users', { where: { id: req.user.userId } });
  if (users.length > 0) {
    updateById('users', users[0].id, { total_orders: (users[0].total_orders || 0) + 1 });
  }
  
  res.json({ code: 0, data: { ...order }, message: '下单成功，等待骑手接单' });
}

function listOrders(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 20;
  const status = req.query.status !== undefined ? parseInt(req.query.status) : null;
  const keyword = req.query.keyword;
  
  let allOrders = getAll('orders', { where: { user_id: req.user.userId } });
  
  if (status !== null) allOrders = allOrders.filter(o => o.status === status);
  if (keyword) allOrders = allOrders.filter(o => 
    String(o.order_no).includes(keyword) || String(o.title).includes(keyword)
  );
  
  allOrders.sort((a, b) => b.created_at > a.created_at ? 1 : -1);
  
  const total = allOrders.length;
  const paged = allOrders.slice((page - 1) * perPage, page * perPage);
  
  // Enrich with details
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const riders = getAll('riders', {});
  const users = getAll('users', {});
  
  for (const order of paged) {
    const svc = services.find(s => s.id === order.service_id);
    const cat = categories.find(c => c.id === order.category_id);
    const rider = riders.find(r => r.id === order.rider_id);
    const usr = users.find(u => u.id === order.user_id);
    
    order.service_name = svc?.name || '';
    order.category_name = cat?.name || '';
    order.rider_name = rider?.realname || '';
    order.rider_phone = rider?.phone || '';
    order.user_nickname = usr?.nickname || '';
    order.user_avatar = usr?.avatar || '';
  }
  
  res.json({ code: 0, data: { orders: paged, total, page, perPage } });
}

function getOrderDetail(req, res) {
  const orderId = req.params.id; // This should be order_no for better UX
  
  const allOrders = getAll('orders', { where: { user_id: req.user.userId } });
  const order = allOrders.find(o => o.order_no === orderId);
  
  if (!order) {
    // Try by numeric id
    const byId = getById('orders', parseInt(orderId));
    if (!byId || byId.user_id !== req.user.userId) {
      return res.json({ code: 404, message: '订单不存在' });
    }
  }
  
  // Enrich
  const services = getAll('services', {});
  const categories = getAll('categories', {});
  const riders = getAll('riders', {});
  
  if (order) {
    const svc = services.find(s => s.id === order.service_id);
    const cat = categories.find(c => c.id === order.category_id);
    const rider = riders.find(r => r.id === order.rider_id);
    order.service_name = svc?.name || '';
    order.category_name = cat?.name || '';
    order.rider_name = rider?.realname || '';
    order.rider_phone = rider?.phone || '';
  }
  
  res.json({ code: 0, data: order || {} });
}

function cancelOrder(req, res) {
  const orderNo = req.params.id;
  const allOrders = getAll('orders', { where: { user_id: req.user.userId } });
  const order = allOrders.find(o => o.order_no === orderNo);
  
  if (!order || ![0, 1].includes(order.status)) {
    return res.json({ code: 400, message: '无法取消该订单' });
  }
  
  updateById('orders', order.id, { status: 4, cancel_reason: req.body.reason || '' });
  res.json({ code: 0, message: '订单已取消' });
}

module.exports = { createOrder, listOrders, getOrderDetail, cancelOrder };
