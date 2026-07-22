// ==================== Global State ====================
let currentUser = null;
let currentSection = 'overview';

// ==================== Login ====================
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  
  try {
    const res = await authAPI.login(username, password);
    
    if (res.code === 0) {
      setToken(res.data.token || 'admin');
      currentUser = res.data.admin;
      
      document.getElementById('login-page').classList.add('hidden');
      document.getElementById('dashboard-page').classList.remove('hidden');
      
      loadDashboard();
      showToast('登录成功', 'success');
    } else {
      errorEl.textContent = res.message || '登录失败';
    }
  } catch (err) {
    errorEl.textContent = '网络错误，请检查后端服务';
  }
}

function logout() {
  authAPI.logout();
  currentUser = null;
  location.href = '/';
}

// ==================== Navigation ====================
function showSection(section) {
  currentSection = section;
  
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  // Show selected
  document.getElementById(`section-${section}`).classList.remove('hidden');
  
  // Update nav
  event.target.closest('.nav-item')?.classList.add('active');
  
  // Update title
  const titles = {
    overview: '数据概览',
    orders: '订单管理',
    riders: '骑手管理',
    services: '服务管理',
    users: '用户管理',
    merchants: '商户管理'
  };
  document.getElementById('page-title').textContent = titles[section] || '数据概览';
  
  // Load data
  switch (section) {
    case 'overview': loadDashboard(); break;
    case 'orders': loadOrders(); break;
    case 'riders': loadRiders(); break;
    case 'services': loadServices(); break;
    case 'users': loadUsers(); break;
    case 'merchants': loadMerchants(); break;
  }
}

// ==================== Dashboard ====================
async function loadDashboard() {
  try {
    // Get overview stats
    const [statsRes, ordersRes] = await Promise.all([
      dashboardAPI.getOverview(),
      dashboardAPI.getOrderStats()
    ]);
    
    const stats = statsRes?.data || {};
    
    // Update stat cards
    animateNumber('total-orders', stats.totalOrders || 0);
    animateNumber('total-users', stats.totalUsers || 0);
    animateNumber('total-riders', stats.totalRiders || 0);
    document.getElementById('today-revenue').textContent = formatMoney(stats.todayRevenue || 0);
    
    // Order status distribution
    const orderList = ordersRes?.data?.orders || [];
    const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    
    orderList.forEach(o => {
      if (statusCounts.hasOwnProperty(o.status)) {
        statusCounts[o.status]++;
      }
    });
    
    const total = orderList.length || 1;
    document.getElementById('count-pending').textContent = statusCounts[0];
    document.getElementById('count-dispatched').textContent = statusCounts[1];
    document.getElementById('count-doing').textContent = statusCounts[2];
    document.getElementById('count-completed').textContent = statusCounts[3];
    document.getElementById('count-cancelled').textContent = statusCounts[4];
    
    document.getElementById('status-pending').style.width = `${(statusCounts[0]/total)*100}%`;
    document.getElementById('status-dispatched').style.width = `${(statusCounts[1]/total)*100}%`;
    document.getElementById('status-doing').style.width = `${(statusCounts[2]/total)*100}%`;
    document.getElementById('status-completed').style.width = `${(statusCounts[3]/total)*100}%`;
    document.getElementById('status-cancelled').style.width = `${(statusCounts[4]/total)*100}%`;
    
    // Recent orders table
    const tbody = document.querySelector('#recent-orders tbody');
    const recent = orderList.slice(0, 5);
    
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">暂无订单</td></tr>';
    } else {
      tbody.innerHTML = recent.map(o => `
        <tr>
          <td>${o.order_no || o.id}</td>
          <td>${o.service_name || '-'}</td>
          <td>${formatMoney(o.paid_amount)}</td>
          <td>${getStatusBadge(o.status)}</td>
        </tr>
      `).join('');
    }
    
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let current = 0;
  const increment = Math.max(1, Math.floor(target / 20));
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 30);
}

