var ds = require('../db/datastore');

function getMerchantOrders(req, res) {
  var merchantId = req.params.id;
  if (!merchantId) { return res.json({ code: 400, message: '商户ID不能为空' }); }
  var page = parseInt(req.query.page) || 1;
  var perPage = parseInt(req.query.perPage) || 20;
  var statusFilter = req.query.status !== undefined ? parseInt(req.query.status) : null;
  var keyword = req.query.keyword || '';
  var allOrders = ds.getAll('orders', {});
  var merchantOrders = allOrders.slice();
  if (statusFilter !== null && statusFilter !== undefined) {
    merchantOrders = merchantOrders.filter(function(o) { return o.status === statusFilter; });
  }
  if (keyword) {
    var kw = keyword.toLowerCase();
    merchantOrders = merchantOrders.filter(function(o) {
      return String(o.order_no || '').toLowerCase().indexOf(kw) !== -1 ||
             String(o.title || '').toLowerCase().indexOf(kw) !== -1;
    });
  }
  merchantOrders.sort(function(a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  var total = merchantOrders.length;
  var paged = merchantOrders.slice((page - 1) * perPage, page * perPage);
  var svcMap={}, catMap={}, usrMap={}, ridMap={};
  ds.getAll('services', {}).forEach(function(s){ svcMap[s.id] = s; });
  ds.getAll('categories', {}).forEach(function(c){ catMap[c.id] = c; });
  ds.getAll('users', {}).forEach(function(u){ usrMap[u.id] = u; });
  ds.getAll('riders', {}).forEach(function(r){ ridMap[r.id] = r; });
  for (var i=0; i<paged.length; i++) {
    var o = paged[i];
    var svc = svcMap[o.service_id];
    var cat = catMap[o.category_id];
    var usr = usrMap[o.user_id];
    var rid = ridMap[o.rider_id];
    if (svc) o.service_name = svc.name || '';
    if (cat) o.category_name = cat.name || '';
    if (usr) { o.user_nickname = usr.nickname || ''; o.user_phone = usr.phone || ''; }
    if (rid) { o.rider_name = rid.realname || ''; }
  }
  for (var i=0; i<merchantOrders.length; i++) {
    var mo = merchantOrders[i];
    var ms = svcMap[mo.service_id];
    var mu = usrMap[mo.user_id];
    if (ms) mo.service_name = ms.name || '';
    if (mu) mo.user_nickname = mu.nickname || '';
  }
  res.json({ code: 0, data: { orders: paged, total: total, page: page, perPage: perPage, allOrders: merchantOrders } });
}

function getMerchant(req, res) {
  var m = ds.getByField('merchants', 'id', parseInt(req.params.id));
  if (!m) return res.json({ code: 404, message: '商户不存在' });
  res.json({ code: 0, data: m });
}

function updateMerchant(req, res) {
  var u = {};
  ['name','contact','phone','address','logo','status'].forEach(function(f) {
    if (req.body[f] !== undefined) u[f] = req.body[f];
  });
  if (Object.keys(u).length === 0) return res.json({ code: 400, message: '无更新字段' });
  ds.updateById('merchants', parseInt(req.params.id), u);
  res.json({ code: 0, message: '更新成功' });
}

function getMerchantShops(req, res) {
  var shops = ds.getAll('merchants', { where: { merchant_id: parseInt(req.params.id) } });
  res.json({ code: 0, data: shops });
}

function getMerchantFinance(req, res) {
  var page = parseInt(req.query.page) || 1;
  var perPage = parseInt(req.query.perPage) || 20;
  var payments = ds.getAll('payments', { where: { merchant_id: parseInt(req.params.id) } });
  payments.sort(function(a,b){ return (b.created_at||'').localeCompare(a.created_at||''); });
  var total = payments.length;
  var paged = payments.slice((page-1)*perPage, page*perPage);
  res.json({ code: 0, data: { payments: paged, total: total, page: page, perPage: perPage } });
}

module.exports = { getMerchantOrders: getMerchantOrders, getMerchant: getMerchant, updateMerchant: updateMerchant, getMerchantShops: getMerchantShops, getMerchantFinance: getMerchantFinance };

// ============= 商户通知 & 设置 =============

function getNotifications(req, res) {
  var merchantId = req.params.id;
  
  var dispatchRecords = ds.getAll('dispatch_records', {});
  var payments = ds.getAll('payments', {});
  var announcements = ds.getAll('announcements', []);
  
  if (!announcements) announcements = [];
  
  var msgList = [];
  
  // 订单相关通知
  for (var i = 0; i < dispatchRecords.length; i++) {
    var nr = dispatchRecords[i];
    msgList.push({
      id: nr.id,
      title: '订单调度：' + (nr.order_id || ''),
      content: nr.reason || '系统自动派单',
      type: 'order',
      is_read: 0,
      created_at: nr.created_at
    });
  }
  
  // 财务通知
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
  
  // 系统公告
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
  
  msgList.sort(function(a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  res.json({ code: 0, data: msgList });
}

function markNotificationRead(req, res) {
  // 在实际系统中会更新已读状态到数据库
  res.json({ code: 0, message: '已标记为已读' });
}

function markAllNotificationsRead(req, res) {
  res.json({ code: 0, message: '已全部标记为已读' });
}

function getSettings(req, res) {
  var merchantId = req.params.id;
  var settingsKey = 'merchant_settings_' + merchantId;
  var existing = ds.db[settingsKey] || null;
  
  if (!existing) {
    existing = {
      name: '', phone: '', email: '', address: '',
      push_enabled: true, sound_enabled: true, vibration_enabled: false,
      order_notify: true, system_notify: false, finance_notify: true,
      theme: 'light', language: 'zh-CN'
    };
  }
  res.json({ code: 0, data: existing });
}

function updateSettings(req, res) {
  var merchantId = req.params.id;
  var settingsKey = 'merchant_settings_' + merchantId;
  
  var fields = ['name','phone','email','address','push_enabled','sound_enabled',
                'vibration_enabled','order_notify','system_notify','finance_notify','theme','language'];
  var updates = {};
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

module.exports.getNotifications = getNotifications;
module.exports.markNotificationRead = markNotificationRead;
module.exports.markAllNotificationsRead = markAllNotificationsRead;
module.exports.getSettings = getSettings;
module.exports.updateSettings = updateSettings;
