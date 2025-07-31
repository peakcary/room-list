<template>
  <view class="container">
    <view class="header">
      <text class="title">🔗 服务空间绑定测试</text>
    </view>
    
    <view class="test-section">
      <view class="test-item">
        <text class="label">环境信息:</text>
        <text class="value">{{ environmentInfo }}</text>
      </view>
      
      <view class="test-item">
        <text class="label">uniCloud状态:</text>
        <text class="value" :class="uniCloudStatus.class">{{ uniCloudStatus.text }}</text>
      </view>
      
      <view class="test-item">
        <text class="label">服务空间:</text>
        <text class="value">{{ spaceInfo }}</text>
      </view>
      
      <view class="test-item">
        <text class="label">连接测试:</text>
        <text class="value" :class="connectionStatus.class">{{ connectionStatus.text }}</text>
      </view>
      
      <button class="test-btn" @click="runTest">🧪 运行绑定测试</button>
      
      <view class="result-section" v-if="testResult">
        <text class="result-title">测试结果:</text>
        <text class="result-text">{{ testResult }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getEnvironmentInfo, testCloudConnection } from '@/utils/cloud-init.js'

export default {
  data() {
    return {
      environmentInfo: '检测中...',
      uniCloudStatus: { text: '检测中...', class: '' },
      spaceInfo: 'mp-82beb92d-779d-44d1-a1d3-7fee8609024d',
      connectionStatus: { text: '未测试', class: '' },
      testResult: ''
    }
  },
  
  onLoad() {
    this.checkEnvironment()
  },
  
  methods: {
    checkEnvironment() {
      const env = getEnvironmentInfo()
      this.environmentInfo = `${env.platform} | ${env.environment}`
      
      if (env.uniCloudAvailable) {
        this.uniCloudStatus = { text: '✅ 已加载', class: 'success' }
      } else {
        this.uniCloudStatus = { text: '❌ 未加载', class: 'error' }
      }
    },
    
    async runTest() {
      this.testResult = '测试中...'
      this.connectionStatus = { text: '测试中...', class: 'testing' }
      
      try {
        const success = await testCloudConnection()
        
        if (success) {
          this.connectionStatus = { text: '✅ 连接成功', class: 'success' }
          this.testResult = '🎉 服务空间绑定正常！云函数调用成功，体验版应该可以正常工作。'
        } else {
          this.connectionStatus = { text: '❌ 连接失败', class: 'error' }
          this.testResult = '⚠️ 服务空间可能未正确绑定，请检查：\n1. uniCloud控制台中的应用绑定\n2. 微信公众平台的域名配置\n3. HBuilderX中的服务空间关联'
        }
      } catch (error) {
        this.connectionStatus = { text: '❌ 测试异常', class: 'error' }
        this.testResult = `🚨 绑定测试失败: ${error.message}\n\n请确认：\n1. 服务空间ID正确\n2. ClientSecret有效\n3. 云函数已部署`
      }
    }
  }
}
</script>

<style>
.container {
  padding: 40rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.test-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.test-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 32rpx;
  color: #666;
  font-weight: bold;
}

.value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
}

.success {
  color: #52c41a;
}

.error {
  color: #ff4d4f;
}

.testing {
  color: #1890ff;
}

.test-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 32rpx;
  margin: 40rpx 0;
  width: 100%;
}

.result-section {
  margin-top: 40rpx;
  padding: 30rpx;
  background: #f8f9ff;
  border-radius: 16rpx;
  border-left: 8rpx solid #667eea;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.result-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-line;
}
</style>