# 📖 上门服务小程序 - 文件说明手册

> 老板专用，每个文件干什么、怎么改，一目了然！

---

## 📁 项目结构

```
New project/
├── app.js              ← 小程序入口（全局配置）
├── app.json            ← 小程序配置（页面路由、tabBar）
├── app.wxss            ← 全局样式（公共CSS）
├── sitemap.json        ← 站点地图配置
├── pages/
│   ├── index/          ← 首页
│   ├── book/           ← 预约页
│   ├── order/          ← 订单页
│   └── mine/           ← 个人中心
└── images/             ← 图片资源（待补充）
```

---

## 📄 每个文件详细说明

### 1️⃣ app.json — 小程序总配置

**作用：** 控制整个小程序的页面路由、导航栏、底部 tab 栏

**怎么改：**

```json
{
  "pages": [
    "pages/index/index",    // 首页
    "pages/book/book",      // 预约页
    "pages/order/order",    // 订单页
    "pages/mine/mine"       // 个人中心
  ],
  "window": {
    "navigationBarBackgroundColor": "#FF6B35",  // 导航栏背景色（橙色）
    "navigationBarTitleText": "上门好服务",       // 标题文字
    "navigationBarTextStyle": "white"             // 标题颜色（white/black）
  },
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",  // 首页路径
        "text": "首页"                      // 底部标签文字
      },
      {
        "pagePath": "pages/order/order",  // 订单页路径
        "text": "订单"
      },
      {
        "pagePath": "pages/mine/mine",    // 个人中心路径
        "text": "我的"
      }
    ]
  }
}
```

**改标题：** 改 `navigationBarTitleText`
**改颜色：** 改 `navigationBarBackgroundColor`（用16进制颜色码）
**加页面：** 在 `pages` 数组加一行 `"pages/新页面/新页面"`

---

### 2️⃣ app.js — 全局逻辑

**作用：** 存放全局数据、生命周期函数

**怎么改：**

```javascript
// 修改服务数据（首页显示的服务）
globalData: {
  services: [
    { id: 1, name: '深度保洁', price: 199, category: '家政' },
    // ↑ 加一个新服务，复制上面一行改名字和价格就行
  ],
  categories: [
    { id: 1, name: '家政保洁' },
    // ↑ 加一个分类，同上
  ]
}
```

**加服务：** 在 `services` 数组加一行 `{ id: 数字, name: '名字', price: 价格 }`
**改分类：** 在 `categories` 数组加一行 `{ id: 数字, name: '分类名' }`

---

### 3️⃣ app.wxss — 全局样式

**作用：** 所有页面通用的 CSS 样式

**怎么改：**

```css
/* 改全局字体大小 */
page { font-size: 28rpx; }

/* 改全局背景色 */
page { background-color: #F5F5F5; }
```

**rpx 单位：** 微信小程序自适应单位，750rpx = 屏幕宽度
**改颜色：** 用 16 进制颜色码，如 `#FF6B35`（橙色）、`#333333`（深灰）

---

### 4️⃣ pages/index/index.wxml — 首页布局

**作用：** 首页的 HTML 结构

**包含内容：**
- 搜索框（第4行 `input`）
- 轮播图（第8行 `swiper`）
- 服务分类网格（第14行 `category-grid`）
- 热门推荐列表（第22行 `service-list`）

**怎么改：**

```html
<!-- 改搜索框提示文字 -->
<input placeholder="搜索服务项目" />  <!-- 改引号里的字 -->

<!-- 改轮播图图片 -->
<image src="https://xxx.com/图片地址.jpg" />  <!-- 改src里的链接 -->

<!-- 改分类名称 -->
<text class="cat-name">{{item.name}}</text>  <!-- 名称来自 app.js 的 categories -->
```

**改文字：** 找到对应 `<text>` 标签，改里面的文字
**改图片：** 找到 `<image>` 标签，改 `src` 属性

---

### 5️⃣ pages/index/index.wxss — 首页样式

**作用：** 首页的 CSS 样式

**怎么改：**

```css
/* 改搜索框圆角 */
.search-bar { border-radius: 40rpx; }

/* 改轮播图高度 */
.banner { height: 300rpx; }

/* 改分类图标大小 */
.cat-icon { width: 80rpx; height: 80rpx; }

/* 改服务卡片间距 */
.service-card { margin-bottom: 20rpx; }
```

**常用属性：**
- `width/height` — 宽高
- `padding` — 内边距（元素内部留白）
- `margin` — 外边距（元素外部间距）
- `border-radius` — 圆角
- `background-color` — 背景色
- `font-size` — 字体大小
- `color` — 字体颜色

---

### 6️⃣ pages/book/book.wxml — 预约页布局

**作用：** 预约页面的 HTML 结构

