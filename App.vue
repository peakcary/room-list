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
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')  
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
