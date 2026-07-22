// Backend API Configuration
const API_BASE = 'http://localhost:5000';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('admin_token') || '';
}

function setToken(token) {
  localStorage.setItem('admin_token', token);
}

function clearToken() {
  localStorage.removeItem('admin_token');
}

// Generic API request
async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  try {
    const response = await fetch(API_BASE + url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    // Handle 401 - token expired or invalid
    if (data.code === 401) {
      clearToken();
      location.href = '/';
      throw new Error('请先登录');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Admin authentication
const authAPI = {
  login(username, password) {
    return request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  logout() {
    clearToken();
  }
};

// Dashboard statistics
const dashboardAPI = {
  getOverview() {
    return request('/api/admin/dashboard');
  },
  getOrderStats() {
    return request('/api/orders?perPage=100');
  }
};

// Order management
const ordersAPI = {
  list(page = 1, perPage = 20, status = '', keyword = '') {
    let url = `/api/admin/orders?page=${page}&perPage=${perPage}`;
    if (status) url += `&status=${status}`;
    if (keyword) url += `&keyword=${keyword}`;
    return request(url);
  },
  detail(orderNo) {
    return request(`/api/admin/orders/${orderNo}`);
  },
  assign(orderNo, riderId) {
    return request('/api/admin/orders/assign', {
      method: 'POST',
      body: JSON.stringify({ order_no: orderNo, rider_id: riderId })
    });
  },
  cancel(orderNo, reason = '后台取消') {
    return request(`/api/admin/orders/${orderNo}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};

// Rider management
const ridersAPI = {
  list(status = '') {
    let url = '/api/admin/riders';
    if (status) url += `?status=${status}`;
    return request(url);
  },
  certify(riderId, approved) {
    return request('/api/admin/riders/certify', {
      method: 'POST',
      body: JSON.stringify({ rider_id: riderId, approved })
    });
  }
};

// Service management
const servicesAPI = {
  list(action = 'services') {
    return request(`/api/admin/services?action=${action}`);
  },
  addCategory(data) {
    return request('/api/admin/services?action=addCategory', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateService(data) {
    return request('/api/admin/services?action=editService', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// User management
const usersAPI = {
  list(page = 1, perPage = 20) {
    return request(`/api/admin/users?page=${page}&perPage=${perPage}`);
  }
};

// Utility functions
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return dateStr.substring(0, 19).replace('T', ' ');
}

function formatMoney(amount) {
  return '¥' + parseFloat(amount || 0).toFixed(2);
}

function getStatusBadge(status) {
  const map = {
    0: '<span class="badge badge-warning">待抢单</span>',
    1: '<span class="badge badge-blue">已接单</span>',
    2: '<span class="badge badge-blue">进行中</span>',
    3: '<span class="badge badge-green">已完成</span>',
    4: '<span class="badge badge-red">已取消</span>',
  };
  return map[status] || '-';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ff4d4f' : '#52c41a'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