**包含内容：**
- 服务信息卡片（顶部显示选中的服务）
- 日期选择器（横向滚动）
- 时段选择器（网格排列）
- 地址输入框
- 备注输入框
- 费用明细
- 底部提交按钮

**怎么改：**

```html
<!-- 改日期格式 -->
<text class="date-day">{{item.day}}</text>  <!-- 显示几号 -->

<!-- 改时段 -->
<!-- 时段来自 book.js 的 timeSlots 数组 -->

<!-- 改费用显示 -->
<text class="total-price">¥{{service.price}}</text>  <!-- 总价 -->

<!-- 改按钮文字 -->
<button class="submit-btn">立即预约</button>  <!-- 改引号里的字 -->
```

---

### 7️⃣ pages/book/book.js — 预约页逻辑

**作用：** 预约页的 JavaScript 逻辑

**怎么改：**

```javascript
// 修改时段
data: {
  timeSlots: [
    '09:00-10:00',
    '10:00-11:00',
    // ↑ 加一个时段，复制一行改时间
  ]
}

// 修改预约成功后的跳转
wx.switchTab({ url: '/pages/order/order' })  // 跳转到订单页
```

---

### 8️⃣ pages/order/order.wxml — 订单页布局

**作用：** 订单列表的 HTML 结构

**怎么改：**

```html
<!-- 改空状态提示 -->
<view class="empty-tip" wx:if="{{orders.length == 0}}">
  <text>暂无订单</text>  <!-- 改这里的文字 -->
</view>

<!-- 改订单状态文字 -->
<text class="order-status">{{item.status}}</text>  <!-- 状态来自 book.js -->
```

---

### 9️⃣ pages/mine/mine.wxml — 个人中心布局

**作用：** 个人中心的 HTML 结构

**包含内容：**
- 用户头像和昵称
- 订单统计（全部/待确认/进行中/已完成）
- 功能菜单（地址、收藏、优惠券、帮助、客服、设置）

**怎么改：**

```html
<!-- 改功能菜单文字 -->
<text class="menu-text">我的地址</text>  <!-- 改引号里的字 -->

<!-- 改功能图标 -->
<text class="menu-icon">📍</text>  <!-- 改 emoji 图标 -->

<!-- 改客服电话 -->
<!-- 在 mine.js 里找 goContact 函数 -->
```

---

## 🎨 常用修改速查表

### 改颜色

| 文件 | 位置 | 改什么 |
|------|------|--------|
| app.json | `navigationBarBackgroundColor` | 导航栏颜色 |
| app.wxss | `page { background-color }` | 全局背景色 |
| pages/*/mine.wxss | `.user-header { background }` | 个人中心渐变背景 |

**颜色代码：** `#FF6B35`（橙色）、`#333333`（黑色）、`#FFFFFF`（白色）

### 改文字

- 中文文字：在 `.wxml` 文件中找 `<text>` 标签，改引号里的内容
- 按钮文字：找 `<button>` 标签，改里面的文字

### 改图片

- 轮播图：`pages/index/index.wxml` 第8-11行，改 `src`
- 分类图标：`app.js` 的 `categories` 数组，改 `icon` 字段

### 加页面

1. 在 `pages/` 下新建文件夹，如 `pages/about/`
2. 新建4个文件：`about.wxml`、`about.js`、`about.wxss`、`about.json`
3. 在 `app.json` 的 `pages` 数组加一行 `"pages/about/about"`

---

## 📱 微信开发者工具使用

### 导入项目

1. 打开微信开发者工具
2. 点「+」新建项目
3. 选择项目目录：`~/Documents/New project`
4. AppID 选「测试号」（没有就用这个）
5. 点「确定」

### 预览效果

- 点顶部「预览」按钮
- 用微信扫码在手机上查看

### 真机调试

- 点顶部「真机调试」
- 手机扫码，实时看到改动效果

---

## 🔧 常见问题

### Q: 怎么改服务价格？
A: 打开 `app.js`，找到 `services` 数组，改 `price` 值

### Q: 怎么加新的服务分类？
A: 打开 `app.js`，找到 `categories` 数组，加一行 `{ id: 数字, name: '分类名', icon: '图片路径' }`

### Q: 怎么改底部标签文字？
A: 打开 `app.json`，找到 `tabBar.list`，改 `text` 的值

### Q: 怎么改导航栏标题？
A: 打开 `app.json`，找到 `window.navigationBarTitleText`

### Q: 怎么改主题颜色？
A: 全局搜索 `#FF6B35`，替换成你想要的颜色

---

## 📞 客服电话

在 `pages/mine/mine.js` 的 `goContact()` 函数里改：
```javascript
wx.makePhoneCall({ phoneNumber: '400-123-4567' })  // 改这个数字
```

---

*最后更新：2026年7月21日*
*版本：v1.0*
