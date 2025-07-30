"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statistics: {
        total: 0,
        rented: 0,
        available: 0,
        monthlyRevenue: 0
      },
      recentActivities: []
    };
  },
  onLoad() {
    this.loadStatistics();
    this.loadRecentActivities();
  },
  onShow() {
    this.loadStatistics();
  },
  methods: {
    // 加载统计数据
    async loadStatistics() {
      try {
        const promises = [
          this.getRoomCount(""),
          this.getRoomCount("rented"),
          this.getRoomCount("available")
        ];
        const results = await Promise.all(promises);
        this.statistics.total = results[0];
        this.statistics.rented = results[1];
        this.statistics.available = results[2];
        await this.calculateMonthlyRevenue();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:132", "加载统计数据失败:", error);
      }
    },
    // 获取房间数量
    async getRoomCount(status) {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              status,
              pageSize: 1e3,
              // 获取所有数据来计算总数
              pageNum: 1
            }
          }
        });
        return result.result.code === 0 ? result.result.data.total : 0;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:153", "获取房间数量失败:", error);
        return 0;
      }
    },
    // 计算月收入
    async calculateMonthlyRevenue() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              status: "rented",
              pageSize: 1e3,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          const rentedRooms = result.result.data.list;
          const totalRevenue = rentedRooms.reduce((sum, room) => {
            return sum + (room.rent_price || 0);
          }, 0);
          this.statistics.monthlyRevenue = totalRevenue;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:182", "计算月收入失败:", error);
      }
    },
    // 加载最近活动
    loadRecentActivities() {
      this.recentActivities = [
        {
          id: 1,
          icon: "🏠",
          title: "新增了101号房间",
          time: new Date(Date.now() - 2 * 60 * 60 * 1e3)
          // 2小时前
        }
      ];
    },
    // 导航到房间列表
    navigateToRooms(status) {
      common_vendor.index.switchTab({
        url: "/pages/room-list/room-list"
      });
    },
    // 添加房间
    addRoom() {
      common_vendor.index.navigateTo({
        url: "/pages/room-edit/room-edit"
      });
    },
    // 查看房间列表
    viewRooms() {
      common_vendor.index.switchTab({
        url: "/pages/room-list/room-list"
      });
    },
    // 水电管理
    utilityRecords() {
      common_vendor.index.navigateTo({
        url: "/pages/utility-record/utility-record"
      });
    },
    // 租户管理
    tenantManagement() {
      common_vendor.index.navigateTo({
        url: "/pages/tenant-info/tenant-info"
      });
    },
    // 系统测试
    systemTest() {
      common_vendor.index.navigateTo({
        url: "/pages/test/test"
      });
    },
    // 格式化时间
    formatTime(time) {
      const now = /* @__PURE__ */ new Date();
      const diff = now - time;
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      if (hours < 1) {
        return "刚刚";
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days}天前`;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.statistics.total),
    b: common_vendor.o(($event) => $options.navigateToRooms("")),
    c: common_vendor.t($data.statistics.rented),
    d: common_vendor.o(($event) => $options.navigateToRooms("rented")),
    e: common_vendor.t($data.statistics.available),
    f: common_vendor.o(($event) => $options.navigateToRooms("available")),
    g: common_vendor.t($data.statistics.monthlyRevenue),
    h: common_vendor.o((...args) => $options.addRoom && $options.addRoom(...args)),
    i: common_vendor.o((...args) => $options.viewRooms && $options.viewRooms(...args)),
    j: common_vendor.o((...args) => $options.utilityRecords && $options.utilityRecords(...args)),
    k: common_vendor.o((...args) => $options.tenantManagement && $options.tenantManagement(...args)),
    l: common_vendor.o((...args) => $options.systemTest && $options.systemTest(...args)),
    m: common_vendor.f($data.recentActivities, (activity, k0, i0) => {
      return {
        a: common_vendor.t(activity.icon),
        b: common_vendor.t(activity.title),
        c: common_vendor.t($options.formatTime(activity.time)),
        d: activity.id
      };
    }),
    n: $data.recentActivities.length === 0
  }, $data.recentActivities.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
