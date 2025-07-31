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


      <!-- 出租历史记录 -->
      <view class="info-section">
        <view class="section-title">📋 出租历史记录</view>
        
        <view class="rental-history-list" v-if="rentalHistory.length > 0">
          <view class="rental-history-item" v-for="rental in rentalHistory" :key="rental._id">
            <view class="rental-header">
              <view class="rental-tenant-name">{{ rental.tenant_info?.name || '租户信息缺失' }}</view>
              <view class="rental-status" :class="'rental-status-' + rental.status">
                {{ getRentalStatusText(rental.status) }}
              </view>
            </view>
            <view class="rental-details">
              <view class="rental-period">
                <text class="period-label">租期:</text>
                <text class="period-value">{{ formatDateRange(rental.rent_start_date, rental.rent_end_date) }}</text>
              </view>
              <view class="rental-info-row">
                <view class="rental-info-item">
                  <text class="info-label">月租金:</text>
                  <text class="info-value price">¥{{ rental.rent_price }}</text>
                </view>
                <view class="rental-info-item">
                  <text class="info-label">押金:</text>
                  <text class="info-value">¥{{ rental.deposit }}</text>
                </view>
              </view>
              <view class="rental-phone" v-if="rental.tenant_info?.phone">
                <text class="phone-label">电话:</text>
                <text class="phone-value" @tap="callTenant(rental.tenant_info.phone)">
                  📞 {{ rental.tenant_info.phone }}
                </text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="no-rental-history" v-else>
          <text>暂无出租历史记录</text>
        </view>
      </view>

      <!-- 维修记录 -->
      <view class="info-section">
        <view class="section-title-with-action">
          <text class="section-title">🔧 维修记录</text>
          <button class="add-maintenance-btn" @click="showAddMaintenance">+ 添加维修</button>
        </view>
        
        <view class="maintenance-list" v-if="maintenanceRecords.length > 0">
          <view class="maintenance-item" v-for="record in maintenanceRecords" :key="record._id">
            <view class="maintenance-header">
              <view class="maintenance-amount">¥{{ record.amount }}</view>
              <view class="maintenance-date">{{ formatDate(record.create_date) }}</view>
            </view>
            <view class="maintenance-content">{{ record.description }}</view>
          </view>
        </view>
        
        <view class="no-maintenance" v-else>
          <text>暂无维修记录</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn tenant" @click="manageTenant" v-if="roomInfo.status === 'available'">
          添加租户
        </button>
        <button class="action-btn delete" @click="deleteRoom" v-if="roomInfo.status === 'available'">
          删除房间
        </button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
    
    <!-- 添加维修记录弹窗 -->
    <view class="maintenance-modal" v-if="showMaintenanceModal" @click="closeAddMaintenance">
      <view class="maintenance-popup" @click.stop>
        <view class="popup-header">
          <text class="popup-title">添加维修记录</text>
          <button class="close-btn" @click="closeAddMaintenance">×</button>
        </view>
        
        <view class="popup-content">
          <view class="form-item">
            <view class="form-label">维修金额 *</view>
            <input 
              class="form-input"
              v-model="maintenanceForm.amount"
              type="digit"
              placeholder="请输入维修金额"
            />
          </view>
          
          <view class="form-item">
            <view class="form-label">维修内容 *</view>
            <textarea 
              class="form-textarea"
              v-model="maintenanceForm.description"
              placeholder="请描述维修内容"
              maxlength="200"
            ></textarea>
          </view>
        </view>
        
        <view class="popup-actions">
          <button class="btn-cancel" @click="closeAddMaintenance">取消</button>
          <button class="btn-save" @click="saveMaintenance">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      roomInfo: null,
      loading: true,
      roomId: '',
      maintenanceRecords: [],
      rentalHistory: [],
      showMaintenanceModal: false,
      maintenanceForm: {
        amount: '',
        description: ''
      }
    }
  },
  
  onLoad(options) {
    // 检查登录状态
    this.checkAuth();
    
    if (options.id) {
      this.roomId = options.id;
      this.loadRoomInfo();
    }
  },
  
  methods: {
    // 检查认证状态
    checkAuth() {
      const { checkPageAuth } = require('../../utils/auth.js');
      return checkPageAuth();
    },
    
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
          // 加载维修记录和出租历史
          await this.loadMaintenanceRecords();
          await this.loadRentalHistory();
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
    
    // 加载维修记录
    async loadMaintenanceRecords() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getMaintenanceRecords',
            data: { roomId: this.roomId }
          }
        });
        
        if (result.result.code === 0) {
          this.maintenanceRecords = result.result.data || [];
        }
      } catch (error) {
        console.error('加载维修记录失败:', error);
      }
    },
    
    // 显示添加维修弹窗
    showAddMaintenance() {
      this.maintenanceForm = {
        amount: '',
        description: ''
      };
      this.showMaintenanceModal = true;
    },
    
    // 关闭添加维修弹窗
    closeAddMaintenance() {
      this.showMaintenanceModal = false;
    },
    
    // 保存维修记录
    async saveMaintenance() {
      if (!this.maintenanceForm.amount || !this.maintenanceForm.description) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({ title: '保存中...' });
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addMaintenanceRecord',
            data: {
              roomId: this.roomId,
              amount: parseFloat(this.maintenanceForm.amount),
              description: this.maintenanceForm.description.trim()
            }
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });
          this.closeAddMaintenance();
          await this.loadMaintenanceRecords();
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('保存维修记录失败:', error);
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    
    // 管理租户
    manageTenant() {
      uni.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${this.roomId}`
      });
    },
    
    // 删除房间
    deleteRoom() {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除${this.roomInfo.room_number}号房吗？此操作不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '删除中...' });
              
              const result = await uniCloud.callFunction({
                name: 'room-management',
                data: {
                  action: 'deleteRoom',
                  data: { id: this.roomId }
                }
              });
              
              if (result.result.code === 0) {
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                setTimeout(() => {
                  uni.navigateBack();
                }, 1500);
              } else {
                uni.showToast({
                  title: result.result.message,
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('删除房间失败:', error);
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    
    // 拨打电话
    callTenant(phoneNumber) {
      // 如果传入了电话号码参数就用参数，否则使用当前租户信息
      const phone = phoneNumber || this.roomInfo.tenant_info?.phone;
      if (phone) {
        uni.makePhoneCall({
          phoneNumber: phone,
          fail: (err) => {
            console.error('拨打电话失败:', err);
            uni.showToast({
              title: '拨打失败',
              icon: 'none'
            });
          }
        });
      } else {
        uni.showToast({
          title: '电话号码不存在',
          icon: 'none'
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
    },
    
    // 加载出租历史记录
    async loadRentalHistory() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRentalHistory',
            data: { roomId: this.roomId }
          }
        });
        
        if (result.result.code === 0) {
          this.rentalHistory = result.result.data || [];
        }
      } catch (error) {
        console.error('加载出租历史失败:', error);
      }
    },
    
    // 获取租赁状态文本
    getRentalStatusText(status) {
      const statusMap = {
        active: '在租',
        terminated: '已终止',
        expired: '已过期'
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


.tenant {
  background-color: #722ed1;
}

.delete {
  background-color: #ff4d4f;
}


.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}

/* 维修记录样式 */
.section-title-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.add-maintenance-btn {
  padding: 12rpx 20rpx;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.maintenance-list {
  max-height: 400rpx;
  overflow-y: auto;
}

.maintenance-item {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #fa8c16;
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.maintenance-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #fa8c16;
}

.maintenance-date {
  font-size: 24rpx;
  color: #999;
}

.maintenance-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}

.no-maintenance {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 出租历史记录样式 */
.rental-history-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.rental-history-item {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #1890ff;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.1);
}

.rental-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.rental-tenant-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1890ff;
}

.rental-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: bold;
  color: white;
}

.rental-status-active {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.rental-status-terminated {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.rental-status-expired {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}

.rental-details {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8rpx;
  padding: 16rpx;
}

.rental-period {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.period-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 8rpx;
}

.period-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.rental-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.rental-info-item {
  display: flex;
  align-items: center;
}

.rental-info-item .info-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 8rpx;
}

.rental-info-item .info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.rental-info-item .info-value.price {
  color: #ff4d4f;
  font-weight: bold;
}

.rental-phone {
  display: flex;
  align-items: center;
}

.phone-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 8rpx;
}

.phone-value {
  font-size: 26rpx;
  color: #1890ff;
  text-decoration: underline;
}

.no-rental-history {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 弹窗样式 */
.maintenance-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.maintenance-popup {
  background-color: white;
  border-radius: 20rpx 20rpx 0 0;
  width: 100%;
  max-height: 80vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  color: #999;
  border: none;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-content {
  padding: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
}

.form-textarea {
  min-height: 120rpx;
  resize: none;
}

.form-input:focus, .form-textarea:focus {
  border-color: #007AFF;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
  padding: 40rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel, .btn-save {
  flex: 1;
  padding: 28rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

.btn-save {
  background-color: #007AFF;
  color: white;
}
</style>