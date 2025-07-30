<template>
  <view class="container">
    <!-- 欢迎区域 -->
    <view class="welcome-section">
      <view class="welcome-title">房间管理系统</view>
      <view class="welcome-subtitle">高效管理您的房产资源</view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view class="stat-card" @click="navigateToRooms('')">
        <view class="stat-icon total">🏠</view>
        <view class="stat-number">{{ statistics.total }}</view>
        <view class="stat-label">总房间数</view>
      </view>
      
      <view class="stat-card" @click="navigateToRooms('rented')">
        <view class="stat-icon rented">🔑</view>
        <view class="stat-number">{{ statistics.rented }}</view>
        <view class="stat-label">已出租</view>
      </view>
      
      <view class="stat-card" @click="navigateToRooms('available')">
        <view class="stat-icon available">🆓</view>
        <view class="stat-number">{{ statistics.available }}</view>
        <view class="stat-label">空闲房间</view>
      </view>
      
      <view class="stat-card">
        <view class="stat-icon revenue">💰</view>
        <view class="stat-number">{{ statistics.monthlyRevenue }}</view>
        <view class="stat-label">月收入(元)</view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="section-title">快捷操作</view>
      <view class="action-grid">
        <view class="action-item" @click="addRoom">
          <view class="action-icon">➕</view>
          <text class="action-text">添加房间</text>
        </view>
        
        <view class="action-item" @click="viewRooms">
          <view class="action-icon">📋</view>
          <text class="action-text">房间列表</text>
        </view>
        
        <view class="action-item" @click="utilityRecords">
          <view class="action-icon">⚡</view>
          <text class="action-text">水电管理</text>
        </view>
        
        <view class="action-item" @click="tenantManagement">
          <view class="action-icon">👥</view>
          <text class="action-text">租户管理</text>
        </view>
        
        <view class="action-item debug-item" @click="systemTest">
          <view class="action-icon">🔧</view>
          <text class="action-text">系统测试</text>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="recent-activity">
      <view class="section-title">最近活动</view>
      <view class="activity-list">
        <view class="activity-item" v-for="activity in recentActivities" :key="activity.id">
          <view class="activity-icon">{{ activity.icon }}</view>
          <view class="activity-content">
            <view class="activity-title">{{ activity.title }}</view>
            <view class="activity-time">{{ formatTime(activity.time) }}</view>
          </view>
        </view>
        
        <view class="no-activity" v-if="recentActivities.length === 0">
          <text>暂无最近活动</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statistics: {
        total: 0,
        rented: 0,
        available: 0,
        monthlyRevenue: 0
      },
      recentActivities: []
    }
  },
  
  onLoad() {
    this.loadStatistics();
    this.loadRecentActivities();
  },
  
  onShow() {
    // 页面显示时刷新数据
    this.loadStatistics();
  },
  
  methods: {
    // 加载统计数据
    async loadStatistics() {
      try {
        // 获取房间统计
        const promises = [
          this.getRoomCount(''),
          this.getRoomCount('rented'),
          this.getRoomCount('available')
        ];
        
        const results = await Promise.all(promises);
        
        this.statistics.total = results[0];
        this.statistics.rented = results[1];
        this.statistics.available = results[2];
        
        // 计算月收入（获取已租房间的租金总和）
        await this.calculateMonthlyRevenue();
        
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },
    
    // 获取房间数量
    async getRoomCount(status) {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              status,
              pageSize: 1000, // 获取所有数据来计算总数
              pageNum: 1
            }
          }
        });
        
        return result.result.code === 0 ? result.result.data.total : 0;
      } catch (error) {
        console.error('获取房间数量失败:', error);
        return 0;
      }
    },
    
    // 计算月收入
    async calculateMonthlyRevenue() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              status: 'rented',
              pageSize: 1000,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          const rentedRooms = result.result.data.list;
          const totalRevenue = rentedRooms.reduce((sum, room) => {
            return sum + (room.rent_price || 0);
          }, 0);
          
          this.statistics.monthlyRevenue = totalRevenue;
        }
      } catch (error) {
        console.error('计算月收入失败:', error);
      }
    },
    
    // 加载最近活动
    loadRecentActivities() {
      // 这里可以从数据库加载最近的操作记录
      // 暂时使用模拟数据
      this.recentActivities = [
        {
          id: 1,
          icon: '🏠',
          title: '新增了101号房间',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
        }
      ];
    },
    
    // 导航到房间列表
    navigateToRooms(status) {
      uni.switchTab({
        url: '/pages/room-list/room-list'
      });
    },
    
    // 添加房间
    addRoom() {
      uni.navigateTo({
        url: '/pages/room-edit/room-edit'
      });
    },
    
    // 查看房间列表
    viewRooms() {
      uni.switchTab({
        url: '/pages/room-list/room-list'
      });
    },
    
    // 水电管理
    utilityRecords() {
      uni.navigateTo({
        url: '/pages/utility-record/utility-record'
      });
    },
    
    // 租户管理
    tenantManagement() {
      uni.navigateTo({
        url: '/pages/tenant-info/tenant-info'
      });
    },
    
    // 系统测试
    systemTest() {
      uni.navigateTo({
        url: '/pages/test/test'
      });
    },
    
    // 格式化时间
    formatTime(time) {
      const now = new Date();
      const diff = now - time;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 1) {
        return '刚刚';
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days}天前`;
      }
    }
  }
}
</script>

<style>
.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding-bottom: 120rpx;
  /* #ifdef H5 */
  padding-bottom: 70px;
  /* #endif */
}

.welcome-section {
  padding: 80rpx 40rpx 60rpx;
  text-align: center;
  color: white;
}

.welcome-title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.welcome-subtitle {
  font-size: 28rpx;
  opacity: 0.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 40rpx 40rpx;
}

.stat-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  text-align: center;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.stat-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.quick-actions, .recent-activity {
  background: white;
  margin: 0 40rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.debug-item {
  grid-column: 1 / -1;
  background: #ff9500 !important;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  border-radius: 16rpx;
  background: #f8f9fa;
  transition: all 0.3s;
}

.action-item:active {
  transform: scale(0.95);
  background: #e9ecef;
}

.action-icon {
  font-size: 40rpx;
  margin-bottom: 12rpx;
}

.action-text {
  font-size: 26rpx;
  color: #333;
}

.activity-list {
  max-height: 400rpx;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.activity-time {
  font-size: 24rpx;
  color: #999;
}

.no-activity {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}
</style>
