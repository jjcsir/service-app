const api = require('../../../utils/api')

Page({
  data: {
    merchantName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: false,
    orderNotify: true,
    systemNotify: false,
    financeNotify: true,
    theme: 'light',
    language: 'zh-CN'
  },

  onLoad() {
    this.loadSettings()
  },

  async loadSettings() {
    try {
      const res = await api.getMerchantSettings()
      if (res.data) {
        this.setData({
          merchantName: res.data.name || '',
          contactPhone: res.data.phone || '',
          contactEmail: res.data.email || '',
          address: res.data.address || '',
          pushEnabled: res.data.push_enabled !== false,
          soundEnabled: res.data.sound_enabled !== false,
          vibrationEnabled: res.data.vibration_enabled === true,
          orderNotify: res.data.order_notify !== false,
          systemNotify: res.data.system_notify === true,
          financeNotify: res.data.finance_notify !== false,
          theme: res.data.theme || 'light',
          language: res.data.language || 'zh-CN'
        })
      }
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  },

  // ── 输入框变化 ──
  onNameInput(e) { this.setData({ merchantName: e.detail.value }) },
  onPhoneInput(e) { this.setData({ contactPhone: e.detail.value }) },
  onEmailInput(e) { this.setData({ contactEmail: e.detail.value }) },
  onAddressInput(e) { this.setData({ address: e.detail.value }) },

  // ── Switch 开关切换 ──
  onPushToggle(e) { this.setData({ pushEnabled: e.detail.value }) },
  onSoundToggle(e) { this.setData({ soundEnabled: e.detail.value }) },
  onVibrateToggle(e) { this.setData({ vibrationEnabled: e.detail.value }) },
  onOrderNotifyToggle(e) { this.setData({ orderNotify: e.detail.value }) },
  onSystemNotifyToggle(e) { this.setData({ systemNotify: e.detail.value }) },
  onFinanceNotifyToggle(e) { this.setData({ financeNotify: e.detail.value }) },

  // ── 保存设置 ──
  saveSettings() {
    const settings = {
      name: this.data.merchantName,
      phone: this.data.contactPhone,
      email: this.data.contactEmail,
      address: this.data.address,
      push_enabled: this.data.pushEnabled,
      sound_enabled: this.data.soundEnabled,
      vibration_enabled: this.data.vibrationEnabled,
      order_notify: this.data.orderNotify,
      system_notify: this.data.systemNotify,
      finance_notify: this.data.financeNotify,
      theme: this.data.theme,
      language: this.data.language
    }

    wx.showLoading({ title: '保存中...' })
    api.updateMerchantSettings(settings).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // ── 退出登录 ──
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          api.removeToken()
          api.removeUserInfo()
          wx.reLaunch({ url: '/pages/mine/mine' })
        }
      }
    })
  }
})
