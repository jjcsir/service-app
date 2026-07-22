Component({
  properties: {
    tabs: { type: Array, value: [] },
    activeTab: { type: Number, value: 0 }
  },
  methods: {
    onTab(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({ activeTab: index });
      this.triggerEvent('change', { index });
    }
  }
})
