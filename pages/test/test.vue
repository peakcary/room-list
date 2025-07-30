<template>
  <view class="container">
    <view class="header">
      <text class="title">系统初始化测试</text>
    </view>
    
    <view class="test-section">
      <view class="test-item">
        <button class="test-btn" @click="initDatabase">初始化数据库</button>
        <text class="test-result">{{ dbInitResult }}</text>
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
      roomTestResult: '',
      addRoomResult: '',
      getRoomsResult: '',
      availableRoomsResult: '',
      rentedRoomsResult: '',
      debugInfo: '等待测试...'
    }
  },
  
  methods: {
    // 初始化数据库
    async initDatabase() {
      this.dbInitResult = '初始化中...';
      this.debugInfo = '正在初始化数据库...';
      
      try {
        const result = await uniCloud.callFunction({
          name: 'db-init',
          data: {}
        });
        
        this.dbInitResult = `初始化完成: ${result.result.message}`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
        
      } catch (error) {
        this.dbInitResult = `初始化失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        console.error('数据库初始化失败:', error);
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
  margin-bottom: 60rpx;
}

.title {
  font-size: 48rpx;
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
</style>