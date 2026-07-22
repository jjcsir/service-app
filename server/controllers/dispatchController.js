const ds = require('../db/datastore');
const { getAll, getById, insert, updateById, count } = ds;

function viewPool(req, res) {
  const pendingOrders = getAll('orders', { 
    where: { status: [0, 5] }, 
    orderBy: { col: 'created_at', dir: 'ASC' } 
  });
  
  // Enrich orders
  const services = getAll('services', {});
  const users = getAll('users', {});
  
  for (const order of pendingOrders) {
    const svc = services.find(s => s.id === order.service_id);
    const usr = users.find(u => u.id === order.user_id);
    order.service_name = svc?.name || '';
    order.user_nickname = usr?.nickname || '';
    order.user_phone = usr?.phone || '';
  }
  
  const nearbyRiders = getAll('riders', { 
    where: { is_active: 1, available: 1, cert_status: 1 } 
  });
  
  res.json({ code: 0, data: { orders: pendingOrders, riders: nearbyRiders } });
}

function assignOrder(req, res) {
  const { order_no, rider_id, source } = req.body || {};
  
  const orders = getAll('orders', { where: { order_no } });
  if (orders.length === 0) return res.json({ code: 400, message: '订单无效' });
  if (!([0, 5].includes(orders[0].status))) return res.json({ code: 400, message: '订单状态无效' });
  
  const rider = getById('riders', rider_id);
  if (!rider) return res.json({ code: 400, message: '骑手不存在' });
  
  updateById('orders', orders[0].id, { rider_id, status: 5 });
  
  insert('dispatch_records', { 
    order_id: order_no, operator_id: req.user.userId, to_rider_id: rider_id, 
    method: 'assign', reason: source || '' 
  });
  
  res.json({ code: 0, message: '指派成功' });
}

function transferOrder(req, res) {
  const { order_no, from_rider_id, to_rider_id } = req.body || {};
  
  const orders = getAll('orders', { where: { order_no } });
  const order = orders.find(o => o.rider_id == from_rider_id);
  
  if (order) {
    updateById('orders', order.id, { rider_id: to_rider_id, status: 1 });
    insert('dispatch_records', { 
      order_id: order_no, from_rider_id, to_rider_id, method: 'transfer', reason: '转单' 
    });
  }
  
  res.json({ code: 0, message: '转单成功' });
}

function autoDispatch(req, res) {
  const expandRadiusKm = req.body?.expandRadiusKm || 2;
  const maxExpansions = req.body?.maxExpansions || 5;
  
  let dispatched = 0;
  const pendingOrders = getAll('orders', { where: { status: 0, rider_id: null } });
  const availableRiders = getAll('riders', { where: { is_active: 1, available: 1, cert_status: 1 } });
  
  for (const order of pendingOrders.slice(0, maxExpansions * 2)) {
    if (availableRiders.length === 0) break;
    
    const rider = availableRiders[Math.floor(Math.random() * availableRiders.length)];
    updateById('orders', order.id, { rider_id: rider.id, status: 5 });
    
    insert('dispatch_records', { 
      order_id: order.order_no, to_rider_id: rider.id, 
      method: 'auto', reason: '自动派单', auto_expand: 1, radius_km: expandRadiusKm
    });
    
    dispatched++;
  }
  
  res.json({ code: 0, data: { dispatched, expanded: expandRadiusKm, message: `自动派单完成，共分配 ${dispatched} 个订单` } });
}

function getDispatchRecords(req, res) {
  const records = getAll('dispatch_records', { 
    orderBy: { col: 'created_at', dir: 'DESC' }
  }).slice(0, 50);
  res.json({ code: 0, data: records });
}

module.exports = { viewPool, assignOrder, transferOrder, autoDispatch, getDispatchRecords };
