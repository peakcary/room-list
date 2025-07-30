<template>
  <view class="container">
    <view class="header">
      <text class="title">系统初始化测试</text>
    </view>
    
    <view class="init-section">
      <view class="init-card">
        <view class="init-title">🚀 数据库初始化</view>
        <view class="init-desc">创建示例房间、租户和租赁关系数据，用于测试系统功能</view>
        <button class="init-btn-large" @click="initDatabase">
          <text class="btn-text">{{ initButtonText }}</text>
        </button>
        <view class="init-result" :class="initResultClass">{{ dbInitResult }}</view>
      </view>
    </view>
    
    <view class="test-section">
      <view class="section-header">
        <text class="section-title">系统功能测试</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="testRoomManagement">测试房间管理接口</button>
        <text class="test-result">{{ roomTestResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="addTestRoom">添加测试房间</button>
        <text class="test-result">{{ addRoomResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="getRooms">获取全部房间列表</button>
        <text class="test-result">{{ getRoomsResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="getAvailableRooms">获取可租用房间</button>
        <text class="test-result">{{ availableRoomsResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="getRentedRooms">获取已租用房间</button>
        <text class="test-result">{{ rentedRoomsResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn debug-btn" @click="debugDatabase">🔍 调试数据库状态</button>
        <text class="test-result">{{ debugResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn deploy-btn" @click="goToSystemDeploy">🚀 系统部署管理</button>
        <text class="test-result">一键部署和管理系统</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn reset-btn" @click="forceResetDatabase">🗑️ 强制重置数据库</button>
        <text class="test-result">{{ resetResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="fixDataInconsistencies">修复数据不一致</button>
        <text class="test-result">{{ fixResult }}</text>
      </view>
      
      <view class="test-item">
        <button class="test-btn" @click="forceResetDatabase">强制重置数据库</button>
        <text class="test-result">{{ resetResult }}</text>
      </view>
    </view>
    
    <view class="debug-info">
      <text class="debug-title">调试信息：</text>
      <text class="debug-text">{{ debugInfo }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      dbInitResult: '',
      initButtonText: '立即初始化',
      initResultClass: '',
      isInitializing: false,
      roomTestResult: '',
      addRoomResult: '',
      getRoomsResult: '',
      availableRoomsResult: '',
      rentedRoomsResult: '',
      debugResult: '',
      fixResult: '',
      resetResult: '',
      debugInfo: '等待测试...'
    }
  },
  
  methods: {
    // 初始化数据库
    async initDatabase() {
      if (this.isInitializing) return;
      
      this.isInitializing = true;
      this.initButtonText = '初始化中...';
      this.dbInitResult = '正在创建示例数据...';
      this.initResultClass = 'loading';
      this.debugInfo = '正在初始化数据库...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'db-init',
          data: {}
        });
        
        if (result.result.code === 0) {
          this.dbInitResult = '✅ 初始化成功！已创建示例房间、租户和租赁关系数据';
          this.initResultClass = 'success';
          this.initButtonText = '重新初始化';
          this.debugInfo = '初始化完成，现在可以在房间列表中看到租户信息了';
          
          // 显示成功提示
          uni.showToast({
            title: '初始化成功',
            icon: 'success'
          });
        } else {
          this.dbInitResult = `❌ 初始化失败: ${result.result.message}`;
          this.initResultClass = 'error';
          this.initButtonText = '重试初始化';
        }
        
        this.debugInfo = JSON.stringify(result.result, null, 2);
        
      } catch (error) {
        this.dbInitResult = `❌ 初始化失败: ${error.message}`;
        this.initResultClass = 'error';
        this.initButtonText = '重试初始化';
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('数据库初始化失败:', error);
        
        uni.showToast({
          title: '初始化失败',
          icon: 'none'
        });
      } finally {
        this.isInitializing = false;
      }
    },
    
    // 测试房间管理接口
    async testRoomManagement() {
      this.roomTestResult = '测试中...';
      this.debugInfo = '正在测试房间管理接口...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        
        this.roomTestResult = `测试成功: 找到 ${result.result.data?.total || 0} 个房间`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
        
      } catch (error) {
        this.roomTestResult = `测试失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('房间管理接口测试失败:', error);
      }
    },
    
    // 添加测试房间
    async addTestRoom() {
      this.addRoomResult = '添加中...';
      this.debugInfo = '正在添加测试房间...';
      
      try {
        const testRoom = {
          room_number: `TEST${Date.now()}`,
          floor: 1,
          area: 25,
          rent_price: 1000,
          status: 'available',
          utilities: {
            electricity_reading: 0,
            water_reading: 0,
            electricity_rate: 0.5,
            water_rate: 3.0
          }
        };
        
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addRoom',
            data: testRoom
          }
        });
        
        this.addRoomResult = `添加成功: 房间号 ${testRoom.room_number}`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
        
      } catch (error) {
        this.addRoomResult = `添加失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('添加测试房间失败:', error);
      }
    },
    
    // 获取房间列表
    async getRooms() {
      this.getRoomsResult = '获取中...';
      this.debugInfo = '正在获取房间列表...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.getRoomsResult = `获取成功: 共 ${result.result.data.total} 个房间`;
          this.debugInfo = `房间列表: ${rooms.map(r => r.room_number).join(', ')}`;
        } else {
          this.getRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
        
      } catch (error) {
        this.getRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('获取房间列表失败:', error);
      }
    },
    
    // 获取可租用房间
    async getAvailableRooms() {
      this.availableRoomsResult = '获取中...';
      this.debugInfo = '正在获取可租用房间...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              status: 'available',
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.availableRoomsResult = `获取成功: 共 ${result.result.data.total} 个可租用房间`;
          this.debugInfo = `可租用房间: ${rooms.map(r => r.room_number).join(', ')}`;
        } else {
          this.availableRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
        
      } catch (error) {
        this.availableRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('获取可租用房间失败:', error);
      }
    },
    
    // 获取已租用房间
    async getRentedRooms() {
      this.rentedRoomsResult = '获取中...';
      this.debugInfo = '正在获取已租用房间...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              status: 'rented',
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.rentedRoomsResult = `获取成功: 共 ${result.result.data.total} 个已租用房间`;
          this.debugInfo = `已租用房间: ${rooms.map(r => r.room_number + (r.current_tenant ? ` (${r.current_tenant.name})` : '')).join(', ')}`;
        } else {
          this.rentedRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
        
      } catch (error) {
        this.rentedRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('获取已租用房间失败:', error);
      }
    },
    
    // 调试数据库状态
    async debugDatabase() {
      this.debugResult = '调试中...';
      this.debugInfo = '正在检查数据库状态...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'debugDatabase',
            data: {}
          }
        });
        
        if (result.result.code === 0) {
          const { debug_info, inconsistencies } = result.result.data;
          this.debugResult = `调试完成: 房间${debug_info.rooms.total}个, 租赁${debug_info.rentals.total}个, 租户${debug_info.tenants.total}个, 数据不一致${inconsistencies.length}处`;
          
          let debugText = `=== 数据库状态 ===\n`;
          debugText += `房间总数: ${debug_info.rooms.total}\n`;
          debugText += `租赁总数: ${debug_info.rentals.total}\n`;
          debugText += `租户总数: ${debug_info.tenants.total}\n\n`;
          
          if (inconsistencies.length > 0) {
            debugText += `=== 数据不一致问题 ===\n`;
            inconsistencies.forEach((issue, index) => {
              debugText += `${index + 1}. ${issue.issue}\n`;
              debugText += `   房间: ${issue.room_number} (${issue.room_id})\n`;
              if (issue.current_rental_id) {
                debugText += `   租赁ID: ${issue.current_rental_id}\n`;
              }
              debugText += `\n`;
            });
          } else {
            debugText += `✅ 数据一致性检查通过\n`;
          }
          
          debugText += `\n=== 房间详情 ===\n`;
          debug_info.rooms.data.forEach(room => {
            debugText += `${room.room_number}: ${room.status}`;
            if (room.current_rental_id) {
              debugText += ` (租赁ID: ${room.current_rental_id})`;
            }
            debugText += `\n`;
          });
          
          this.debugInfo = debugText;
          
        } else {
          this.debugResult = `调试失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
        
      } catch (error) {
        this.debugResult = `调试失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('调试数据库失败:', error);
      }
    },
    
    // 修复数据不一致
    async fixDataInconsistencies() {
      this.fixResult = '修复中...';
      this.debugInfo = '正在修复数据不一致问题...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'fixDataInconsistencies',
            data: {}
          }
        });
        
        if (result.result.code === 0) {
          const { fixes_applied, fixes } = result.result.data;
          this.fixResult = `✅ 修复完成！共处理 ${fixes_applied} 个问题`;
          
          let debugText = `=== 数据修复报告 ===\n`;
          debugText += `修复问题数量: ${fixes_applied}\n\n`;
          
          if (fixes.length > 0) {
            debugText += `=== 修复详情 ===\n`;
            fixes.forEach((fix, index) => {
              debugText += `${index + 1}. ${fix.action}\n`;
              if (fix.room_number) {
                debugText += `   房间: ${fix.room_number}\n`;
              }
              if (fix.rental_id) {
                debugText += `   租赁ID: ${fix.rental_id}\n`;
              }
              debugText += `   类型: ${fix.type}\n\n`;
            });
          } else {
            debugText += `✅ 未发现需要修复的问题\n`;
          }
          
          this.debugInfo = debugText;
          
          uni.showToast({
            title: '修复完成',
            icon: 'success'
          });
          
        } else {
          this.fixResult = `❌ 修复失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
        
      } catch (error) {
        this.fixResult = `修复失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('修复数据不一致失败:', error);
      }
    },
    
    // 强制重置数据库
    async forceResetDatabase() {
      this.resetResult = '重置中...';
      this.debugInfo = '正在强制重置数据库...';
      
      try {
        uni.showModal({
          title: '确认重置',
          content: '这将删除所有数据并重新创建，确定继续吗？',
          success: async (res) => {
            if (res.confirm) {
              const result = await uniCloud.callFunction({
                name: 'db-init',
                data: {
                  forceReset: true
                }
              });
              
              if (result.result.code === 0) {
                this.resetResult = '✅ 数据库重置成功！';
                this.debugInfo = '数据库已重置，所有旧数据已清空，新的示例数据已创建';
                
                uni.showToast({
                  title: '重置成功',
                  icon: 'success'
                });
              } else {
                this.resetResult = `❌ 重置失败: ${result.result.message}`;
                this.debugInfo = JSON.stringify(result.result, null, 2);
              }
            } else {
              this.resetResult = '重置已取消';
              this.debugInfo = '用户取消了重置操作';
            }
          }
        });
        
      } catch (error) {
        this.resetResult = `重置失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('强制重置数据库失败:', error);
      }
    },
    
    // 跳转到系统部署管理页面
    goToSystemDeploy() {
      uni.navigateTo({
        url: '/pages/system-deploy/system-deploy'
      });
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

.init-section {
  margin-bottom: 40rpx;
}

.init-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  color: white;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.15);
}

.init-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.init-desc {
  font-size: 26rpx;
  opacity: 0.9;
  margin-bottom: 30rpx;
  line-height: 1.5;
}

.init-btn-large {
  background-color: rgba(255,255,255,0.2);
  border: 2rpx solid rgba(255,255,255,0.5);
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  margin-bottom: 24rpx;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s;
}

.init-btn-large:active {
  transform: scale(0.95);
  background-color: rgba(255,255,255,0.3);
}

.btn-text {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

.init-result {
  font-size: 28rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
  background-color: rgba(255,255,255,0.1);
  backdrop-filter: blur(5rpx);
}

.init-result.loading {
  color: #fff3cd;
  background-color: rgba(255,243,205,0.2);
}

.init-result.success {
  color: #d1edff;
  background-color: rgba(209,237,255,0.2);
}

.init-result.error {
  color: #f8d7da;
  background-color: rgba(248,215,218,0.2);
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.test-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
}

.test-item {
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.test-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.test-btn {
  width: 100%;
  padding: 30rpx;
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.test-result {
  display: block;
  font-size: 28rpx;
  color: #666;
  word-break: break-all;
}

.debug-info {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
}

.debug-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.debug-text {
  display: block;
  font-size: 24rpx;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.debug-btn {
  background-color: #ff9500 !important;
}

.deploy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}
</style>