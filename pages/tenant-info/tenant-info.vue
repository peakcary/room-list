<template>
  <view class="container">
    <form @submit="saveTenant" v-if="!loading">
      <!-- 租户信息表单 -->
      <view class="form-section">
        <view class="section-title">租户信息</view>
        
        <view class="form-item">
          <view class="form-label">姓名 *</view>
          <input 
            class="form-input"
            v-model="formData.name"
            placeholder="请输入租户姓名"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">身份证号 *</view>
          <input 
            class="form-input"
            v-model="formData.id_card"
            placeholder="请输入身份证号"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">联系电话 *</view>
          <input 
            class="form-input"
            v-model="formData.phone"
            type="number"
            placeholder="请输入联系电话"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">租期开始日期 *</view>
          <picker 
            mode="date" 
            :value="formData.rent_start_date" 
            @change="onStartDateChange"
          >
            <view class="picker-input">
              {{ formData.rent_start_date || '请选择开始日期' }}
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <view class="form-label">租期结束日期 *</view>
          <picker 
            mode="date" 
            :value="formData.rent_end_date" 
            @change="onEndDateChange"
          >
            <view class="picker-input">
              {{ formData.rent_end_date || '请选择结束日期' }}
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 水电表读数 -->
      <view class="form-section">
        <view class="section-title">⚡ 入住水电表读数</view>
        <view class="section-note">请记录入住时的水电表读数，用于后续计费</view>
        
        <view class="utility-grid">
          <view class="utility-item">
            <text class="utility-label">电表读数</text>
            <view class="utility-input-group">
              <input 
                class="utility-input" 
                v-model="formData.electricity_reading" 
                type="digit"
                placeholder="0"
              />
              <text class="utility-unit">度</text>
            </view>
          </view>
          <view class="utility-item">
            <text class="utility-label">水表读数</text>
            <view class="utility-input-group">
              <input 
                class="utility-input" 
                v-model="formData.water_reading" 
                type="digit"
                placeholder="0"
              />
              <text class="utility-unit">吨</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 租赁信息 -->
      <view class="form-section">
        <view class="section-title">💰 租赁信息</view>
        
        <view class="form-item" v-if="roomInfo">
          <view class="form-label">房间号</view>
          <input 
            class="form-input"
            :value="roomInfo.room_number"
            disabled
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">月租金 *</view>
          <input 
            class="form-input"
            v-model.number="formData.rent_price"
            type="digit"
            placeholder="请输入月租金"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">押金</view>
          <input 
            class="form-input"
            v-model.number="formData.deposit"
            type="digit"
            placeholder="请输入押金金额"
          />
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="form-actions">
        <button class="btn-cancel" @click="cancel">取消</button>
        <button class="btn-save" @click="saveTenant">保存</button>
      </view>
    </form>

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
      loading: true,
      roomId: '',
      roomInfo: null,
      formData: {
        name: '',
        id_card: '',
        phone: '',
        rent_start_date: '',
        rent_end_date: '',
        rent_price: '',
        deposit: '',
        electricity_reading: '0',
        water_reading: '0'
      }
    }
  },
  
  onLoad(options) {
    // 检查登录状态
    this.checkAuth();
    
    if (options.roomId) {
      this.roomId = options.roomId;
      this.loadRoomInfo();
    } else {
      this.loading = false;
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
          
          // 如果房间已有租户，加载租户信息进行编辑
          if (this.roomInfo.tenant_info) {
            this.formData = {
              name: this.roomInfo.tenant_info.name || '',
              id_card: this.roomInfo.tenant_info.id_card || '',
              phone: this.roomInfo.tenant_info.phone || '',
              rent_start_date: this.formatDateForPicker(this.roomInfo.tenant_info.rent_start_date),
              rent_end_date: this.formatDateForPicker(this.roomInfo.tenant_info.rent_end_date)
            };
            
            uni.setNavigationBarTitle({
              title: '编辑租户信息'
            });
          } else {
            uni.setNavigationBarTitle({
              title: '添加租户信息'
            });
          }
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
    
    // 开始日期选择
    onStartDateChange(e) {
      this.formData.rent_start_date = e.detail.value;
    },
    
    // 结束日期选择
    onEndDateChange(e) {
      this.formData.rent_end_date = e.detail.value;
    },
    
    // 格式化日期为picker需要的格式
    formatDateForPicker(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 表单验证
    validateForm() {
      if (!this.formData.name.trim()) {
        uni.showToast({
          title: '请输入租户姓名',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.id_card.trim()) {
        uni.showToast({
          title: '请输入身份证号',
          icon: 'none'
        });
        return false;
      }
      
      // 简单的身份证号验证
      if (!/^\d{17}[\dXx]$/.test(this.formData.id_card)) {
        uni.showToast({
          title: '请输入有效的身份证号',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.phone.trim()) {
        uni.showToast({
          title: '请输入联系电话',
          icon: 'none'
        });
        return false;
      }
      
      
      if (!this.formData.rent_start_date) {
        uni.showToast({
          title: '请选择租期开始日期',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.rent_end_date) {
        uni.showToast({
          title: '请选择租期结束日期',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.rent_price || this.formData.rent_price <= 0) {
        uni.showToast({
          title: '请输入有效的月租金',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    // 保存租户信息
    async saveTenant() {
      if (!this.validateForm()) return;
      
      uni.showLoading({
        title: '保存中...'
      });
      
      try {
        // 先创建租户
        const tenantData = {
          name: this.formData.name.trim(),
          id_card: this.formData.id_card.trim(),
          phone: this.formData.phone.trim(),
          status: 'active'
        };
        
        const tenantResult = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addTenant',
            data: tenantData
          }
        });
        
        if (tenantResult.result.code !== 0) {
          uni.showToast({
            title: tenantResult.result.message,
            icon: 'none'
          });
          return;
        }
        
        const tenantId = tenantResult.result.data.id;
        
        // 创建租赁关系
        const rentalData = {
          room_id: this.roomId,
          tenant_id: tenantId,
          rent_price: parseFloat(this.formData.rent_price),
          deposit: parseFloat(this.formData.deposit) || parseFloat(this.formData.rent_price), // 押金默认等于租金
          rent_start_date: this.formData.rent_start_date,
          rent_end_date: this.formData.rent_end_date,
          utilities_included: false,
          electricity_start_reading: parseFloat(this.formData.electricity_reading) || 0,
          water_start_reading: parseFloat(this.formData.water_reading) || 0,
          contract_notes: `${this.roomInfo.room_number}号房租赁合同`
        };
        
        const rentalResult = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'createRental',
            data: rentalData
          }
        });
        
        if (rentalResult.result.code === 0) {
          uni.showToast({
            title: '租赁创建成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            // 通知页面刷新
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.route.includes('room-list')) {
              prevPage.$vm.refreshData();
            }
            uni.navigateBack();
          }, 1500);
        } else {
          // 如果租赁创建失败，删除已创建的租户
          await uniCloud.callFunction({
            name: 'room-management',
            data: {
              action: 'deleteTenant',
              data: { id: tenantId }
            }
          });
          
          uni.showToast({
            title: rentalResult.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('保存租户信息失败:', error);
        uni.showToast({
          title: '保存失败',
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

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
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

.form-input:focus {
  border-color: #007AFF;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  background-color: #fff;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 24rpx;
}

.section-note {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
  line-height: 1.4;
}

.utility-grid {
  display: flex;
  gap: 24rpx;
}

.utility-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
}

.utility-label {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.utility-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

.utility-input {
  flex: 1;
  padding: 16rpx 40rpx 16rpx 16rpx;
  border: 2rpx solid #e9ecef;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  background-color: white;
}

.utility-unit {
  position: absolute;
  right: 12rpx;
  font-size: 24rpx;
  color: #999;
}

.room-info {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #666;
  font-size: 28rpx;
  margin-right: 12rpx;
}

.info-value {
  color: #333;
  font-size: 28rpx;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  padding: 40rpx 20rpx;
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

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}
</style>