<template>
  <view class="container">
    <!-- 头部时间选择 -->
    <view class="header-section">
      <view class="welcome-title">收入统计</view>
      <view class="time-selector">
        <view class="time-tabs">
          <view 
            class="time-tab" 
            :class="{ active: currentTimeType === 'monthly' }"
            @click="switchTimeType('monthly')"
          >
            按月
          </view>
          <view 
            class="time-tab" 
            :class="{ active: currentTimeType === 'yearly' }"
            @click="switchTimeType('yearly')"
          >
            按年
          </view>
        </view>
        <view class="time-picker" @click="showTimePicker">
          <text>{{ currentPeriodText }}</text>
          <text class="arrow">▼</text>
        </view>
      </view>
    </view>

    <!-- 收入统计卡片 -->
    <view class="income-section">
      <view class="income-overview">
        <view class="overview-item rent">
          <view class="overview-icon">🏠</view>
          <view class="overview-content">
            <view class="overview-amount">¥{{ incomeStats.rent_income || 0 }}</view>
            <view class="overview-label">租金收入</view>
          </view>
        </view>
        
        <view class="overview-item utility">
          <view class="overview-icon">⚡</view>
          <view class="overview-content">
            <view class="overview-amount">¥{{ incomeStats.utility_income || 0 }}</view>
            <view class="overview-label">水电收入</view>
          </view>
        </view>
        
        <view class="overview-item maintenance">
          <view class="overview-icon">🔧</view>
          <view class="overview-content">
            <view class="overview-amount">¥{{ incomeStats.maintenance_expenses || 0 }}</view>
            <view class="overview-label">维修支出</view>
          </view>
        </view>
        
        <view class="overview-item net">
          <view class="overview-icon">💰</view>
          <view class="overview-content">
            <view class="overview-amount profit">¥{{ incomeStats.net_income || 0 }}</view>
            <view class="overview-label">净收入</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 房间出租情况 -->
    <view class="occupancy-section">
      <view class="section-title">房间出租情况</view>
      <view class="occupancy-stats">
        <view class="occupancy-main">
          <view class="occupancy-rate">
            <view class="rate-circle">
              <view class="rate-text">{{ occupancyStats.occupancy_rate || 0 }}%</view>
              <view class="rate-label">出租率</view>
            </view>
          </view>
          <view class="occupancy-details">
            <view class="detail-item">
              <view class="detail-number">{{ occupancyStats.total || 0 }}</view>
              <view class="detail-label">总房间</view>
            </view>
            <view class="detail-item rented">
              <view class="detail-number">{{ occupancyStats.rented || 0 }}</view>
              <view class="detail-label">已出租</view>
            </view>
            <view class="detail-item available">
              <view class="detail-number">{{ occupancyStats.available || 0 }}</view>
              <view class="detail-label">空闲</view>
            </view>
          </view>
        </view>
        
        <view class="rental-alerts" v-if="rentalAlerts.expiring_soon > 0 || rentalAlerts.overdue > 0">
          <view class="alert-item warning" v-if="rentalAlerts.expiring_soon > 0">
            <view class="alert-icon">⚠️</view>
            <view class="alert-text">{{ rentalAlerts.expiring_soon }}个租约即将到期</view>
          </view>
          <view class="alert-item danger" v-if="rentalAlerts.overdue > 0">
            <view class="alert-icon">🚨</view>
            <view class="alert-text">{{ rentalAlerts.overdue }}个租约已过期</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 收入趋势图 -->
    <view class="trend-section" v-if="incomeTrend.length > 0">
      <view class="section-title">收入趋势（最近6个月）</view>
      <view class="trend-chart">
        <view class="trend-item" v-for="(item, index) in incomeTrend" :key="index">
          <view class="trend-bar">
            <view 
              class="trend-bar-fill rent" 
              :style="{ height: getTrendBarHeight(item.rent_income) + '%' }"
            ></view>
            <view 
              class="trend-bar-fill utility" 
              :style="{ height: getTrendBarHeight(item.utility_income) + '%', bottom: getTrendBarHeight(item.rent_income) + '%' }"
            ></view>
          </view>
          <view class="trend-label">{{ formatTrendMonth(item.month) }}</view>
          <view class="trend-amount">¥{{ item.rent_income + item.utility_income }}</view>
        </view>
      </view>
      <view class="trend-legend">
        <view class="legend-item">
          <view class="legend-color rent"></view>
          <text>租金收入</text>
        </view>
        <view class="legend-item">
          <view class="legend-color utility"></view>
          <text>水电收入</text>
        </view>
      </view>
    </view>

    <!-- 系统管理入口 -->
    <view class="system-management">
      <button class="system-btn" @click="goToSystemDeploy">
        🚀 系统部署管理
      </button>
    </view>

  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTimeType: 'monthly', // monthly 或 yearly
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      incomeStats: {
        rent_income: 0,
        utility_income: 0,
        maintenance_expenses: 0,
        net_income: 0,
        period: ''
      },
      occupancyStats: {
        total: 0,
        rented: 0,
        available: 0,
        maintenance: 0,
        occupancy_rate: 0
      },
      rentalAlerts: {
        expiring_soon: 0,
        overdue: 0
      },
      incomeTrend: [],
      loading: false
    }
  },
  
  computed: {
    currentPeriodText() {
      if (this.currentTimeType === 'monthly') {
        return `${this.currentYear}年${this.currentMonth}月`;
      } else {
        return `${this.currentYear}年`;
      }
    }
  },
  
  onLoad() {
    this.loadDashboardData();
  },
  
  onShow() {
    // 页面显示时刷新数据
    this.loadDashboardData();
  },
  
  methods: {
    // 加载首页数据
    async loadDashboardData() {
      if (this.loading) return;
      this.loading = true;
      
      try {
        // 获取收入统计
        await this.loadIncomeStats();
        
        // 获取房间出租统计
        await this.loadOccupancyStats();
        
        // 获取收入趋势
        await this.loadIncomeTrend();
        
      } catch (error) {
        console.error('加载首页数据失败:', error);
        uni.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 加载收入统计
    async loadIncomeStats() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getIncomeStatistics',
            data: {
              year: this.currentYear,
              month: this.currentTimeType === 'monthly' ? this.currentMonth : undefined,
              type: this.currentTimeType
            }
          }
        });
        
        if (result.result.code === 0) {
          if (this.currentTimeType === 'yearly' && result.result.data.year_totals) {
            this.incomeStats = result.result.data.year_totals;
            this.incomeStats.period = result.result.data.period;
          } else {
            this.incomeStats = result.result.data;
          }
        }
      } catch (error) {
        console.error('加载收入统计失败:', error);
      }
    },
    
    // 加载房间出租统计
    async loadOccupancyStats() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getRoomOccupancyStatistics'
          }
        });
        
        if (result.result.code === 0) {
          this.occupancyStats = result.result.data.room_status;
          this.rentalAlerts = result.result.data.rental_activity;
        }
      } catch (error) {
        console.error('加载房间统计失败:', error);
      }
    },
    
    // 加载收入趋势
    async loadIncomeTrend() {
      try {
        const result = await uniCloud.callFunction({
          name: 'room-management',
          data: {
            action: 'getIncomeTrend'
          }
        });
        
        if (result.result.code === 0) {
          this.incomeTrend = result.result.data;
        }
      } catch (error) {
        console.error('加载收入趋势失败:', error);
      }
    },
    
    // 切换时间类型
    switchTimeType(type) {
      if (this.currentTimeType === type) return;
      this.currentTimeType = type;
      this.loadIncomeStats();
    },
    
    // 显示时间选择器
    showTimePicker() {
      if (this.currentTimeType === 'monthly') {
        // 月份选择器
        const months = [];
        for (let i = 1; i <= 12; i++) {
          months.push(`${i}月`);
        }
        
        uni.showActionSheet({
          itemList: months,
          success: (res) => {
            this.currentMonth = res.tapIndex + 1;
            this.loadIncomeStats();
          }
        });
      } else {
        // 年份选择器
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
          years.push(`${i}年`);
        }
        
        uni.showActionSheet({
          itemList: years,
          success: (res) => {
            this.currentYear = currentYear - 2 + res.tapIndex;
            this.loadIncomeStats();
          }
        });
      }
    },
    
    // 计算趋势图柱状高度
    getTrendBarHeight(amount) {
      if (this.incomeTrend.length === 0) return 0;
      
      const maxAmount = Math.max(...this.incomeTrend.map(item => 
        item.rent_income + item.utility_income
      ));
      
      return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
    },
    
    // 格式化趋势月份
    formatTrendMonth(monthStr) {
      const [year, month] = monthStr.split('-');
      return `${month}月`;
    },
    
    // 跳转到系统部署管理
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
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx;
  /* #ifdef H5 */
  padding-bottom: 70px;
  /* #endif */
}

