"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      roomInfo: null,
      loading: true,
      roomId: "",
      maintenanceRecords: [],
      rentalHistory: [],
      showMaintenanceModal: false,
      maintenanceForm: {
        amount: "",
        description: ""
      }
    };
  },
  onLoad(options) {
    if (options.id) {
      this.roomId = options.id;
      this.loadRoomInfo();
    }
  },
  methods: {
    // 加载房间信息
    async loadRoomInfo() {
      this.loading = true;
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRoomById",
            data: { id: this.roomId }
          }
        });
        if (result.result.code === 0) {
          this.roomInfo = result.result.data;
          common_vendor.index.setNavigationBarTitle({
            title: `${this.roomInfo.room_number}号房详情`
          });
          await this.loadMaintenanceRecords();
          await this.loadRentalHistory();
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:228", "加载房间信息失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 加载维修记录
    async loadMaintenanceRecords() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getMaintenanceRecords",
            data: { roomId: this.roomId }
          }
        });
        if (result.result.code === 0) {
          this.maintenanceRecords = result.result.data || [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:253", "加载维修记录失败:", error);
      }
    },
    // 显示添加维修弹窗
    showAddMaintenance() {
      this.maintenanceForm = {
        amount: "",
        description: ""
      };
      this.showMaintenanceModal = true;
    },
    // 关闭添加维修弹窗
    closeAddMaintenance() {
      this.showMaintenanceModal = false;
    },
    // 保存维修记录
    async saveMaintenance() {
      if (!this.maintenanceForm.amount || !this.maintenanceForm.description) {
        common_vendor.index.showToast({
          title: "请填写完整信息",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.showLoading({ title: "保存中..." });
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "addMaintenanceRecord",
            data: {
              roomId: this.roomId,
              amount: parseFloat(this.maintenanceForm.amount),
              description: this.maintenanceForm.description.trim()
            }
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
          this.closeAddMaintenance();
          await this.loadMaintenanceRecords();
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:310", "保存维修记录失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 管理租户
    manageTenant() {
      common_vendor.index.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${this.roomId}`
      });
    },
    // 删除房间
    deleteRoom() {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除${this.roomInfo.room_number}号房吗？此操作不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              const result = await common_vendor.tr.callFunction({
                name: "room-management",
                data: {
                  action: "deleteRoom",
                  data: { id: this.roomId }
                }
              });
              if (result.result.code === 0) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                setTimeout(() => {
                  common_vendor.index.navigateBack();
                }, 1500);
              } else {
                common_vendor.index.showToast({
                  title: result.result.message,
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:361", "删除房间失败:", error);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    },
    // 拨打电话
    callTenant() {
      var _a;
      if ((_a = this.roomInfo.tenant_info) == null ? void 0 : _a.phone) {
        common_vendor.index.makePhoneCall({
          phoneNumber: this.roomInfo.tenant_info.phone
        });
      }
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
    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp)
        return "--";
      const date = new Date(timestamp);
      return date.toLocaleDateString();
    },
    // 加载出租历史记录
    async loadRentalHistory() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRentalHistory",
            data: { roomId: this.roomId }
          }
        });
        if (result.result.code === 0) {
          this.rentalHistory = result.result.data || [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:416", "加载出租历史失败:", error);
      }
    },
    // 获取租赁状态文本
    getRentalStatusText(status) {
      const statusMap = {
        active: "在租",
        terminated: "已终止",
        expired: "已过期"
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
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.roomInfo
  }, $data.roomInfo ? common_vendor.e({
    b: common_vendor.t($data.roomInfo.room_number),
    c: common_vendor.t($data.roomInfo.floor || "--"),
    d: common_vendor.t($options.getStatusText($data.roomInfo.status)),
    e: common_vendor.n("status-" + $data.roomInfo.status),
    f: $data.roomInfo.tenant_info
  }, $data.roomInfo.tenant_info ? {
    g: common_vendor.t($data.roomInfo.tenant_info.name),
    h: common_vendor.t($data.roomInfo.tenant_info.id_card),
    i: common_vendor.t($data.roomInfo.tenant_info.phone),
    j: common_vendor.o((...args) => $options.callTenant && $options.callTenant(...args)),
    k: common_vendor.t($options.formatDate($data.roomInfo.tenant_info.rent_start_date)),
    l: common_vendor.t($options.formatDate($data.roomInfo.tenant_info.rent_end_date))
  } : {}, {
    m: $data.rentalHistory.length > 0
  }, $data.rentalHistory.length > 0 ? {
    n: common_vendor.f($data.rentalHistory, (rental, k0, i0) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: common_vendor.t(((_a = rental.tenant_info) == null ? void 0 : _a.name) || "租户信息缺失"),
        b: common_vendor.t($options.getRentalStatusText(rental.status)),
        c: common_vendor.n("rental-status-" + rental.status),
        d: common_vendor.t($options.formatDateRange(rental.rent_start_date, rental.rent_end_date)),
        e: common_vendor.t(rental.rent_price),
        f: common_vendor.t(rental.deposit),
        g: (_b = rental.tenant_info) == null ? void 0 : _b.phone
      }, ((_c = rental.tenant_info) == null ? void 0 : _c.phone) ? {
        h: common_vendor.t(rental.tenant_info.phone),
        i: common_vendor.o(($event) => $options.callTenant(rental.tenant_info.phone), rental._id)
      } : {}, {
        j: rental._id
      });
    })
  } : {}, {
    o: common_vendor.o((...args) => $options.showAddMaintenance && $options.showAddMaintenance(...args)),
    p: $data.maintenanceRecords.length > 0
  }, $data.maintenanceRecords.length > 0 ? {
    q: common_vendor.f($data.maintenanceRecords, (record, k0, i0) => {
      return {
        a: common_vendor.t(record.amount),
        b: common_vendor.t($options.formatDate(record.create_date)),
        c: common_vendor.t(record.description),
        d: record._id
      };
    })
  } : {}, {
    r: $data.roomInfo.status === "available"
  }, $data.roomInfo.status === "available" ? {
    s: common_vendor.o((...args) => $options.manageTenant && $options.manageTenant(...args))
  } : {}, {
    t: $data.roomInfo.status === "available"
  }, $data.roomInfo.status === "available" ? {
    v: common_vendor.o((...args) => $options.deleteRoom && $options.deleteRoom(...args))
  } : {}) : {}, {
    w: $data.loading
  }, $data.loading ? {} : {}, {
    x: $data.showMaintenanceModal
  }, $data.showMaintenanceModal ? {
    y: common_vendor.o((...args) => $options.closeAddMaintenance && $options.closeAddMaintenance(...args)),
    z: $data.maintenanceForm.amount,
    A: common_vendor.o(($event) => $data.maintenanceForm.amount = $event.detail.value),
    B: $data.maintenanceForm.description,
    C: common_vendor.o(($event) => $data.maintenanceForm.description = $event.detail.value),
    D: common_vendor.o((...args) => $options.closeAddMaintenance && $options.closeAddMaintenance(...args)),
    E: common_vendor.o((...args) => $options.saveMaintenance && $options.saveMaintenance(...args)),
    F: common_vendor.o(() => {
    }),
    G: common_vendor.o((...args) => $options.closeAddMaintenance && $options.closeAddMaintenance(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/room-detail/room-detail.js.map
