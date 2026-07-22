const api = require('./utils/api')

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    services: [],
    categories: [],
    banners: []
  },

  onLaunch() {
    // 检查本地是否有 token
    const token = api.getToken()
    if (token) {
      this.globalData.isLoggedIn = true
    }
    
    // 异步加载全局数据
    Promise.all([
      this.loadBanners(),
      this.loadCategories(),
      this.loadServices()
    ]).catch(err => console.error('首页数据加载失败:', err))
  },

  async loadBanners() {
    try {
      const res = await api.getBanners()
      if (res.data && res.data.length > 0) {
        this.globalData.banners = res.data.map(b => b.image)
      } else {
        // fallback 到默认轮播图
        this.globalData.banners = [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=750&h=300&fit=crop',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=750&h=300&fit=crop',
          'https://images.unsplash.com/photo-1628177142898-93e36e4e2a3f?w=750&h=300&fit=crop'
        ]
      }
    } catch (e) {
      console.log('加载轮播图失败，使用默认数据')
      this.globalData.banners = [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=750&h=300&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=750&h=300&fit=crop',
        'https://images.unsplash.com/photo-1628177142898-93e36e4e2a3f?w=750&h=300&fit=crop'
      ]
    }
  },

  async loadServices() {
    try {
      const res = await api.getServices()
      if (res.data) {
        this.globalData.services = res.data || []
      }
    } catch (e) {
      console.log('加载服务失败')
    }
  },

  async loadCategories() {
    try {
      const res = await api.getCategories()
      if (res.data) {
        this.globalData.categories = res.data || []
      }
    } catch (e) {
      console.log('加载分类失败')
    }
  }
})
