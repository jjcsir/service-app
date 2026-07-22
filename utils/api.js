const API = 'http://localhost:5000/api';

function request(url, method = 'GET', data = {}) {
  const token = wx.getStorageSync('merchant_token') || wx.getStorageSync('rider_token');
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: API + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}

// ============ 商户接口 ============
module.exports = {
  // 商户资料
  getMerchantProfile(merchantId) {
    return request(`/api/merchants/${merchantId}/profile`);
  },
  
  updateMerchant(merchantId, data) {
    return request(`/api/merchants/${merchantId}/profile`, 'PUT', data);
  },

  // 已有接口（保持兼容）
  login(data) { return request('/auth/login', 'POST', data); },
  getServices() { return request('/services'); },
  getCategories() { return request('/categories'); },
  getBanners() { return request('/banners'); },
  getFAQs() { return request('/faqs'); },
  
  createOrder(data) { return request('/orders', 'POST', data); },
  listOrders(params = {}) { 
    const qs = Object.entries(params).map(([k,v]) => `${k}=${v}`).join('&');
    return request(`/orders${qs ? '?' + qs : ''}`); 
  },
  getOrderDetail(id) { return request(`/orders/${id}`); },
  cancelOrder(id) { return request(`/orders/${id}`, 'DELETE'); },
  
  riderRegister(data) { return request('/rider/register', 'POST', data); },
  riderLogin(data) { return request('/rider/login', 'POST', data); },
  riderGrabPool(data) { return request('/rider/grab-pool', 'POST', data); },
  riderGrabOrder(data) { return request('/rider/grab-order', 'POST', data); },
  riderMyOrders(params = {}) {
    const qs = Object.entries(params).map(([k,v]) => `${k}=${v}`).join('&');
    return request(`/rider/orders?${qs}`);
  },
  riderUpdateOrderStatus(data) { return request(`/rider/orders/${data.order_no}/status`, 'PUT', data); },
  riderStats() { return request('/rider/stats'); },
  riderUpdateStatus(data) { return request('/rider/status', 'PUT', data); },
};
