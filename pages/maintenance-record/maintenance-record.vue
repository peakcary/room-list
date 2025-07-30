<template>
  <view class="container">
    <!-- 操作栏 -->
    <view class="action-bar">
      <view class="search-box">
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索房间号..."
          @input="onSearch"
        />
      </view>
      <view class="add-btn" @click="addRecord">
        <text class="add-icon">+</text>
        <text>添加维修</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-number">{{ statistics.totalRecords }}</text>
        <text class="stat-label">维修记录</text>
      </view>
      <view class="stat-card">
        <text class="stat-number cost">¥{{ statistics.totalCost }}</text>
        <text class="stat-label">总费用</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ statistics.thisMonthRecords }}</text>
        <text class="stat-label">本月维修</text>
      </view>
    </view>

    <!-- 维修记录列表 -->
    <scroll-view class="record-list" scroll-y="true" @scrolltolower="loadMore">
      <view class="record-item" v-for="record in recordList" :key="record._id" @click="viewRecord(record)">
        <view class="record-header">
          <view class="room-info">
            <text class="room-number">🏠 {{ record.room_info?.room_number }}号房</text>
            <view class="record-type" :class="'type-' + record.maintenance_type">
              {{ getTypeText(record.maintenance_type) }}
            </view>
          </view>
          <view class="record-cost">
            <text class="cost-amount">¥{{ record.cost }}</text>
          </view>
        </view>
        
        <view class="record-content">
          <text class="record-desc">{{ record.description }}</text>
          <view class="record-meta">
            <text class="record-date">📅 {{ formatDate(record.maintenance_date) }}</text>
            <text class="record-company" v-if="record.maintenance_company">
              🔧 {{ record.maintenance_company }}
            </text>
          </view>
        </view>
        
        <view class="record-status">
          <view class="status-badge" :class="'status-' + record.status">
            {{ getStatusText(record.status) }}
          </view>
          <view class="warranty-info" v-if="record.warranty_end_date && record.status === 'completed'">
            <text class="warranty-text" :class="getWarrantyClass(record.warranty_end_date)">
              {{ getWarrantyText(record.warranty_end_date) }}
            </text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <text>{{ loading ? '加载中...' : '上拉加载更多' }}</text>
      </view>
    </scroll-view>

    <!-- 添加维修记录弹窗 -->
    <view class="modal-overlay" v-if="showAddModal" @click="hideAddModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加维修记录</text>
          <view class="modal-close" @click="hideAddModal">✕</view>
        </view>
        
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">房间</text>
            <picker mode="selector" :range="roomOptions" range-key="label" @change="onRoomChange">
              <view class="form-picker">
                <text class="picker-text">{{ selectedRoom ? selectedRoom.label : '请选择房间' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="form-label">维修类型</text>
            <picker mode="selector" :range="typeOptions" range-key="label" @change="onTypeChange">
              <view class="form-picker">
                <text class="picker-text">{{ selectedType ? selectedType.label : '请选择类型' }}</text>
                <text class="picker-arrow">▼</text>
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="form-label">维修日期</text>
            <picker mode="date" :value="formData.maintenance_date" @change="onDateChange">
              <view class="form-picker">
                <text class="picker-text">{{ formData.maintenance_date || '请选择日期' }}</text>
                <text class="picker-arrow">📅</text>
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="form-label">维修费用</text>
            <input 
              class="form-input" 
              v-model="formData.cost" 
              type="digit"
              placeholder="请输入费用"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">维修描述</text>
            <textarea 
              class="form-textarea" 
              v-model="formData.description" 
              placeholder="请描述维修内容"
              maxlength="200"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">维修公司/人员（可选）</text>
            <input 
              class="form-input" 
              v-model="formData.maintenance_company" 
              placeholder="请输入维修公司或人员"
            />
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="btn cancel-btn" @click="hideAddModal">取消</button>
          <button class="btn confirm-btn" @click="submitRecord">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      recordList: [],
      loading: false,
      hasMore: true,
      pageNum: 1,
      pageSize: 10,
      searchKeyword: '',
      searchTimer: null,
      statistics: {
        totalRecords: 0,
        totalCost: 0,
        thisMonthRecords: 0
      },
      showAddModal: false,
      roomOptions: [],
      selectedRoom: null,
      typeOptions: [
        { value: 'plumbing', label: '水管维修' },
        { value: 'electrical', label: '电路维修' },
        { value: 'appliance', label: '电器维修' },
        { value: 'furniture', label: '家具维修' },
        { value: 'decoration', label: '装修维护' },
        { value: 'other', label: '其他维修' }
      ],
      selectedType: null,
      formData: {
        room_id: '',
        maintenance_type: '',
        maintenance_date: '',
        cost: '',
        description: '',
        maintenance_company: ''
      }
    }
  },
  
  onLoad() {
    this.loadRecords();
    this.loadStatistics();
    this.loadRoomOptions();
  },
  
  onPullDownRefresh() {
    this.refreshData();
  },
  
  methods: {
    // 加载维修记录
    async loadRecords(isRefresh = false) {
      if (this.loading) return;
      
      this.loading = true;
      
      if (isRefresh) {
        this.pageNum = 1;
        this.recordList = [];
        this.hasMore = true;
      }
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getMaintenanceRecords',
            data: {
              pageNum: this.pageNum,
              pageSize: this.pageSize,
              searchKeyword: this.searchKeyword
            }
          }
        });
        
        if (result.result.code === 0) {
          const { list, total } = result.result.data;
          
          if (isRefresh) {
            this.recordList = list;
          } else {
            this.recordList = [...this.recordList, ...list];
          }
          
          this.hasMore = this.recordList.length < total;
          this.pageNum++;
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载维修记录失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        uni.stopPullDownRefresh();
      }
    },
    
    // 加载统计信息
    async loadStatistics() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getMaintenanceCostStats',
            data: {}
          }
        });
        
        if (result.result.code === 0) {
          const data = result.result.data;
          this.statistics.totalRecords = data.recordCount;
          this.statistics.totalCost = data.totalCost;
          
          // 计算本月记录数
          const thisMonth = new Date().getMonth() + 1;
          const thisYear = new Date().getFullYear();
          this.statistics.thisMonthRecords = data.records.filter(record => {
            const recordDate = new Date(record.maintenance_date);
            return recordDate.getMonth() + 1 === thisMonth && recordDate.getFullYear() === thisYear;
          }).length;
        }
      } catch (error) {
        console.error('加载统计信息失败:', error);
      }
    },
    
    // 加载房间选项
    async loadRoomOptions() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRooms',
            data: {
              pageSize: 1000,
              pageNum: 1
            }
          }
        });
        
        if (result.result.code === 0) {
          this.roomOptions = result.result.data.list.map(room => ({
            value: room._id,
            label: `${room.room_number}号房`
          }));
        }
      } catch (error) {
        console.error('加载房间列表失败:', error);
      }
    },
    
    // 搜索
    onSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.refreshData();
      }, 500);
    },
    
    // 刷新数据
    refreshData() {
      this.loadRecords(true);
      this.loadStatistics();
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.loadRecords();
      }
    },
    
    // 查看记录详情
    viewRecord(record) {
      // 可以跳转到详情页面或显示详情弹窗
      console.log('查看维修记录:', record);
    },
    
    // 显示添加弹窗
    addRecord() {
      this.showAddModal = true;
      this.resetForm();
    },
    
    // 隐藏添加弹窗
    hideAddModal() {
      this.showAddModal = false;
      this.resetForm();
    },
    
    // 重置表单
    resetForm() {
      this.formData = {
        room_id: '',
        maintenance_type: '',
        maintenance_date: this.formatDateForPicker(new Date()),
        cost: '',
        description: '',
        maintenance_company: ''
      };
      this.selectedRoom = null;
      this.selectedType = null;
    },
    
    // 房间选择
    onRoomChange(e) {
      const index = e.detail.value;
      this.selectedRoom = this.roomOptions[index];
      this.formData.room_id = this.selectedRoom.value;
    },
    
    // 类型选择
    onTypeChange(e) {
      const index = e.detail.value;
      this.selectedType = this.typeOptions[index];
      this.formData.maintenance_type = this.selectedType.value;
    },
    
    // 日期选择
    onDateChange(e) {
      this.formData.maintenance_date = e.detail.value;
    },
    
    // 提交记录
    async submitRecord() {
      if (!this.validateForm()) return;
      
      uni.showLoading({ title: '保存中...' });
      
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'addMaintenanceRecord',
            data: this.formData
          }
        });
        
        if (result.result.code === 0) {
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.hideAddModal();
          this.refreshData();
        } else {
          uni.showToast({
            title: result.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('添加维修记录失败:', error);
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 表单验证
    validateForm() {
      if (!this.formData.room_id) {
        uni.showToast({
          title: '请选择房间',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.maintenance_type) {
        uni.showToast({
          title: '请选择维修类型',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.maintenance_date) {
        uni.showToast({
          title: '请选择维修日期',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.cost) {
        uni.showToast({
          title: '请输入维修费用',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.formData.description) {
        uni.showToast({
          title: '请输入维修描述',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '--';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 格式化日期为picker格式
    formatDateForPicker(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 获取类型文本
    getTypeText(type) {
      const typeMap = {
        plumbing: '水管',
        electrical: '电路',
        appliance: '电器',
        furniture: '家具',
        decoration: '装修',
        other: '其他'
      };
      return typeMap[type] || '未知';
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待维修',
        in_progress: '维修中',
        completed: '已完成',
        warranty_expired: '保修过期'
      };
      return statusMap[status] || '未知';
    },
    
    // 获取保修文本
    getWarrantyText(warrantyEndDate) {
      if (!warrantyEndDate) return '';
      
      const end = new Date(warrantyEndDate);
      const now = new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return '保修已过期';
      } else if (diffDays === 0) {
        return '保修今日到期';
      } else if (diffDays <= 30) {
        return `保修${diffDays}天后到期`;
      } else {
        return `保修中（${Math.floor(diffDays / 30)}个月后到期）`;
      }
    },
    
    // 获取保修样式类
    getWarrantyClass(warrantyEndDate) {
      if (!warrantyEndDate) return '';
      
      const end = new Date(warrantyEndDate);
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
    }
  }
}
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.search-box {
  flex: 1;
  margin-right: 20rpx;
}

.search-input {
  width: 100%;
  padding: 16rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  font-size: 28rpx;
  border: none;
}

.add-btn {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #007AFF;
  color: white;
  border-radius: 20rpx;
  font-size: 28rpx;
}

.add-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  padding: 20rpx 32rpx;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 8rpx;
}

.stat-number.cost {
  color: #ff4d4f;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

/* 记录列表 */
.record-list {
  flex: 1;
  padding: 0 32rpx 20rpx;
}

.record-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.room-info {
  flex: 1;
}

.room-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.record-type {
  display: inline-block;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: white;
}

.type-plumbing { background-color: #1890ff; }
.type-electrical { background-color: #faad14; }
.type-appliance { background-color: #52c41a; }
.type-furniture { background-color: #722ed1; }
.type-decoration { background-color: #eb2f96; }
.type-other { background-color: #8c8c8c; }

.record-cost {
  text-align: right;
}

.cost-amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff4d4f;
}

.record-content {
  margin-bottom: 16rpx;
}

.record-desc {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.record-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: white;
}

.status-pending { background-color: #faad14; }
.status-in_progress { background-color: #1890ff; }
.status-completed { background-color: #52c41a; }
.status-warranty_expired { background-color: #8c8c8c; }

.warranty-info {
  font-size: 22rpx;
}

.warranty-text.normal { color: #52c41a; }
.warranty-text.warning { color: #faad14; }
.warranty-text.urgent { color: #ff4d4f; }
.warranty-text.expired { color: #8c8c8c; }

.load-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 16rpx;
  width: 90%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 32rpx;
  color: #999;
  padding: 8rpx;
}

.modal-body {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.form-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid #e9ecef;
}

.picker-text {
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

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
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
  background: linear-gradient(135deg, #007AFF 0%, #40a9ff 100%);
  color: white;
}
</style>