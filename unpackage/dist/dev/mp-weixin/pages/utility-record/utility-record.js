"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      roomId: "",
      roomInfo: null,
      recordList: [],
      loading: true,
      showAddForm: false,
      newRecord: {
        electricity_reading: "",
        water_reading: ""
      }
    };
  },
  onLoad(options) {
    if (options.roomId) {
      this.roomId = options.roomId;
      this.loadRoomInfo();
      this.loadRecords();
    }
  },
  methods: {
    // 加载房间信息
    async loadRoomInfo() {
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
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/utility-record/utility-record.vue:167", "加载房间信息失败:", error);
      }
    },
    // 加载水电记录
    async loadRecords() {
      this.loading = true;
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getUtilityRecords",
            data: {
              roomId: this.roomId,
              pageSize: 50,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          this.recordList = result.result.data.list;
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/utility-record/utility-record.vue:197", "加载水电记录失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 添加水电记录
    async addRecord() {
      if (!this.newRecord.electricity_reading && !this.newRecord.water_reading) {
        common_vendor.index.showToast({
          title: "请输入电表或水表读数",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "添加中..."
      });
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "addUtilityRecord",
            data: {
              roomId: this.roomId,
              electricity_reading: this.newRecord.electricity_reading || 0,
              water_reading: this.newRecord.water_reading || 0
            }
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "success"
          });
          this.closeAddForm();
          this.loadRecords();
          this.loadRoomInfo();
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/utility-record/utility-record.vue:250", "添加水电记录失败:", error);
        common_vendor.index.showToast({
          title: "添加失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 标记已缴费
    async markAsPaid(recordId) {
      common_vendor.index.showModal({
        title: "确认操作",
        content: "确定要标记为已缴费吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await common_vendor.tr.callFunction({
                name: "room-management",
                data: {
                  action: "updateUtilityPayment",
                  data: {
                    recordId,
                    isPaid: true
                  }
                }
              });
              if (result.result.code === 0) {
                common_vendor.index.showToast({
                  title: "更新成功",
                  icon: "success"
                });
                this.loadRecords();
              } else {
                common_vendor.index.showToast({
                  title: result.result.message,
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/utility-record/utility-record.vue:292", "更新缴费状态失败:", error);
              common_vendor.index.showToast({
                title: "操作失败",
                icon: "none"
              });
            }
          }
        }
      });
    },
    // 关闭添加表单
    closeAddForm() {
      this.showAddForm = false;
      this.newRecord = {
        electricity_reading: "",
        water_reading: ""
      };
    },
    // 格式化日期时间
    formatDateTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b;
  return common_vendor.e({
    a: $data.roomInfo
  }, $data.roomInfo ? {
    b: common_vendor.t($data.roomInfo.room_number),
    c: common_vendor.t(((_a = $data.roomInfo.utilities) == null ? void 0 : _a.electricity_reading) || 0),
    d: common_vendor.t(((_b = $data.roomInfo.utilities) == null ? void 0 : _b.water_reading) || 0)
  } : {}, {
    e: common_vendor.o(($event) => $data.showAddForm = true),
    f: common_vendor.f($data.recordList, (record, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.formatDateTime(record.record_date)),
        b: common_vendor.t(record.is_paid ? "已缴费" : "未缴费"),
        c: record.is_paid ? 1 : "",
        d: common_vendor.t(record.electricity_reading),
        e: common_vendor.t(record.electricity_usage),
        f: common_vendor.t(record.water_reading),
        g: common_vendor.t(record.water_usage),
        h: common_vendor.t(record.electricity_fee.toFixed(2)),
        i: common_vendor.t(record.water_fee.toFixed(2)),
        j: common_vendor.t(record.total_fee.toFixed(2)),
        k: !record.is_paid
      }, !record.is_paid ? {
        l: common_vendor.o(($event) => $options.markAsPaid(record._id), record._id)
      } : {}, {
        m: record._id
      });
    }),
    g: $data.recordList.length === 0 && !$data.loading
  }, $data.recordList.length === 0 && !$data.loading ? {} : {}, {
    h: $data.showAddForm
  }, $data.showAddForm ? {
    i: common_vendor.o((...args) => $options.closeAddForm && $options.closeAddForm(...args)),
    j: $data.newRecord.electricity_reading,
    k: common_vendor.o(common_vendor.m(($event) => $data.newRecord.electricity_reading = $event.detail.value, {
      number: true
    })),
    l: $data.newRecord.water_reading,
    m: common_vendor.o(common_vendor.m(($event) => $data.newRecord.water_reading = $event.detail.value, {
      number: true
    })),
    n: common_vendor.o((...args) => $options.closeAddForm && $options.closeAddForm(...args)),
    o: common_vendor.o((...args) => $options.addRecord && $options.addRecord(...args)),
    p: common_vendor.o(() => {
    }),
    q: common_vendor.o((...args) => $options.closeAddForm && $options.closeAddForm(...args))
  } : {}, {
    r: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/utility-record/utility-record.js.map
