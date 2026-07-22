const ds = require('../db/datastore');
const { generateToken } = require('../middleware/auth');

function login(req, res) {
  const { openid, nickname, avatar, referral_code } = req.body || {};
  let user = ds.getAll('users', { where: { openid }})[0];
  if (!user) {
    user = ds.insert('users', { openid, nickname: nickname || '', avatar: avatar || '', referral_code: 'U' + Date.now().toString(36).toUpperCase() });
    if (referral_code) {
      const referrer = ds.getAll('users', { where: { referral_code: referral_code } })[0];
      if (referrer) { ds.updateById('users', user.id, { referrer_id: referrer.id }); ds.insert('distributors', { user_id: user.id, parent_id: referrer.id }); }
    }
  }
  if (!user) return res.json({ code: 404, message: '用户不存在' });
  const token = generateToken({ userId: user.id, role: 'user' });
  const dists = ds.getAll('distributors', { where: { user_id: user.id } });
  res.json({ code: 0, data: { token, ...user, distributor: dists[0] || null } });
}

function getProfile(req, res) {
  const user = ds.getByField('users', 'id', req.user.userId);
  if (!user) return res.json({ code: 404, message: '用户不存在' });
  const dists = ds.getAll('distributors', { where: { user_id: user.id } });
  res.json({ code: 0, data: { ...user, distributor: dists[0] || null } });
}

function updateProfile(req, res) {
  const updates = {};
  for (const f of ['nickname','phone','realname','gender','city','district','address','avatar']) {
    if (req.body[f] !== undefined && req.body[f] !== '') updates[f] = req.body[f];
  }
  if (Object.keys(updates).length > 0) ds.updateById('users', req.user.userId, updates);
  res.json({ code: 0, message: '更新成功' });
}

function getWallet(req, res) {
  const user = ds.getByField('users', 'id', req.user.userId);
  if (!user) return res.json({ code: 404, message: '用户不存在' });
  const payments = ds.getAll('payments', { where: { user_id: user.id }, orderBy: { col: 'created_at', dir: 'DESC' }, limit: 10 });
  res.json({ code: 0, data: { balance: parseFloat(user.balance || 0), total_orders: user.total_orders || 0, coupon_count: user.coupon_count || 0, payments } });
}

function topup(req, res) {
  const { amount, method } = req.body || {};
  const user = ds.getByField('users', 'id', req.user.userId);
  const newBalance = (parseFloat(user.balance) || 0) + parseFloat(amount);
  ds.updateById('users', user.id, { balance: newBalance });
  ds.insert('payments', { user_id: user.id, amount, type: 'topup', method, status: 1 });
  res.json({ code: 0, data: { balance: newBalance }, message: '充值成功' });
}

// ==================== 优惠券（用户端） ====================

/**
 * 获取可领取的优惠券列表
 * GET /api/coupons
 */
function getCoupons(req, res) {
  const coupons = ds.getAll('coupons', { where: { status: 1 } });
  for (const c of coupons) {
    c.typeLabel = c.type === 'cash' ? '现金券' : c.type === 'discount' ? '折扣券' : '普通券';
    c.label = c.type === 'cash' ? `¥${c.value}` : `${c.value}折`;
    c.validity = c.valid_days ? `领取后${c.valid_days}天内有效` : '';
  }
  res.json({ code: 0, data: coupons });
}

/**
 * 领取优惠券
 * POST /api/coupons/claim
 */
function claimCoupon(req, res) {
  const { coupon_id } = req.body || {};
  const userId = req.user.userId;
  
  const coupons = ds.getAll('coupons', {});
  const coupon = coupons.find(c => c.id === parseInt(coupon_id));
  if (!coupon) {
    return res.json({ code: 404, message: '优惠券不存在' });
  }
  
  // 检查是否已领取
  const userCoupons = ds.getAll('user_coupons', { where: { user_id: userId, coupon_id } });
  if (userCoupons.length > 0) {
    return res.json({ code: 400, message: '您已经领取过该优惠券了' });
  }
  
  // 记录领取
  ds.insert('user_coupons', {
    user_id: userId,
    coupon_id: coupon.id,
    status: 0,  // 0=未使用, 1=已使用, 2=已过期
    claimed_at: new Date().toISOString().split('T')[0]
  });
  
  // 更新用户优惠券计数
  ds.updateById('users', userId, { 
    coupon_count: (parseInt(user.coupon_count || 0)) + 1 
  });
  
  // 更新优惠券领取计数
  ds.updateById('coupons', coupon.id, {
    claimed_count: (parseInt(coupon.claimed_count || 0)) + 1
  });
  
  res.json({ code: 0, message: '领取成功', data: { ...coupon, typeLabel: coupon.type === 'cash' ? '现金券' : '折扣券' } });
}

module.exports = { login, getProfile, updateProfile, getWallet, topup, getCoupons, claimCoupon };
