const app = getApp()

Page({
  data: {
    banners: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=750&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=750&h=300&fit=crop',
      'https://images.unsplash.com/photo-1628177142898-93e36e4e2a3f?w=750&h=300&fit=crop'
    ],
    categories: [],
    services: [],
    searchKeyword: ''
  },

  onLoad() {
    this.setData({
      categories: app.globalData.categories,
      services: app.globalData.services
    })
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value })
    const kw = e.detail.value.toLowerCase()
    if (!kw) {
      this.setData({ services: app.globalData.services })
      return
    }
    const filtered = app.globalData.services.filter(s => 
      s.name.includes(kw) || s.category.includes(kw)
    )
    this.setData({ services: filtered })
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id
    console.log('分类:', id)
  },

  goBook(e) {
    const id = e.currentTarget.dataset.id
    const service = app.globalData.services.find(s => s.id == id)
    if (service) {
      wx.navigateTo({
        url: '/pages/book/book?id=' + service.id
      })
    }
  }
})
