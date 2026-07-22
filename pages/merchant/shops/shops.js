const api = require('../../../utils/api')

Page({
  data: {
    shops: [],
    showForm: false,
    isEdit: false,
    loading: false,
    shopForm: { name: '', contact_phone: '', address: '', logo: '' },
  },

  onLoad() {
    this.loadShops()
  },

  onShow() {
    this.loadShops()
  },

  loadShops() {
    const token = wx.getStorageSync('token')
    if (!token) return
    const merchantId = wx.getStorageSync('merchantId')
    if (!merchantId) return
    api.getShops(merchantId).then(res => {
      if (res.code === 0) this.setData({ shops: res.data.shops || [] })
    }).catch(() => {})
  },

  showAddShop() {
    this.setData({ showForm: true, isEdit: false, shopForm: { name: '', contact_phone: '', address: '', logo: '' } })
  },

  editShop(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const shop = this.data.shops.find(s => s.id === id)
    if (!shop) return
    this.setData({ showForm: true, isEdit: true, shopForm: { ...shop } })
  },

  cancelForm() {
    this.setData({ showForm: false })
  },

  submitForm() {
    const { name, contact_phone, address, logo } = this.data.shopForm
    if (!name || !name.trim()) {
      return wx.showToast({ title: '请输入店铺名称', icon: 'none' })
    }

    this.setData({ loading: true })
    const merchantId = wx.getStorageSync('merchantId')
    const body = { merchant_id: merchantId, name: name.trim(), contact_phone, address, logo }

    if (this.data.isEdit) {
      api.updateShop(this.data.shopForm.id, body).then(res => {
        this.setData({ loading: false, showForm: false })
        if (res.code === 0) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          this.loadShops()
        }
      }).catch(() => { this.setData({ loading: false }) })
    } else {
      api.addShop(body).then(res => {
        this.setData({ loading: false, showForm: false })
        if (res.code === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.loadShops()
        }
      }).catch(() => { this.setData({ loading: false }) })
    }
  },

  deleteShop(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个店铺吗？',
      success: (res) => {
        if (res.confirm) {
          api.deleteShop(id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadShops()
          }).catch(() => {})
        }
      },
    })
  },

  chooseLogo() {
    wx.chooseImage({
      count: 1,
      success: (r) => {
        this.setData({ 'shopForm.logo': r.tempFilePaths[0] })
      },
    })
  },

  onNameInput(e) { this.setData({ 'shopForm.name': e.detail.value }) },
  onPhoneInput(e) { this.setData({ 'shopForm.contact_phone': e.detail.value }) },
  onAddressInput(e) { this.setData({ 'shopForm.address': e.detail.value }) },
})
