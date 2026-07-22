const api = require('../../utils/api')

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    orderCounts: { all: 0, pending: 0, doing: 0, done: 0 },
    balance: 0,
    totalOrders: 0,
    couponCount: 0,
    currentMode: 'user'  // 'user' | 'rider'
  },

  onShow() {
    this.checkLoginState()
    if (this.data.isLoggedIn) {
      this.loadData()
    }
  },

  checkLoginState() {
    const token = api.getToken()
    this.setData({ isLoggedIn: !!token })
    
    if (token) {
      this.loadProfile()
    } else {
      const localInfo = JSON.parse(wx.getStorageSync('userInfo') || '{}')
      if (localInfo.nickname) {
        this.setData({ userInfo: localInfo })
      }
    }
  },

  async loadProfile() {
    try {
      const res = await api.getProfile()
      const user = res.data
      this.setData({ 
        userInfo: { nickname: user.nickname || '', avatar: user.avatar || '' },
        balance: user.balance || 0,
        totalOrders: user.total_orders || 0,
        couponCount: user.coupon_count || 0
      })
    } catch (err) { console.error('获取用户信息失败:', err) }
  },

  async loadData() {
    try {
      const [orderRes] = await Promise.all([
        api.listOrders({ page: 1, perPage: 200 }).catch(() => ({ data: { orders: [] } }))
      ])
      const allOrders = orderRes.data?.orders || []
      this.setData({
        orderCounts: {
          all: allOrders.length,
          pending: allOrders.filter(o => o.status == 0 || o.status == 5).length,
          doing: allOrders.filter(o => o.status == 1 || o.status == 2).length,
          done: allOrders.filter(o => o.status == 3).length
        }
      })
    } catch (err) { console.error('加载数据失败:', err) }
  },

  // ── 登录 ──
  onLogin() {
    wx.showLoading({ title: '登录中...' })
    wx.login({
      success: (loginRes) => {
        const openid = loginRes.code || ('wx_' + Date.now())
        api.login({ openid, nickname: '微信用户' }).then(res => {
          wx.hideLoading()
          const { token, user } = res.data
          api.setToken(token)
          // Save phone if available for rider login
          if (user && user.phone) {
            wx.setStorageSync('loginToken', user.phone)
          }
          api.setUserInfo(user)
          this.setData({
            userInfo: { nickname: user.nickname || '微信用户', avatar: user.avatar || '' },
            isLoggedIn: true
          })
          setTimeout(() => this.loadData(), 800)
        }).catch(err => {
          wx.hideLoading()
          console.error('登录失败:', err)
        })
      },
      fail: () => {
        api.login({ openid: 'wx_' + Date.now(), nickname: '微信用户' }).then(res => {
          api.setToken(res.data.token)
          this.setData({
            userInfo: { nickname: res.data.user.nickname, avatar: '' },
            isLoggedIn: true
          })
          setTimeout(() => this.loadData(), 800)
        }).catch(err => { console.error('登录失败:', err) })
      }
    })
  },

  // ── 退出登录 ──
  onLogout() {
    wx.showModal({
      title: '提示', content: '确定退出登录？',
      success: (res) => {
        if (!res.confirm) return
        api.removeToken(); api.removeUserInfo()
        this.setData({ isLoggedIn: false, userInfo: {}, orderCounts: { all:0, pending:0, doing:0, done:0 } })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  },

  // ── 模式切换 ──
  switchMode() {
    const newMode = this.data.currentMode === 'user' ? 'rider' : 'user'
    this.setData({ currentMode: newMode })
    wx.showToast({ title: `已切换至${newMode === 'user' ? '顾客端' : '骑手端'}`, icon: 'none' })
  },

  // ── 骑手入口 ──
  goRiderRegister() {
    wx.navigateTo({ url: '/pages/rider/rider_register/rider_register' })
  },

  goOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.switchTab({ url: '/pages/order/order?status=' + (status || '') })
  },

  // 顾客端导航
  goAddress()    { wx.showToast({ title: '地址管理开发中', icon: 'none' }) },
  goFavorites()  { wx.showToast({ title: '收藏功能开发中', icon: 'none' }) },
  goCoupon()     { wx.showToast({ title: '优惠券开发中', icon: 'none' }) },
  goWallet()     { wx.showToast({ title: '钱包开发中', icon: 'none' }) },
  goHelp()       { wx.showToast({ title: '帮助中心开发中', icon: 'none' }) },
  goContact()    { wx.makePhoneCall({ phoneNumber: '400-123-4567' }) },
  goSettings()   { wx.showToast({ title: '设置开发中', icon: 'none' }) },

  // 骑手端导航
  goRiderHome()  { wx.navigateTo({ url: '/pages/rider/home/home' }) },
  goWithdraw()   { wx.showToast({ title: '提现开发中', icon: 'none' }) },
  goCert()       { wx.showToast({ title: '认证管理开发中', icon: 'none' }) }
})
