Page({
  data: { orders: [] },

  onLoad() {},

  onShow() {
    const orders = wx.getStorageSync('orders') || []
    this.setData({ orders })
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    let orders = wx.getStorageSync('orders') || []
    orders = orders.filter(o => o.id != id)
    wx.setStorageSync('orders', orders)
    this.setData({ orders })
    wx.showToast({ title: '已取消', icon: 'success' })
  },

  showDetail(e) {
    wx.showToast({ title: '详情页开发中', icon: 'none' })
  }
})
