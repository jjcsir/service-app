const api = require('../../../utils/api')

Page({
  data: {
    tabs: ['待接单', '进行中', '已完成'],
    activeTab: 0,
    orders: []
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.index })
    this.loadOrders()
  },

  async loadOrders() {
    // TODO: 调用 rider/orders API
    this.setData({ orders: [] })
  },

  onPickup(e) {
    wx.showToast({ title: '标记取货中', icon: 'success' })
  },
  onDeliver(e) {
    wx.showToast({ title: '标记送货中', icon: 'success' })
  },
  onComplete(e) {
    wx.showToast({ title: '订单完成！', icon: 'success' })
  }
})

cat > "/Users/mac/.codex/worktrees/2f93/New project/pages/rider/orders/orders.json" << 'EOF'
{
  "navigationBarTitleText": "我的订单",
  "usingComponents": {}
}
