const api = require('../../../../utils/api')

Page({
  data: {
    realname: '',
    phone: '',
    idCardFront: [],
    vehicleType: '电动车',
    vehicleTypes: ['电动车', '摩托车', '汽车'],
    submitting: false
  },

  onLoad() {
    // Pre-fill phone from user info if available
    const userInfo = api.getUserInfo()
    if (userInfo.phone) {
      this.setData({ phone: userInfo.phone })
    }
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onVehicleTypeChange(e) {
    this.setData({ vehicleType: e.detail.value })
  },

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          idCardFront: res.tempFilePaths
        })
      }
    })
  },

  async onSubmit() {
    const { realname, phone, idCardFront, vehicleType } = this.data

    // Basic validation
    if (!realname || !realname.trim()) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!vehicleType) {
      wx.showToast({ title: '请选择交通工具类型', icon: 'none' })
      return
    }

    // Get existing token/user info for linking
    const userToken = api.getToken()
    const userInfo = api.getUserInfo()

    this.setData({ submitting: true })
    wx.showLoading({ title: '注册中...' })

    try {
      const registerData = {
        realname: realname.trim(),
        phone,
        vehicle_type: vehicleType,
      }

      // If we have an existing user account, link by openid
      if (userInfo.openid) {
        registerData.openid = userInfo.openid
      }

      // ID card front is optional — include file path if selected
      if (idCardFront && idCardFront.length > 0) {
        registerData.id_card_front = idCardFront[0]
      }

      // Step 1: Register as rider
      await api.riderRegister(registerData)

      // Step 2: Login as rider to get rider token
      const loginRes = await api.riderLogin({ phone })
      if (loginRes && loginRes.token) {
        api.setToken(loginRes.token)
      }

      wx.hideLoading()
      wx.showToast({ title: '注册成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/rider/home/home' })
      }, 1500)
    } catch (err) {
      console.error('骑手注册失败:', err)
      wx.hideLoading()
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
