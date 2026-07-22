const ds = require('./datastore');

module.exports = { 
  db: ds,          // ds contains getAll, insert, getByField, etc.
  initDatabase() {
    ds.load();
    console.log('✅ 数据库初始化完成');
    
    // Seed on first run
    if (!ds.db.categories || ds.db.categories.length === 0) seedData();
    else if (ds.db.services && ds.db.services.length > 0) {
      // Ensure is_active on existing data
      for (const cat of ds.db.categories) if (cat.is_active === undefined) cat.is_active = 1;
      for (const svc of ds.db.services) if (svc.is_active === undefined) svc.is_active = 1;
    }
  }
};

function seedData() {
  const { insert } = ds;
  
  const categories = [
    ['家政保洁','/images/clean.png'],['家电维修','/images/repair.png'],
    ['管道疏通','/images/pipe.png'],['搬家服务','/images/move.png'],
    ['美甲美睫','/images/beauty.png'],['空调清洗','/images/ac.png'],
    ['甲醛治理','/images/formaldehyde.png'],['开锁换锁','/images/lock.png'],
  ];
  for (const [name, icon] of categories) insert('categories', { name, icon, sort_order: categories.indexOf([name,icon]), is_active: 1 });
  
  const services = [
    [1,'深度保洁','全屋深度清洁',199],[1,'日常保洁','日常打扫清洁',99],[1,'开荒保洁','新房首次清洁',299],
    [2,'洗衣机清洗','内筒清洗消毒',158],[2,'冰箱清洗','内部深度清洁除味',128],[2,'油烟机清洗','拆洗消毒',168],
    [3,'马桶疏通','各类马桶堵塞疏通',120],[3,'下水道疏通','地漏洗手池疏通',150],
    [4,'居民搬家','小件家具搬移',500],[4,'公司搬迁','办公室整体搬迁',2000],
    [5,'美甲单色','单手指甲上色',68],[5,'美甲彩绘','复杂图案设计',128],[5,'美睫','假睫毛种植',198],
    [6,'挂机清洗','壁挂式空调清洗消毒',88],[6,'柜机清洗','立式空调清洗消毒',128],
    [7,'除甲醛','新房甲醛检测+治理',500],
    [8,'开锁','快速上门开锁',80],[8,'换锁芯','升级C级锁芯',200],
  ];
  for (let i=0; i<services.length; i++) {
    const [cid,name,desc,price] = services[i];
    insert('services', { category_id: cid, name, description: desc, price, sort_order: i+1, is_active: 1 });
  }
  
  for (let i=1; i<=3; i++) insert('banners', { image: `https://images.unsplash.com/photo-${[1581578731548,1558618666,1628177142898][i-1]}?w=750&h=300&fit=crop`, sort_order: i, is_active: 1 });
  
  const faqs = [
    ['预约流程是什么？','选择服务项目 → 填写地址和时间 → 确认订单 → 等待骑手接单'],
    ['可以取消订单吗？','骑手接单前可随时取消，全额退款。接单后收取20%违约金。'],
    ['支付方式有哪些？','支持微信支付、余额支付。'],
    ['如何成为骑手？','在骑手端APP提交注册申请，上传身份证和交通工具信息，审核通过后即可接单。'],
  ];
  for (let i=0; i<faqs.length; i++) insert('faqs', { question: faqs[i][0], answer: faqs[i][1], sort_order: i+1 });
  
  console.log('📦 种子数据初始化完成');
}
