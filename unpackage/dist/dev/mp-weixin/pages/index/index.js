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
      loading: false
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
    this.loadDashboardData();
  },
  onShow() {
    this.loadDashboardData();
  },
  methods: {
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:214", "加载首页数据失败:", error);
        common_vendor.index.showToast({
          title: "数据加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:248", "加载收入统计失败:", error);
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:267", "加载房间统计失败:", error);
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
        common_vendor.index.__f__("error", "at pages/index/index.vue:285", "加载收入趋势失败:", error);
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
        const months = [];
        for (let i = 1; i <= 12; i++) {
          months.push(`${i}月`);
        }
        common_vendor.index.showActionSheet({
          itemList: months,
          success: (res) => {
            this.currentMonth = res.tapIndex + 1;
            this.loadIncomeStats();
          }
        });
      } else {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
          years.push(`${i}年`);
        }
        common_vendor.index.showActionSheet({
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
    },
    // 跳转到系统部署管理
    goToSystemDeploy() {
      common_vendor.index.navigateTo({
        url: "/pages/system-deploy/system-deploy"
      });
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
  } : {}, {
    w: common_vendor.o((...args) => $options.goToSystemDeploy && $options.goToSystemDeploy(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
