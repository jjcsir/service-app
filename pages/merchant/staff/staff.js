const api = require('../../../utils/api')

Page({
  data: {
    staffList: [],
    showForm: false,
    isEdit: false,
    loading: false,
    staffForm: { name: '', phone: '', role: '' },
    roleOptions: ['普通店员', '店长', '财务'],
    roleIndex: 0
  },

  onLoad() {
    this.loadStaff()
  },

  onShow() {
    this.loadStaff()
  },

  loadStaff() {
    const merchantId = wx.getStorageSync('merchantId')
    if (!merchantId) return
    api.getStaffList(merchantId).then(res => {
      if (res.code === 0) {
        this.setData({ staffList: res.data.staff || [] })
      }
    }).catch(() => {})
  },

  showAddStaff() {
    this.setData({
      showForm: true,
      isEdit: false,
      staffForm: { name: '', phone: '', role: '' },
      roleIndex: 0
    })
  },

  editStaff(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const s = this.data.staffList.find(x => x.id === id)
    if (!s) return
    const idx = this.data.roleOptions.indexOf(s.role || '普通店员')
    this.setData({
      showForm: true,
      isEdit: true,
      staffForm: { ...s },
      roleIndex: idx >= 0 ? idx : 0
    })
  },

  cancelForm() {
    this.setData({ showForm: false })
  },

  onRoleChange(e) {
    this.setData({ roleIndex: parseInt(e.detail.value) })
  },

  submitForm() {
    const { name, phone, role } = this.data.staffForm
    if (!name || !name.trim()) {
      return wx.showToast({ title: '请输入姓名', icon: 'none' })
    }
    this.setData({ loading: true })
    const merchantId = wx.getStorageSync('merchantId')
    const payload = { merchant_id: merchantId, name: name.trim(), phone, role }
    if (this.data.isEdit) {
      payload.id = this.data.staffForm.id
      api.updateStaff(payload.id, payload).then(res => {
        this.setData({ loading: false, showForm: false })
        if (res.code === 0) {
          wx.showToast({ title: '更新成功', icon: 'success' })
          this.loadStaff()
        }
      }).catch(() => { this.setData({ loading: false }) })
    } else {
      api.addStaff(payload).then(res => {
        this.setData({ loading: false, showForm: false })
        if (res.code === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' })
          this.loadStaff()
        }
      }).catch(() => { this.setData({ loading: false }) })
    }
  },

  deleteStaff(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除该店员？',
      success: r => {
        if (r.confirm) {
          api.deleteStaff(id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadStaff()
          }).catch(() => {})
        }
      }
    })
  },

  onNameInput(e) {
    this.setData({ 'staffForm.name': e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ 'staffForm.phone': e.detail.value })
  }
})
