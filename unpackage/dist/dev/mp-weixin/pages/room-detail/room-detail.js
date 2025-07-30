"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      roomInfo: null,
      loading: true,
      roomId: ""
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
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:149", "加载房间信息失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 编辑房间
    editRoom() {
      common_vendor.index.navigateTo({
        url: `/pages/room-edit/room-edit?id=${this.roomId}`
      });
    },
    // 管理水电
    manageUtilities() {
      common_vendor.index.navigateTo({
        url: `/pages/utility-record/utility-record?roomId=${this.roomId}`
      });
    },
    // 管理租户
    manageTenant() {
      common_vendor.index.navigateTo({
        url: `/pages/tenant-info/tenant-info?roomId=${this.roomId}`
      });
    },
    // 移除租户
    removeTenant() {
      common_vendor.index.showModal({
        title: "确认操作",
        content: "确定要移除当前租户吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await common_vendor.tr.callFunction({
                name: "room-management",
                data: {
                  action: "removeTenant",
                  data: { roomId: this.roomId }
                }
              });
              if (result.result.code === 0) {
                common_vendor.index.showToast({
                  title: "移除成功",
                  icon: "success"
                });
                this.loadRoomInfo();
              } else {
                common_vendor.index.showToast({
                  title: result.result.message,
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/room-detail/room-detail.vue:209", "移除租户失败:", error);
              common_vendor.index.showToast({
                title: "操作失败",
                icon: "none"
              });
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
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c, _d;
  return common_vendor.e({
    a: $data.roomInfo
  }, $data.roomInfo ? common_vendor.e({
    b: common_vendor.t($data.roomInfo.room_number),
    c: common_vendor.t($data.roomInfo.floor || "--"),
    d: common_vendor.t($data.roomInfo.area || "--"),
    e: common_vendor.t($data.roomInfo.rent_price),
    f: common_vendor.t($options.getStatusText($data.roomInfo.status)),
    g: common_vendor.n("status-" + $data.roomInfo.status),
    h: $data.roomInfo.tenant_info
  }, $data.roomInfo.tenant_info ? {
    i: common_vendor.t($data.roomInfo.tenant_info.name),
    j: common_vendor.t($data.roomInfo.tenant_info.id_card),
    k: common_vendor.t($data.roomInfo.tenant_info.phone),
    l: common_vendor.o((...args) => $options.callTenant && $options.callTenant(...args)),
    m: common_vendor.t($options.formatDate($data.roomInfo.tenant_info.rent_start_date)),
    n: common_vendor.t($options.formatDate($data.roomInfo.tenant_info.rent_end_date))
  } : {}, {
    o: common_vendor.t(((_a = $data.roomInfo.utilities) == null ? void 0 : _a.electricity_reading) || 0),
    p: common_vendor.t(((_b = $data.roomInfo.utilities) == null ? void 0 : _b.water_reading) || 0),
    q: common_vendor.t(((_c = $data.roomInfo.utilities) == null ? void 0 : _c.electricity_rate) || 0.5),
    r: common_vendor.t(((_d = $data.roomInfo.utilities) == null ? void 0 : _d.water_rate) || 3),
    s: common_vendor.o((...args) => $options.editRoom && $options.editRoom(...args)),
    t: common_vendor.o((...args) => $options.manageUtilities && $options.manageUtilities(...args)),
    v: $data.roomInfo.status === "available"
  }, $data.roomInfo.status === "available" ? {
    w: common_vendor.o((...args) => $options.manageTenant && $options.manageTenant(...args))
  } : {}, {
    x: $data.roomInfo.status === "rented"
  }, $data.roomInfo.status === "rented" ? {
    y: common_vendor.o((...args) => $options.removeTenant && $options.removeTenant(...args))
  } : {}) : {}, {
    z: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/room-detail/room-detail.js.map
