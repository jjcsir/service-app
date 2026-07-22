const api = require('../../utils/api')
const app = getApp()

// 分类 Emoji 映射（emoji替代图片图标）
const EMOJI_MAP = {
  '家政保洁': '🧹', '家电维修': '🔌', '管道疏通': '🚿', '搬家服务': '📦',
  '美甲美睫': '💅', '空调清洗': '❄️', '甲醛治理': '🌿', '开锁换锁': '🔑',
  '深度保洁': '✨', '日常保洁': '🧽', '开荒保洁': '🏠',
}

Page({
  data: {
    banners: [],
    categories: [],
    allServices: [],
    services: [],
    filteredServices: [],  // 首页顶部横向滚动区域用（取前8个）
    searchKeyword: '',
    currentCategory: '',
    currentCategoryName: '热门',
    loading: false
  },

  onLoad() {
    this.loadInitialData()
  },

  onShow() {
    this.refreshServices()
  },

  async loadInitialData() {
    try {
      // 并行加载分类、服务、轮播图
      const [catsRes, svcsRes, bannersRes] = await Promise.all([
        api.getCategories().catch(() => ({ data: [] })),
        api.getServices().catch(() => ({ data: [] })),
        api.getBanners().catch(() => ({ data: [] }))
      ])

      const categories = (catsRes.data || []).map(c => {
        const emoji = c.name ? EMOJI_MAP[c.name] : '🏷️'
        return { ...c, emoji }
      })
      const services = (svcsRes.data || []).map(s => {
        // 从分类名查找 emoji
        const cat = categories.find(c => c.id === s.category_id)
        const emoji = s.name ? (EMOJI_MAP[s.name] || cat?.emoji || '🔧') : '🔧'
        return { ...s, emoji }
      })
      const banners = bannersRes.data || []

      this.setData({
        categories, services, allServices: services,
        filteredServices: services.slice(0, 8),
        banners,
        currentCategory: ''
      })

      // 同步到 globalData
      app.globalData.categories = categories
      app.globalData.services = services
      app.globalData.banners = banners
    } catch (e) {
      console.error('首页加载失败:', e)
      // Fallback: use local cached data
      const cats = app.globalData.categories || []
      const svcs = app.globalData.services || []
      this.setData({
        categories: cats, services: svcs,
        allServices: svcs, filteredServices: svcs.slice(0, 8),
        banners: app.globalData.banners || []
      })
    }
  },

  async refreshServices() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await api.getServices()
      if (res.data) {
        const services = res.data.map(s => ({ ...s, emoji: SVC_EMOJI(s) }))
        const categories = app.globalData.categories || []
        const filteredServices = services.slice(0, 8)
        
        this.setData({ 
          services, allServices: services, filteredServices,
          currentCategory: ''
        })
        app.globalData.services = services
      }
    } catch (e) {
      console.log('服务刷新失败，使用缓存数据')
    } finally {
      this.setData({ loading: false })
    }
  },

  // ── 搜索 ──
  onSearch(e) {
    const kw = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: kw })
    
    if (!kw) {
      const filteredServices = this.data.allServices.slice(0, 8)
      this.setData({ services: this.data.allServices, filteredServices })
      return
    }

    const filtered = this.data.allServices.filter(s => 
      (s.name && s.name.toLowerCase().includes(kw)) ||
      (s.description && s.description.toLowerCase().includes(kw)) ||
      (s.category_name && s.category_name.toLowerCase().includes(kw))
    )
    this.setData({ 
      services: filtered, 
      filteredServices: filtered.slice(0, 8)
    })
  },

  // ── 分类筛选 ──
  goCategory(e) {
    const catId = e.currentTarget.dataset.id
    
    if (!catId) {
      this.setData({ 
        currentCategory: '',
        currentCategoryName: '热门',
        services: this.data.allServices,
        filteredServices: this.data.allServices.slice(0, 8)
      })
      return
    }

    const cat = this.data.categories.find(c => c.id == catId)
    const services = this.data.allServices.filter(s => s.category_id == catId)
    
    this.setData({ 
      currentCategory: catId,
      currentCategoryName: cat?.name || '服务列表',
      services,
      filteredServices: services.slice(0, 8)
    })

    wx.pageScrollTo({ scrollTop: 400, duration: 300 })
  },

  // ── 预约跳转 ──
  goBook(e) {
    const id = e.currentTarget.dataset.id
    const service = this.data.allServices.find(s => s.id == id)
    if (service) {
      wx.navigateTo({
        url: `/pages/book/book?id=${service.id}&name=${encodeURIComponent(service.name)}&price=${service.price}`
      })
    } else {
      wx.showToast({ title: '服务不存在', icon: 'none' })
    }
  },

  // 工具方法：获取Emoji
  getItemEmoji(name) {
    return EMOJI_MAP[name] || '🔧'
  }
})

// Helper
function SVC_EMOJI(s) {
  const map = { ...EMOJI_MAP }
  return map[s.name] || '🔧'
}
