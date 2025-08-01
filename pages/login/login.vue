<template>
  <view class="login-container">
    <view class="login-card">
      <!-- 头部Logo和标题 -->
      <view class="login-header">
        <view class="logo-section">
          <text class="logo-icon">🏠</text>
          <text class="app-title">房间管理系统</text>
        </view>
        <text class="login-subtitle">请登录以访问系统</text>
      </view>

      <!-- 登录表单 -->
      <view class="login-form">
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">👤</text>
            <input 
              class="form-input" 
              type="text" 
              v-model="loginForm.username"
              placeholder="请输入用户名"
              @input="clearError"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input 
              class="form-input" 
              type="password" 
              v-model="loginForm.password"
              placeholder="请输入密码"
              @input="clearError"
            />
          </view>
        </view>

        <!-- 错误提示 -->
        <view class="error-message" v-if="errorMessage">
          <text class="error-text">{{ errorMessage }}</text>
        </view>

        <!-- 登录按钮 -->
        <button 
          class="login-btn" 
          :class="{ loading: isLoading }"
          @click="handleLogin"
          :disabled="isLoading"
        >
          <text v-if="!isLoading">登录</text>
          <text v-else>登录中...</text>
        </button>
      </view>
    </view>

    <!-- 版权信息 -->
    <view class="copyright">
      <text class="copyright-text">房间管理系统 v1.0</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      errorMessage: '',
      isLoading: false
    }
  },

  onLoad() {
    // 检查是否已经登录
    this.checkLoginStatus();
  },

  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('authToken');
      
      if (userInfo && token) {
        // 已登录，跳转到主页
        uni.reLaunch({
          url: '/pages/room-list/room-list'
        });
      }
    },

    // 清除错误信息
    clearError() {
      this.errorMessage = '';
    },

    // 处理登录
    async handleLogin() {
      // 表单验证
      if (!this.loginForm.username.trim()) {
        this.errorMessage = '请输入用户名';
        return;
      }

      if (!this.loginForm.password.trim()) {
        this.errorMessage = '请输入密码';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      try {
        // 调用登录验证
        const result = await this.validateLogin(this.loginForm.username, this.loginForm.password);
        
        if (result.success) {
          // 登录成功
          await this.handleLoginSuccess(result.userInfo);
        } else {
          this.errorMessage = result.message || '登录失败，请检查用户名和密码';
        }
      } catch (error) {
        console.error('登录失败:', error);
        this.errorMessage = '登录过程中发生错误，请重试';
      } finally {
        this.isLoading = false;
      }
    },

    // 验证登录
    async validateLogin(username, password) {
      // 使用auth.js中的账户存储系统进行验证
      try {
        const accounts = uni.getStorageSync('userAccounts');
        let validAccounts = [];
        
        if (accounts) {
          validAccounts = JSON.parse(accounts);
        } else {
          // 如果没有存储账户，使用默认账户并初始化存储
          validAccounts = [
            { username: 'admin', password: '123456', name: '系统管理员', role: 'admin' },
            { username: 'manager', password: '888888', name: '房管员', role: 'manager' }
          ];
          uni.setStorageSync('userAccounts', JSON.stringify(validAccounts));
        }

        const account = validAccounts.find(acc => 
          acc.username === username && acc.password === password
        );

        if (account) {
          return {
            success: true,
            userInfo: {
              username: account.username,
              name: account.name,
              role: account.role,
              loginTime: new Date().toISOString()
            }
          };
        } else {
          return {
            success: false,
            message: '用户名或密码错误'
          };
        }
      } catch (error) {
        console.error('登录验证过程中出错:', error);
        return {
          success: false,
          message: '登录验证失败，请重试'
        };
      }
    },

    // 处理登录成功
    async handleLoginSuccess(userInfo) {
      try {
        // 生成token
        const token = this.generateToken(userInfo);
        
        // 保存用户信息和token
        uni.setStorageSync('userInfo', userInfo);
        uni.setStorageSync('authToken', token);
        
        // 显示成功提示
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/room-list/room-list'
          });
        }, 1500);

      } catch (error) {
        console.error('保存登录信息失败:', error);
        this.errorMessage = '登录信息保存失败，请重试';
      }
    },

    // 生成简单的token
    generateToken(userInfo) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2);
      return `${userInfo.username}_${timestamp}_${randomStr}`;
    }
  }
}
</script>

<style>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.login-card {
  width: 100%;
  max-width: 600rpx;
  background: white;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.logo-icon {
  font-size: 64rpx;
  margin-right: 16rpx;
}

.app-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.login-subtitle {
  font-size: 28rpx;
  color: #666;
}

.login-form {
  width: 100%;
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

.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  margin-bottom: 32rpx;
}

.login-btn:not([disabled]):active {
  transform: scale(0.98);
}

.login-btn.loading {
  opacity: 0.8;
}

.login-btn[disabled] {
  opacity: 0.6;
}

.copyright {
  margin-top: 60rpx;
  text-align: center;
}

.copyright-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}
</style>