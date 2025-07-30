<template>
  <view class="container">
    <view class="header">
      <view class="title">🚀 系统部署管理</view>
      <view class="subtitle">一键完成云函数部署和数据库初始化</view>
    </view>

    <!-- 系统状态检查 -->
    <view class="section">
      <view class="section-title">📊 系统状态检查</view>
      <view class="status-card">
        <view class="status-item">
          <view class="status-label">云函数状态</view>
          <view class="status-value" :class="systemStatus.cloudFunction.class">
            {{ systemStatus.cloudFunction.text }}
          </view>
        </view>
        <view class="status-item">
          <view class="status-label">数据库状态</view>
          <view class="status-value" :class="systemStatus.database.class">
            {{ systemStatus.database.text }}
          </view>
        </view>
        <view class="status-item">
          <view class="status-label">示例数据</view>
          <view class="status-value" :class="systemStatus.sampleData.class">
            {{ systemStatus.sampleData.text }}
          </view>
        </view>
      </view>
      <button class="check-btn" @click="checkSystemStatus" :disabled="loading">
        {{ loading ? '检查中...' : '🔍 检查系统状态' }}
      </button>
    </view>

    <!-- 数据库初始化 -->
    <view class="section">
      <view class="section-title">🗄️ 数据库初始化</view>
      <view class="action-card">
        <view class="action-desc">初始化数据库集合和示例数据</view>
        <view class="action-buttons">
          <button class="action-btn primary" @click="initDatabase(false)" :disabled="loading">
            📚 创建示例数据
          </button>
          <button class="action-btn danger" @click="initDatabase(true)" :disabled="loading">
            🔄 重置所有数据
          </button>
        </view>
      </view>
    </view>

    <!-- 系统测试 -->
    <view class="section">
      <view class="section-title">🧪 功能测试</view>
      <view class="test-grid">
        <button class="test-btn" @click="testFunction('getRooms')" :disabled="loading">
          测试房间列表
        </button>
        <button class="test-btn" @click="testFunction('getIncomeStatistics')" :disabled="loading">
          测试收入统计
        </button>
        <button class="test-btn" @click="testFunction('getRoomOccupancyStatistics')" :disabled="loading">
          测试出租统计
        </button>
        <button class="test-btn" @click="testFunction('debugDatabase')" :disabled="loading">
          调试数据库
        </button>
      </view>
    </view>

    <!-- 数据修复 -->
    <view class="section">
      <view class="section-title">🔧 数据修复</view>
      <view class="action-card">
        <view class="action-desc">修复数据不一致问题</view>
        <button class="action-btn warning" @click="fixDataInconsistencies" :disabled="loading">
          🛠️ 修复数据不一致
        </button>
      </view>
    </view>

    <!-- 操作日志 -->
    <view class="section">
      <view class="section-title">📋 操作日志</view>
      <scroll-view class="log-container" scroll-y="true">
        <view class="log-item" v-for="(log, index) in logs" :key="index" :class="log.type">
          <view class="log-time">{{ log.time }}</view>
          <view class="log-content">{{ log.message }}</view>
        </view>
        <view class="no-logs" v-if="logs.length === 0">
          暂无操作日志
        </view>
      </scroll-view>
      <button class="clear-btn" @click="clearLogs">清空日志</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      systemStatus: {
        cloudFunction: { text: '未检查', class: 'unknown' },
        database: { text: '未检查', class: 'unknown' },
        sampleData: { text: '未检查', class: 'unknown' }
      },
      logs: []
    }
  },
  
  onLoad() {
    this.addLog('info', '系统部署管理页面已加载');
    // 自动检查系统状态
    setTimeout(() => {
      this.checkSystemStatus();
    }, 1000);
  },
  
  methods: {
    // 添加日志
    addLog(type, message) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      this.logs.unshift({
        type,
        message,
        time
      });
      
      // 限制日志数量
      if (this.logs.length > 50) {
        this.logs = this.logs.slice(0, 50);
      }
    },
    
    // 检查系统状态
    async checkSystemStatus() {
      this.loading = true;
      this.addLog('info', '开始检查系统状态...');
      
      try {
        // 检查云函数状态
        await this.checkCloudFunction();
        
        // 检查数据库状态
        await this.checkDatabase();
        
        // 检查示例数据
        await this.checkSampleData();
        
        this.addLog('success', '系统状态检查完成');
      } catch (error) {
        this.addLog('error', `系统状态检查失败: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    
    // 检查云函数状态
    async checkCloudFunction() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: { pageSize: 1, pageNum: 1 }
          }
        });
        
        if (result.result.code === 0) {
          this.systemStatus.cloudFunction = { text: '正常', class: 'success' };
          this.addLog('success', '云函数连接正常');
        } else {
          this.systemStatus.cloudFunction = { text: '异常', class: 'error' };
          this.addLog('error', `云函数异常: ${result.result.message}`);
        }
      } catch (error) {
        this.systemStatus.cloudFunction = { text: '未部署', class: 'error' };
        this.addLog('error', `云函数未部署或配置错误: ${error.message}`);
      }
    },
    
    // 检查数据库状态
    async checkDatabase() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'debugDatabase'
          }
        });
        
        if (result.result.code === 0) {
          this.systemStatus.database = { text: '正常', class: 'success' };
          this.addLog('success', '数据库连接正常');
        } else {
          this.systemStatus.database = { text: '异常', class: 'warning' };
          this.addLog('warning', `数据库异常: ${result.result.message}`);
        }
      } catch (error) {
        this.systemStatus.database = { text: '错误', class: 'error' };
        this.addLog('error', `数据库检查失败: ${error.message}`);
      }
    },
    
    // 检查示例数据
    async checkSampleData() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: { pageSize: 10, pageNum: 1 }
          }
        });
        
        if (result.result.code === 0) {
          const total = result.result.data.total;
          if (total > 0) {
            this.systemStatus.sampleData = { text: `已有${total}条数据`, class: 'success' };
            this.addLog('success', `发现${total}条房间数据`);
          } else {
            this.systemStatus.sampleData = { text: '无数据', class: 'warning' };
            this.addLog('warning', '数据库中没有房间数据');
          }
        }
      } catch (error) {
        this.systemStatus.sampleData = { text: '检查失败', class: 'error' };
        this.addLog('error', `示例数据检查失败: ${error.message}`);
      }
    },
    
    // 初始化数据库
    async initDatabase(forceReset = false) {
      const action = forceReset ? '重置数据库' : '初始化数据库';
      
      uni.showModal({
        title: '确认操作',
        content: `确定要${action}吗？${forceReset ? '这将删除所有现有数据！' : ''}`,
        success: async (res) => {
          if (res.confirm) {
            await this.performDatabaseInit(forceReset);
          }
        }
      });
    },
    
    // 执行数据库初始化
    async performDatabaseInit(forceReset) {
      this.loading = true;
      this.addLog('info', `开始${forceReset ? '重置' : '初始化'}数据库...`);
      
      try {
        const result = await uniCloud.callFunction({
          name: 'db-init',
          data: { forceReset }
        });
        
        if (result.result.code === 0) {
          this.addLog('success', `数据库${forceReset ? '重置' : '初始化'}成功`);
          uni.showToast({
            title: '操作成功',
            icon: 'success'
          });
          // 重新检查状态
          setTimeout(() => {
            this.checkSystemStatus();
          }, 2000);
        } else {
          this.addLog('error', `数据库操作失败: ${result.result.message}`);
          uni.showToast({
            title: '操作失败',
            icon: 'error'
          });
        }
      } catch (error) {
        this.addLog('error', `数据库操作异常: ${error.message}`);
        uni.showToast({
          title: '操作异常',
          icon: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 测试功能
    async testFunction(functionName) {
      this.loading = true;
      this.addLog('info', `测试功能: ${functionName}`);
      
      try {
        let testData = {};
        
        // 根据不同功能设置测试数据
        switch (functionName) {
          case 'getRooms':
            testData = { pageSize: 10, pageNum: 1 };
            break;
          case 'getIncomeStatistics':
            testData = { type: 'monthly' };
            break;
          case 'getRoomOccupancyStatistics':
            testData = {};
            break;
          case 'debugDatabase':
            testData = {};
            break;
        }
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: functionName,
            data: testData
          }
        });
        
        if (result.result.code === 0) {
          this.addLog('success', `${functionName} 测试成功`);
          console.log(`${functionName} 结果:`, result.result.data);
          
          uni.showModal({
            title: '测试成功',
            content: `${functionName} 功能正常，详细结果请查看控制台`,
            showCancel: false
          });
        } else {
          this.addLog('error', `${functionName} 测试失败: ${result.result.message}`);
          uni.showModal({
            title: '测试失败',
            content: result.result.message,
            showCancel: false
          });
        }
      } catch (error) {
        this.addLog('error', `${functionName} 测试异常: ${error.message}`);
        uni.showModal({
          title: '测试异常',
          content: error.message,
          showCancel: false
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 修复数据不一致
    async fixDataInconsistencies() {
      uni.showModal({
        title: '确认修复',
        content: '确定要修复数据不一致问题吗？',
        success: async (res) => {
          if (res.confirm) {
            this.loading = true;
            this.addLog('info', '开始修复数据不一致问题...');
            
            try {
              const result = await uniCloud.callFunction({
                name: 'room-management',
                data: {
                  action: 'fixDataInconsistencies'
                }
              });
              
              if (result.result.code === 0) {
                const fixes = result.result.data.fixes_applied;
                this.addLog('success', `数据修复完成，共修复${fixes}个问题`);
                uni.showToast({
                  title: `修复了${fixes}个问题`,
                  icon: 'success'
                });
              } else {
                this.addLog('error', `数据修复失败: ${result.result.message}`);
                uni.showToast({
                  title: '修复失败',
                  icon: 'error'
                });
              }
            } catch (error) {
              this.addLog('error', `数据修复异常: ${error.message}`);
              uni.showToast({
                title: '修复异常',
                icon: 'error'
              });
            } finally {
              this.loading = false;
            }
          }
        }
      });
    },
    
    // 清空日志
    clearLogs() {
      this.logs = [];
      this.addLog('info', '日志已清空');
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

.header {
  text-align: center;
  padding: 40rpx 20rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  color: white;
  margin-bottom: 30rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

/* 状态卡片 */
.status-card {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 28rpx;
  color: #666;
}

.status-value {
  font-size: 28rpx;
  font-weight: bold;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
}

.status-value.success {
  background: #e8f5e8;
  color: #4caf50;
}

.status-value.warning {
  background: #fff3cd;
  color: #f57c00;
}

.status-value.error {
  background: #ffebee;
  color: #f44336;
}

.status-value.unknown {
  background: #f0f0f0;
  color: #999;
}

/* 按钮样式 */
.check-btn {
  width: 100%;
  padding: 24rpx;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.check-btn[disabled] {
  background: #ccc;
}

.action-card {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
}

.action-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: bold;
}

.action-btn.primary {
  background: #007AFF;
  color: white;
}

.action-btn.danger {
  background: #ff4d4f;
  color: white;
}

.action-btn.warning {
  background: #faad14;
  color: white;
}

.action-btn[disabled] {
  background: #ccc;
  color: #999;
}

/* 测试按钮网格 */
.test-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.test-btn {
  padding: 20rpx;
  background: #f0f0f0;
  border: none;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333;
}

.test-btn[disabled] {
  background: #e0e0e0;
  color: #999;
}

/* 日志容器 */
.log-container {
  height: 400rpx;
  background: #1a1a1a;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.log-item {
  margin-bottom: 12rpx;
  font-size: 24rpx;
  line-height: 1.4;
}

.log-item.info {
  color: #e3f2fd;
}

.log-item.success {
  color: #4caf50;
}

.log-item.warning {
  color: #ff9800;
}

.log-item.error {
  color: #f44336;
}

.log-time {
  color: #999;
  font-size: 22rpx;
  margin-right: 12rpx;
}

.log-content {
  display: inline;
}

.no-logs {
  color: #666;
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
}

.clear-btn {
  width: 100%;
  padding: 16rpx;
  background: #666;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 24rpx;
}
</style>