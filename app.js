const API = 'http://localhost:5000/api'

App({
  globalData: {
    userInfo: null,
    services: [],
    categories: [],
    banners: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=750&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=750&h=300&fit=crop',
      'https://images.unsplash.com/photo-1628177142898-93e36e4e2a3f?w=750&h=300&fit=crop'
    ]
  },

  async onLaunch() {
    console.log('小程序启动')
    await this.loadServices()
    await this.loadCategories()
  },

  async loadServices() {
    try {
      const res = await wx.request({ url: API + '/services', method: 'GET' })
      if (res.statusCode === 200 && res.data.code === 0) {
        this.globalData.services = res.data.data || []
      }
    } catch (e) {
      console.log('加载服务失败，使用本地数据')
    }
  },

  async loadCategories() {
    try {
      const res = await wx.request({ url: API + '/categories', method: 'GET' })
      if (res.statusCode === 200 && res.data.code === 0) {
        this.globalData.categories = res.data.data || []
      }
    } catch (e) {
      console.log('加载分类失败，使用本地数据')
    }
  }
})
