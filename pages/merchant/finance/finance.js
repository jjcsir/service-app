const api = require('../../../utils/api')

Page({
  data: {
    balance: '0.00',
    totalIncome: '0.00',
    withdrawnAmount: '0.00',
    pendingAmount: '0.00',
    transactions: [],
    activeTab: 0
  },

  onLoad() {
    this.loadFinance()
  },

  onShow() {
    this.loadFinance()
  },

  loadFinance() {
    // 先确保 merchantId 已设置
    api.getMyMerchants().then(res => {
      if (res.code === 0 && res.data.merchants.length > 0) {
        wx.setStorageSync('merchantId', res.data.merchants[0].id)
      }
    }).catch(() => {})

    // 加载资金数据
    const merchantId = wx.getStorageSync('merchantId')
    if (!merchantId) return

    api.getMerchantFinance().then(res => {
      if (res.code === 0) {
        const d = res.data
        this.setData({
          balance: Number(d.balance || 0).toFixed(2),
          totalIncome: Number(d.total_income || 0).toFixed(2),
          withdrawnAmount: Number(d.withdrawn || 0).toFixed(2),
          pendingAmount: Number(d.pending || 0).toFixed(2),
          transactions: (d.transactions || []).slice(0, 20)
        })
      }
    }).catch(() => {})
  },

  switchTab(e) {
    this.setData({ activeTab: parseInt(e.currentTarget.dataset.tab) })
  },

  goWithdraw() {
    wx.navigateTo({ url: '/pages/dist/withdraw/withdraw' })
  }
})
