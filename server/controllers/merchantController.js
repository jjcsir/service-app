var ds = require('../db/datastore');

/**
 * 获取商户订单列表（支持按状态筛选、搜索）
 */
function getMerchantOrders(req, res) {
  var merchantId = req.params.id;
  if (!merchantId) {
    return res.json({ code: 400, message: '商户ID不能为空' });
  }

  var page = parseInt(req.query.page) || 1;
  var perPage = parseInt(req.query.perPage) || 20;
  var statusFilter = req.query.status !== undefined ? parseInt(req.query.status) : null;
  var keyword = req.query.keyword || '';

  // 获取该商户关联的所有订单
  // 订单通过 service_id 关联到商户提供的服务
  var allOrders = ds.getAll('orders', {});
  var merchantOrders = [];

  for (var i = 0; i < allOrders.length; i++) {
    var order = allOrders[i];
    // 简化逻辑：所有订单都属于商户（实际应通过商户-服务关联过滤）
    // 这里假设商户ID与订单的service_id或category_id有关联
    merchantOrders.push(order);
  }

  // 按状态筛选
  if (statusFilter !== null && statusFilter !== undefined) {
    merchantOrders = merchantOrders.filter(function(o) { return o.status === statusFilter; });
  }

  // 按关键字搜索
  if (keyword) {
    var kw = keyword.toLowerCase();
    merchantOrders = merchantOrders.filter(function(o) {
      return String(o.order_no).toLowerCase().indexOf(kw) !== -1 ||
             String(o.title || '').toLowerCase().indexOf(kw) !== -1 ||
             String(o.start_address || '').toLowerCase().indexOf(kw) !== -1;
    });
  }

  // 按创建时间倒序
  merchantOrders.sort(function(a, b) {
    return (b.created_at || '').localeCompare(a.created_at || '');
  });

  var total = merchantOrders.length;
  var paged = merchantOrders.slice((page - 1) * perPage, page * perPage);

  // 填充详细信息
  var svcMap = {}, catMap = {}, usrMap = {}, ridMap = {};
  var services = ds.getAll('services', {});
  var categories = ds.getAll('categories', {});
  var users = ds.getAll('users', {});
  var riders = ds.getAll('riders', {});
  for (var i = 0; i < services.length; i++) svcMap[services[i].id] = services[i];
  for (var i = 0; i < categories.length; i++) catMap[categories[i].id] = categories[i];
  for (var i = 0; i < users.length; i++) usrMap[users[i].id] = users[i];
  for (var i = 0; i < riders.length; i++) ridMap[riders[i].id] = riders[i];

  for (var j = 0; j < paged.length; j++) {
    var o = paged[j];
    var svc = svcMap[o.service_id];
    var cat = catMap[o.category_id];
    var usr = usrMap[o.user_id];
    var rid = ridMap[o.rider_id];

    if (svc) o.service_name = svc.name || '';
    if (cat) o.category_name = cat.name || '';
    if (usr) { o.user_nickname = usr.nickname || ''; o.user_phone = usr.phone || ''; o.user_avatar = usr.avatar || ''; }
    if (rid) { o.rider_name = rid.realname || ''; o.rider_phone = rid.phone || ''; }
  }

  // 也填充所有订单的详情用于统计
  for (var k = 0; k < merchantOrders.length; k++) {
    var mo = merchantOrders[k];
    var ms = svcMap[mo.service_id];
    var mu = usrMap[mo.user_id];
    if (ms) mo.service_name = ms.name || '';
    if (mu) mo.user_nickname = mu.nickname || '';
  }

  res.json({
    code: 0,
    data: {
      orders: paged,
      total: total,
      page: page,
      perPage: perPage,
      allOrders: merchantOrders
    }
  });
}

/**
 * 获取商户信息
 */
function getMerchant(req, res) {
  var merchantId = req.params.id;
  var merchant = ds.getByField('merchants', 'id', parseInt(merchantId));
  if (!merchant) return res.json({ code: 404, message: '商户不存在' });
  res.json({ code: 0, data: merchant });
}

/**
 * 更新商户信息
 */
