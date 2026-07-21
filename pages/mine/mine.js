Page({
  data: {
    userInfo: {},
    orderCounts: { all: 0, pending: 0, doing: 0, done: 0 }
  },

  onLoad() {},

  onShow() {
    const orders = wx.getStorageSync('orders') || []
    this.setData({
      userInfo: wx.getStorageSync('userInfo') || {},
      orderCounts: {
        all: orders.length,
        pending: orders.filter(o => o.status === '待确认').length,
        doing: orders.filter(o => o.status === '进行中').length,
        done: orders.filter(o => o.status === '已完成').length
      }
    })
  },

  goOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.switchTab({ url: '/pages/order/order' })
  },

  goAddress() { wx.showToast({ title: '地址管理开发中', icon: 'none' }) },
  goFavorites() { wx.showToast({ title: '收藏夹开发中', icon: 'none' }) },
  goCoupon() { wx.showToast({ title: '优惠券开发中', icon: 'none' }) },
  goHelp() { wx.showToast({ title: '帮助中心开发中', icon: 'none' }) },
  goContact() {
    wx.makePhoneCall({ phoneNumber: '400-123-4567' })
  },
  goSettings() { wx.showToast({ title: '设置开发中', icon: 'none' }) }
})
