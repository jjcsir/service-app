const express = require('express');
const router = express.Router();
const { authRequired, riderAuth } = require('../middleware/auth');
const ds = require('../db/datastore');

const userCtrl = require('../controllers/userController');
const riderCtrl = require('../controllers/riderController');
const orderCtrl = require('../controllers/orderController');
const serviceCtrl = require('../controllers/serviceController');
const dispatchCtrl = require('../controllers/dispatchController');

// User endpoints
router.post('/api/auth/login', userCtrl.login);
router.get('/api/users/me', authRequired, userCtrl.getProfile);
router.put('/api/users/me', authRequired, userCtrl.updateProfile);
router.get('/api/users/me/wallet', authRequired, userCtrl.getWallet);
router.post('/api/users/me/wallet/topup', authRequired, userCtrl.topup);

// Service/Categories
router.get('/api/services', serviceCtrl.getServices);
router.get('/api/categories', serviceCtrl.getCategories);
router.get('/api/banners', serviceCtrl.getBanners);
router.get('/api/announcements', serviceCtrl.getAnnouncements);
router.get('/api/faqs', serviceCtrl.getFAQs);
router.get('/api/coupons', serviceCtrl.getCoupons);
router.post('/api/coupons/claim', authRequired, serviceCtrl.claimCoupon);

// Orders (user)
router.post('/api/orders', authRequired, orderCtrl.createOrder);
router.get('/api/orders', authRequired, orderCtrl.listOrders);
router.get('/api/orders/:id', authRequired, orderCtrl.getOrderDetail);
router.delete('/api/orders/:id', authRequired, orderCtrl.cancelOrder);

// Rider endpoints
router.post('/api/rider/register', riderCtrl.register);
router.post('/api/rider/login', riderCtrl.login);
router.get('/api/rider/me', riderAuth, riderCtrl.getProfile);
router.put('/api/rider/status', riderAuth, riderCtrl.updateStatus);
router.get('/api/rider/stats', riderAuth, riderCtrl.stats);
router.get('/api/rider/grab-pool', riderAuth, riderCtrl.grabPool);
router.post('/api/rider/grab-order', riderAuth, riderCtrl.grabOrder);
router.get('/api/rider/orders', riderAuth, riderCtrl.myOrders);
router.put('/api/rider/orders/:id/status', riderAuth, riderCtrl.updateOrderStatus);

// Dispatch
router.get('/api/dispatch/pool', authRequired, dispatchCtrl.viewPool);
router.post('/api/dispatch/assign', authRequired, dispatchCtrl.assignOrder);
router.post('/api/dispatch/auto', authRequired, dispatchCtrl.autoDispatch);
router.get('/api/dispatch/records', authRequired, dispatchCtrl.getDispatchRecords);

// Admin stats
router.get('/api/admin/stats', authRequired, (req, res) => {
  const totalOrders = ds.count('orders');
  const totalUsers = ds.count('users');
  const totalRiders = ds.count('riders');
  const today = new Date().toISOString().split('T')[0];
  const allOrders = ds.getAll('orders', {});
  const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(today)).length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.paid_amount) || 0), 0);
  
  res.json({ code: 0, data: { totalOrders, totalUsers, totalRiders, todayOrders, totalRevenue: totalRevenue.toFixed(2) } });
});

module.exports = router;
