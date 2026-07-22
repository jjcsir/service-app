const ds = require('../db/datastore');
const { getAll, getById, insert, updateById } = ds;

function getCategories(req, res) {
  const cats = getAll('categories', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'ASC' } });
  
  for (const cat of cats) {
    cat.services = getAll('services', { 
      where: { category_id: cat.id, is_active: 1 },
      orderBy: { col: 'sort_order', dir: 'DESC' }
    });
  }
  
  res.json({ code: 0, data: cats });
}

function getServices(req, res) {
  const { category_id, keyword } = req.query || {};
  
  let allServices = getAll('services', { where: { is_active: 1 } });
  
  if (category_id) allServices = allServices.filter(s => s.category_id === parseInt(category_id));
  if (keyword) allServices = allServices.filter(s => 
    String(s.name).toLowerCase().includes(keyword.toLowerCase()) ||
    String(s.description || '').toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Add category names
  const categories = getAll('categories', {});
  for (const svc of allServices) {
    const cat = categories.find(c => c.id === svc.category_id);
    svc.category_name = cat?.name || '';
  }
  
  res.json({ code: 0, data: allServices });
}

function addCategory(req, res) {
  const { name, icon, sort_order } = req.body || {};
  const cat = insert('categories', { name, icon: icon || '', sort_order: sort_order || 0, is_active: 1 });
  res.json({ code: 0, data: { id: cat.id } });
}

function addService(req, res) {
  const { category_id, name, description, icon, price, unit, min_price, max_price, duration, images, features, sort_order } = req.body || {};
  const svc = insert('services', { 
    category_id, name, description: description || '', icon: icon || '', price: price || 0, 
    unit: unit || '次', min_price: min_price || 0, max_price: max_price || 9999,
    duration: duration || 60, images: JSON.stringify(images || []), features: JSON.stringify(features || []), 
    sort_order: sort_order || 0, is_active: 1 
  });
  res.json({ code: 0, data: { id: svc.id } });
}

function getBanners(req, res) {
  const banners = getAll('banners', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'DESC' } });
  res.json({ code: 0, data: banners });
}

function getAnnouncements(req, res) {
  const anns = getAll('announcements', { where: { is_active: 1 }, orderBy: { col: 'created_at', dir: 'DESC' } });
  res.json({ code: 0, data: anns.slice(0, 5) });
}

function getFAQs(req, res) {
  const faqs = getAll('faqs', { where: { is_active: 1 }, orderBy: { col: 'sort_order', dir: 'DESC' } });
  res.json({ code: 0, data: faqs });
}

function getCoupons(req, res) {
  const coupons = getAll('coupons', { where: { is_active: 1 }, orderBy: { col: 'created_at', dir: 'DESC' } });
  res.json({ code: 0, data: coupons.slice(0, 10) });
}

function claimCoupon(req, res) {
  const { coupon_id } = req.body || {};
  const coupon = getById('coupons', coupon_id);
  
  if (!coupon) return res.json({ code: 400, message: '优惠券不存在' });
  if (coupon.total <= coupon.issued) return res.json({ code: 400, message: '已领完' });
  
  // Check already claimed
  const existing = getAll('user_coupons', { where: { user_id: req.user.userId, coupon_id } });
  if (existing.length > 0) return res.json({ code: 400, message: '您已领取过此券' });
  
  const code = 'CPN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  const expiresAt = new Date(Date.now() + coupon.valid_days * 86400000).toISOString().split('T')[0];
  
  insert('user_coupons', { user_id: req.user.userId, coupon_id, code, status: 0, expires_at: expiresAt });
  
  const coupons = getAll('coupons', {});
  const cup = coupons.find(c => c.id === coupon_id);
  if (cup) updateById('coupons', cup.id, { issued: cup.issued + 1 });
  
  res.json({ code: 0, data: { code }, message: '领券成功' });
}

module.exports = { getCategories, getServices, addCategory, addService, getBanners, getAnnouncements, getFAQs, getCoupons, claimCoupon };
