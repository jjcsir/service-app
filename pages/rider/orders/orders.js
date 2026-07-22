const api = require('../../../utils/api')

// Map tab text to status filter values matching server:
// tabs[0]='待接单' → status=0 (pending)
// tabs[1]='进行中' → show status=1,2 (assigned + in progress)
// tabs[2]='已完成' → status=3 (done)
const TAB_STATUS_MAP = {
  0: '',     // show all pending (status 0)
  1: '',     // all doing — will filter client side
  2: '',     // completed — will filter client side
}

Page({
  data: {
    tabs: ['待接单', '进行中', '已完成'],
    activeTab: 0,
    orders: []
  },

  onLoad() {
    const pages = getCurrentPages()
    const curr = pages[pages.length - 1]
    if (curr && curr.options && curr.options.status !== undefined) {
      const statusMap = { '': 0, '0': 0, 'pending': 0, '1': 1, 'doing': 1, '3': 2, 'done': 2 }
      const idx = statusMap[curr.options.status]
      if (idx !== undefined) this.setData({ activeTab: idx })
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.index })
    this.loadOrders()
  },

  async loadOrders() {
    const token = api.getToken()
    if (!token) {
      this.setData({ orders: [] })
      return
    }

    try {
      let res
      if (this.data.activeTab === 0) {
        // 待接单: status=0
        res = await api.myOrders({ status: '0' })
      } else if (this.data.activeTab === 1) {
        // 进行中: status=1,2
        const doingRes = await Promise.all([
          api.myOrders({ status: '1' }).catch(() => ({ data: { orders: [] } })),
          api.myOrders({ status: '2' }).catch(() => ({ data: { orders: [] } }))
        ])
        const allDoing = [
          ...(doingRes[0].data?.orders || []),
          ...(doingRes[1].data?.orders || [])
        ]
        res = { data: { orders: allDoing, total: allDoing.length } }
      } else {
        // 已完成: status=3,4
        const doneRes = await Promise.all([
          api.myOrders({ status: '3' }).catch(() => ({ data: { orders: [] } })),
          api.myOrders({ status: '4' }).catch(() => ({ data: { orders: [] } }))
        ])
        const allDone = [
          ...(doneRes[0].data?.orders || []),
          ...(doneRes[1].data?.orders || [])
        ]
        res = { data: { orders: allDone, total: allDone.length } }
      }

      if (res && res.data && res.data.orders) {
        const orders = res.data.orders.map(o => ({
          ...o,
          statusText: this._statusText(o.status),
          statusCls: this._statusClass(o.status),
          statusIdx: parseInt(o.status) || 0
        }))
        this.setData({ orders })
      }
    } catch (err) {
      console.error('加载订单失败:', err)
      this.setData({ orders: [] })
    }
  },

  _statusText(status) {
    const map = { '0': '待接单', '1': '已接单', '2': '配送中', '3': '送货中', '4': '已完成', 0: '待接单', 1: '已接单', 2: '配送中', 3: '送货中', 4: '已完成' }
    return map[status] || '未知'
  },

  _statusClass(status) {
    const clsMap = { '0': 'status-pending', '1': 'status-accepted', '2': 'status-delivering', '3': 'status-delivering', '4': 'status-done', 0: 'status-pending', 1: 'status-accepted', 2: 'status-delivering', 3: 'status-delivering', 4: 'status-done' }
    return clsMap[status] || ''
  },

  handleAction(id, action) {
    api.updateOrderStatus(id, action).then(() => {
      wx.showToast({ title: '操作成功', icon: 'success' })
      this.loadOrders()
    }).catch(err => {
      console.error('更新订单状态失败:', err)
    })
  },

  onPickup(e) {
    const id = e.currentTarget.dataset.id
    this.handleAction(id, 'pickup')
  },

  onDeliver(e) {
    const id = e.currentTarget.dataset.id
    this.handleAction(id, 'deliver')
  },

  onComplete(e) {
    const id = e.currentTarget.dataset.id
    this.handleAction(id, 'complete')
  }
})
