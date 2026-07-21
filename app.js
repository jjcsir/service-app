App({
  globalData: {
    userInfo: null,
    services: [
      { id: 1, name: '深度保洁', icon: '/images/clean.png', price: 199, category: '家政' },
      { id: 2, name: '家电清洗', icon: '/images/ac.png', price: 158, category: '清洗' },
      { id: 3, name: '管道疏通', icon: '/images/pipe.png', price: 120, category: '维修' },
      { id: 4, name: '家电维修', icon: '/images/repair.png', price: 200, category: '维修' },
      { id: 5, name: '搬家服务', icon: '/images/move.png', price: 500, category: '搬家' },
      { id: 6, name: '美甲美睫', icon: '/images/beauty.png', price: 98, category: '美容' },
    ],
    categories: [
      { id: 1, name: '家政保洁', icon: '/images/clean.png' },
      { id: 2, name: '家电维修', icon: '/images/repair.png' },
      { id: 3, name: '管道疏通', icon: '/images/pipe.png' },
      { id: 4, name: '搬家服务', icon: '/images/move.png' },
      { id: 5, name: '美甲美睫', icon: '/images/beauty.png' },
      { id: 6, name: '空调清洗', icon: '/images/ac.png' },
      { id: 7, name: '甲醛治理', icon: '/images/formaldehyde.png' },
      { id: 8, name: '开锁换锁', icon: '/images/lock.png' },
    ],
    banners: [
      '/images/banner1.png',
      '/images/banner2.png',
      '/images/banner3.png'
    ]
  },

  onLaunch() {
    console.log('小程序启动')
  }
})
