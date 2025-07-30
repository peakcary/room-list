"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      roomList: [],
      loading: false,
      hasMore: true,
      pageNum: 1,
      pageSize: 10,
      currentTab: "all",
      // 当前选中的Tab
      searchKeyword: "",
      // 搜索关键词
      searchTimer: null,
      // 搜索防抖定时器
      statistics: {
        total: 0,
        rented: 0,
        available: 0
      }
    };
  },
  onLoad() {
    this.loadRooms();
    this.loadStatistics();
  },
  onPullDownRefresh() {
    this.refreshData();
  },
  onShow() {
    this.refreshData();
  },
  methods: {
    // 加载房间列表
    async loadRooms(isRefresh = false) {
      if (this.loading)
        return;
      this.loading = true;
      if (isRefresh) {
        this.pageNum = 1;
        this.roomList = [];
        this.hasMore = true;
      }
      try {
        const requestData = {
          pageNum: this.pageNum,
          pageSize: this.pageSize,
          searchKeyword: this.searchKeyword
        };
        if (this.currentTab !== "all") {
          requestData.status = this.currentTab;
        }
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: requestData
          }
        });
        if (result.result.code === 0) {
          const { list, total } = result.result.data;
          if (isRefresh) {
            this.roomList = list;
          } else {
            this.roomList = [...this.roomList, ...list];
          }
          this.hasMore = this.roomList.length < total;
          this.pageNum++;
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-list/room-list.vue:188", "加载房间列表失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
        common_vendor.index.stopPullDownRefresh();
      }
    },
    // 加载统计信息
    async loadStatistics() {
      try {
        const promises = [
          this.getRoomCount(""),
          this.getRoomCount("rented"),
          this.getRoomCount("available")
        ];
        const results = await Promise.all(promises);
        this.statistics = {
          total: results[0],
          rented: results[1],
          available: results[2]
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-list/room-list.vue:216", "加载统计信息失败:", error);
      }
    },
    // 获取房间数量
    async getRoomCount(status) {
      const requestData = {
        pageSize: 1,
        // 只需要获取总数，不需要具体数据
        pageNum: 1
      };
      if (status) {
        requestData.status = status;
      }
      const result = await common_vendor.tr.callFunction({
        name: "room-management",
        data: {
          action: "getRooms",
          data: requestData
        }
      });
      return result.result.code === 0 ? result.result.data.total : 0;
    },
    // 搜索
    onSearch(e) {
      this.searchKeyword = e.detail.value;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.refreshData();
      }, 500);
    },
    // 刷新数据
    refreshData() {
      this.loadRooms(true);
      this.loadStatistics();
    },
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.loadRooms();
      }
    },
    // Tab切换
    switchTab(tab) {
      if (this.currentTab === tab)
        return;
      this.currentTab = tab;
      this.refreshData();
    },
    // 查看房间详情
    viewRoom(room) {
      common_vendor.index.navigateTo({
        url: `/pages/room-detail/room-detail?id=${room._id}`
      });
    },
    // 添加房间
    addRoom() {
      common_vendor.index.navigateTo({
        url: "/pages/room-edit/room-edit"
      });
    },
    // 创建租赁关系
    createRental(room) {
      common_vendor.index.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${room._id}&action=create`
      });
    },
    // 终止租赁关系
    terminateRental(room) {
      if (!room.current_rental_id)
        return;
      common_vendor.index.showModal({
        title: "确认退租",
        content: `确定要终止${room.room_number}号房的租赁关系吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "处理中..." });
              const result = await common_vendor.tr.callFunction({
                name: "room-management",
                data: {
                  action: "terminateRental",
                  data: {
                    rental_id: room.current_rental_id,
                    termination_reason: "正常退租"
                  }
                }
              });
              if (result.result.code === 0) {
                common_vendor.index.showToast({
                  title: "退租成功",
                  icon: "success"
                });
                this.refreshData();
              } else {
                common_vendor.index.showToast({
                  title: result.result.message,
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/room-list/room-list.vue:333", "退租失败:", error);
              common_vendor.index.showToast({
                title: "操作失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        available: "可租用",
        rented: "已租用",
        maintenance: "维修中"
      };
      return statusMap[status] || "未知";
    },
    // 格式化日期范围
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate)
        return "--";
      const start = new Date(startDate);
      const end = new Date(endDate);
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      return `${formatDate(start)} 至 ${formatDate(end)}`;
    },
    // 计算剩余天数
    getDaysRemaining(endDate) {
      if (!endDate)
        return "";
      const end = new Date(endDate);
      const now = /* @__PURE__ */ new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays < 0) {
        return "已过期";
      } else if (diffDays === 0) {
        return "今日到期";
      } else if (diffDays <= 7) {
        return `${diffDays}天后到期`;
      } else if (diffDays <= 30) {
        return `${diffDays}天后到期`;
      } else {
        return `${Math.floor(diffDays / 30)}个月后到期`;
      }
    },
    // 获取剩余天数样式类
    getDaysRemainingClass(endDate) {
      if (!endDate)
        return "";
      const end = new Date(endDate);
      const now = /* @__PURE__ */ new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays < 0) {
        return "expired";
      } else if (diffDays <= 7) {
        return "urgent";
      } else if (diffDays <= 30) {
        return "warning";
      } else {
        return "normal";
      }
    },
    // 拨打电话
    callTenant(phoneNumber) {
      common_vendor.index.makePhoneCall({
        phoneNumber,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/room-list/room-list.vue:421", "拨打电话失败:", err);
          common_vendor.index.showToast({
            title: "拨打失败",
            icon: "none"
          });
        }
      });
    },
    // 续租
    renewRental(room) {
      if (!room.current_rental_id)
        return;
      common_vendor.index.navigateTo({
        url: `/pages/rental-renewal/rental-renewal?rentalId=${room.current_rental_id}&roomId=${room._id}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.statistics.total),
    b: $data.currentTab === "all" ? 1 : "",
    c: common_vendor.o(($event) => $options.switchTab("all")),
    d: common_vendor.t($data.statistics.available),
    e: $data.currentTab === "available" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchTab("available")),
    g: common_vendor.t($data.statistics.rented),
    h: $data.currentTab === "rented" ? 1 : "",
    i: common_vendor.o(($event) => $options.switchTab("rented")),
    j: common_vendor.o([($event) => $data.searchKeyword = $event.detail.value, (...args) => $options.onSearch && $options.onSearch(...args)]),
    k: $data.searchKeyword,
    l: common_vendor.o((...args) => $options.addRoom && $options.addRoom(...args)),
    m: common_vendor.f($data.roomList, (room, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(room.room_number),
        b: room.status === "available"
      }, room.status === "available" ? {
        c: common_vendor.o(($event) => $options.createRental(room), room._id)
      } : {}, {
        d: room.status === "rented"
      }, room.status === "rented" ? {
        e: common_vendor.o(($event) => $options.renewRental(room), room._id)
      } : {}, {
        f: room.status === "rented"
      }, room.status === "rented" ? {
        g: common_vendor.o(($event) => $options.terminateRental(room), room._id)
      } : {}, {
        h: room.current_tenant
      }, room.current_tenant ? common_vendor.e({
        i: common_vendor.t(room.current_tenant.name),
        j: common_vendor.t(room.current_tenant.phone),
        k: common_vendor.o(($event) => $options.callTenant(room.current_tenant.phone), room._id),
        l: room.current_rental
      }, room.current_rental ? {
        m: common_vendor.t($options.formatDateRange(room.current_rental.rent_start_date, room.current_rental.rent_end_date)),
        n: common_vendor.t($options.getDaysRemaining(room.current_rental.rent_end_date)),
        o: common_vendor.n($options.getDaysRemainingClass(room.current_rental.rent_end_date))
      } : {}) : {}, {
        p: room._id,
        q: common_vendor.o(($event) => $options.viewRoom(room), room._id)
      });
    }),
    n: $data.hasMore
  }, $data.hasMore ? {
    o: common_vendor.t($data.loading ? "加载中..." : "上拉加载更多")
  } : {}, {
    p: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/room-list/room-list.js.map
