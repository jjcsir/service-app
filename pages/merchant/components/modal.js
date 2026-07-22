Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    hasFooter: { type: Boolean, value: true },
    cancelText: { type: String, value: '取消' },
    confirmText: { type: String, value: '确定' }
  },
  observers: {
    show(val) { console.log('modal show:', val) }
  },
  methods: {
    onClose() { this.triggerEvent('close') },
    onCancel() { this.triggerEvent('cancel') },
    onConfirm() { this.triggerEvent('confirm') },
    stopProp() {}
  }
})
