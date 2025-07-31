<template>
  <view class="app">
    <!-- 主内容区域 -->
    <view class="main-content">
      <!-- 这里是页面内容 -->
    </view>
    
    <!-- 自定义 tabbar (仅在 H5 端显示) -->
    <!-- #ifdef H5 -->
    <custom-tabbar></custom-tabbar>
    <!-- #endif -->
  </view>
</template>

<script>
// #ifdef H5
import CustomTabbar from '@/components/custom-tabbar/custom-tabbar.vue'
// #endif

export default {
  // #ifdef H5
  components: {
    CustomTabbar
  },
  // #endif
  
  onLaunch: function() {
    console.log('App Launch')
    // 初始化应用时检查登录状态
    this.checkInitialAuth()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')  
  },
  
  methods: {
    // 检查应用启动时的认证状态
    checkInitialAuth() {
      try {
        const { isLoggedIn } = require('./utils/auth.js')
        
        // 获取当前页面
        const pages = getCurrentPages()
        const currentPage = pages.length > 0 ? pages[pages.length - 1] : null
        const currentRoute = currentPage ? `/${currentPage.route}` : ''
        
        console.log('App启动检查认证状态, 当前路由:', currentRoute)
        
        // 如果当前不在登录页面且未登录，则跳转到登录页面
        if (currentRoute !== '/pages/login/login' && !isLoggedIn()) {
          console.log('未登录，跳转到登录页面')
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }, 100)
        }
      } catch (error) {
        console.error('检查认证状态失败:', error)
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
.app {
  height: 100vh;
}

.main-content {
  height: 100%;
  /* #ifdef H5 */
  padding-bottom: 50px; /* 为自定义tabbar留出空间 */
  /* #endif */
}

/* 全局CSS变量 */
page {
  --primary-color: #007AFF;
  --text-color: #333;
  --border-color: #e5e5e5;
  --bg-color: #f5f5f5;
}

/* 通用样式 */
.container {
  background-color: var(--bg-color);
  min-height: 100vh;
}

/* 按钮通用样式 */
.btn {
  border-radius: 8rpx;
  border: none;
  font-size: 28rpx;
  padding: 20rpx 40rpx;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

/* 表单通用样式 */
.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: var(--text-color);
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid var(--border-color);
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
}

.form-input:focus {
  border-color: var(--primary-color);
}
</style>
