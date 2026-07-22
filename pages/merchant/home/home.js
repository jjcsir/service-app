const api = require('../../../utils/api')

Page({
  data: {
    merchantInfo: {},
    stats: { todayOrders: 0, monthOrders: 0, todayRevenue: '0.00', totalRevenue: '0.00' },
    recentOrders: [],
    statusMap: ['待接单', '已接单', '进行中', '已完成', '已取消']
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const token = wx.getStorageSync('token')
    if (!token) return wx.redirectTo({ url: '/pages/login/login' })

    // 加载商户信息
    api.getMyMerchants().then(res => {
      if (res.code === 0 && res.data.merchants.length > 0) {
        const merchant = res.data.merchants[0]
        this.setData({ merchantInfo: merchant })
      }
    }).catch(() => {})

    // 加载商户订单
    api.getMerchantOrders().then(res => {
      if (res.code === 0) {
        const orders = (res.data.orders || []).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        this.setData({ recentOrders: orders.slice(0, 5) })

        // 统计数据
        const today = new Date().toISOString().slice(0, 10)
        const thisMonth = new Date().toISOString().slice(0, 7)
        const todayOrders = orders.filter(o => (o.created_at || '').startsWith(today)).length
        const monthOrders = orders.filter(o => (o.created_at || '').startsWith(thisMonth)).length
        const todayRev = orders.filter(o => (o.created_at || '').startsWith(today)).reduce((s, o) => s + parseFloat(o.actual_pay || 0), 0)
        const totalRev = orders.reduce((s, o) => s + parseFloat(o.actual_pay || 0), 0)

        this.setData({
          'stats.todayOrders': todayOrders,
          'stats.monthOrders': monthOrders,
          'stats.todayRevenue': todayRev.toFixed(2),
          'stats.totalRevenue': totalRev.toFixed(2)
        })
      }
    }).catch(() => {})
  },

  statusText(status) {
    return this.data.statusMap[status] || '未知'
  },

  goShops() {
    wx.showToast({ title: '店铺管理开发中', icon: 'none' })
  },
  goOrders() {
    wx.showToast({ title: '订单列表开发中', icon: 'none' })
  },
  goStaff() {
    wx.showToast({ title: '店员管理开发中', icon: 'none' })
  },
  goFinance() {
    wx.showToast({ title: '财务中心开发中', icon: 'none' })
  },
  goOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '订单详情开发中', icon: 'none' })
  }
})
