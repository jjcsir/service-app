const api = require('../../../utils/api')

Page({
  data: {
    riderName: '骑手',
    isOnline: false,
    todayOrders: 0,
    weekIncome: '0',
    rating: '5.0',
    myOrderCount: 0
  },

  onLoad() {
    this.riderLogin()
  },

  onShow() {
    this.checkRider()
    this.loadStats()
  },

  async riderLogin() {
    const token = api.getToken() || wx.getStorageSync('loginToken')
    if (!token) return // Not logged in yet, will be handled by checkLogin

    try {
      const res = await api.riderLogin({ token })
      if (res && res.token) {
        api.setToken(res.token)
      }
      if (res && res.rider) {
        this.setData({ riderName: res.rider.realname || '骑手' })
      }
    } catch (err) {
      console.error('骑手登录失败:', err)
    }
  },

  checkRider() {
    const token = api.getToken()
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先以骑手身份登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/mine/mine' })
          }
        }
      })
    }
  },

  async loadStats() {
    try {
      const res = await api.riderStats()
      if (res && res.data) {
        const d = res.data
        this.setData({
          todayOrders: d.todayOrders || 0,
          weekIncome: d.weekIncome || '0',
          rating: d.rating ? parseFloat(d.rating).toFixed(1) : '5.0',
          myOrderCount: (d.total_orders || 0)
        })
      }
    } catch (err) {
      console.error('加载统计数据失败:', err)
    }
  },

  async toggleOnline() {
    const newStatus = !this.data.isOnline
    this.setData({ isOnline: newStatus })

    try {
      await api.updateRiderStatus({ available: newStatus })
      const status = newStatus ? '在线' : '离线'
      wx.showToast({ title: `已切换为${status}`, icon: 'none' })
    } catch (err) {
      console.error('更新状态失败:', err)
      this.setData({ isOnline: !newStatus })
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  goGrab() {
    wx.navigateTo({ url: '/pages/rider/grab/grab' })
  },

  goMyOrders() {
    wx.navigateTo({ url: '/pages/rider/orders/orders' })
  },

  goWallet() { wx.showToast({ title: '钱包开发中', icon: 'none' }) },
  goWithdraw() { wx.showToast({ title: '提现开发中', icon: 'none' }) },
  goProfile() { wx.showToast({ title: '个人信息开发中', icon: 'none' }) }
})
