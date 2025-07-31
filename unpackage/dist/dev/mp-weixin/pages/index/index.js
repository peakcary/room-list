"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentTimeType: "monthly",
      // monthly 或 yearly
      currentYear: (/* @__PURE__ */ new Date()).getFullYear(),
      currentMonth: (/* @__PURE__ */ new Date()).getMonth() + 1,
      incomeStats: {
        rent_income: 0,
        utility_income: 0,
        maintenance_expenses: 0,
        net_income: 0,
        period: ""
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
      }
    };
  },
  computed: {
    currentPeriodText() {
      if (this.currentTimeType === "monthly") {
        return `${this.currentYear}年${this.currentMonth}月`;
      } else {
        return `${this.currentYear}年`;
      }
    }
  },
  onLoad() {
    this.checkAuth();
    this.loadAvailableTimeRange();
    this.loadDashboardData();
  },
  onShow() {
    this.loadDashboardData();
  },
  methods: {
    // 检查认证状态
    checkAuth() {
      const { checkPageAuth } = require("../../utils/auth.js");
      return checkPageAuth();
    },
    // 加载首页数据
    async loadDashboardData() {
      if (this.loading)
        return;
      this.loading = true;
      try {
        await this.loadIncomeStats();
        await this.loadOccupancyStats();
        await this.loadIncomeTrend();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:221", "加载首页数据失败:", error);
        common_vendor.index.showToast({
          title: "数据加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 加载可用时间范围
    async loadAvailableTimeRange() {
      try {
        const [rentalsResult, utilityResult] = await Promise.all([
          common_vendor.tr.callFunction({
            name: "room-management",
            data: { action: "getRentals" }
          }),
          common_vendor.tr.callFunction({
            name: "room-management",
            data: { action: "getUtilityRecords" }
          })
        ]);
        const rentals = rentalsResult.result.code === 0 ? rentalsResult.result.data.list : [];
        const utilityRecords = utilityResult.result.code === 0 ? utilityResult.result.data.list : [];
        this.calculateAvailableTimeRange(rentals, utilityRecords);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:251", "加载时间范围失败:", error);
        this.setDefaultTimeRange();
      }
    },
    // 根据租赁数据和水电记录计算可用时间范围
    calculateAvailableTimeRange(rentals, utilityRecords) {
      const dates = [];
      const currentDate = /* @__PURE__ */ new Date();
      dates.push(currentDate);
      rentals.forEach((rental) => {
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
      utilityRecords.forEach((record) => {
        if (record.record_date) {
          dates.push(new Date(record.record_date));
        }
        if (record.create_date) {
          dates.push(new Date(record.create_date));
        }
      });
      const uniqueDates = [...new Set(dates.map((date) => date.getTime()))].map((time) => new Date(time)).sort((a, b) => a - b);
      if (uniqueDates.length === 0) {
        this.setDefaultTimeRange();
        return;
      }
      const minDate = uniqueDates[0];
      const maxDate = uniqueDates[uniqueDates.length - 1];
      const minYear = minDate.getFullYear();
      const maxYear = Math.max(currentDate.getFullYear(), maxDate.getFullYear());
      this.availableTimeRange.years = [];
      for (let year = minYear; year <= maxYear; year++) {
        this.availableTimeRange.years.push(year);
      }
      if (!this.availableTimeRange.years.includes(this.currentYear)) {
        this.currentYear = this.availableTimeRange.years[this.availableTimeRange.years.length - 1];
      }
      this.updateAvailableMonths();
      if (!this.availableTimeRange.months.includes(this.currentMonth)) {
        this.currentMonth = this.availableTimeRange.months[this.availableTimeRange.months.length - 1] || 1;
      }
      common_vendor.index.__f__("log", "at pages/index/index.vue:323", "计算的时间范围:", {
        years: this.availableTimeRange.years,
        months: this.availableTimeRange.months,
        currentYear: this.currentYear,
        currentMonth: this.currentMonth
      });
    },
    // 更新可用月份（基于当前选中的年份和实际数据）
    updateAvailableMonths() {
      const currentDate = /* @__PURE__ */ new Date();
      const selectedYear = this.currentYear;
      this.availableTimeRange.months = [];
      if (selectedYear === currentDate.getFullYear()) {
        for (let month = 1; month <= currentDate.getMonth() + 1; month++) {
          this.availableTimeRange.months.push(month);
        }
      } else if (selectedYear < currentDate.getFullYear()) {
        for (let month = 1; month <= 12; month++) {
          this.availableTimeRange.months.push(month);
        }
      } else {
        for (let month = 1; month <= 12; month++) {
          this.availableTimeRange.months.push(month);
        }
      }
      if (this.availableTimeRange.months.length === 0) {
        this.availableTimeRange.months.push(currentDate.getMonth() + 1);
      }
    },
    // 设置默认时间范围
    setDefaultTimeRange() {
      const currentDate = /* @__PURE__ */ new Date();
      const currentYear = currentDate.getFullYear();
      this.availableTimeRange.years = [];
      for (let year = currentYear - 2; year <= currentYear + 1; year++) {
        this.availableTimeRange.years.push(year);
      }
      this.updateAvailableMonths();
    },
    // 加载收入统计
    async loadIncomeStats() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getIncomeStatistics",
            data: {
              year: this.currentYear,
              month: this.currentTimeType === "monthly" ? this.currentMonth : void 0,
              type: this.currentTimeType
            }
          }
        });
        if (result.result.code === 0) {
          if (this.currentTimeType === "yearly" && result.result.data.year_totals) {
            this.incomeStats = result.result.data.year_totals;
            this.incomeStats.period = result.result.data.period;
          } else {
            this.incomeStats = result.result.data;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:399", "加载收入统计失败:", error);
      }
    },
    // 加载房间出租统计
    async loadOccupancyStats() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRoomOccupancyStatistics"
          }
        });
        if (result.result.code === 0) {
          this.occupancyStats = result.result.data.room_status;
          this.rentalAlerts = result.result.data.rental_activity;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:418", "加载房间统计失败:", error);
      }
    },
    // 加载收入趋势
    async loadIncomeTrend() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getIncomeTrend"
          }
        });
        if (result.result.code === 0) {
          this.incomeTrend = result.result.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:436", "加载收入趋势失败:", error);
      }
    },
    // 切换时间类型
    switchTimeType(type) {
      if (this.currentTimeType === type)
        return;
      this.currentTimeType = type;
      this.loadIncomeStats();
    },
    // 显示时间选择器
    showTimePicker() {
      if (this.currentTimeType === "monthly") {
        if (this.availableTimeRange.months.length === 0) {
          common_vendor.index.showToast({
            title: "暂无可用月份数据",
            icon: "none"
          });
          return;
        }
        const months = this.availableTimeRange.months.map((month) => `${month}月`);
        this.availableTimeRange.months.indexOf(this.currentMonth);
        common_vendor.index.showActionSheet({
          itemList: months,
          success: (res) => {
            this.currentMonth = this.availableTimeRange.months[res.tapIndex];
            this.loadIncomeStats();
          }
        });
      } else {
        if (this.availableTimeRange.years.length === 0) {
          common_vendor.index.showToast({
            title: "暂无可用年份数据",
            icon: "none"
          });
          return;
        }
        const years = this.availableTimeRange.years.map((year) => `${year}年`);
        this.availableTimeRange.years.indexOf(this.currentYear);
        common_vendor.index.showActionSheet({
          itemList: years,
          success: (res) => {
            this.currentYear = this.availableTimeRange.years[res.tapIndex];
            this.updateAvailableMonths();
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
      if (this.incomeTrend.length === 0)
        return 0;
      const maxAmount = Math.max(...this.incomeTrend.map(
        (item) => item.rent_income + item.utility_income
      ));
      return maxAmount > 0 ? amount / maxAmount * 100 : 0;
    },
    // 格式化趋势月份
    formatTrendMonth(monthStr) {
      const [year, month] = monthStr.split("-");
      return `${month}月`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentTimeType === "monthly" ? 1 : "",
    b: common_vendor.o(($event) => $options.switchTimeType("monthly")),
    c: $data.currentTimeType === "yearly" ? 1 : "",
    d: common_vendor.o(($event) => $options.switchTimeType("yearly")),
    e: common_vendor.t($options.currentPeriodText),
    f: common_vendor.o((...args) => $options.showTimePicker && $options.showTimePicker(...args)),
    g: common_vendor.t($data.incomeStats.rent_income || 0),
    h: common_vendor.t($data.incomeStats.utility_income || 0),
    i: common_vendor.t($data.incomeStats.maintenance_expenses || 0),
    j: common_vendor.t($data.incomeStats.net_income || 0),
    k: common_vendor.t($data.occupancyStats.occupancy_rate || 0),
    l: common_vendor.t($data.occupancyStats.total || 0),
    m: common_vendor.t($data.occupancyStats.rented || 0),
    n: common_vendor.t($data.occupancyStats.available || 0),
    o: $data.rentalAlerts.expiring_soon > 0 || $data.rentalAlerts.overdue > 0
  }, $data.rentalAlerts.expiring_soon > 0 || $data.rentalAlerts.overdue > 0 ? common_vendor.e({
    p: $data.rentalAlerts.expiring_soon > 0
  }, $data.rentalAlerts.expiring_soon > 0 ? {
    q: common_vendor.t($data.rentalAlerts.expiring_soon)
  } : {}, {
    r: $data.rentalAlerts.overdue > 0
  }, $data.rentalAlerts.overdue > 0 ? {
    s: common_vendor.t($data.rentalAlerts.overdue)
  } : {}) : {}, {
    t: $data.incomeTrend.length > 0
  }, $data.incomeTrend.length > 0 ? {
    v: common_vendor.f($data.incomeTrend, (item, index, i0) => {
      return {
        a: $options.getTrendBarHeight(item.rent_income) + "%",
        b: $options.getTrendBarHeight(item.utility_income) + "%",
        c: $options.getTrendBarHeight(item.rent_income) + "%",
        d: common_vendor.t($options.formatTrendMonth(item.month)),
        e: common_vendor.t(item.rent_income + item.utility_income),
        f: index
      };
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
