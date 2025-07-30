<template>
  <view class="container">
    <form @submit="saveRoom">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <view class="form-label">房间号 *</view>
          <input 
            class="form-input"
            v-model="formData.room_number"
            placeholder="请输入房间号"
            :disabled="isEdit"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">楼层</view>
          <input 
            class="form-input"
            v-model.number="formData.floor"
            type="number"
            placeholder="请输入楼层"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">面积(㎡)</view>
          <input 
            class="form-input"
            v-model.number="formData.area"
            type="digit"
            placeholder="请输入面积"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">租金(元/月) *</view>
          <input 
            class="form-input"
            v-model.number="formData.rent_price"
            type="digit"
            placeholder="请输入租金"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">房间状态</view>
          <picker @change="onStatusChange" :value="statusIndex" :range="statusOptions" range-key="text">
            <view class="picker-input">
              {{ statusOptions[statusIndex].text }}
              <text class="arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 水电设置 -->
      <view class="form-section">
        <view class="section-title">水电设置</view>
        
        <view class="form-item">
          <view class="form-label">当前电表读数(度)</view>
          <input 
            class="form-input"
            v-model.number="formData.utilities.electricity_reading"
            type="digit"
            placeholder="请输入电表读数"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">当前水表读数(吨)</view>
          <input 
            class="form-input"
            v-model.number="formData.utilities.water_reading"
            type="digit"
            placeholder="请输入水表读数"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">电费单价(元/度)</view>
          <input 
            class="form-input"
            v-model.number="formData.utilities.electricity_rate"
            type="digit"
            placeholder="请输入电费单价"
          />
        </view>
        
        <view class="form-item">
          <view class="form-label">水费单价(元/吨)</view>
          <input 
            class="form-input"
            v-model.number="formData.utilities.water_rate"
            type="digit"
            placeholder="请输入水费单价"
          />
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="form-actions">
        <button class="btn-cancel" @click="cancel">取消</button>
        <button class="btn-save" @click="saveRoom">保存</button>
      </view>
    </form>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isEdit: false,
      roomId: '',
      formData: {
        room_number: '',
        floor: '',
        area: '',
        rent_price: '',
        status: 'available',
        utilities: {
          electricity_reading: 0,
          water_reading: 0,
          electricity_rate: 0.5,
          water_rate: 3.0
        }
      },
      statusIndex: 0,
      statusOptions: [
        { value: 'available', text: '可租用' },
        { value: 'rented', text: '已租用' },
        { value: 'maintenance', text: '维修中' }
      ]
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.isEdit = true;
      this.roomId = options.id;
      this.loadRoomInfo();
      uni.setNavigationBarTitle({
        title: '编辑房间'
      });
    } else {
      uni.setNavigationBarTitle({
        title: '添加房间'
      });
    }
  },
  
  methods: {
    // 加载房间信息（编辑时）
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
          const roomData = result.result.data;
          this.formData = {
            room_number: roomData.room_number,
            floor: roomData.floor || '',
            area: roomData.area || '',
            rent_price: roomData.rent_price,
            status: roomData.status,
            utilities: {
              electricity_reading: roomData.utilities?.electricity_reading || 0,
              water_reading: roomData.utilities?.water_reading || 0,
              electricity_rate: roomData.utilities?.electricity_rate || 0.5,
              water_rate: roomData.utilities?.water_rate || 3.0
            }
          };
          
          // 设置状态选择器
          this.statusIndex = this.statusOptions.findIndex(option => option.value === roomData.status);
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
      }
    },
    
    // 状态选择
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.formData.status = this.statusOptions[this.statusIndex].value;
    },
    
    // 表单验证
    validateForm() {
      if (!this.formData.room_number.trim()) {
        uni.showToast({
          title: '请输入房间号',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.rent_price || this.formData.rent_price <= 0) {
        uni.showToast({
          title: '请输入有效的租金',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    // 保存房间
    async saveRoom() {
      if (!this.validateForm()) return;
      
      uni.showLoading({
        title: '保存中...'
      });
      
      try {
        const action = this.isEdit ? 'updateRoom' : 'addRoom';
        const data = this.isEdit 
          ? { id: this.roomId, ...this.formData }
          : this.formData;
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action,
            data
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: this.isEdit ? '更新成功' : '添加成功',
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
        console.error('保存房间失败:', error);
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

.form-input[disabled] {
  background-color: #f5f5f5;
  color: #999;
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
}

.arrow {
  color: #999;
  font-size: 24rpx;
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
</style>