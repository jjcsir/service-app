const BASE_URL = 'http://localhost:5000'

// Token 存取
function getToken() { return wx.getStorageSync('token') || '' }
function setToken(t) { wx.setStorageSync('token', t) }
function removeToken() { wx.removeStorageSync('token') }

// 用户信息存取
function getUserInfo() { try { return JSON.parse(wx.getStorageSync('userInfo')) || {} } catch { return {} } }
function setUserInfo(u) { wx.setStorageSync('userInfo', JSON.stringify(u)) }
function removeUserInfo() { wx.removeStorageSync('userInfo') }

// 通用请求方法
function request(url, method = 'GET', data = {}, needAuth = false) {
  return new Promise((resolve, reject) => {
    const token = needAuth ? getToken() : ''
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      success(res) {
        if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
          // Token 过期或无效，清除登录状态
          removeToken()
          removeUserInfo()
          wx.showToast({ title: '请重新登录', icon: 'none' })
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/mine/mine' })
          }, 1500)
          reject(new Error('未登录'))
          return
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data)
        } else {
          wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
          reject(new Error(res.data.message || '请求失败'))
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = {
  BASE_URL,
  getToken, setToken, removeToken,
  getUserInfo, setUserInfo, removeUserInfo,
  request,

  // ========== 认证 ==========
  login: (data) => request('/api/auth/login', 'POST', data),

  // ========== 用户 ==========
  getProfile: () => request('/api/users/me', 'GET', {}, true),
  updateProfile: (data) => request('/api/users/me', 'PUT', data, true),
  getWallet: () => request('/api/users/me/wallet', 'GET', {}, true),
  topup: (data) => request('/api/users/me/wallet/topup', 'POST', data, true),

  // ========== 服务/分类 ==========
  getCategories: () => request('/api/categories', 'GET'),
  getServices: (params) => request('/api/services', 'GET', params || {}),
  getBanners: () => request('/api/banners', 'GET'),
  getAnnouncements: () => request('/api/announcements', 'GET'),
  getFAQs: () => request('/api/faqs', 'GET'),

  // ========== 优惠券 ==========
  getCoupons: () => request('/api/coupons', 'GET'),
  claimCoupon: (coupon_id) => request('/api/coupons/claim', 'POST', { coupon_id }, true),

  // ========== 订单 ==========
  createOrder: (data) => request('/api/orders', 'POST', data, true),
  listOrders: (params) => request('/api/orders', 'GET', params || {}, true),
  getOrderDetail: (id) => request('/api/orders/' + id, 'GET', {}, true),
  cancelOrder: (id) => request('/api/orders/' + id, 'DELETE', {}, true),
}
