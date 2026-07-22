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

  onShow() {
    this.checkLogin()
    this.loadData()
  },

  checkLogin() {
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

  loadData() {
    // TODO: 调用骑手 API 获取统计数据
    // 模拟数据
    this.setData({
      todayOrders: Math.floor(Math.random() * 10),
      weekIncome: (Math.random() * 500).toFixed(0),
      rating: (4.5 + Math.random() * 0.5).toFixed(1),
      myOrderCount: Math.floor(Math.random() * 3)
    })
  },

  toggleOnline() {
    this.setData({ isOnline: !this.data.isOnline })
    const status = this.data.isOnline ? '离线' : '在线'
    wx.showToast({ title: `已切换为${status}`, icon: 'none' })
    // TODO: 调用 rider API 更新状态
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
