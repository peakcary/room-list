<template>
  <view class="container">
    <!-- Tab栏 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'all' }"
        @click="switchTab('all')"
      >
        <view class="tab-content">
          <text class="tab-text">全部</text>
          <text class="tab-count">({{ statistics.total }})</text>
        </view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'available' }"
        @click="switchTab('available')"
      >
        <view class="tab-content">
          <text class="tab-text">可租用</text>
          <text class="tab-count">({{ statistics.available }})</text>
        </view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'rented' }"
        @click="switchTab('rented')"
      >
        <view class="tab-content">
          <text class="tab-text">已租用</text>
          <text class="tab-count">({{ statistics.rented }})</text>
        </view>
      </view>
    </view>
    
    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="search-box">
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索房间号..."
          @input="onSearch"
        />
      </view>
      <view class="add-btn" @click="addRoom">
        <text class="add-icon">+</text>
        <text>添加</text>
      </view>
    </view>

    <!-- 房间列表 -->
    <scroll-view class="room-list" scroll-y="true" @scrolltolower="loadMore">
      <view class="room-item" v-for="room in roomList" :key="room._id" @click="viewRoom(room)">
        <view class="room-header">
          <view class="room-number">{{ room.room_number }}号房</view>
          <view class="header-actions">
            <button class="header-btn tenant" @click.stop="createRental(room)" v-if="room.status === 'available'">
              出租
            </button>
            <button class="header-btn renewal" @click.stop="renewRental(room)" v-if="room.status === 'rented'">
              续租
            </button>
            <button class="header-btn terminate" @click.stop="terminateRental(room)" v-if="room.status === 'rented'">
              退租
            </button>
          </view>
        </view>
        
        
        <view class="tenant-info-card" v-if="room.current_tenant">
          <view class="tenant-main-info">
            <view class="tenant-name-phone">
              <text class="tenant-name">{{ room.current_tenant.name }}</text>
              <text class="tenant-phone" @tap="callTenant(room.current_tenant.phone)">
                📞 {{ room.current_tenant.phone }}
              </text>
            </view>
            <view class="tenant-status">
              <text class="status-badge">在租</text>
            </view>
          </view>
          <view class="rental-period" v-if="room.current_rental">
            <text class="period-text">📅 {{ formatDateRange(room.current_rental.rent_start_date, room.current_rental.rent_end_date) }}</text>
            <view class="days-remaining" :class="getDaysRemainingClass(room.current_rental.rent_end_date)">
              <text class="days-text">{{ getDaysRemaining(room.current_rental.rent_end_date) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <text>{{ loading ? '加载中...' : '上拉加载更多' }}</text>
      </view>
    </scroll-view>

  </view>
</template>

<script>
export default {
  data() {
    return {
      roomList: [],
      loading: false,
      hasMore: true,
      pageNum: 1,
      pageSize: 10,
      currentTab: 'all', // 当前选中的Tab
      searchKeyword: '', // 搜索关键词
      searchTimer: null, // 搜索防抖定时器
      statistics: {
        total: 0,
        rented: 0,
        available: 0
      }
    }
  },
  
  onLoad() {
    this.loadRooms();
    this.loadStatistics();
  },
  
  onPullDownRefresh() {
    this.refreshData();
  },
  
  onShow() {
    // 页面显示时刷新数据，确保从其他页面返回时数据是最新的
    this.refreshData();
  },
  
  methods: {
    // 加载房间列表
    async loadRooms(isRefresh = false) {
      if (this.loading) return;
      
      this.loading = true;
      
      if (isRefresh) {
        this.pageNum = 1;
        this.roomList = [];
        this.hasMore = true;
      }
      
      try {
        // 构建请求数据
        const requestData = {
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          searchKeyword: this.searchKeyword
        };
        
        // 只有不是"全部"时才传递status参数
        if (this.currentTab !== 'all') {
          requestData.status = this.currentTab;
        }
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: requestData
          }
        });
        
        if (result.result.code === 0) {
          const { list, total } = result.result.data;
          
          if (isRefresh) {
            this.roomList = list;
          } else {
            this.roomList = [...this.roomList, ...list];
          }
          
          this.hasMore = this.roomList.length < total;
          this.pageNum++;
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载房间列表失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },
    
    // 加载统计信息
    async loadStatistics() {
      try {
        const promises = [
          this.getRoomCount(''),
          this.getRoomCount('rented'),
          this.getRoomCount('available')
        ];
        
        const results = await Promise.all(promises);
        
        this.statistics = {
          total: results[0],
          rented: results[1],
          available: results[2]
        };
      } catch (error) {
        console.error('加载统计信息失败:', error);
      }
    },
    
    // 获取房间数量
    async getRoomCount(status) {
      const requestData = {
        pageSize: 1, // 只需要获取总数，不需要具体数据
        pageNum: 1
      };
      
      // 只有status不为空时才传递status参数
      if (status) {
        requestData.status = status;
      }
      
      const result = await uniCloud.callFunction({
        name: 'room-management',
        data: {
          action: 'getRooms',
          data: requestData
        }
      });
      
      return result.result.code === 0 ? result.result.data.total : 0;
    },
    
    
    // 搜索
    onSearch(e) {
      this.searchKeyword = e.detail.value;
      // 防抖处理
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.refreshData();
      }, 500);
    },
    
    // 刷新数据
    refreshData() {
      this.loadRooms(true);
      this.loadStatistics();
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.loadRooms();
      }
    },
    
    // Tab切换
    switchTab(tab) {
      if (this.currentTab === tab) return;
      this.currentTab = tab;
      this.refreshData();
    },
    
    // 查看房间详情
    viewRoom(room) {
      uni.navigateTo({
        url: `/pages/room-detail/room-detail?id=${room._id}`
      });
    },
    
    
    // 添加房间
    addRoom() {
      uni.navigateTo({
        url: '/pages/room-edit/room-edit'
      });
    },
    
    // 创建租赁关系
    createRental(room) {
      uni.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${room._id}&action=create`
      });
    },
    
    
    // 终止租赁关系
    terminateRental(room) {
      if (!room.current_rental_id) return;
      
      uni.showModal({
        title: '确认退租',
        content: `确定要终止${room.room_number}号房的租赁关系吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' });
              
              const result = await uniCloud.callFunction({
                name: 'room-management',
                data: {
                  action: 'terminateRental',
                  data: {
                    rental_id: room.current_rental_id,
                    termination_reason: '正常退租'
                  }
                }
              });
              
              if (result.result.code === 0) {
                uni.showToast({
                  title: '退租成功',
                  icon: 'success'
                });
                this.refreshData();
              } else {
                uni.showToast({
                  title: result.result.message,
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('退租失败:', error);
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        available: '可租用',
        rented: '已租用',
        maintenance: '维修中'
      };
      return statusMap[status] || '未知';
    },
    
    // 格式化日期范围
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '--';
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      return `${formatDate(start)} 至 ${formatDate(end)}`;
    },
    
    // 计算剩余天数
    getDaysRemaining(endDate) {
      if (!endDate) return '';
      
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return '已过期';
      } else if (diffDays === 0) {
        return '今日到期';
      } else if (diffDays <= 7) {
        return `${diffDays}天后到期`;
      } else if (diffDays <= 30) {
        return `${diffDays}天后到期`;
      } else {
        return `${Math.floor(diffDays / 30)}个月后到期`;
      }
    },
    
    // 获取剩余天数样式类
    getDaysRemainingClass(endDate) {
      if (!endDate) return '';
      
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return 'expired';
      } else if (diffDays <= 7) {
        return 'urgent';
      } else if (diffDays <= 30) {
        return 'warning';
      } else {
        return 'normal';
      }
    },
    
    // 拨打电话
    callTenant(phoneNumber) {
      uni.makePhoneCall({
        phoneNumber: phoneNumber,
        fail: (err) => {
          console.error('拨打电话失败:', err);
          uni.showToast({
            title: '拨打失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 续租
    renewRental(room) {
      if (!room.current_rental_id) return;
      
      uni.navigateTo({
        url: `/pages/rental-renewal/rental-renewal?rentalId=${room.current_rental_id}&roomId=${room._id}`
      });
    }
  }
}
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  /* #ifdef H5 */
  padding-bottom: 70px;
  /* #endif */
}

/* Tab栏样式 */
.tab-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 12rpx;
  position: relative;
  min-width: 0; /* 防止文字溢出 */
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tab-item.active {
  color: #007AFF;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007AFF;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 32rpx;
  font-weight: bold;
}

.tab-count {
  font-size: 26rpx;
  color: #999;
  opacity: 0.8;
}

.tab-item.active .tab-count {
  color: #007AFF;
}


/* 操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.search-box {
  flex: 1;
  margin-right: 20rpx;
}

.search-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  font-size: 28rpx;
  border: none;
}

.add-btn {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #007AFF;
  color: white;
  border-radius: 20rpx;
  font-size: 28rpx;
}

.add-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.room-list {
  flex: 1;
  padding: 20rpx 0;
}

.room-list .room-item {
  margin:10rpx 0;
}

.room-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.08);
  border: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.room-item:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.room-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

.room-number::before {
  content: '🏠';
  font-size: 32rpx;
  margin-right: 12rpx;
}

.header-actions {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.header-btn {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  border: none;
  color: white;
  min-width: 60rpx;
  text-align: center;
}


.header-btn.tenant {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.header-btn.renewal {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
}

.header-btn.terminate {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}


/* 租户信息卡片 */
.tenant-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 12rpx;
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.tenant-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.tenant-name-phone {
  display: flex;
  align-items: center;
  flex: 1;
}

.tenant-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
  margin-right: 16rpx;
}

.tenant-phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
  cursor: pointer;
}

.tenant-status {
  flex-shrink: 0;
}

.status-badge {
  background-color: rgba(82, 196, 26, 0.2);
  color: #52c41a;
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: bold;
  border: 1rpx solid rgba(82, 196, 26, 0.3);
}

.rental-period {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.period-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.days-remaining {
  display: flex;
  justify-content: center;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  margin-top: 8rpx;
}

.days-remaining.normal {
  background-color: rgba(82, 196, 26, 0.2);
  border: 1rpx solid rgba(82, 196, 26, 0.3);
}

.days-remaining.warning {
  background-color: rgba(250, 173, 20, 0.2);
  border: 1rpx solid rgba(250, 173, 20, 0.3);
}

.days-remaining.urgent {
  background-color: rgba(255, 77, 79, 0.2);
  border: 1rpx solid rgba(255, 77, 79, 0.3);
}

.days-remaining.expired {
  background-color: rgba(140, 140, 140, 0.2);
  border: 1rpx solid rgba(140, 140, 140, 0.3);
}

.days-text {
  font-size: 24rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.95);
}



.load-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

</style>