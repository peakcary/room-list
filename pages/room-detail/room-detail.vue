<template>
  <view class="container">
    <view class="room-info-card" v-if="roomInfo">
      <!-- 房间基本信息 -->
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <view class="info-grid">
          <view class="info-item">
            <view class="info-label">房间号</view>
            <view class="info-value">{{ roomInfo.room_number }}</view>
          </view>
          <view class="info-item">
            <view class="info-label">楼层</view>
            <view class="info-value">{{ roomInfo.floor || '--' }}层</view>
          </view>
          <view class="info-item">
            <view class="info-label">面积</view>
            <view class="info-value">{{ roomInfo.area || '--' }}㎡</view>
          </view>
          <view class="info-item">
            <view class="info-label">租金</view>
            <view class="info-value price">¥{{ roomInfo.rent_price }}/月</view>
          </view>
          <view class="info-item">
            <view class="info-label">状态</view>
            <view class="info-value">
              <view class="status-tag" :class="'status-' + roomInfo.status">
                {{ getStatusText(roomInfo.status) }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 租户信息 -->
      <view class="info-section" v-if="roomInfo.tenant_info">
        <view class="section-title">租户信息</view>
        <view class="info-grid">
          <view class="info-item">
            <view class="info-label">姓名</view>
            <view class="info-value">{{ roomInfo.tenant_info.name }}</view>
          </view>
          <view class="info-item">
            <view class="info-label">身份证</view>
            <view class="info-value">{{ roomInfo.tenant_info.id_card }}</view>
          </view>
          <view class="info-item">
            <view class="info-label">电话</view>
            <view class="info-value phone" @click="callTenant">{{ roomInfo.tenant_info.phone }}</view>
          </view>
          <view class="info-item">
            <view class="info-label">租期开始</view>
            <view class="info-value">{{ formatDate(roomInfo.tenant_info.rent_start_date) }}</view>
          </view>
          <view class="info-item">
            <view class="info-label">租期结束</view>
            <view class="info-value">{{ formatDate(roomInfo.tenant_info.rent_end_date) }}</view>
          </view>
        </view>
      </view>

      <!-- 水电信息 -->
      <view class="info-section">
        <view class="section-title">水电信息</view>
        <view class="info-grid">
          <view class="info-item">
            <view class="info-label">电表读数</view>
            <view class="info-value">{{ roomInfo.utilities?.electricity_reading || 0 }}度</view>
          </view>
          <view class="info-item">
            <view class="info-label">水表读数</view>
            <view class="info-value">{{ roomInfo.utilities?.water_reading || 0 }}吨</view>
          </view>
          <view class="info-item">
            <view class="info-label">电费单价</view>
            <view class="info-value">¥{{ roomInfo.utilities?.electricity_rate || 0.5 }}/度</view>
          </view>
          <view class="info-item">
            <view class="info-label">水费单价</view>
            <view class="info-value">¥{{ roomInfo.utilities?.water_rate || 3.0 }}/吨</view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn edit" @click="editRoom">编辑房间</button>
        <button class="action-btn utilities" @click="manageUtilities">水电管理</button>
        <button class="action-btn tenant" @click="manageTenant" v-if="roomInfo.status === 'available'">
          添加租户
        </button>
        <button class="action-btn tenant-remove" @click="removeTenant" v-if="roomInfo.status === 'rented'">
          移除租户
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      roomInfo: null,
      loading: true,
      roomId: ''
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.roomId = options.id;
      this.loadRoomInfo();
    }
  },
  
  methods: {
    // 加载房间信息
    async loadRoomInfo() {
      this.loading = true;
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRoomById',
            data: { id: this.roomId }
          }
        });
        
        if (result.result.code === 0) {
          this.roomInfo = result.result.data;
          // 更新页面标题
          uni.setNavigationBarTitle({
            title: `${this.roomInfo.room_number}号房详情`
          });
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载房间信息失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 编辑房间
    editRoom() {
      uni.navigateTo({
        url: `/pages/room-edit/room-edit?id=${this.roomId}`
      });
    },
    
    // 管理水电
    manageUtilities() {
      uni.navigateTo({
        url: `/pages/utility-record/utility-record?roomId=${this.roomId}`
      });
    },
    
    // 管理租户
    manageTenant() {
      uni.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${this.roomId}`
      });
    },
    
    // 移除租户
    removeTenant() {
      uni.showModal({
        title: '确认操作',
        content: '确定要移除当前租户吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniCloud.callFunction({
                name: 'room-management',
                data: {
                  action: 'removeTenant',
                  data: { roomId: this.roomId }
                }
              });
              
              if (result.result.code === 0) {
                uni.showToast({
                  title: '移除成功',
                  icon: 'success'
                });
                this.loadRoomInfo(); // 重新加载数据
              } else {
                uni.showToast({
                  title: result.result.message,
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('移除租户失败:', error);
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 拨打电话
    callTenant() {
      if (this.roomInfo.tenant_info?.phone) {
        uni.makePhoneCall({
          phoneNumber: this.roomInfo.tenant_info.phone
        });
      }
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
    
    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return '--';
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    }
  }
}
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.room-info-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.info-section {
  padding: 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx 20rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
}

.phone {
  color: #007AFF;
  text-decoration: underline;
}

.status-tag {
  display: inline-block;
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

.action-buttons {
  padding: 40rpx;
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 200rpx;
  padding: 24rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: white;
}

.edit {
  background-color: #1890ff;
}

.utilities {
  background-color: #52c41a;
}

.tenant {
  background-color: #722ed1;
}

.tenant-remove {
  background-color: #ff4d4f;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}
</style>