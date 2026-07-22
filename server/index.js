const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 初始化数据库
initDatabase();

// 路由
app.use('/', routes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务运行中', timestamp: new Date().toISOString() });
});

// 启动
app.listen(PORT, () => {
  console.log(`\n🚀 后端服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   API文档: http://localhost:${PORT}/api/health\n`);
});
