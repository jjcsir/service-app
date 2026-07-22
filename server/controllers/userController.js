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

module.exports = { login, getProfile, updateProfile, getWallet, topup };
