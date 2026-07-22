var express = require('express');
var router = express.Router();
var { authRequired, riderAuth } = require('../middleware/auth');
var ds = require('../db/datastore');

// 加载控制器
var userCtrl = require('../controllers/userController');
var riderCtrl = require('../controllers/riderController');
var orderCtrl = require('../controllers/orderController');
var serviceCtrl = require('../controllers/serviceController');
var dispatchCtrl = require('../controllers/dispatchController');
var merchantCtrl = require('../controllers/merchantController');

// ==================== 用户端接口 ====================
router.post('/api/auth/login', userCtrl.login);
router.get('/api/users/me', authRequired, userCtrl.getProfile);
router.put('/api/users/me', authRequired, userCtrl.updateProfile);
router.get('/api/users/me/wallet', authRequired, userCtrl.getWallet);
router.post('/api/users/me/wallet/topup', authRequired, userCtrl.topup);

// 服务和分类
router.get('/api/services', serviceCtrl.getServices);
router.get('/api/categories', serviceCtrl.getCategories);
router.get('/api/banners', serviceCtrl.getBanners);
router.get('/api/announcements', serviceCtrl.getAnnouncements);
router.get('/api/faqs', serviceCtrl.getFAQs);
router.get('/api/coupons', serviceCtrl.getCoupons);
router.post('/api/coupons/claim', authRequired, serviceCtrl.claimCoupon);

// 订单（用户）
router.post('/api/orders', authRequired, orderCtrl.createOrder);
router.get('/api/orders', authRequired, orderCtrl.listOrders);
router.get('/api/orders/:id', authRequired, orderCtrl.getOrderDetail);
router.delete('/api/orders/:id', authRequired, orderCtrl.cancelOrder);

// ==================== 骑手端接口 ====================
router.post('/api/rider/register', riderCtrl.register);
router.post('/api/rider/login', riderCtrl.login);
router.get('/api/rider/me', riderAuth, riderCtrl.getProfile);
router.put('/api/rider/status', riderAuth, riderCtrl.updateStatus);
router.get('/api/rider/stats', riderAuth, riderCtrl.stats);
router.get('/api/rider/grab-pool', riderAuth, riderCtrl.grabPool);
router.post('/api/rider/grab-order', riderAuth, riderCtrl.grabOrder);
router.get('/api/rider/orders', riderAuth, riderCtrl.myOrders);
router.put('/api/rider/orders/:id/status', riderAuth, riderCtrl.updateOrderStatus);

// ==================== 调度中心 ====================
router.get('/api/dispatch/pool', authRequired, dispatchCtrl.viewPool);
router.post('/api/dispatch/auto', authRequired, dispatchCtrl.autoDispatch);
router.get('/api/dispatch/records', authRequired, dispatchCtrl.getDispatchRecords);

// ==================== 商户端接口 ====================
router.get('/api/merchants/:id', merchantCtrl.getMerchant);
router.get('/api/merchants/:id/orders', merchantCtrl.getMerchantOrders);
router.put('/api/merchants/:id', merchantCtrl.updateMerchant);
router.get('/api/merchants/:id/shops', merchantCtrl.getMerchantShops);
router.get('/api/merchants/:id/finance', merchantCtrl.getMerchantFinance);

// ==================== 管理统计 ====================
router.get('/api/admin/stats', authRequired, function(req, res) {
  var totalOrders = ds.count('orders');
  var totalUsers = ds.count('users');
  var totalRiders = ds.count('riders');
  var allOrders = ds.getAll('orders', {});
  var today = new Date().toISOString().split('T')[0];
  var todayOrders = 0;
  for (var i = 0; i < allOrders.length; i++) {
    if (allOrders[i].created_at && allOrders[i].created_at.startsWith(today)) { todayOrders++; }
  }
  var totalRevenue = 0;
  for (var i = 0; i < allOrders.length; i++) { totalRevenue += parseFloat(allOrders[i].paid_amount) || 0; }
  
  res.json({ code: 0, data: { totalOrders: totalOrders, totalUsers: totalUsers, totalRiders: totalRiders, todayOrders: todayOrders, totalRevenue: totalRevenue.toFixed(2) } });
});

module.exports = router;
