const ds = require('../db/datastore');

function getCategories(req, res) {
  const cats = ds.getAll('categories', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'ASC' } });
  for (const cat of cats) {
    cat.services = ds.getAll('services', { where: { category_id: cat.id, is_active: 1 }, orderBy: { col: 'sort_order', dir: 'DESC' } });
  }
  res.json({ code: 0, data: cats });
}

function getServices(req, res) {
  const { category_id, keyword } = req.query || {};
  let svcs = ds.getAll('services', { where: { is_active: 1 } });
  if (category_id) svcs = svcs.filter(s => s.category_id === parseInt(category_id));
  if (keyword) svcs = svcs.filter(s => String(s.name).toLowerCase().includes(keyword.toLowerCase()) || String(s.description||'').toLowerCase().includes(keyword.toLowerCase()));
  const catMap = {}; for (const c of ds.getAll('categories', {})) catMap[c.id]=c.name;
  for (const s of svcs) s.category_name = catMap[s.category_id]||'';
  res.json({ code: 0, data: svcs });
}

function getBanners(req, res) { res.json({ code: 0, data: ds.getAll('banners', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'DESC' } }) }); }
function getAnnouncements(req, res) { res.json({ code: 0, data: ds.getAll('announcements', { where: { is_active: 1 }, orderBy: { col: 'created_at', dir: 'DESC' } }).slice(0,5) }); }
function getFAQs(req, res) { res.json({ code: 0, data: ds.getAll('faqs', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'DESC' } }) }); }
function getCoupons(req, res) { res.json({ code: 0, data: ds.getAll('coupons', { where: { is_active: 1 }, orderBy: { col: 'created_at', dir: 'DESC' } }).slice(0,10) }); }

function claimCoupon(req, res) {
  const coupon = ds.getByField('coupons', 'id', req.body.coupon_id);
  if (!coupon) return res.json({ code: 400, message: '优惠券不存在' });
  if (coupon.total <= coupon.issued) return res.json({ code: 400, message: '已领完' });
  const existing = ds.getAll('user_coupons', { where: { user_id: req.user.userId, coupon_id: coupon.id } });
  if (existing.length > 0) return res.json({ code: 400, message: '您已领取过此券' });
  const code = 'CPN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,6).toUpperCase();
  ds.insert('user_coupons', { user_id: req.user.userId, coupon_id: coupon.id, code, status: 0, expires_at: new Date(Date.now()+coupon.valid_days*86400000).toISOString().split('T')[0] });
  const cup = ds.getByField('coupons', 'id', coupon.id);
  if (cup) ds.updateById('coupons', cup.id, { issued: cup.issued+1 });
  res.json({ code: 0, data: { code }, message: '领券成功' });
}

module.exports = { getCategories, getServices, getBanners, getAnnouncements, getFAQs, getCoupons, claimCoupon };
