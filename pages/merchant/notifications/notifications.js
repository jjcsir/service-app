const api = require('../../../utils/api')

Page({
  data: {
    messages: [],
    activeTab: 0,
    tabs: [
      { label: '全部', value: '' },
      { label: '订单', value: 'order' },
      { label: '系统', value: 'system' },
      { label: '财务', value: 'finance' }
    ],
    loading: false
  },

  onLoad() {
    this.loadMessages()
  },

  async loadMessages() {
    this.setData({ loading: true })
    try {
      // Try API first, fallback to local
      const res = await api.getMerchantNotifications()
      if (res.data) {
        const enriched = this.enrichMessages(res.data)
        this.setData({ messages: enriched })
      }
    } catch (err) {
      console.error('加载消息失败:', err)
      // Fallback
      this.setFallbackData()
    } finally {
      this.setData({ loading: false })
    }
  },

  enrichMessages(messages) {
    return messages.map(m => ({
      ...m,
      isRead: m.is_read || m.status === 1,
      typeClass: this.getMessageTypeClass(m.type),
      time: this.formatTime(m.created_at)
    }))
  },

  getMessageTypeClass(type) {
    const map = { order: 'order', system: 'system', finance: 'finance' }
    return map[type] || ''
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const d = new Date(timeStr.replace(' ', 'T'))
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return d.getMonth() + 1 + '月' + d.getDate() + '日'
  },

  setFallbackData() {
    const msgs = [
      { id: 1, title: '新订单 #SO20260723001', content: '用户张三预约了深度保洁服务', type: 'order', status: 0, created_at: '2026-07-23 10:30' },
      { id: 2, title: '系统升级通知', content: '系统将于今晚22:00进行例行维护，预计耗时30分钟', type: 'system', status: 0, created_at: '2026-07-23 09:00' },
      { id: 3, title: '佣金到账 ¥158.00', content: '订单 #SO20260720045 已完成，佣金已结算至钱包', type: 'finance', status: 1, created_at: '2026-07-20 15:20' },
    ]
    this.setData({ messages: this.enrichMessages(msgs) })
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ activeTab: idx })
    
    const value = this.data.tabs[idx].value
    if (value) {
      const filtered = this.data.messages.filter(m => m.type === value)
      this.setData({ messages: filtered })
    } else {
      this.loadMessages()
    }
  },

  markAsRead(e) {
    const msgId = e.currentTarget.dataset.id
    
    // Update local display immediately
    const msgs = this.data.messages.map(m => 
      m.id === msgId ? { ...m, isRead: true } : m
    )
    this.setData({ messages: msgs })

    // Send to server
    api.markNotificationRead(msgId).catch(err => {
      console.error('标记已读失败:', err)
    })
  },

  markAllRead() {
    const msgs = this.data.messages.map(m => ({ ...m, isRead: true }))
    this.setData({ messages: msgs })
    
    api.markAllNotificationsRead().catch(() => {})
  }
})
