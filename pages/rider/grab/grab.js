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
    // TODO: 调用 rider grab-pool API
    // 模拟数据
    this.setData({ 
      orders: [
        { order_no: 'SO001', service_name: '深度保洁', total_amount: 199, start_address: '朝阳区建国路88号', created_at: new Date().toLocaleString(), grabbed: false },
        { order_no: 'SO002', service_name: '空调清洗', total_amount: 88, start_address: '海淀区中关村大街1号', created_at: new Date(Date.now()-60000).toLocaleString(), grabbed: false },
        { order_no: 'SO003', service_name: '管道疏通', total_amount: 150, start_address: '西城区金融街10号', created_at: new Date(Date.now()-120000).toLocaleString(), grabbed: false }
      ]
    })
  },

  refresh() { this.loadPool() },

  async onGrab(e) {
    const orderNo = e.currentTarget.dataset.id
    // TODO: 调用 grab-order API
    
    const orders = this.data.orders.map(o => 
      o.order_no === orderNo ? { ...o, grabbed: true } : o
    )
    this.setData({ orders })
    
    wx.showToast({ title: '抢单成功！', icon: 'success' })
  },

  getItemEmoji(name) { return EMOJI_MAP[name] || '🔧' }
})
