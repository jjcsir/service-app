const express = require('express');
const router = express.Router();
const { authRequired, riderAuth } = require('../middleware/auth');
const ds = require('../db/datastore');
const { getAll } = ds;

// Controllers
const userCtrl = require('../controllers/userController');
const riderCtrl = require('../controllers/riderController');
const orderCtrl = require('../controllers/orderController');
const serviceCtrl = require('../controllers/serviceController');
const dispatchCtrl = require('../controllers/dispatchController');

// ==================== 用户端接口 ====================
router.post('/api/auth/login', userCtrl.login);

router.get('/api/users/me', authRequired, userCtrl.getProfile);
router.put('/api/users/me', authRequired, userCtrl.updateProfile);
router.get('/api/users/me/wallet', authRequired, userCtrl.getWallet);
router.post('/api/users/me/wallet/topup', authRequired, userCtrl.topup);

router.get('/api/services', serviceCtrl.getServices);
router.get('/api/categories', serviceCtrl.getCategories);
router.get('/api/banners', serviceCtrl.getBanners);
router.get('/api/announcements', serviceCtrl.getAnnouncements);
router.get('/api/faqs', serviceCtrl.getFAQs);

router.get('/api/coupons', serviceCtrl.getCoupons);
router.post('/api/coupons/claim', authRequired, serviceCtrl.claimCoupon);

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
router.post('/api/dispatch/assign', authRequired, dispatchCtrl.assignOrder);
router.post('/api/dispatch/transfer', authRequired, dispatchCtrl.transferOrder);
router.post('/api/dispatch/auto', authRequired, dispatchCtrl.autoDispatch);
router.get('/api/dispatch/records', authRequired, dispatchCtrl.getDispatchRecords);

// ==================== 管理统计 ====================
router.get('/api/admin/stats', authRequired, (req, res) => {
  const totalOrders = getAll('orders', {}).length;
  const totalUsers = getAll('users', {}).length;
  const totalRiders = getAll('riders', {}).length;
  const todayOrders = getAll('orders', {}).filter(o => {
    const d = o.created_at ? o.created_at.split('T')[0] : '';
    return d === new Date().toISOString().split('T')[0];
  }).length;
  const totalRevenue = getAll('orders', {}).reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  
  res.json({ code: 0, data: { totalOrders, totalUsers, totalRiders, todayOrders, totalRevenue: totalRevenue.toFixed(2) } });
});

module.exports = router;