// ==================== Orders ====================
async function loadOrders() {
  const keyword = document.getElementById('order-search')?.value || '';
  const status = document.getElementById('order-status-filter')?.value || '';
  const tbody = document.getElementById('orders-tbody');
  
  tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载中...</td></tr>';
  
  try {
    const res = await ordersAPI.list(1, 50, status, keyword);
    const orders = res?.data?.orders || [];
    
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无订单</td></tr>';
      return;
    }
    
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>${o.order_no || o.id}</td>
        <td>${o.user_nickname || '-'}</td>
        <td>${o.service_name || '-'}</td>
        <td>${o.start_address || '-'}</td>
        <td>${formatMoney(o.paid_amount)}</td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${formatDate(o.created_at)}</td>
        <td>
          <button class="action-btn" onclick="viewOrder('${o.order_no || o.id}')">详情</button>
          ${o.status === 0 ? `<button class="action-btn primary" onclick="assignRider('${o.order_no || o.id}')">指派</button>` : ''}
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载失败</td></tr>';
  }
}

async function viewOrder(orderNo) {
  try {
    const res = await ordersAPI.detail(orderNo);
    const order = res?.data;
    
    if (!order) {
      showToast('订单不存在', 'error');
      return;
    }
    
    const content = `
      <div style="margin-bottom: 16px;">
        <strong>订单号:</strong> ${order.order_no}<br>
        <strong>状态:</strong> ${order.status_label}<br>
        <strong>金额:</strong> ${formatMoney(order.total_amount)}
      </div>
      <div style="margin-bottom: 16px;">
        <strong>服务:</strong> ${order.service_name || '-'}<br>
        <strong>分类:</strong> ${order.category_name || '-'}
      </div>
      <div style="margin-bottom: 16px;">
        <strong>用户:</strong> ${order.user_nickname || '-'}<br>
        <strong>电话:</strong> ${order.user_phone || '-'}
      </div>
      <div style="margin-bottom: 16px;">
        <strong>取货地址:</strong> ${order.start_address || '-'}<br>
        <strong>送达地址:</strong> ${order.end_address || '-'}
      </div>
      <div style="margin-bottom: 16px;">
        <strong>骑手:</strong> ${order.rider_name || '未分配'}<br>
        <strong>时间:</strong> ${formatDate(order.created_at)}
      </div>
      <div>
        <strong>备注:</strong> ${order.remark || '无'}
      </div>
    `;
    
    document.getElementById('order-detail-content').innerHTML = content;
    document.getElementById('order-modal').classList.add('show');
    
  } catch (err) {
    showToast('获取详情失败', 'error');
  }
}

async function assignRider(orderNo) {
  const riderId = prompt('请输入骑手ID（数字）:');
  if (!riderId) return;
  
  try {
    const res = await ordersAPI.assign(orderNo, parseInt(riderId));
    if (res.code === 0) {
      showToast('指派成功', 'success');
      loadOrders();
    } else {
      showToast(res.message || '指派失败', 'error');
    }
  } catch (err) {
    showToast('操作失败', 'error');
  }
}

function closeModal() {
  document.getElementById('order-modal').classList.remove('show');
}

