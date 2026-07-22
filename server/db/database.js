const ds = require('./datastore');

module.exports = {
  db: ds,
  initDatabase() {
    ds.load();
    console.log('✅ 数据库初始化完成');
    
    // Seed data on first run
    if (!ds.db.categories || ds.db.categories.length === 0) {
      seedData();
    }
  },
  // Convenience methods matching controller expectations
  exec(sql) {} // No-op for compatibility
};

function seedData() {
  const { insert } = ds;
  
  const categories = [
    ['家政保洁', '/images/clean.png'],
    ['家电维修', '/images/repair.png'],
    ['管道疏通', '/images/pipe.png'],
    ['搬家服务', '/images/move.png'],
    ['美甲美睫', '/images/beauty.png'],
    ['空调清洗', '/images/ac.png'],
    ['甲醛治理', '/images/formaldehyde.png'],
    ['开锁换锁', '/images/lock.png'],
  ];
  
  for (const [name, icon] of categories) {
    insert('categories', { name, icon, sort_order: categories.indexOf([name, icon]) });
  }
  
  const services = [
    [1, '深度保洁', '全屋深度清洁', '/images/clean.png', 199],
    [1, '日常保洁', '日常打扫清洁', '/images/clean.png', 99],
    [1, '开荒保洁', '新房装修后首次清洁', '/images/clean.png', 299],
    [2, '洗衣机清洗', '滚筒/波轮洗衣机内筒清洗', '/images/repair.png', 158],
    [2, '冰箱清洗', '冰箱内部深度清洁除味', '/images/repair.png', 128],
    [2, '油烟机清洗', '厨房油烟机拆洗', '/images/repair.png', 168],
    [3, '马桶疏通', '各类马桶堵塞疏通', '/images/pipe.png', 120],
    [3, '下水道疏通', '地漏/洗手池/下水道疏通', '/images/pipe.png', 150],
    [4, '居民搬家', '小件家具搬移', '/images/move.png', 500],
    [4, '公司搬迁', '办公室整体搬迁', '/images/move.png', 2000],
    [5, '美甲单色', '单手指甲上色', '/images/beauty.png', 68],
    [5, '美甲彩绘', '复杂图案设计', '/images/beauty.png', 128],
    [5, '美睫', '假睫毛种植', '/images/beauty.png', 198],
    [6, '挂机清洗', '壁挂式空调清洗消毒', '/images/ac.png', 88],
    [6, '柜机清洗', '立式空调清洗消毒', '/images/ac.png', 128],
    [7, '除甲醛', '新房甲醛检测+治理', '/images/formaldehyde.png', 500],
    [8, '开锁', '快速上门开锁', '/images/lock.png', 80],
    [8, '换锁芯', '升级C级锁芯', '/images/lock.png', 200],
  ];
  
  for (const [catId, name, desc, icon, price] of services) {
    insert('services', { category_id: catId, name, description: desc, icon, price, sort_order: services.indexOf([catId, name]) + 1 });
  }
  
  const banners = [
    { image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=750&h=300&fit=crop', sort_order: 1 },
    { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=750&h=300&fit=crop', sort_order: 2 },
    { image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e2a3f?w=750&h=300&fit=crop', sort_order: 3 },
  ];
  
  for (const b of banners) insert('banners', b);
  
  const faqs = [
    ['预约流程是什么？', '选择服务项目 → 填写地址和时间 → 确认订单 → 等待骑手接单 → 服务完成后付款'],
    ['可以取消订单吗？', '骑手接单前可随时取消，全额退款。骑手接单后取消将收取20%违约金。'],
    ['支付方式有哪些？', '支持微信支付、余额支付。暂不支持现金支付。'],
    ['如何成为骑手？', '在骑手端APP提交注册申请，上传身份证和交通工具信息，审核通过后即可接单。'],
  ];
  
  for (const [q, a] of faqs) insert('faqs', { question: q, answer: a, sort_order: faqs.indexOf([q, a]) + 1 });
  
  console.log('📦 种子数据初始化完成');
}
