const app = getApp()

Page({
  data: {
    service: {},
    dates: [],
    timeSlots: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'],
    currentDateIndex: 0,
    currentTimeSlot: -1,
    address: '',
    remark: ''
  },

  onLoad(options) {
    const id = parseInt(options.id) || 1
    const service = app.globalData.services.find(s => s.id == id)
    if (service) {
      this.setData({ service })
    }
    this.generateDates()
  },

  generateDates() {
    const dates = []
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dates.push({
        day: d.getDate(),
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
    this.setData({ address: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  submitOrder() {
    if (this.data.currentTimeSlot < 0) {
      return wx.showToast({ title: '请选择时段', icon: 'none' })
    }
    if (!this.data.address.trim()) {
      return wx.showToast({ title: '请填写地址', icon: 'none' })
    }

    const order = {
      id: Date.now(),
      serviceName: this.data.service.name,
      servicePrice: this.data.service.price,
      date: this.data.dates[this.data.currentDateIndex].day,
      time: this.data.timeSlots[this.data.currentTimeSlot],
      address: this.data.address,
      remark: this.data.remark,
      status: '待确认',
      createTime: new Date().toLocaleString()
    }

    // 保存订单
    let orders = wx.getStorageSync('orders') || []
    orders.unshift(order)
    wx.setStorageSync('orders', orders)

    wx.showToast({ title: '预约成功！', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/order/order' })
    }, 1500)
  }
})
