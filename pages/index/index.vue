<template>
  <view class="container">
    <!-- 用户信息栏 -->
    <view class="user-bar">
      <view class="user-info">
        <text class="user-name">{{ userInfo.name || userInfo.username }}</text>
        <text class="user-role">({{ userRoleText }})</text>
      </view>
      <view class="user-actions">
        <text class="change-password-btn" @tap="changePassword">改密码</text>
        <text class="logout-btn" @tap="handleLogout">退出</text>
      </view>
    </view>
    
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


  </view>
</template>

<script>
import { checkPageAuth, getCurrentUser, logout } from '../../utils/auth.js';

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
      loading: false,
      // 可选的时间范围
      availableTimeRange: {
        years: [],
        months: []
      },
      userInfo: {}
    }
  },
  
  computed: {
    currentPeriodText() {
      if (this.currentTimeType === 'monthly') {
        return `${this.currentYear}年${this.currentMonth}月`;
      } else {
        return `${this.currentYear}年`;
      }
    },
    
    userRoleText() {
      // 角色显示名称映射
      const roleMap = {
        'admin': '管理员',
        'manager': '房管员',
        'user': '普通用户'
      };
      return roleMap[this.userInfo.role] || '未知角色';
    }
  },
  
  onLoad() {
    // 检查登录状态
    this.checkAuth();
    this.loadAvailableTimeRange();
    this.loadDashboardData();
  },
  
  onShow() {
    // 页面显示时刷新数据和用户信息
    this.checkAuth();
    this.loadDashboardData();
  },
  
  methods: {
    // 检查认证状态
    checkAuth() {
      const isAuth = checkPageAuth();
      if (isAuth) {
        this.userInfo = getCurrentUser() || {};
      }
      return isAuth;
    },
    
    // 修改密码
    changePassword() {
      uni.navigateTo({
        url: '/pages/change-password/change-password'
      });
    },
    
    // 处理退出登录
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            logout();
          }
        }
      });
    },
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
    
    // 加载可用时间范围
    async loadAvailableTimeRange() {
      try {
        // 同时获取租赁数据和水电记录数据来确定时间范围
        const [rentalsResult, utilityResult] = await Promise.all([
          uniCloud.callFunction({
            name: 'room-management',
            data: { action: 'getRentals' }
          }),
          uniCloud.callFunction({
            name: 'room-management',
            data: { action: 'getUtilityRecords' }
          })
        ]);
        
        const rentals = rentalsResult.result.code === 0 ? rentalsResult.result.data.list : [];
        const utilityRecords = utilityResult.result.code === 0 ? utilityResult.result.data.list : [];
        
        this.calculateAvailableTimeRange(rentals, utilityRecords);
      } catch (error) {
        console.error('加载时间范围失败:', error);
        // 失败时使用默认范围
        this.setDefaultTimeRange();
      }
    },
    
    // 根据租赁数据和水电记录计算可用时间范围
    calculateAvailableTimeRange(rentals, utilityRecords) {
      const dates = [];
      const currentDate = new Date();
      
      // 添加当前月份
      dates.push(currentDate);
      
      // 从租赁数据中提取日期
      rentals.forEach(rental => {
        if (rental.start_date) {
          dates.push(new Date(rental.start_date));
        }
        if (rental.end_date) {
          dates.push(new Date(rental.end_date));
        }
        if (rental.create_date) {
          dates.push(new Date(rental.create_date));  
        }
      });
      
      // 从水电记录中提取日期
      utilityRecords.forEach(record => {
        if (record.record_date) {
          dates.push(new Date(record.record_date));
        }
        if (record.create_date) {
          dates.push(new Date(record.create_date));
        }
      });
      
      // 去重并排序
      const uniqueDates = [...new Set(dates.map(date => date.getTime()))]
        .map(time => new Date(time))
        .sort((a, b) => a - b);
      
      if (uniqueDates.length === 0) {
        this.setDefaultTimeRange();
        return;
      }
      
      const minDate = uniqueDates[0];
      const maxDate = uniqueDates[uniqueDates.length - 1];
      
      // 生成年份范围（从最早年份到当前年份）
      const minYear = minDate.getFullYear();
      const maxYear = Math.max(currentDate.getFullYear(), maxDate.getFullYear());
      
      this.availableTimeRange.years = [];
      for (let year = minYear; year <= maxYear; year++) {
        this.availableTimeRange.years.push(year);
      }
      
      // 确保当前年份和月份在可用范围内
      if (!this.availableTimeRange.years.includes(this.currentYear)) {
        this.currentYear = this.availableTimeRange.years[this.availableTimeRange.years.length - 1];
      }
      
      // 生成当前年份的月份范围
      this.updateAvailableMonths();
      
      // 确保当前月份在可用范围内
      if (!this.availableTimeRange.months.includes(this.currentMonth)) {
        this.currentMonth = this.availableTimeRange.months[this.availableTimeRange.months.length - 1] || 1;
      }
      
      console.log('计算的时间范围:', {
        years: this.availableTimeRange.years,
        months: this.availableTimeRange.months,
        currentYear: this.currentYear,
        currentMonth: this.currentMonth
      });
    },
    
    // 更新可用月份（基于当前选中的年份和实际数据）
    updateAvailableMonths() {
      const currentDate = new Date();
      const selectedYear = this.currentYear;
      
      this.availableTimeRange.months = [];
      
      // 如果是当前年份，显示到当前月份
      if (selectedYear === currentDate.getFullYear()) {
        for (let month = 1; month <= currentDate.getMonth() + 1; month++) {
          this.availableTimeRange.months.push(month);
        }
      } else if (selectedYear < currentDate.getFullYear()) {
        // 历史年份，显示所有月份
        for (let month = 1; month <= 12; month++) {
          this.availableTimeRange.months.push(month);
        }
      } else {
        // 未来年份，暂时显示所有月份（实际使用中可能需要根据预期数据调整）
        for (let month = 1; month <= 12; month++) {
          this.availableTimeRange.months.push(month);
        }
      }
      
      // 确保至少有一个月份可选
      if (this.availableTimeRange.months.length === 0) {
        this.availableTimeRange.months.push(currentDate.getMonth() + 1);
      }
    },
    
    // 设置默认时间范围
    setDefaultTimeRange() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // 默认显示最近3年
      this.availableTimeRange.years = [];
      for (let year = currentYear - 2; year <= currentYear + 1; year++) {
        this.availableTimeRange.years.push(year);
      }
      
      this.updateAvailableMonths();
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
        // 月份选择器 - 基于可用月份
        if (this.availableTimeRange.months.length === 0) {
          uni.showToast({
            title: '暂无可用月份数据',
            icon: 'none'
          });
          return;
        }
        
        const months = this.availableTimeRange.months.map(month => `${month}月`);
        const currentIndex = this.availableTimeRange.months.indexOf(this.currentMonth);
        
        uni.showActionSheet({
          itemList: months,
          success: (res) => {
            this.currentMonth = this.availableTimeRange.months[res.tapIndex];
            this.loadIncomeStats();
          }
        });
      } else {
        // 年份选择器 - 基于可用年份
        if (this.availableTimeRange.years.length === 0) {
          uni.showToast({
            title: '暂无可用年份数据',
            icon: 'none'
          });
          return;
        }
        
        const years = this.availableTimeRange.years.map(year => `${year}年`);
        const currentIndex = this.availableTimeRange.years.indexOf(this.currentYear);
        
        uni.showActionSheet({
          itemList: years,
          success: (res) => {
            this.currentYear = this.availableTimeRange.years[res.tapIndex];
            // 年份改变时，更新可用月份
            this.updateAvailableMonths();
            // 如果当前月份不在新的可用月份中，设置为第一个可用月份
            if (!this.availableTimeRange.months.includes(this.currentMonth)) {
              this.currentMonth = this.availableTimeRange.months[0] || 1;
            }
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

/* 用户信息栏 */
.user-bar {
  background: white;
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #e5e5e5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.user-role {
  font-size: 24rpx;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 24rpx;
}

.change-password-btn {
  font-size: 28rpx;
  color: #1890ff;
  padding: 12rpx 20rpx;
  background: #f0f7ff;
  border-radius: 20rpx;
}

.change-password-btn:active {
  background: #e1f0ff;
}

.logout-btn {
  font-size: 28rpx;
  color: #ff4757;
  padding: 12rpx 20rpx;
  background: #ffeaea;
  border-radius: 20rpx;
}

.logout-btn:active {
  background: #ffdddd;
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

</style>
