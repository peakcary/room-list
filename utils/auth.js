/**
 * 权限控制工具
 * 提供登录状态检查、权限验证等功能
 */

// 需要登录的页面列表
const PROTECTED_PAGES = [
  '/pages/room-list/room-list',
  '/pages/index/index',
  '/pages/room-detail/room-detail',
  '/pages/room-edit/room-edit',
  '/pages/tenant-info/tenant-info',
  '/pages/utility-record/utility-record',
  '/pages/rental-renewal/rental-renewal',
  '/pages/maintenance-record/maintenance-record',
  '/pages/system-deploy/system-deploy',
  '/pages/test/test'
];

/**
 * 检查用户是否已登录
 */
function isLoggedIn() {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    const token = uni.getStorageSync('authToken');
    
    if (!userInfo || !token) {
      return false;
    }
    
    // 验证token是否过期（简单验证）
    if (isTokenExpired(token)) {
      clearAuth();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
}

/**
 * 检查token是否过期
 */
function isTokenExpired(token) {
  try {
    const parts = token.split('_');
    if (parts.length < 2) return true;
    
    const timestamp = parseInt(parts[1]);
    const now = Date.now();
    
    // Token有效期7天
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    return (now - timestamp) > SEVEN_DAYS;
  } catch (error) {
    return true;
  }
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  try {
    return uni.getStorageSync('userInfo');
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 获取用户权限角色
 */
function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/**
 * 检查用户是否有特定权限
 */
function hasPermission(permission) {
  const userRole = getUserRole();
  
  if (!userRole) return false;
  
  // 管理员有所有权限
  if (userRole === 'admin') return true;
  
  // 根据权限类型判断
  const permissionMap = {
    'view': ['admin', 'manager'],
    'edit': ['admin', 'manager'],
    'delete': ['admin'],
    'system': ['admin']
  };
  
  const allowedRoles = permissionMap[permission] || [];
  return allowedRoles.includes(userRole);
}

/**
 * 检查页面是否需要登录
 */
function isProtectedPage(pagePath) {
  return PROTECTED_PAGES.some(path => pagePath.includes(path));
}

/**
 * 跳转到登录页面
 */
function redirectToLogin(fromPage) {
  console.log('跳转到登录页面, 来源页面:', fromPage);
  
  uni.reLaunch({
    url: '/pages/login/login',
    fail: (error) => {
      console.error('跳转登录页面失败:', error);
    }
  });
}

/**
 * 清除认证信息
 */
function clearAuth() {
  try {
    uni.removeStorageSync('userInfo');
    uni.removeStorageSync('authToken');
  } catch (error) {
    console.error('清除认证信息失败:', error);
  }
}

/**
 * 退出登录
 */
function logout() {
  clearAuth();
  
  uni.showToast({
    title: '已退出登录',
    icon: 'success',
    duration: 1500
  });
  
  setTimeout(() => {
    redirectToLogin();
  }, 1500);
}

/**
 * 页面权限检查中间件
 */
function checkPageAuth() {
  // 获取当前页面路径
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const pagePath = `/${currentPage.route}`;
  
  console.log('检查页面权限:', pagePath);
  
  // 检查是否是受保护的页面
  if (isProtectedPage(pagePath)) {
    if (!isLoggedIn()) {
      console.log('未登录，跳转到登录页面');
      redirectToLogin(pagePath);
      return false;
    }
  }
  
  return true;
}

/**
 * 刷新token
 */
function refreshToken() {
  const userInfo = getCurrentUser();
  if (userInfo) {
    const newToken = generateToken(userInfo);
    uni.setStorageSync('authToken', newToken);
    return newToken;
  }
  return null;
}

/**
 * 生成token
 */
function generateToken(userInfo) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2);
  return `${userInfo.username}_${timestamp}_${randomStr}`;
}

/**
 * 格式化用户角色显示名称
 */
function getRoleDisplayName(role) {
  const roleMap = {
    'admin': '管理员',
    'manager': '房管员',
    'user': '普通用户'
  };
  
  return roleMap[role] || '未知角色';
}

// 导出所有函数
module.exports = {
  isLoggedIn,
  getCurrentUser,
  getUserRole,
  hasPermission,
  isProtectedPage,
  redirectToLogin,
  clearAuth,
  logout,
  checkPageAuth,
  refreshToken,
  getRoleDisplayName
};