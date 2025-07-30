<template>
  <view class="custom-tabbar" v-if="showTabbar">
    <view 
      class="tabbar-item" 
      v-for="(item, index) in tabList" 
      :key="index"
      :class="{ active: currentIndex === index }"
      @click="switchTab(item, index)"
    >
      <view class="tabbar-icon">{{ item.icon }}</view>
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabbar',
  data() {
    return {
      currentIndex: 0,
      tabList: [
        {
          pagePath: '/pages/index/index',
          text: '首页',
          icon: '🏠'
        },
        {
          pagePath: '/pages/room-list/room-list',
          text: '房间管理',
          icon: '🏢'
        }
      ]
    }
  },
  computed: {
    showTabbar() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length === 0) return false;
      
      const currentPage = pages[pages.length - 1];
      const currentPath = '/' + currentPage.route;
      
      // 检查当前页面是否在 tabbar 页面列表中
      return this.tabList.some(tab => tab.pagePath === currentPath);
    }
  },
  mounted() {
    this.updateCurrentIndex();
  },
  methods: {
    switchTab(item, index) {
      if (this.currentIndex === index) return;
      
      this.currentIndex = index;
      uni.switchTab({
        url: item.pagePath
      });
    },
    updateCurrentIndex() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const currentPath = '/' + currentPage.route;
      
      const index = this.tabList.findIndex(tab => tab.pagePath === currentPath);
      if (index !== -1) {
        this.currentIndex = index;
      }
    }
  }
}
</script>

<style>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
  color: #7A7E83;
  transition: color 0.3s;
}

.tabbar-item.active {
  color: #007AFF;
}

.tabbar-icon {
  font-size: 44rpx;
  margin-bottom: 4rpx;
}

.tabbar-text {
  font-size: 20rpx;
  line-height: 1;
}

/* H5端适配 */
/* #ifdef H5 */
.custom-tabbar {
  height: 50px;
  padding-bottom: 0;
}

.tabbar-item {
  padding: 5px 0;
}

.tabbar-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.tabbar-text {
  font-size: 10px;
}
/* #endif */
</style>