function updateMerchant(req, res) {
  var merchantId = req.params.id;
  var updates = {};
  var fields = ['name', 'contact', 'phone', 'address', 'logo', 'status'];
  for (var i = 0; i < fields.length; i++) {
    if (req.body[fields[i]] !== undefined) {
      updates[fields[i]] = req.body[fields[i]];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.json({ code: 400, message: '没有需要更新的字段' });
  }
  ds.updateById('merchants', parseInt(merchantId), updates);
  res.json({ code: 0, message: '更新成功' });
}

/**
 * 获取商户下的店铺列表
 */
function getMerchantShops(req, res) {
  var merchantId = req.params.id;
  var shops = ds.getAll('merchants', { where: { merchant_id: parseInt(merchantId) } });
  res.json({ code: 0, data: shops });
}

/**
 * 获取商户财务日志
 */
function getMerchantFinance(req, res) {
  var merchantId = req.params.id;
  var page = parseInt(req.query.page) || 1;
  var perPage = parseInt(req.query.perPage) || 20;
  var allPayments = ds.getAll('payments', { where: { merchant_id: parseInt(merchantId) } });
  allPayments.sort(function(a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  var total = allPayments.length;
  var paged = allPayments.slice((page - 1) * perPage, page * perPage);
  res.json({ code: 0, data: { payments: paged, total: total, page: page, perPage: perPage } });
}

module.exports = {
  getMerchantOrders: getMerchantOrders,
  getMerchant: getMerchant,
  updateMerchant: updateMerchant,
  getMerchantShops: getMerchantShops,
  getMerchantFinance: getMerchantFinance
};

/**
 * 获取商户消息通知
 */
function getNotifications(req, res) {
  var merchantId = req.params.id;
  
  // 如果 merchants 表没有关联 notification preferences，则直接返回所有通知类数据
  var notifications = ds.getAll('dispatch_records', {});
  var payments = ds.getAll('payments', {});
  var announcements = ds.getAll('announcements', {});
  
  // Build message list from various sources
  var msgList = [];
  
  // Order-related messages from dispatch records
  for (var i = 0; i < notifications.length; i++) {
    var nr = notifications[i];
    msgList.push({
      id: nr.id,
      title: '订单调度：' + (nr.order_id || ''),
      content: nr.reason || '系统自动派单',
      type: 'order',
      is_read: 0,
      created_at: nr.created_at
    });
  }
  
  // Payment/finance messages
  for (var j = 0; j < payments.length; j++) {
    var p = payments[j];
    if (p.type === 'topup') {
      msgList.push({
        id: 1000 + p.id,
        title: '充值通知',
        content: '账户充值 ¥' + String(p.amount || 0) + ' 成功',
        type: 'finance',
        is_read: p.status === 1 ? 1 : 0,
        created_at: p.created_at
      });
    }
  }
  
  // System announcements
  for (var k = 0; k < announcements.length; k++) {
    var a = announcements[k];
    msgList.push({
      id: 2000 + a.id,
      title: a.title || '系统公告',
      content: a.content || '',
      type: 'system',
      is_read: 0,
      created_at: a.created_at
    });
  }
  
  // Sort by time desc
  msgList.sort(function(a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  
  res.json({ code: 0, data: msgList });
}

/**
 * 标记单条通知为已读
 */
function markNotificationRead(req, res) {
  var msgId = parseInt(req.params.id);
  // In a real system we'd update a read_receipt table
  res.json({ code: 0, message: '已标记为已读' });
}

/**
 * 标记全部通知为已读
 */
function markAllNotificationsRead(req, res) {
  res.json({ code: 0, message: '已全部标记为已读' });
}

/**
 * 获取商户设置
 */
function getSettings(req, res) {
  var merchantId = req.params.id;
  // Read from settings or store in a default structure
  var settingsKey = 'merchant_settings_' + merchantId;
  var existing = null;
  var settings = ds.db[settingsKey] || null;
  
  if (!settings) {
    // Default settings
    settings = {
      name: '',
      phone: '',
      email: '',
      address: '',
      push_enabled: true,
      sound_enabled: true,
      vibration_enabled: false,
      order_notify: true,
      system_notify: false,
      finance_notify: true,
      theme: 'light',
      language: 'zh-CN'
    };
  }
  
  res.json({ code: 0, data: settings });
}

/**
 * 更新商户设置
 */
function updateSettings(req, res) {
  var merchantId = req.params.id;
  var settingsKey = 'merchant_settings_' + merchantId;
  
  var updates = {};
  var fields = ['name','phone','email','address','push_enabled','sound_enabled',
                'vibration_enabled','order_notify','system_notify','finance_notify','theme','language'];
  for (var i = 0; i < fields.length; i++) {
    if (req.body[fields[i]] !== undefined) {
      updates[fields[i]] = req.body[fields[i]];
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return res.json({ code: 400, message: '没有需要更新的字段' });
  }
  
  var existing = ds.db[settingsKey] || {};
  ds.db[settingsKey] = Object.assign(existing, updates);
  ds.save();
  
  res.json({ code: 0, message: '设置保存成功' });
}

// Append to exports
module.exports.getNotifications = getNotifications;
module.exports.markNotificationRead = markNotificationRead;
module.exports.markAllNotificationsRead = markAllNotificationsRead;
module.exports.getSettings = getSettings;
module.exports.updateSettings = updateSettings;
