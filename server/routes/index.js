var express = require('express');
var router = express.Router();
var authMiddleware = require('../middleware/auth');
var ds = require('../db/datastore');

// Controllers
var userCtrl = require('../controllers/userController');
var riderCtrl = require('../controllers/riderController');
var orderCtrl = require('../controllers/orderController');
var serviceCtrl = require('../controllers/serviceController');
var dispatchCtrl = require('../controllers/dispatchController');
var merchantCtrl = require('../controllers/merchantController');

// ==================== 用户端接口 ====================
router.post('/api/auth/login', userCtrl.login);
router.get('/api/users/me', authMiddleware.authRequired, userCtrl.getProfile);
router.put('/api/users/me', authMiddleware.authRequired, userCtrl.updateProfile);
router.get('/api/users/me/wallet', authMiddleware.authRequired, userCtrl.getWallet);
router.post('/api/users/me/wallet/topup', authMiddleware.authRequired, userCtrl.topup);

router.get('/api/services', serviceCtrl.getServices);
router.get('/api/categories', serviceCtrl.getCategories);
router.get('/api/banners', serviceCtrl.getBanners);
router.get('/api/announcements', serviceCtrl.getAnnouncements);
router.get('/api/faqs', serviceCtrl.getFAQs);
router.get('/api/coupons', serviceCtrl.getCoupons);
router.post('/api/coupons/claim', authMiddleware.authRequired, serviceCtrl.claimCoupon);

router.post('/api/orders', authMiddleware.authRequired, orderCtrl.createOrder);
router.get('/api/orders', authMiddleware.authRequired, orderCtrl.listOrders);
router.get('/api/orders/:id', authMiddleware.authRequired, orderCtrl.getOrderDetail);
router.delete('/api/orders/:id', authMiddleware.authRequired, orderCtrl.cancelOrder);

// ==================== 骑手端接口 ====================
router.post('/api/rider/register', riderCtrl.register);
router.post('/api/rider/login', riderCtrl.login);
router.get('/api/rider/me', authMiddleware.riderAuth, riderCtrl.getProfile);
router.put('/api/rider/status', authMiddleware.riderAuth, riderCtrl.updateStatus);
router.get('/api/rider/stats', authMiddleware.riderAuth, riderCtrl.stats);
router.get('/api/rider/grab-pool', authMiddleware.riderAuth, riderCtrl.grabPool);
router.post('/api/rider/grab-order', authMiddleware.riderAuth, riderCtrl.grabOrder);
router.get('/api/rider/orders', authMiddleware.riderAuth, riderCtrl.myOrders);
router.put('/api/rider/orders/:id/status', authMiddleware.riderAuth, riderCtrl.updateOrderStatus);

// ==================== 调度中心 ====================
router.get('/api/dispatch/pool', authMiddleware.authRequired, dispatchCtrl.viewPool);
router.post('/api/dispatch/auto', authMiddleware.authRequired, dispatchCtrl.autoDispatch);
router.get('/api/dispatch/records', authMiddleware.authRequired, dispatchCtrl.getDispatchRecords);

// ==================== 商户端接口 ====================
router.get('/api/merchants/:id', merchantCtrl.getMerchant);
router.get('/api/merchants/:id/orders', merchantCtrl.getMerchantOrders);
router.put('/api/merchants/:id', merchantCtrl.updateMerchant);
router.get('/api/merchants/:id/shops', merchantCtrl.getMerchantShops);
router.get('/api/merchants/:id/finance', merchantCtrl.getMerchantFinance);

// ==================== 管理统计 ====================
router.get('/api/admin/stats', authMiddleware.authRequired, function(req, res) {
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
