const api = require('../../../utils/api');

Page({
  data: {
    merchant: {},
    certStatusText: '待审核',
    wallet: { balance: 0 },
    stats: { totalOrders: 0, todayOrders: 0, monthRevenue: 0 }
  },

  onLoad() {
    this.loadProfile();
  },

  // 加载商户资料
  async loadProfile() {
    try {
      const token = wx.getStorageSync('rider_token') || wx.getStorageSync('merchant_token');
      if (!token) {
        return wx.showToast({ title: '请先登录', icon: 'none' });
      }

      const user = JSON.parse(wx.getStorageSync('user_info') || '{}');
      if (!user.merchant_id) {
        return wx.showToast({ title: '非商户账号', icon: 'none' });
      }

      const res = await api.getMerchantProfile(user.merchant_id);
      
      if (res.code === 0) {
        const m = res.data;
        
        // 认证状态文本映射
        const certMap = { 0: '未提交', 1: '待审核', 2: '已通过', 3: '已驳回' };
        
        this.setData({
          merchant: m,
          certStatusText: certMap[m.cert_status] || '未知'
        });
      }
    } catch (e) {
      console.error('加载资料失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 输入事件
  onNameInput(e) { this.setData({ 'merchant.name': e.detail.value }); },
  onContactInput(e) { this.setData({ 'merchant.contact': e.detail.value }); },
  onPhoneInput(e) { this.setData({ 'merchant.phone': e.detail.value }); },
  onAddressInput(e) { this.setData({ 'merchant.address': e.detail.value }); },
  onDescInput(e) { this.setData({ 'merchant.description': e.detail.value }); },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // TODO: 上传到OSS，这里先更新本地预览
        this.setData({ 'merchant.avatar': res.tempFiles[0].tempFilePath });
        wx.showToast({ title: '图片已选择', icon: 'none' });
      }
    });
  },

  // 上传营业执照
  uploadLicense() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ 'merchant.business_license': res.tempFiles[0].tempFilePath });
        wx.showLoading({ title: '上传中...' });
        // TODO: 调用上传API
      }
    });
  },

  // 上传身份证
  uploadIdCard() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ 'merchant.id_card': res.tempFiles[0].tempFilePath });
        wx.showLoading({ title: '上传中...' });
        // TODO: 调用上传API
      }
    });
  },

  // 修改密码
  editPassword() {
    wx.navigateTo({ url: '/pages/merchant/edit-password/edit-password' });
  },

  // 消息通知开关
  onNotifyChange(e) {
    const enabled = e.detail.value;
    this.setData({ 'merchant.notification_enabled': enabled });
    
    api.updateMerchant(this.getCurrentMerchantId(), { notification_enabled: enabled }).then(res => {
      if (res.code !== 0) {
        this.setData({ 'merchant.notification_enabled': !enabled });
      }
    }).catch(() => {
      this.setData({ 'merchant.notification_enabled': !enabled });
    });
  },

  // 隐私政策
  openPrivacy() {
    wx.navigateTo({ url: '/pages/merchant/privacy/privacy' });
  },

  // 保存资料
  saveProfile() {
    const m = this.data.merchant;
    
    // 基础校验
    if (!m.name || !m.name.trim()) {
      return wx.showToast({ title: '请填写商户名称', icon: 'none' });
    }
    if (!m.contact || !m.contact.trim()) {
      return wx.showToast({ title: '请填写联系人', icon: 'none' });
    }
    if (!m.phone || !/^1\d{10}$/.test(m.phone)) {
      return wx.showToast({ title: '请填写正确手机号', icon: 'none' });
    }

    wx.showLoading({ title: '保存中...' });
    
    api.updateMerchant(this.getCurrentMerchantId(), {
      name: m.name,
      contact: m.contact,
      phone: m.phone,
      address: m.address,
      description: m.description
    }).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.loadProfile();
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络异常', icon: 'none' });
    });
  },

  getCurrentMerchantId() {
    const user = JSON.parse(wx.getStorageSync('user_info') || '{}');
    return user.merchant_id || '';
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('merchant_token');
          wx.removeStorageSync('user_info');
          wx.removeStorageSync('orders');
          wx.reLaunch({ url: '/pages/mine/mine' });
        }
      }
    });
  }
});
