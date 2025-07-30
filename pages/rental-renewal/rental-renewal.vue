<template>
  <view class="container">
    <view class="loading-container" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
    
    <view v-else>
      <!-- 房间信息卡片 -->
      <view class="room-card">
        <view class="room-header">
          <text class="room-title">🏠 {{ roomInfo.room_number }}号房</text>
          <view class="room-status rented">已租用</view>
        </view>
        <view class="room-details">
          <view class="detail-item">
            <text class="detail-label">当前租金</text>
            <text class="detail-value price">¥{{ roomInfo.rent_price }}/月</text>
          </view>
          <view class="detail-item" v-if="roomInfo.deposit_amount">
            <text class="detail-label">押金</text>
            <text class="detail-value">¥{{ roomInfo.deposit_amount }}</text>
          </view>
        </view>
      </view>

      <!-- 当前租户信息 -->
      <view class="tenant-card">
        <view class="tenant-header">
          <text class="tenant-title">👤 当前租户</text>
        </view>
        <view class="tenant-details">
          <view class="tenant-row">
            <text class="tenant-name">{{ rentalInfo.tenant_info.name }}</text>
            <text class="tenant-phone" @tap="callTenant(rentalInfo.tenant_info.phone)">
              📞 {{ rentalInfo.tenant_info.phone }}
            </text>
          </view>
          <view class="rental-period">
            <text class="period-text">📅 {{ formatDateRange(rentalInfo.rent_start_date, rentalInfo.rent_end_date) }}</text>
            <view class="days-remaining" :class="getDaysRemainingClass(rentalInfo.rent_end_date)">
              <text class="days-text">{{ getDaysRemaining(rentalInfo.rent_end_date) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 续租表单 -->
      <view class="renewal-form">
        <view class="form-header">
          <text class="form-title">🔄 续租设置</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">新的结束日期</text>
          <picker mode="date" :value="formData.new_rent_end_date" @change="onEndDateChange">
            <view class="date-picker">
              <text class="date-text">{{ formData.new_rent_end_date || '请选择结束日期' }}</text>
              <text class="picker-arrow">📅</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <text class="form-label">新租金（可选）</text>
          <input 
            class="form-input" 
            v-model="formData.new_rent_price" 
            type="digit"
            placeholder="不填则使用当前租金"
          />
          <text class="input-unit">元/月</text>
        </view>

        <view class="utility-section">
          <view class="utility-header">
            <text class="utility-title">⚡ 水电表读数</text>
            <text class="utility-subtitle">续租时更新水电表读数</text>
          </view>
          
          <view class="utility-row">
            <view class="utility-item">
              <text class="utility-label">当前电表</text>
              <text class="utility-current">{{ rentalInfo.electricity_start_reading || 0 }}度</text>
              <input 
                class="utility-input" 
                v-model="formData.electricity_reading" 
                type="digit"
                placeholder="新读数"
              />
            </view>
            <view class="utility-item">
              <text class="utility-label">当前水表</text>
              <text class="utility-current">{{ rentalInfo.water_start_reading || 0 }}吨</text>
              <input 
                class="utility-input" 
                v-model="formData.water_reading" 
                type="digit"
                placeholder="新读数"
              />
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea 
            class="form-textarea" 
            v-model="formData.contract_notes" 
            placeholder="续租合同备注（可选）"
            maxlength="200"
          />
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="btn cancel-btn" @click="cancel">取消</button>
        <button class="btn confirm-btn" @click="confirmRenewal">确认续租</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      rentalId: '',
      roomId: '',
      roomInfo: null,
      rentalInfo: null,
      formData: {
        new_rent_end_date: '',
        new_rent_price: '',
        electricity_reading: '',
        water_reading: '',
        contract_notes: ''
      }
    }
  },
  
  onLoad(options) {
    this.rentalId = options.rentalId;
    this.roomId = options.roomId;
    this.loadData();
  },
  
  methods: {
    // 加载数据
    async loadData() {
      try {
        // 加载租赁信息
        const rentalResult = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRentalInfo',
            data: { rental_id: this.rentalId }
          }
        });
        
        if (rentalResult.result.code === 0) {
          this.rentalInfo = rentalResult.result.data;
          this.roomInfo = this.rentalInfo.room_info;
          
          // 设置默认值
          const endDate = new Date(this.rentalInfo.rent_end_date);
          endDate.setFullYear(endDate.getFullYear() + 1); // 默认续租一年
          this.formData.new_rent_end_date = this.formatDateForPicker(endDate);
          // 使用当前租赁记录中的读数作为默认值
          this.formData.electricity_reading = this.rentalInfo.electricity_start_reading || 0;
          this.formData.water_reading = this.rentalInfo.water_start_reading || 0;
        } else {
          uni.showToast({
            title: rentalResult.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 日期选择
    onEndDateChange(e) {
      this.formData.new_rent_end_date = e.detail.value;
    },
    
    // 格式化日期为picker格式
    formatDateForPicker(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
    
    // 获取剩余天数样式
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
    
    // 表单验证
    validateForm() {
      if (!this.formData.new_rent_end_date) {
        uni.showToast({
          title: '请选择新的结束日期',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    // 确认续租
    async confirmRenewal() {
      if (!this.validateForm()) return;
      
      uni.showModal({
        title: '确认续租',
        content: `确定要将${this.roomInfo.room_number}号房续租到${this.formData.new_rent_end_date}吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.submitRenewal();
          }
        }
      });
    },
    
    // 提交续租
    async submitRenewal() {
      uni.showLoading({ title: '处理中...' });
      
      try {
        const renewalData = {
          rental_id: this.rentalId,
          new_rent_end_date: this.formData.new_rent_end_date,
          new_rent_price: this.formData.new_rent_price ? parseFloat(this.formData.new_rent_price) : null,
          electricity_reading: parseFloat(this.formData.electricity_reading) || 0,
          water_reading: parseFloat(this.formData.water_reading) || 0,
          contract_notes: this.formData.contract_notes
        };
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'renewRental',
            data: renewalData
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '续租成功',
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
        console.error('续租失败:', error);
        uni.showToast({
          title: '续租失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 取消
    cancel() {
      uni.navigateBack();
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.loading-text {
  font-size: 32rpx;
  color: #999;
}

/* 房间信息卡片 */
.room-card {
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

.room-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.room-status.rented {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: white;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.room-details {
  display: flex;
  gap: 40rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.detail-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.detail-value.price {
  color: #ff4d4f;
}

/* 租户信息卡片 */
.tenant-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  color: white;
}

.tenant-header {
  margin-bottom: 16rpx;
}

.tenant-title {
  font-size: 32rpx;
  font-weight: bold;
}

.tenant-details {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  padding: 20rpx;
}

.tenant-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.tenant-name {
  font-size: 32rpx;
  font-weight: bold;
}

.tenant-phone {
  font-size: 28rpx;
  text-decoration: underline;
  cursor: pointer;
}

.rental-period {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.period-text {
  font-size: 26rpx;
}

.days-remaining {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.days-remaining.normal {
  background-color: rgba(82, 196, 26, 0.3);
}

.days-remaining.warning {
  background-color: rgba(250, 173, 20, 0.3);
}

.days-remaining.urgent,
.days-remaining.expired {
  background-color: rgba(255, 77, 79, 0.3);
}

.days-text {
  font-size: 22rpx;
  font-weight: bold;
}

/* 续租表单 */
.renewal-form {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.form-header {
  margin-bottom: 32rpx;
}

.form-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.form-item {
  margin-bottom: 32rpx;
  position: relative;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid #e9ecef;
}

.date-text {
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  font-size: 24rpx;
  opacity: 0.6;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid #e9ecef;
  font-size: 28rpx;
}

.input-unit {
  position: absolute;
  right: 20rpx;
  top: 60rpx;
  font-size: 26rpx;
  color: #999;
}

.form-textarea {
  width: 100%;
  height: 120rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid #e9ecef;
  font-size: 28rpx;
  resize: none;
}

/* 水电表部分 */
.utility-section {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}

.utility-header {
  margin-bottom: 20rpx;
}

.utility-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.utility-subtitle {
  font-size: 24rpx;
  color: #666;
}

.utility-row {
  display: flex;
  gap: 20rpx;
}

.utility-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  border-radius: 8rpx;
  padding: 20rpx;
}

.utility-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.utility-current {
  font-size: 24rpx;
  color: #1890ff;
  margin-bottom: 12rpx;
  font-weight: bold;
}

.utility-input {
  width: 100%;
  padding: 12rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  text-align: center;
  font-size: 26rpx;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
}

.btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  text-align: center;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(19, 194, 194, 0.3);
}

.confirm-btn:active {
  transform: scale(0.98);
}
</style>