const api = require('../../utils/api')

Page({
  data: {
    coupons: [],
    myCoupons: [],
    currentTab: 0  // 0=可领, 1=我的
  },

  onShow() {
    this.loadAvailableCoupons()
    this.loadMyCoupons()
  },

  async loadAvailableCoupons() {
    try {
      const res = await api.getCoupons()
      const list = (res.data || []).map(c => ({
        ...c,
        label: c.type === 'cash' ? `¥${c.value}` : `${c.value}折`,
        typeLabel: c.type === 'cash' ? '现金券' : '折扣券'
      }))
      this.setData({ coupons: list })
    } catch (err) {
      console.error('获取优惠券列表失败:', err)
      this.setData({ coupons: [] })
    }
  },

  async loadMyCoupons() {
    // 先从本地读取
    let myCoupons = wx.getStorageSync('myCoupons') || []
    
    // 如果有 token，也尝试从 API 拉取
    if (api.getToken()) {
      try {
        // user_coupons 表通过 datastore 查询
        const ds = require('../../server/db/datastore')
        // fallback: use local storage for now
      } catch (e) {}
    }
    
    myCoupons = myCoupons.map(c => ({
      ...c,
      statusLabel: c.status === 0 ? '未使用' : c.status === 1 ? '已使用' : '已过期',
      statusClass: c.status === 0 ? 'status-unused' : c.status === 1 ? 'status-used' : 'status-expired'
    }))
    
    this.setData({ myCoupons })
  },

  claimCoupon(e) {
    const id = e.currentTarget.dataset.id
    const coupon = this.data.coupons.find(c => c.id === id)
    
    wx.showModal({
      title: '确认领取',
      content: `确定领取「${coupon.name}」？`,
      success: (res) => {
        if (!res.confirm) return
        
        wx.showLoading({ title: '领取中...' })
        api.claimCoupon(id).then(() => {
          wx.hideLoading()
          wx.showToast({ title: '领取成功！', icon: 'success' })
          
          // 更新本地列表：移除已领取的
          const remaining = this.data.coupons.filter(c => c.id !== id)
          this.setData({ coupons: remaining })
          
          // 存入本地"我的优惠券"
          const myCoupons = this.data.myCoupons || []
          myCoupons.unshift({
            ...coupon,
            id: coupon.id,
            user_id: null,
            status: 0,
            claimed_at: new Date().toISOString().split('T')[0]
          })
          wx.setStorageSync('myCoupons', myCoupons)
          this.setData({ myCoupons })
        }).catch(err => {
          wx.hideLoading()
          console.error('领取失败:', err)
        })
      }
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  useCoupon(e) {
    const idx = e.currentTarget.dataset.idx
    wx.navigateTo({ url: `/pages/book/book?coupon_id=${this.data.myCoupons[idx].id}` })
  }
})
