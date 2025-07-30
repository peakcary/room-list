<template>
  <view class="container">
    <!-- 房间信息 -->
    <view class="room-header" v-if="roomInfo">
      <view class="room-title">{{ roomInfo.room_number }}号房 - 水电管理</view>
      <view class="current-readings">
        <view class="reading-item">
          <text class="reading-label">当前电表:</text>
          <text class="reading-value">{{ roomInfo.utilities?.electricity_reading || 0 }}度</text>
        </view>
        <view class="reading-item">
          <text class="reading-label">当前水表:</text>
          <text class="reading-value">{{ roomInfo.utilities?.water_reading || 0 }}吨</text>
        </view>
      </view>
    </view>

    <!-- 添加记录按钮 -->
    <view class="add-record-btn" @click="showAddForm = true">
      <text class="btn-text">+ 添加水电记录</text>
    </view>

    <!-- 记录列表 -->
    <view class="record-list">
      <view class="record-item" v-for="record in recordList" :key="record._id">
        <view class="record-header">
          <view class="record-date">{{ formatDateTime(record.record_date) }}</view>
          <view class="record-status" :class="{ paid: record.is_paid }">
            {{ record.is_paid ? '已缴费' : '未缴费' }}
          </view>
        </view>
        
        <view class="record-details">
          <view class="detail-row">
            <view class="detail-item">
              <text class="detail-label">电表读数:</text>
              <text class="detail-value">{{ record.electricity_reading }}度</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">用电量:</text>
              <text class="detail-value">{{ record.electricity_usage }}度</text>
            </view>
          </view>
          
          <view class="detail-row">
            <view class="detail-item">
              <text class="detail-label">水表读数:</text>
              <text class="detail-value">{{ record.water_reading }}吨</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">用水量:</text>
              <text class="detail-value">{{ record.water_usage }}吨</text>
            </view>
          </view>
          
          <view class="detail-row">
            <view class="detail-item">
              <text class="detail-label">电费:</text>
              <text class="detail-value fee">¥{{ record.electricity_fee.toFixed(2) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">水费:</text>
              <text class="detail-value fee">¥{{ record.water_fee.toFixed(2) }}</text>
            </view>
          </view>
          
          <view class="total-fee">
            <text class="total-label">总费用:</text>
            <text class="total-value">¥{{ record.total_fee.toFixed(2) }}</text>
          </view>
        </view>
        
        <view class="record-actions" v-if="!record.is_paid">
          <button class="pay-btn" @click="markAsPaid(record._id)">标记已缴费</button>
        </view>
      </view>
      
      <view class="no-records" v-if="recordList.length === 0 && !loading">
        <text>暂无水电记录</text>
      </view>
    </view>

    <!-- 添加记录弹窗 -->
    <view class="modal-overlay" v-if="showAddForm" @click="closeAddForm">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加水电记录</text>
          <text class="modal-close" @click="closeAddForm">×</text>
        </view>
        
        <view class="form-content">
          <view class="form-item">
            <view class="form-label">电表读数(度)</view>
            <input 
              class="form-input"
              v-model.number="newRecord.electricity_reading"
              type="digit"
              placeholder="请输入当前电表读数"
            />
          </view>
          
          <view class="form-item">
            <view class="form-label">水表读数(吨)</view>
            <input 
              class="form-input"
              v-model.number="newRecord.water_reading"
              type="digit"
              placeholder="请输入当前水表读数"
            />
          </view>
        </view>
        
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="closeAddForm">取消</button>
          <button class="modal-btn confirm" @click="addRecord">确定</button>
        </view>
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
      roomId: '',
      roomInfo: null,
      recordList: [],
      loading: true,
      showAddForm: false,
      newRecord: {
        electricity_reading: '',
        water_reading: ''
      }
    }
  },
  
  onLoad(options) {
    if (options.roomId) {
      this.roomId = options.roomId;
      this.loadRoomInfo();
      this.loadRecords();
    }
  },
  
  methods: {
    // 加载房间信息
    async loadRoomInfo() {
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
        }
      } catch (error) {
        console.error('加载房间信息失败:', error);
      }
    },
    
    // 加载水电记录
    async loadRecords() {
      this.loading = true;
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getUtilityRecords',
            data: {
              roomId: this.roomId,
              pageSize: 50,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          this.recordList = result.result.data.list;
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载水电记录失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 添加水电记录
    async addRecord() {
      if (!this.newRecord.electricity_reading && !this.newRecord.water_reading) {
        uni.showToast({
          title: '请输入电表或水表读数',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '添加中...'
      });
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addUtilityRecord',
            data: {
              roomId: this.roomId,
              electricity_reading: this.newRecord.electricity_reading || 0,
              water_reading: this.newRecord.water_reading || 0
            }
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });
          
          this.closeAddForm();
          this.loadRecords();
          this.loadRoomInfo(); // 更新房间信息中的读数
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('添加水电记录失败:', error);
        uni.showToast({
          title: '添加失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 标记已缴费
    async markAsPaid(recordId) {
      uni.showModal({
        title: '确认操作',
        content: '确定要标记为已缴费吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniCloud.callFunction({
                name: 'room-management',
                data: {
                  action: 'updateUtilityPayment',
                  data: {
                    recordId,
                    isPaid: true
                  }
                }
              });
              
              if (result.result.code === 0) {
                uni.showToast({
                  title: '更新成功',
                  icon: 'success'
                });
                this.loadRecords();
              } else {
                uni.showToast({
                  title: result.result.message,
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('更新缴费状态失败:', error);
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 关闭添加表单
    closeAddForm() {
      this.showAddForm = false;
      this.newRecord = {
        electricity_reading: '',
        water_reading: ''
      };
    },
    
    // 格式化日期时间
    formatDateTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
  }
}
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.room-header {
  background-color: #fff;
  padding: 40rpx;
  border-bottom: 1rpx solid #eee;
}

.room-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.current-readings {
  display: flex;
  gap: 40rpx;
}

.reading-item {
  display: flex;
  align-items: center;
}

.reading-label {
  color: #666;
  font-size: 28rpx;
  margin-right: 8rpx;
}

.reading-value {
  color: #007AFF;
  font-size: 28rpx;
  font-weight: bold;
}

.add-record-btn {
  margin: 20rpx;
  padding: 32rpx;
  background-color: #007AFF;
  color: white;
  text-align: center;
  border-radius: 16rpx;
  font-size: 32rpx;
}

.record-list {
  padding: 0 20rpx 20rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.record-date {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.record-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background-color: #ff4d4f;
  color: white;
}

.record-status.paid {
  background-color: #52c41a;
}

.record-details {
  margin-bottom: 24rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.detail-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.detail-label {
  color: #666;
  font-size: 26rpx;
  margin-right: 8rpx;
}

.detail-value {
  color: #333;
  font-size: 26rpx;
}

.fee {
  color: #ff4d4f;
  font-weight: bold;
}

.total-fee {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.total-label {
  color: #333;
  font-size: 30rpx;
  font-weight: bold;
  margin-right: 12rpx;
}

.total-value {
  color: #ff4d4f;
  font-size: 32rpx;
  font-weight: bold;
}

.record-actions {
  display: flex;
  justify-content: flex-end;
}

.pay-btn {
  padding: 16rpx 32rpx;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.no-records {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 20rpx;
  width: 600rpx;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 40rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.form-content {
  padding: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 40rpx 40rpx;
}

.modal-btn {
  flex: 1;
  padding: 24rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.cancel {
  background-color: #f5f5f5;
  color: #666;
}

.confirm {
  background-color: #007AFF;
  color: white;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}
</style>