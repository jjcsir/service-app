const express = require('express');
const router = express.Router();
const { authRequired, riderAuth } = require('../middleware/auth');
const { getAll } = require('../db/datastore');

// Controllers
const userCtrl = require('../controllers/userController');
const riderCtrl = require('../controllers/riderController');
const orderCtrl = require('../controllers/orderController');
const serviceCtrl = require('../controllers/serviceController');
const dispatchCtrl = require('../controllers/dispatchController');
const adminCtrl = require('../controllers/adminController');
const merchantCtrl = require('../controllers/merchantController');

// ==================== 用户端接口 ====================
router.post('/api/auth/login', userCtrl.login);
router.post('/api/auth/loginbycode', userCtrl.loginByCode);
router.get('/api/users/me', authRequired, userCtrl.getProfile);
router.put('/api/users/me', authRequired, userCtrl.updateProfile);
router.get('/api/users/me/wallet', authRequired, userCtrl.getWallet);
router.post('/api/users/me/wallet/topup', authRequired, userCtrl.topup);
router.get('/api/services', serviceCtrl.getServices);
router.get('/api/categories', serviceCtrl.getCategories);
router.get('/api/banners', serviceCtrl.getBanners);
router.get('/api/faqs', serviceCtrl.getFAQs);
router.get('/api/coupons', userCtrl.getCoupons);
router.post('/api/coupons/claim', authRequired, userCtrl.claimCoupon);
router.post('/api/orders', authRequired, orderCtrl.createOrder);
router.get('/api/orders', authRequired, orderCtrl.listOrders);
router.get('/api/orders/:id', authRequired, orderCtrl.getOrderDetail);
router.delete('/api/orders/:id', authRequired, orderCtrl.cancelOrder);

// 商户入驻（不需要登录）
router.post('/api/merchants/apply', merchantCtrl.applyMerchant);
router.get('/api/merchants/my', authRequired, merchantCtrl.listMerchants);
router.get('/api/merchants/:id', merchantCtrl.getMerchantDetail);
router.post('/api/merchants/shops', authRequired, merchantCtrl.addShop);
router.get('/api/merchants/shops', merchantCtrl.getShops);
router.delete('/api/merchants/shops/:id', merchantCtrl.deleteShop);
router.post('/api/merchants/staff', authRequired, merchantCtrl.addStaff);
router.get('/api/merchants/staff', merchantCtrl.getStaffList);

// 店铺类型
router.get('/api/shop-types', merchantCtrl.getShopTypes);
router.post('/api/shop-types', authRequired, merchantCtrl.addShopType);

// ==================== 骑手端接口 ====================
router.post('/api/rider/register', riderCtrl.register);
router.post('/api/rider/login', riderCtrl.login);
router.get('/api/rider/me', riderAuth, riderCtrl.getProfile);
router.put('/api/rider/status', riderAuth, riderCtrl.updateStatus);
router.get('/api/rider/grab-pool', riderAuth, riderCtrl.grabPool);
router.post('/api/rider/grab-order', riderAuth, riderCtrl.grabOrder);
router.get('/api/rider/orders', riderAuth, riderCtrl.myOrders);
router.put('/api/rider/orders/:id/status', riderAuth, riderCtrl.updateOrderStatus);
router.get('/api/rider/stats', riderAuth, riderCtrl.stats);

// ==================== 调度中心 ====================
router.get('/api/dispatch/pool', authRequired, dispatchCtrl.viewPool);
router.post('/api/dispatch/assign', authRequired, dispatchCtrl.assignOrder);
router.post('/api/dispatch/auto', authRequired, dispatchCtrl.autoDispatch);
router.get('/api/dispatch/records', authRequired, dispatchCtrl.getDispatchRecords);

// ==================== 管理员后台 ====================
router.post('/api/admin/login', adminCtrl.adminLogin);
router.get('/api/admin/dashboard', authRequired, adminCtrl.dashboard);
router.get('/api/admin/orders', authRequired, adminCtrl.orderList);
router.get('/api/admin/orders/:id', authRequired, adminCtrl.orderDetail);
router.post('/api/admin/orders/:id/cancel', authRequired, adminCtrl.cancelOrder);
router.post('/api/admin/orders/assign', authRequired, adminCtrl.assignOrder);
router.get('/api/admin/riders', authRequired, adminCtrl.riderList);
router.post('/api/admin/riders/certify', authRequired, adminCtrl.certifyRider);
router.get('/api/admin/services', authRequired, adminCtrl.serviceManagement);
router.get('/api/admin/users', authRequired, adminCtrl.userList);
router.get('/api/admin/coupons', authRequired, adminCtrl.couponList);
router.post('/api/admin/coupon', authRequired, adminCtrl.couponAdd);
router.put('/api/admin/coupon/:id', authRequired, adminCtrl.couponUpdate);
router.delete('/api/admin/coupon/:id', authRequired, adminCtrl.couponDelete);
router.get('/api/admin/distributors', authRequired, adminCtrl.distributorList);
router.get('/api/admin/distributor/:id', authRequired, adminCtrl.distributorDetail);
// 商户管理
router.get('/api/admin/merchants', authRequired, merchantCtrl.listMerchants);

// 商户详情
router.get('/api/admin/merchants/:id', authRequired, merchantCtrl.getMerchantDetail);
// 审核商户
router.post('/api/admin/merchants/:id/review', authRequired, merchantCtrl.reviewMerchant);
// 删除商户
router.delete('/api/admin/merchants/:id', authRequired, merchantCtrl.deleteMerchant);

module.exports = router;