/* 头部区域 */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx 40rpx;
  color: white;
}

.welcome-title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  text-align: center;
}

.time-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25rpx;
  padding: 6rpx;
}

.time-tab {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  transition: all 0.3s;
}

.time-tab.active {
  background: white;
  color: #667eea;
  font-weight: bold;
}

.time-picker {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 20rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
}

.arrow {
  margin-left: 8rpx;
  font-size: 20rpx;
}

/* 收入统计 */
.income-section {
  margin: -20rpx 40rpx 30rpx;
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.1);
}

.income-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.overview-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #f8f9fa;
}

.overview-item.rent {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.overview-item.utility {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
}

.overview-item.maintenance {
  background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
}

.overview-item.net {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.overview-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.overview-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 4rpx;
}

.overview-amount.profit {
  color: #4caf50;
}

.overview-label {
  font-size: 24rpx;
  color: #666;
}

/* 房间出租情况 */
.occupancy-section {
  background: white;
  margin: 0 40rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.occupancy-main {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.occupancy-rate {
  margin-right: 40rpx;
}

.rate-circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.rate-text {
  font-size: 32rpx;
  font-weight: bold;
}

.rate-label {
  font-size: 20rpx;
  margin-top: 4rpx;
}

.occupancy-details {
  flex: 1;
  display: flex;
  justify-content: space-around;
}

.detail-item {
  text-align: center;
}

.detail-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.detail-item.rented .detail-number {
  color: #f44336;
}

.detail-item.available .detail-number {
  color: #4caf50;
}

.detail-label {
  font-size: 24rpx;
  color: #666;
}

.rental-alerts {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.alert-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  margin-bottom: 12rpx;
  border-radius: 12rpx;
}

.alert-item.warning {
  background: #fff3cd;
  border: 1rpx solid #ffeaa7;
}

.alert-item.danger {
  background: #f8d7da;
  border: 1rpx solid #f5c6cb;
}

.alert-icon {
  margin-right: 12rpx;
  font-size: 28rpx;
}

.alert-text {
  font-size: 26rpx;
  color: #333;
}

/* 收入趋势图 */
.trend-section {
  background: white;
  margin: 0 40rpx 30rpx;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0,0,0,0.1);
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar {
  position: relative;
  width: 40rpx;
  height: 160rpx;
  background: #f0f0f0;
  border-radius: 20rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
}

.trend-bar-fill {
  position: absolute;
  width: 100%;
  border-radius: 20rpx;
  transition: all 0.3s;
}

.trend-bar-fill.rent {
  background: linear-gradient(to top, #667eea 0%, #764ba2 100%);
}

.trend-bar-fill.utility {
  background: linear-gradient(to top, #f093fb 0%, #f5576c 100%);
}

.trend-label {
  font-size: 22rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.trend-amount {
  font-size: 20rpx;
  color: #333;
  font-weight: bold;
}

.trend-legend {
  display: flex;
  justify-content: center;
  gap: 40rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #666;
}

.legend-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  margin-right: 8rpx;
}

.legend-color.rent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.legend-color.utility {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* 系统管理入口 */
.system-management {
  padding: 40rpx;
  text-align: center;
}

.system-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 25rpx rgba(255, 107, 107, 0.3);
  transition: all 0.3s;
}

.system-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
}

</style>
