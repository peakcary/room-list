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

/**
 * 获取本地存储的用户账户信息
 */
function getStoredAccounts() {
  try {
    const accounts = uni.getStorageSync('userAccounts');
    if (accounts) {
      return JSON.parse(accounts);
    }
  } catch (error) {
    console.error('获取存储账户失败:', error);
  }
  
  // 返回默认账户
  const defaultAccounts = [
    { username: 'admin', password: '123456', name: '系统管理员', role: 'admin' },
    { username: 'manager', password: '888888', name: '房管员', role: 'manager' }
  ];
  
  // 初始化存储
  try {
    uni.setStorageSync('userAccounts', JSON.stringify(defaultAccounts));
  } catch (error) {
    console.error('初始化账户存储失败:', error);
  }
  
  return defaultAccounts;
}

/**
 * 保存用户账户信息到本地存储
 */
function saveStoredAccounts(accounts) {
  try {
    uni.setStorageSync('userAccounts', JSON.stringify(accounts));
    return true;
  } catch (error) {
    console.error('保存账户信息失败:', error);
    return false;
  }
}

/**
 * 验证用户当前密码
 */
function verifyCurrentPassword(username, password) {
  const accounts = getStoredAccounts();
  return accounts.some(acc => 
    acc.username === username && acc.password === password
  );
}

/**
 * 修改用户密码
 */
function changeUserPassword(username, oldPassword, newPassword) {
  try {
    // 验证当前密码
    if (!verifyCurrentPassword(username, oldPassword)) {
      return { success: false, message: '当前密码错误' };
    }

    // 获取所有账户信息
    const accounts = getStoredAccounts();
    
    // 查找并更新对应用户的密码
    const userIndex = accounts.findIndex(acc => acc.username === username);
    if (userIndex === -1) {
      return { success: false, message: '用户不存在' };
    }
    
    // 更新密码
    accounts[userIndex].password = newPassword;
    
    // 保存更新后的账户信息
    if (!saveStoredAccounts(accounts)) {
      return { success: false, message: '保存密码失败，请重试' };
    }
    
    // 更新当前登录用户的信息（如果是当前用户修改密码）
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === username) {
      currentUser.password = newPassword;
      try {
        uni.setStorageSync('userInfo', currentUser);
      } catch (error) {
        console.error('更新当前用户信息失败:', error);
      }
    }
    
    console.log(`用户 ${username} 密码已成功更新`);
    
    return { success: true, message: '密码修改成功' };
  } catch (error) {
    console.error('修改密码失败:', error);
    return { success: false, message: '系统错误，请稍后重试' };
  }
}

// 导出所有函数 (ES6 export)
export {
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
  getRoleDisplayName,
  verifyCurrentPassword,
  changeUserPassword
};