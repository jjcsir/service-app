const api = require('../../../utils/api')

Page({
  data: {
    orders: [],
    loading: false,
    hasMore: true,
    page: 1,
    perPage: 20,
    keyword: '',
    activeTab: 0,
    orderCounts: { all: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 }
  },

  onLoad(options) {
    this.merchantId = options.merchantId || ''
    this.loadOrders()
  },

  onShow() {
    // 每次显示都刷新数据
    if (this.data.orders.length === 0) {
      this.loadOrders()
    }
  },

  // 切换状态标签页
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ activeTab: index })
    this.resetAndLoad()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 执行搜索
  onSearch() {
    this.resetAndLoad()
  },

  // 重置分页并重新加载
  resetAndLoad() {
    this.setData({ page: 1, hasMore: true })
    this.loadOrders()
  },

  // 加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    const nextPage = this.data.page + 1
    this.setData({ page: nextPage })
    this.loadOrders(true)
  },

  // 核心：加载订单列表
  async loadOrders(append = false) {
    if (this.data.loading) return
    
    const { merchantId, page, perPage, keyword, activeTab } = this.data
    if (!merchantId) {
      console.error('商户ID未设置，请在跳转时携带 merchantId 参数')
      wx.showToast({ title: '商户信息缺失', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const params = { page, perPage, keyword }
      
      let status = null
      switch (activeTab) {
        case 1: status = 0  // 待处理
          break
        case 2: status = 1  // 进行中
          break
        case 3: status = 3  // 已完成（后端用不同状态值）
          break
        case 4: status = 4  // 已取消
          break
        default: status = null // 全部
      }
      if (status !== null) params.status = status

      const res = await api.getMerchantOrders(merchantId, params)

      if (res.code === 0) {
        const list = res.data.orders || []
        const totalCount = res.data.total || 0
        
        const orders = append ? [...this.data.orders, ...list] : list
        const hasMore = orders.length < totalCount

        // 计算各状态数量
        const allOrders = res.data.allOrders || list
        const counts = this._calcOrderCounts(allOrders)

        this.setData({
          orders,
          hasMore,
          loading: false,
          orderCounts: counts
        })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载商户订单失败:', err)
      if (!append) {
        this.setData({ loading: false, orders: [], hasMore: false })
      }
    }
  },

  // 计算各状态订单数
  _calcOrderCounts(orders) {
    const counts = { all: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 }
    counts.all = orders.length
    for (const o of orders) {
      switch (o.status) {
        case 0: counts.pending++ break
        case 1: case 2: counts.inProgress++ break
        case 3: counts.completed++ break
        case 4: counts.cancelled++ break
      }
    }
    return counts
  },

  // 确认接单
  onConfirmOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认接单',
      content: '确定要接这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.requestPayment({ /* 微信支付配置 */ })
        }
      }
    })
  },

  // 开始服务
  onStartService(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '已开始服务', icon: 'success' })
    // TODO: 调用 API 更新订单状态
  },

  // 标记完成
  onCompleteOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认完成',
      content: '订单已完成，是否确认？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '订单已完成', icon: 'success' })
        }
      }
    })
  },

  // 取消订单
  onCancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '取消订单后将通知用户，确认取消？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已取消', icon: 'none' })
        }
      }
    })
  },

  // 获取状态文本
  statusText(status) {
    const map = { 0: '待处理', 1: '进行中', 2: '配送中', 3: '已完成', 4: '已取消' }
    return map[status] || '未知'
  },

  // 获取状态样式类名
  statusClass(status) {
    const map = { 0: 'status-pending', 1: 'status-processing', 2: 'status-processing', 3: 'status-completed', 4: 'status-cancelled' }
    return map[status] || ''
  }
})
