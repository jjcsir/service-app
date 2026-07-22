Component({
  properties: {
    title: { type: String, value: '' },
    actionText: { type: String, value: '' },
    showTitle: { type: Boolean, value: true },
    className: { type: String, value: '' },
    customStyle: { type: String, value: '' }
  },
  methods: {
    onAction() { this.triggerEvent('action') }
  }
})
