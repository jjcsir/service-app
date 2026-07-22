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
      
      const res = await api.createOrder({
        service_id: this.data.service.id,
        category_id: this.data.service.category_id,
        start_address: this.data.detailAddress,
        total_amount: this.data.totalPrice,
        remark: this.data.remark,
        context: `时间: ${dateStr} ${timeSlot}`
      })
      
      // 下单成功 → 发起支付流程
      if (res.code === 0 && res.data?.order_no) {
        this.payOrder(res.data.order_no, res.data.paid_amount || this.data.totalPrice)
      } else {
        wx.showToast({ title: res.message || '预约失败', icon: 'none' })
      }
    } catch (err) {
      console.error('下单失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // ── 支付方式选择与模拟支付 ──
  payOrder(orderNo, amount) {
    const self = this
    
    wx.showActionSheet({
      itemList: ['微信余额', '微信支付', '到店支付'],
      success(result) {
        const idx = result.tapIndex
        
        switch (idx) {
          case 0:
            // 微信余额 → 先充值再扣款
            self._payByBalance(orderNo, amount)
            break
          case 1:
            // 微信支付 → 模拟成功
            self._payByWechatPay(orderNo, amount)
            break
          case 2:
            // 到店支付 → 订单状态改为"待确认"(5)，无需付款
            self._payByStorePayment(orderNo, amount)
            break
          default:
            // 用户取消
            break
        }
      }
    })
  },

  /** 微信余额支付 */
  _payByBalance(orderNo, amount) {
    const self = this
    
    // 先查询钱包余额
    api.getWallet().then(walletRes => {
      const balance = walletRes.data?.balance ?? 0
      
      if (balance < amount) {
        // 余额不足，先充值
        wx.showModal({
          title: '余额不足',
          content: `当前余额 ¥${balance.toFixed(2)}，需支付 ¥${amount.toFixed(2)}，是否立即充值？`,
          confirmText: '去充值',
          success(modalRes) {
            if (modalRes.confirm) {
              api.topup({ amount: amount - balance }).then(() => {
                wx.showToast({ title: '充值成功', icon: 'success' })
                // 充值后再执行扣款
                self._completePayment(orderNo, amount)
              }).catch(() => {
                wx.showToast({ title: '充值失败', icon: 'none' })
              })
            }
          }
        })
      } else {
        // 余额充足，直接扣款
        self._completePayment(orderNo, amount)
      }
    }).catch(() => {
      wx.showToast({ title: '获取余额失败', icon: 'none' })
    })
  },

  /** 微信支付（模拟） */
  _payByWechatPay(orderNo, amount) {
    wx.showLoading({ title: '正在唤起微信支付...', mask: true })
    
    // 模拟调起微信支付，1秒后成功
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功！', icon: 'success' })
      self._completePayment(orderNo, amount)
    }, 1000)
  },

  /** 到店支付 */
  _payByStorePayment(orderNo, amount) {
    // 更新订单状态为"待确认"(5)，无需付款
    api.createOrder({
      service_id: 0,
      order_no: orderNo,
      pay_method: 'store_payment',
      paid_amount: 0,
      remark: `到店支付: ¥${amount.toFixed(2)}`
    }).catch(() => {
      // 忽略非关键错误，用户体验优先
    })
    
    wx.showToast({ title: '请到店支付', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/order/order' })
    }, 1500)
  },

  /** 统一支付完成处理 */
  _completePayment(orderNo, amount) {
    // 保存支付记录到本地，方便前端展示
    const payRecords = wx.getStorageSync('pay_records') || []
    payRecords.unshift({
      order_no: orderNo,
      amount: amount,
      method: '模拟支付',
      status: 'paid',
      time: Date.now()
    })
    wx.setStorageSync('pay_records', payRecords)
    
    wx.showToast({ title: '支付成功！', icon: 'success' })
    
    // 跳转到订单列表
    setTimeout(() => {
      wx.switchTab({ url: '/pages/order/order' })
    }, 1500)
  }
})
