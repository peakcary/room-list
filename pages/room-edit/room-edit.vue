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
import { checkPageAuth } from '../../utils/auth.js';

export default {
  data() {
    return {
      formData: {
        room_number: '',
        floor: ''
      }
    }
  },
  
  onLoad(options) {
    // 检查登录状态
    this.checkAuth();
    
    uni.setNavigationBarTitle({
      title: '添加房间'
    });
  },
  
  methods: {
    // 检查认证状态
    checkAuth() {
      return checkPageAuth();
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
      
      return true;
    },
    
    // 保存房间
    async saveRoom() {
      if (!this.validateForm()) return;
      
      uni.showLoading({
        title: '添加中...'
      });
      
      try {
        const roomData = {
          ...this.formData,
          status: 'available' // 新房间默认为可租用状态
        };
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addRoom',
            data: roomData
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '添加成功',
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
        console.error('添加房间失败:', error);
        uni.showToast({
          title: '添加失败',
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