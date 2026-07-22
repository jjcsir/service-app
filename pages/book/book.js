const api = require('../../utils/api')
const app = getApp()

// 服务 Emoji 映射
const EMOJI_MAP = {
  '深度保洁': '✨', '日常保洁': '🧽', '开荒保洁': '🏠',
  '洗衣机清洗': '🫧', '冰箱清洗': '❄️', '油烟机清洗': '🍳',
  '马桶疏通': '🚽', '下水道疏通': '🔧', '居民搬家': '📦',
  '公司搬迁': '🚛', '美甲单色': '💅', '美甲彩绘': '💖',
  '美睫': '👁️', '挂机清洗': '💨', '柜机清洗': '🌀',
  '除甲醛': '🌿', '开锁': '🔑', '换锁芯': '🔐',
}

Page({
  data: {
    service: {},
    dates: [],
    timeSlots: [
      '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
      '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
      '17:00-18:00', '18:00-19:00'
    ],
    currentDateIndex: 0,
    currentTimeSlot: -1,
    detailAddress: '',
    remark: '',
    servicePrice: 0,
    totalPrice: 0,
    loading: false
  },

  onLoad(options) {
    const id = parseInt(options.id) || 1
    
    // 尝试从全局数据或URL参数获取服务信息
    let service = {}
    const allServices = app.globalData.services || []
    const matchedService = allServices.find(s => s.id == id)
    
    if (matchedService) {
      service = { ...matchedService }
    } else if (options.name) {
      service = { name: decodeURIComponent(options.name) }
    }
    
    // URL参数覆盖价格
    const price = parseFloat(options.price) || service.price || 0
    
    service.emoji = EMOJI_MAP[service.name] || '🔧'
    
    this.setData({ 
      service,
      servicePrice: price,
      totalPrice: price
    })
    
    this.generateDates()
  },

  generateDates() {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dates.push({
        day: `${d.getMonth()+1}/${d.getDate()}`,
        week: i === 0 ? '今天' : weekDays[d.getDay()]
      })
    }
    this.setData({ dates })
  },

  selectDate(e) {
    this.setData({ currentDateIndex: e.currentTarget.dataset.index })
  },

  selectTime(e) {
    this.setData({ currentTimeSlot: e.currentTarget.dataset.index })
  },

  onAddressInput(e) {
    this.setData({ detailAddress: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  getLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ detailAddress: res.address + res.name })
      },
      fail: () => {
        // 用户取消，不操作
      }
    })
  },

  async submitOrder() {
    if (!api.getToken()) {
      return wx.showToast({ title: '请先登录', icon: 'none' })
    }
    if (this.data.currentTimeSlot < 0) {
      return wx.showToast({ title: '请选择时段', icon: 'none' })
    }
    if (!this.data.detailAddress.trim()) {
      return wx.showToast({ title: '请填写地址', icon: 'none' })
    }
    if (this.data.loading) return

    this.setData({ loading: true })
    
    try {
      const timeSlot = this.data.timeSlots[this.data.currentTimeSlot]
      const dateStr = this.data.dates[this.data.currentDateIndex].day
      
      await api.createOrder({
        service_id: this.data.service.id,
        category_id: this.data.service.category_id,
        start_address: this.data.detailAddress,
        total_amount: this.data.totalPrice,
        remark: this.data.remark,
        context: `时间: ${dateStr} ${timeSlot}`
      })
      
      wx.showToast({ title: '预约成功！', icon: 'success' })
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/order/order' })
      }, 1500)
    } catch (err) {
      console.error('下单失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
