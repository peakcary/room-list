<template>
  <view class="change-password-container">
    <view class="change-password-card">
      <!-- 头部 -->
      <view class="header">
        <view class="header-icon">🔐</view>
        <view class="header-title">修改密码</view>
        <view class="header-subtitle">请输入原密码和新密码</view>
      </view>

      <!-- 修改密码表单 -->
      <view class="form-section">
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              class="form-input" 
              type="password" 
              v-model="formData.currentPassword"
              placeholder="请输入当前密码"
              @input="clearError"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🆕</text>
            <input 
              class="form-input" 
              type="password" 
              v-model="formData.newPassword"
              placeholder="请输入新密码"
              @input="clearError"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">✅</text>
            <input 
              class="form-input" 
              type="password" 
              v-model="formData.confirmPassword"
              placeholder="请再次输入新密码"
              @input="clearError"
            />
          </view>
        </view>

        <!-- 错误提示 -->
        <view class="error-message" v-if="errorMessage">
          <text class="error-text">{{ errorMessage }}</text>
        </view>

        <!-- 密码要求提示 -->
        <view class="password-tips">
          <view class="tips-title">密码要求：</view>
          <view class="tips-item">• 长度至少6位</view>
          <view class="tips-item">• 建议包含字母和数字</view>
        </view>

        <!-- 操作按钮 -->
        <view class="form-actions">
          <button 
            class="btn-cancel" 
            @click="handleCancel"
          >
            取消
          </button>
          <button 
            class="btn-save" 
            :class="{ loading: isLoading }"
            @click="handleChangePassword"
            :disabled="isLoading"
          >
            <text v-if="!isLoading">确认修改</text>
            <text v-else>修改中...</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      errorMessage: '',
      isLoading: false
    }
  },

  onLoad() {
    // 检查登录状态
    this.checkAuth();
  },

  methods: {
    // 检查认证状态
    checkAuth() {
      const { checkPageAuth } = require('../../utils/auth.js');
      return checkPageAuth();
    },

    // 清除错误信息
    clearError() {
      this.errorMessage = '';
    },

    // 表单验证
    validateForm() {
      if (!this.formData.currentPassword.trim()) {
        this.errorMessage = '请输入当前密码';
        return false;
      }

      if (!this.formData.newPassword.trim()) {
        this.errorMessage = '请输入新密码';
        return false;
      }

      if (this.formData.newPassword.length < 6) {
        this.errorMessage = '新密码长度至少6位';
        return false;
      }

      if (!this.formData.confirmPassword.trim()) {
        this.errorMessage = '请确认新密码';
        return false;
      }

      if (this.formData.newPassword !== this.formData.confirmPassword) {
        this.errorMessage = '两次输入的新密码不一致';
        return false;
      }

      if (this.formData.currentPassword === this.formData.newPassword) {
        this.errorMessage = '新密码不能与当前密码相同';
        return false;
      }

      return true;
    },

    // 处理修改密码
    async handleChangePassword() {
      if (!this.validateForm()) return;

      this.isLoading = true;
      this.errorMessage = '';

      try {
        // 验证当前密码并修改
        const result = await this.changePassword(
          this.formData.currentPassword,
          this.formData.newPassword
        );

        if (result.success) {
          // 修改成功
          uni.showToast({
            title: '密码修改成功',
            icon: 'success',
            duration: 2000
          });

          // 延迟返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        } else {
          this.errorMessage = result.message || '密码修改失败';
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        this.errorMessage = '修改过程中发生错误，请重试';
      } finally {
        this.isLoading = false;
      }
    },

    // 修改密码逻辑
    async changePassword(currentPassword, newPassword) {
      try {
        // 获取当前用户信息和密码修改方法
        const { getCurrentUser, changeUserPassword } = require('../../utils/auth.js');
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
          return { success: false, message: '用户信息不存在，请重新登录' };
        }

        // 调用auth模块的密码修改方法
        const result = changeUserPassword(currentUser.username, currentPassword, newPassword);
        
        return result;
      } catch (error) {
        console.error('修改密码过程中出错:', error);
        return { success: false, message: '系统错误，请稍后重试' };
      }
    },

    // 取消修改
    handleCancel() {
      if (this.formData.currentPassword || this.formData.newPassword || this.formData.confirmPassword) {
        uni.showModal({
          title: '确认取消',
          content: '确定要取消修改密码吗？已输入的内容将丢失。',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    }
  }
}
</script>

<style>
.change-password-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.change-password-card {
  width: 100%;
  max-width: 600rpx;
  background: white;
  border-radius: 24rpx;
  padding: 0;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
  color: white;
}

.header-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.header-subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.form-section {
  padding: 40rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(102, 126, 234, 0.1);
}

.input-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  color: #999;
}

.form-input {
  flex: 1;
  height: 88rpx;
  font-size: 32rpx;
  color: #333;
  background: transparent;
  border: none;
}

.form-input::placeholder {
  color: #999;
}

.error-message {
  margin-bottom: 24rpx;
  padding: 16rpx 20rpx;
  background: #ffeaea;
  border-radius: 8rpx;
  border-left: 6rpx solid #ff4757;
}

.error-text {
  font-size: 26rpx;
  color: #ff4757;
}

.password-tips {
  background: #f0f7ff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
  border: 1rpx solid #e1f0ff;
}

.tips-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 20rpx;
}

.btn-cancel, .btn-save {
  flex: 1;
  height: 88rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:active {
  background: #e8e8e8;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-save:not([disabled]):active {
  transform: scale(0.98);
}

.btn-save.loading {
  opacity: 0.8;
}

.btn-save[disabled] {
  opacity: 0.6;
}
</style>