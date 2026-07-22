const api = require('../../utils/api')

// 服务 Emoji 映射
const EMOJI_MAP = {
  '深度保洁': '✨', '日常保洁': '🧽', '开荒保洁': '🏠',
  '洗衣机清洗': '🫧', '冰箱清洗': '❄️', '油烟机清洗': '🍳',
  '马桶疏通': '🚽', '下水道疏通': '🔧', '居民搬家': '📦',
  '公司搬迁': '🚛', '美甲单色': '💅', '美甲彩绘': '💖',
  '美睫': '👁️', '挂机清洗': '💨', '柜机清洗': '🌀',
  '除甲醛': '🌿', '开锁': '🔑', '换锁芯': '🔐',
}

// 订单状态映射
const STATUS_MAP = {
  0: { label: '待抢单', cls: 'status-pending' },
  1: { label: '已接单', cls: 'status-doing' },
  2: { label: '进行中', cls: 'status-doing' },
  3: { label: '已完成', cls: 'status-done' },
  4: { label: '已取消', cls: 'status-cancelled' },
  5: { label: '已指派', cls: 'status-doing' },
}

Page({
  data: {
    orders: [],
    activeTab: 0,
    tabs: [
      { label: '全部', value: '' },
      { label: '待抢单', value: 0 },
      { label: '进行中', value: 2 },
      { label: '已完成', value: 3 },
      { label: '已取消', value: 4 },
    ],
    loading: false
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    if (this.data.loading) return
    const status = this.data.tabs[this.data.activeTab].value
    const params = { page: 1, perPage: 50 }
    if (status !== '') params.status = status
    
    this.setData({ loading: true })
    
    try {
      const res = await api.listOrders(params)
      const enriched = (res.data?.orders || []).map(o => ({
        ...o,
        statusText: STATUS_MAP[o.status]?.label || '未知'
      }))
      
      this.setData({ 
        orders: enriched,
        loading: false
      })
    } catch (err) {
      console.error('加载订单失败:', err)
      this.setData({ loading: false })
    }
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.index
    if (idx === this.data.activeTab) return
    this.setData({ activeTab: idx })
    this.loadOrders()
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await api.cancelOrder(id)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadOrders()
        } catch (err) {
          console.error('取消失败:', err)
        }
      }
    })
  },

  showDetail(e) {
    const orderNo = e.currentTarget.dataset.orderid
    wx.showToast({ title: '详情页开发中', icon: 'none' })
  },

  // ── 工具方法 ──
  getStatusLabel(status) {
    return STATUS_MAP[status]?.label || '未知'
  },

  getStatusClass(status) {
    return STATUS_MAP[status]?.cls || 'status-default'
  },

  getItemEmoji(name) {
    return EMOJI_MAP[name] || '🔧'
  }
})