// ==================== Riders ====================
async function loadRiders() {
  const statusFilter = document.getElementById('rider-status-filter')?.value || '';
  const tbody = document.getElementById('riders-tbody');
  
  tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载中...</td></tr>';
  
  try {
    const res = await ridersAPI.list(statusFilter);
    const riders = res?.data?.riders || [];
    
    if (riders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无骑手</td></tr>';
      return;
    }
    
    tbody.innerHTML = riders.map(r => `
      <tr>
        <td>${r.realname || '-'}</td>
        <td>${r.phone || '-'}</td>
        <td>${r.vehicle_type || '-'}</td>
        <td>${r.total_orders || 0}</td>
        <td>${formatMoney(r.total_income || 0)}</td>
        <td>L${r.level || 1}</td>
        <td>
          ${r.cert_status === 1 
            ? '<span class="badge badge-green">✅ 已认证</span>' 
            : r.cert_status === 0 
              ? '<span class="badge badge-warning">⏳ 待审核</span>'
              : '<span class="badge badge-red">❌ 拒绝</span>'}
        </td>
        <td>
          ${r.cert_status === 0 
            ? `<button class="action-btn primary" onclick="openCertifyModal(${r.id})">审核</button>`
            : '-'}
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载失败</td></tr>';
  }
}

function openCertifyModal(riderId) {
  document.getElementById('rider-id-to-certify').value = riderId;
  document.getElementById('rider-modal').classList.add('show');
}

function closeRiderModal() {
  document.getElementById('rider-modal').classList.remove('show');
}

async function certifyRider(approved) {
  const riderId = document.getElementById('rider-id-to-certify').value;
  
  try {
    const res = await ridersAPI.certify(riderId, approved);
    if (res.code === 0) {
      showToast(approved ? '认证成功' : '已拒绝', 'success');
      closeRiderModal();
      loadRiders();
    }
  } catch (err) {
    showToast('操作失败', 'error');
  }
}

// ==================== Services ====================
async function loadServices() {
  try {
    const res = await servicesAPI.list();
    const services = res?.data?.items || [];
    
    const tbody = document.querySelector('#services-table tbody');
    
    if (services.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">暂无服务</td></tr>';
      return;
    }
    
    tbody.innerHTML = services.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${s.category_name || '-'}</td>
        <td>${s.name}</td>
        <td>${formatMoney(s.price)}</td>
        <td>${s.is_active ? '🟢 启用' : '🔴 禁用'}</td>
        <td>
          <button class="action-btn" onclick="toggleService(${s.id}, ${!s.is_active})">${s.is_active ? '禁用' : '启用'}</button>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error(err);
  }
}

function toggleAddServiceForm() {
  const form = document.getElementById('add-service-form');
  form.classList.toggle('hidden');
}

async function addService() {
  const categoryId = document.getElementById('new-category').value;
  const name = document.getElementById('new-name').value;
  const price = parseFloat(document.getElementById('new-price').value);
  const description = document.getElementById('new-description').value;
  
  if (!categoryId || !name || !price) {
    showToast('请填写完整信息', 'error');
    return;
  }
  
  try {
    await servicesAPI.addCategory({
      category_id: parseInt(categoryId),
      name,
      price,
      description,
      sort_order: Date.now()
    });
    
    showToast('添加成功', 'success');
    toggleAddServiceForm();
    loadServices();
    
    // Clear form
    document.getElementById('new-category').value = '';
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-description').value = '';
    
  } catch (err) {
    showToast('添加失败', 'error');
  }
}

// ==================== Users ====================
async function loadUsers() {
  try {
    const res = await usersAPI.list();
    const users = res?.data?.users || [];
    const tbody = document.getElementById('users-tbody');
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">暂无用户</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.nickname || '-'}</td>
        <td>${u.phone || '-'}</td>
        <td>${u.total_orders || 0}</td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error(err);
  }
}

// ==================== Utility ====================
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const el = document.getElementById('current-time');
  if (el) el.textContent = timeStr;
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 60000);
  
  // Check if already logged in
  if (getToken()) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard-page').classList.remove('hidden');
    loadDashboard();
  }
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
});


// ==================== 商户管理 ====================
async function loadMerchants() {
  const tbody = document.getElementById('merchants-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="8" class="empty-row">加载中...</td></tr>';
  
  const statusFilter = document.getElementById('merchant-status-filter')?.value || '';
  const searchTerm = document.getElementById('merchant-search')?.value || '';
  
  try {
    const res = await merchantsAPI.list(statusFilter, searchTerm);
    const merchants = res?.data?.merchants || [];
    
    if (merchants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无数据</td></tr>';
      return;
    }
    
    const statusBadge = (s) => {
      const map = {
        0: '<span class="badge badge-gray">已禁用</span>',
        1: '<span class="badge badge-warning">待审核</span>',
        2: '<span class="badge badge-green">已通过</span>',
        3: '<span class="badge badge-red">已拒绝</span>'
      };
      return map[s] || '-';
    };
    
    tbody.innerHTML = merchants.map(m => `
      <tr>
        <td>${m.id}</td>
        <td><strong>${m.name || '-'}</strong></td>
        <td>${m.contact || '-'}</td>
        <td>${m.phone || '-'}</td>
        <td>${m.address || '-'}</td>
        <td>${statusBadge(m.status)}</td>
        <td>${formatDate(m.created_at)}</td>
        <td>
          <button class="btn-link" onclick="viewMerchant(${m.id})">查看详情</button>
          ${m.status == 1 ? `<button class="btn-link" onclick="openReviewModal(${m.id})">审核</button>` : ''}
          <button class="btn-link btn-danger-link" onclick="deleteMerchant(${m.id})">删除</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('加载商户失败:', err);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row" style="color:red;">加载失败</td></tr>';
  }
}

// 防抖搜索
let merchantSearchTimer = null;
function debounceSearchMerchant() {
  clearTimeout(merchantSearchTimer);
  merchantSearchTimer = setTimeout(loadMerchants, 500);
}

// 查看商户详情
async function viewMerchant(id) {
  const modalBody = document.getElementById('merchant-detail-content');
  modalBody.innerHTML = '<p style="text-align:center;color:#999;">加载中...</p>';
  document.getElementById('merchant-modal').classList.remove('hidden');
  
  try {
    const res = await merchantsAPI.detail(id);
    const m = res.data;
    if (!m) return;
    
    modalBody.innerHTML = `
      <div style="margin-bottom:20px;">
        <h4 style="margin-bottom:12px;">基本信息</h4>
        <div class="info-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><strong>商户名称:</strong> ${m.name || '-'}</div>
          <div><strong>联系人:</strong> ${m.contact || '-'}</div>
          <div><strong>联系电话:</strong> ${m.phone || '-'}</div>
          <div><strong>经营地址:</strong> ${m.address || '-'}</div>
          <div><strong>状态:</strong> ${m.status == 1 ? '待审核' : m.status == 2 ? '已通过' : m.status == 3 ? '已拒绝' : '已禁用'}</div>
          <div><strong>申请时间:</strong> ${formatDate(m.created_at)}</div>
        </div>
      </div>
      
      <div style="margin-top:20px;">
        <h4 style="margin-bottom:12px;">店铺列表 (${(m.shops || []).length})</h4>
        ${(m.shops && m.shops.length > 0) ? `
          <table class="data-table" style="margin-bottom:20px;">
            <thead><tr><th>店名</th><th>类型</th><th>联系电话</th></tr></thead>
            <tbody>
              ${m.shops.map(s => `<tr><td>${s.name}</td><td>${s.type_name || '-'}</td><td>${s.contact_phone || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : '<p style="color:#999;">暂无店铺</p>'}
      </div>
      
      <div style="margin-top:20px;">
        <h4 style="margin-bottom:12px;">店员列表 (${(m.staff || []).length})</h4>
        ${(m.staff && m.staff.length > 0) ? `
          <table class="data-table" style="margin-bottom:20px;">
            <thead><tr><th>姓名</th><th>电话</th><th>角色</th></tr></thead>
            <tbody>
              ${m.staff.map(s => `<tr><td>${s.name}</td><td>${s.phone || '-'}</td><td>${s.role || '-'}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : '<p style="color:#999;">暂无店员</p>'}
      </div>
      
      <div style="margin-top:20px;">
        <h4 style="margin-bottom:12px;">订单统计</h4>
        <p>关联订单数: <strong>${m.order_count || 0}</strong></p>
      </div>
    `;
  } catch (err) {
    modalBody.innerHTML = '<p style="color:red;">加载失败</p>';
  }
}

function closeMerchantModal() {
  document.getElementById('merchant-modal').classList.add('hidden');
}

// 打开审核弹窗
function openReviewModal(id) {
  document.getElementById('merchant-id-to-review').value = id;
  document.getElementById('review-remark').value = '';
  document.getElementById('merchant-review-modal').classList.remove('hidden');
}

function closeReviewModal() {
  document.getElementById('merchant-review-modal').classList.add('hidden');
}

// 审核商户
async function reviewMerchant(approved) {
  const id = parseInt(document.getElementById('merchant-id-to-review').value);
  const remark = document.getElementById('review-remark').value;
  
  if (!id) return showToast('商户ID错误', 'error');
  
  try {
    const res = await merchantsAPI.review(id, approved, remark);
    if (res.code === 0) {
      showToast(approved ? '审核通过' : '已拒绝', 'success');
      closeReviewModal();
      loadMerchants();
    } else {
      showToast(res.message || '操作失败', 'error');
    }
  } catch (err) {
    console.error('审核失败:', err);
    showToast('操作失败，请重试', 'error');
  }
}

// 删除商户
async function deleteMerchant(id) {
  if (!confirm('确定要删除该商户吗？此操作不可恢复。')) return;
  
  try {
    const res = await merchantsAPI.delete(id);
    if (res.code === 0) {
      showToast('删除成功', 'success');
      loadMerchants();
    } else {
      showToast(res.message || '删除失败', 'error');
    }
  } catch (err) {
    console.error('删除失败:', err);
    showToast('操作失败，请重试', 'error');
  }
}
