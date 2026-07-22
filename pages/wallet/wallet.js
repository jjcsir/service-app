const api = require('../../utils/api')

Page({
  data: {
    balance: 0,
    payments: [],
    topupAmount: '',
    showTopup: false
  },

  onShow() {
    this.loadWallet()
  },

  async loadWallet() {
    try {
      const res = await api.getWallet()
      const data = res.data || {}
      this.setData({
        balance: parseFloat(data.balance || 0),
        payments: data.payments || []
      })
    } catch (err) {
      console.error('获取钱包信息失败:', err)
    }
  },

  onTopupAmountInput(e) {
    this.setData({ topupAmount: e.detail.value })
  },

  setTopupAmount(e) {
    const amount = e.currentTarget.dataset.amount
    this.setData({ topupAmount: String(amount) })
  },

  doTopup() {
    const amount = parseFloat(this.data.topupAmount)
    if (!amount || amount <= 0) {
      return wx.showToast({ title: '请输入有效金额', icon: 'none' })
    }

    wx.showLoading({ title: '充值中...' })
    api.topup({ amount, method: 'balance' }).then(res => {
      wx.hideLoading()
      wx.showToast({ title: `充值 ¥${amount} 成功`, icon: 'success' })
      this.setData({ topupAmount: '', showTopup: false })
      this.loadWallet()
    }).catch(err => {
      wx.hideLoading()
      console.error('充值失败:', err)
    })
  },

  closeTopup() {
    this.setData({ showTopup: false })
  }
})
