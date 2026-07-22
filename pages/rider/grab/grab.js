const api = require('../../../utils/api')

const EMOJI_MAP = {
  '深度保洁': '✨', '日常保洁': '🧽', '开荒保洁': '🏠',
  '洗衣机清洗': '🫧', '冰箱清洗': '❄️', '油烟机清洗': '🍳',
  '马桶疏通': '🚽', '下水道疏通': '🔧', '居民搬家': '📦',
  '公司搬迁': '🚛', '美甲单色': '💅', '美甲彩绘': '💖',
  '美睫': '👁️', '挂机清洗': '💨', '柜机清洗': '🌀',
  '除甲醛': '🌿', '开锁': '🔑', '换锁芯': '🔐',
}

Page({
  data: { orders: [], loading: false },

  onShow() { this.loadPool() },

  async loadPool() {
    const token = api.getToken()
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await api.grabPool()
      if (res && res.data && res.data.orders) {
        // Convert server order objects to front-end format with grabbed flag
        const orders = (res.data.orders || []).map(o => ({
          id: o.id,
          order_no: o.order_no || '',
          service_name: o.service_name || '',
          total_amount: o.paid_amount || o.total_amount || 0,
          start_address: o.start_address || '',
          created_at: o.created_at ? o.created_at.split('T')[0] + ' ' + (o.created_at.split('T')[1] || '') : '',
          grabbed: !!o.rider_id
        }))
        this.setData({ orders, loading: false })
      }
    } catch (err) {
      console.error('加载抢单池失败:', err)
      this.setData({ loading: false })
    }
  },

  refresh() { this.loadPool() },

  async onGrab(e) {
    const orderNo = e.currentTarget.dataset.id
    if (!orderNo) return

    const order = this.data.orders.find(o => o.order_no === orderNo)
    if (order && order.grabbed) {
      wx.showToast({ title: '该订单已被抢', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '抢单中...' })
      await api.grabOrder({ order_no: orderNo })
      wx.hideLoading()
      wx.showToast({ title: '抢单成功！', icon: 'success' })
      // Refresh the pool to update list
      this.loadPool()
    } catch (err) {
      wx.hideLoading()
      console.error('抢单失败:', err)
    }
  },

  getItemEmoji(name) { return EMOJI_MAP[name] || '🔧' }
})
