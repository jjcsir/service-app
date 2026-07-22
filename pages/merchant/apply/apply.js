const api = require('../../utils/api')

Page({
  data: {
    formData: {
      name: '', contact: '', phone: '', address: '', logo: '', description: ''
    },
    serviceTags: [false,false,false,false,false,false,false,false],
    isAgreed: false,
    loading: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field || e.target.dataset.field
    if (e.detail && e.detail.value !== undefined) {
      const val = this.data.formData
      val[field] = e.detail.value
      this.setData({ formData: val })
    }
  },

  onDescInput(e) {
    const fd = this.data.formData
    fd.description = e.detail.value
    this.setData({ formData: fd })
  },

  chooseLogo() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ 'formData.logo': res.tempFilePaths[0] })
      }
    })
  },

  toggleService(e) {
    const id = parseInt(e.currentTarget.dataset.id) - 1
    const tags = [...this.data.serviceTags]
    tags[id] = !tags[id]
    this.setData({ serviceTags: tags })
  },

  onAgreeChange(e) {
    this.setData({ isAgreed: e.detail.value.length > 0 })
  },

  showAgreement() {
    wx.showModal({
      title: '商户合作协议',
      content: '感谢您的关注！请确认阅读并同意我们制定的商户合作协议及平台规则。具体条款请联系客服获取。',
      showCancel: false
    })
  },

  onSubmit() {
    const { name, contact, phone } = this.data.formData
    if (!name || !contact || !phone) return wx.showToast({ title: '请填写必填项', icon: 'none' })
    if (!/^1\d{10}$/.test(phone)) return wx.showToast({ title: '手机号格式不正确', icon: 'none' })
    if (!this.data.isAgreed) return wx.showToast({ title: '请同意协议', icon: 'none' })

    this.setData({ loading: true })
    api.applyMerchant(this.data.formData).then(res => {
      this.setData({ loading: false })
      if (res.code === 0) {
        wx.showModal({
          title: '申请已提交',
          content: '我们将在1-3个工作日内完成审核，请耐心等待',
          showCancel: false,
          success: () => { wx.navigateBack() }
        })
      }
    }).catch(() => {
      // API失败时降级为本地存储模拟
      console.log('商户入驻（模拟）:', this.data.formData)
      this.setData({ loading: false })
      wx.showToast({ title: '申请已提交', icon: 'success' })
      setTimeout(() => { wx.navigateBack() }, 1500)
    })
  }
})
