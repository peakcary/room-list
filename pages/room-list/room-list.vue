<template>
  <view class="container">
    <!-- Tab栏 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'all' }"
        @click="switchTab('all')"
      >
        <text class="tab-text">全部</text>
        <text class="tab-count">({{ statistics.total }})</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'available' }"
        @click="switchTab('available')"
      >
        <text class="tab-text">可租用</text>
        <text class="tab-count">({{ statistics.available }})</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'rented' }"
        @click="switchTab('rented')"
      >
        <text class="tab-text">已租用</text>
        <text class="tab-count">({{ statistics.rented }})</text>
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
          <view class="room-status" :class="'status-' + room.status">
            {{ getStatusText(room.status) }}
          </view>
        </view>
        
        <view class="room-info">
          <view class="info-item">
            <text class="label">面积:</text>
            <text class="value">{{ room.area || '--' }}㎡</text>
          </view>
          <view class="info-item">
            <text class="label">租金:</text>
            <text class="value price">¥{{ room.rent_price }}/月</text>
          </view>
        </view>
        
        <view class="tenant-info" v-if="room.current_tenant">
          <view class="info-item">
            <text class="label">租户:</text>
            <text class="value">{{ room.current_tenant.name }}</text>
          </view>
          <view class="info-item">
            <text class="label">电话:</text>
            <text class="value">{{ room.current_tenant.phone }}</text>
          </view>
          <view class="info-item" v-if="room.current_rental">
            <text class="label">租期:</text>
            <text class="value">{{ formatDateRange(room.current_rental.rent_start_date, room.current_rental.rent_end_date) }}</text>
          </view>
        </view>
        
        <view class="room-actions">
          <button class="action-btn edit" @click.stop="editRoom(room)">编辑</button>
          <button class="action-btn utilities" @click.stop="manageUtilities(room)">水电</button>
          <button class="action-btn tenant" @click.stop="createRental(room)" v-if="room.status === 'available'">
            出租
          </button>
          <button class="action-btn tenant-end" @click.stop="terminateRental(room)" v-if="room.status === 'rented'">
            退租
          </button>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <text>{{ loading ? '加载中...' : '上拉加载更多' }}</text>
      </view>
    </scroll-view>

    <!-- 底部统计 -->
    <view class="statistics">
      <view class="stat-item">
        <text class="stat-number">{{ statistics.total }}</text>
        <text class="stat-label">总房间</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ statistics.rented }}</text>
        <text class="stat-label">已租</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ statistics.available }}</text>
        <text class="stat-label">空闲</text>
      </view>
    </view>
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
    
    // Tab切换
    switchTab(tab) {
      if (this.currentTab === tab) return;
      this.currentTab = tab;
      this.refreshData();
    },
    
    // 搜索
    onSearch() {
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
    
    // 查看房间详情
    viewRoom(room) {
      uni.navigateTo({
        url: `/pages/room-detail/room-detail?id=${room._id}`
      });
    },
    
    // 编辑房间
    editRoom(room) {
      uni.navigateTo({
        url: `/pages/room-edit/room-edit?id=${room._id}`
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
    
    // 管理水电
    manageUtilities(room) {
      uni.navigateTo({
        url: `/pages/utility-record/utility-record?roomId=${room._id}`
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
  flex-direction: column;
  align-items: center;
  padding: 24rpx 12rpx;
  position: relative;
  min-width: 0; /* 防止文字溢出 */
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
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.tab-count {
  font-size: 22rpx;
  color: #999;
}

.tab-item.active .tab-count {
  color: #007AFF;
}

/* 操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
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
  padding: 20rpx 32rpx;
}

.room-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.room-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.room-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.status-available {
  background-color: #52c41a;
}

.status-rented {
  background-color: #ff4d4f;
}

.status-maintenance {
  background-color: #faad14;
}

.room-info, .tenant-info {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
  width: 50%;
  margin-bottom: 12rpx;
}

.label {
  color: #999;
  font-size: 28rpx;
  margin-right: 12rpx;
}

.value {
  color: #333;
  font-size: 28rpx;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
}

.room-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
}

.edit {
  background-color: #1890ff;
  color: white;
}

.utilities {
  background-color: #52c41a;
  color: white;
}

.tenant {
  background-color: #722ed1;
  color: white;
}

.tenant-end {
  background-color: #ff4d4f;
  color: white;
}

.load-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.statistics {
  display: flex;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}
</style>