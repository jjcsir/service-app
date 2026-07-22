const { insert, getAll, getById, updateById, count } = require('../db/datastore');

// 商户入驻申请
function applyMerchant(req, res) {
  const { name, contact, phone, address, logo } = req.body || {};
  if (!name) return res.json({ code: 400, message: '商户名称必填' });
  
  const merchant = insert('merchants', {
    name, contact: contact || '', phone: phone || '',
    address: address || '', logo: logo || '', status: 1
  });
  res.json({ code: 0, data: merchant, message: '入驻申请提交成功' });
}

// 商户列表（用于管理后台）
function listMerchants(req, res) {
  const keyword = req.query.keyword || '';
  const status = req.query.status || '';
  
  let merchants = getAll('merchants', {});
  if (status !== '') merchants = merchants.filter(m => m.status == parseInt(status));
  if (keyword) merchants = merchants.filter(m => 
    String(m.name).includes(keyword) || String(m.phone || '').includes(keyword)
  );
  
  // 统计每个商户的订单数和收入
  const orders = getAll('orders', {});
  for (const m of merchants) {
    m.order_count = 0;
    m.total_revenue = 0;
  }
  
  res.json({ code: 0, data: { merchants } });
}

// 商户详情
function getMerchantDetail(req, res) {
  const merchant = getById('merchants', parseInt(req.params.id));
  if (!merchant) return res.json({ code: 404, message: '商户不存在' });
  
  // 获取该商户的店铺列表
  const shops = getAll('shops', {}).filter(s => s.merchant_id === merchant.id);
  // 获取店员
  const staff = getAll('staff', {}).filter(s => s.merchant_id === merchant.id);
  // 获取订单
  const merchantOrders = getAll('orders', {}).filter(o => o.merchant_id === merchant.id);
  
  res.json({ code: 0, data: { ...merchant, shops, staff, order_count: merchantOrders.length } });
}

// 添加店铺
function addShop(req, res) {
  const { merchant_id, name, type_id, logo, address, contact_phone } = req.body || {};
  if (!merchant_id || !name) return res.json({ code: 400, message: '商户ID和店铺名称必填' });
  
  const shop = insert('shops', {
    merchant_id, name, type_id: type_id || '',
    logo: logo || '', address: address || '', contact_phone: contact_phone || ''
  });
  res.json({ code: 0, data: shop, message: '店铺添加成功' });
}

// 店铺列表
function getShops(req, res) {
  const merchantId = parseInt(req.query.merchant_id) || 0;
  const shops = getAll('shops', {}).filter(s => !merchantId || s.merchant_id === merchantId);
  res.json({ code: 0, data: { shops } });
}

// 删除店铺
function deleteShop(req, res) {
  const shops = getAll('shops', {});
  const idx = shops.findIndex(s => s.id === parseInt(req.params.id));
  if (idx < 0) return res.json({ code: 404, message: '店铺不存在' });
  shops.splice(idx, 1);
  res.json({ code: 0, message: '删除成功' });
}

// 添加店员
function addStaff(req, res) {
  const { merchant_id, name, phone, role } = req.body || {};
  if (!merchant_id || !name) return res.json({ code: 400, message: '商户ID和姓名必填' });
  
  const staff = insert('staff', {
    merchant_id, name, phone: phone || '', role: role || 'clerk'
  });
  res.json({ code: 0, data: staff, message: '店员添加成功' });
}

// 店员列表
function getStaffList(req, res) {
  const merchantId = parseInt(req.query.merchant_id) || 0;
  const staff = getAll('staff', {}).filter(s => !merchantId || s.merchant_id === merchantId);
  res.json({ code: 0, data: { staff } });
}

// 店铺类型管理
function getShopTypes(req, res) {
  const types = getAll('shop_types', []);
  res.json({ code: 0, data: { types } });
}

// 添加店铺类型
function addShopType(req, res) {
  const { name, icon } = req.body || {};
  if (!name) return res.json({ code: 400, message: '类型名称必填' });
  
  const item = insert('shop_types', { name, icon: icon || '' });
  res.json({ code: 0, data: item, message: '类型添加成功' });
}

module.exports = { 
  applyMerchant, listMerchants, getMerchantDetail, 
  addShop, getShops, deleteShop,
  addStaff, getStaffList,
  getShopTypes, addShopType
};
