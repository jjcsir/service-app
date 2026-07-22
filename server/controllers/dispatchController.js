var ds = require('../db/datastore');

function viewPool(req, res) {
  var pendingOrders = ds.getAll('orders', { where: { status: [0,5] }, orderBy: { col: 'created_at', dir: 'ASC' } });
  var svcMap={}, usrMap={};
  ds.getAll('services',{}).forEach(function(s){svcMap[s.id]=s.name;});
  ds.getAll('users',{}).forEach(function(u){usrMap[u.id]=u;});
  for (var i=0;i<pendingOrders.length;i++){
    pendingOrders[i].service_name=svcMap[pendingOrders[i].service_id]||'';
    if(usrMap[pendingOrders[i].user_id]){pendingOrders[i].user_nickname=usrMap[pendingOrders[i].user_id].nickname||'';pendingOrders[i].user_phone=usrMap[pendingOrders[i].user_id].phone||'';}
  }
  var nearbyRiders = ds.getAll('riders', { where: { is_active: 1, available: 1, cert_status: 1 } });
  res.json({ code: 0, data: { orders: pendingOrders, riders: nearbyRiders } });
}

function assignOrder(req, res) {
  var order_no = req.body.order_no, rider_id = req.body.rider_id, source = req.body.source;
  var orders = ds.getAll('orders', { where: { order_no: order_no } }).filter(function(o){return [0,5].indexOf(o.status)>=0;});
  if (orders.length===0) return res.json({code:400,message:'订单无效'});
  var rider = ds.getByField('riders','id',rider_id);
  if (!rider) return res.json({code:400,message:'骑手不存在'});
  ds.updateById('orders',orders[0].id,{rider_id:rider_id,status:5});
  ds.insert('dispatch_records',{order_id:order_no,operator_id:req.user.userId,to_rider_id:rider_id,method:'assign',reason:source||''});
  res.json({code:0,message:'指派成功'});
}

function autoDispatch(req, res) {
  var expandRadiusKm = req.body.expandRadiusKm||2;
  var maxExpansions = req.body.maxExpansions||5;
  var dispatched = 0;
  var pendingOrders = ds.getAll('orders', { where: { status: 0 } });
  var availableRiders = ds.getAll('riders', { where: { is_active: 1, available: 1, cert_status: 1 } });
  var limit = Math.min(pendingOrders.length, maxExpansions*2);
  for (var i=0;i<limit;i++){
    if (availableRiders.length===0) break;
    var rider = availableRiders[Math.floor(Math.random()*availableRiders.length)];
    ds.updateById('orders',pendingOrders[i].id,{rider_id:rider.id,status:5});
    ds.insert('dispatch_records',{order_id:pendingOrders[i].order_no,to_rider_id:rider.id,method:'auto',reason:'自动派单',auto_expand:1,radius_km:expandRadiusKm});
    dispatched++;
  }
  res.json({code:0,data:{dispatched:dispatched,expanded:expandRadiusKm,message:'自动派单完成，共分配 '+dispatched+' 个订单'}});
}

function getDispatchRecords(req, res) {
  var records = ds.getAll('dispatch_records',{orderBy:{col:'created_at',dir:'DESC'}}).slice(0,50);
  res.json({code:0,data:records});
}

module.exports = {viewPool:viewPool,assignOrder:assignOrder,autoDispatch:autoDispatch,getDispatchRecords:getDispatchRecords};
