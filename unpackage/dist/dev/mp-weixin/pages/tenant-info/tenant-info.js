"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      loading: true,
      roomId: "",
      roomInfo: null,
      formData: {
        name: "",
        id_card: "",
        phone: "",
        rent_start_date: "",
        rent_end_date: ""
      }
    };
  },
  onLoad(options) {
    if (options.roomId) {
      this.roomId = options.roomId;
      this.loadRoomInfo();
    } else {
      this.loading = false;
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
          if (this.roomInfo.tenant_info) {
            this.formData = {
              name: this.roomInfo.tenant_info.name || "",
              id_card: this.roomInfo.tenant_info.id_card || "",
              phone: this.roomInfo.tenant_info.phone || "",
              rent_start_date: this.formatDateForPicker(this.roomInfo.tenant_info.rent_start_date),
              rent_end_date: this.formatDateForPicker(this.roomInfo.tenant_info.rent_end_date)
            };
            common_vendor.index.setNavigationBarTitle({
              title: "编辑租户信息"
            });
          } else {
            common_vendor.index.setNavigationBarTitle({
              title: "添加租户信息"
            });
          }
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/tenant-info/tenant-info.vue:164", "加载房间信息失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 开始日期选择
    onStartDateChange(e) {
      this.formData.rent_start_date = e.detail.value;
    },
    // 结束日期选择
    onEndDateChange(e) {
      this.formData.rent_end_date = e.detail.value;
    },
    // 格式化日期为picker需要的格式
    formatDateForPicker(timestamp) {
      if (!timestamp)
        return "";
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 表单验证
    validateForm() {
      if (!this.formData.name.trim()) {
        common_vendor.index.showToast({
          title: "请输入租户姓名",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.id_card.trim()) {
        common_vendor.index.showToast({
          title: "请输入身份证号",
          icon: "none"
        });
        return false;
      }
      if (!/^\d{17}[\dXx]$/.test(this.formData.id_card)) {
        common_vendor.index.showToast({
          title: "请输入有效的身份证号",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.phone.trim()) {
        common_vendor.index.showToast({
          title: "请输入联系电话",
          icon: "none"
        });
        return false;
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        common_vendor.index.showToast({
          title: "请输入有效的手机号",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.rent_start_date) {
        common_vendor.index.showToast({
          title: "请选择租期开始日期",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.rent_end_date) {
        common_vendor.index.showToast({
          title: "请选择租期结束日期",
          icon: "none"
        });
        return false;
      }
      if (new Date(this.formData.rent_start_date) >= new Date(this.formData.rent_end_date)) {
        common_vendor.index.showToast({
          title: "结束日期必须晚于开始日期",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 保存租户信息
    async saveTenant() {
      if (!this.validateForm())
        return;
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      try {
        const tenantInfo = {
          name: this.formData.name.trim(),
          id_card: this.formData.id_card.trim(),
          phone: this.formData.phone.trim(),
          rent_start_date: new Date(this.formData.rent_start_date).getTime(),
          rent_end_date: new Date(this.formData.rent_end_date).getTime()
        };
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "updateTenant",
            data: {
              roomId: this.roomId,
              tenantInfo
            }
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "保存成功",
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
        common_vendor.index.__f__("error", "at pages/tenant-info/tenant-info.vue:310", "保存租户信息失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 取消
    cancel() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.loading
  }, !$data.loading ? common_vendor.e({
    b: $data.formData.name,
    c: common_vendor.o(($event) => $data.formData.name = $event.detail.value),
    d: $data.formData.id_card,
    e: common_vendor.o(($event) => $data.formData.id_card = $event.detail.value),
    f: $data.formData.phone,
    g: common_vendor.o(($event) => $data.formData.phone = $event.detail.value),
    h: common_vendor.t($data.formData.rent_start_date || "请选择开始日期"),
    i: $data.formData.rent_start_date,
    j: common_vendor.o((...args) => $options.onStartDateChange && $options.onStartDateChange(...args)),
    k: common_vendor.t($data.formData.rent_end_date || "请选择结束日期"),
    l: $data.formData.rent_end_date,
    m: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args)),
    n: $data.roomInfo
  }, $data.roomInfo ? common_vendor.e({
    o: common_vendor.t($data.roomInfo.room_number),
    p: common_vendor.t($data.roomInfo.rent_price),
    q: $data.roomInfo.area
  }, $data.roomInfo.area ? {
    r: common_vendor.t($data.roomInfo.area)
  } : {}) : {}, {
    s: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    t: common_vendor.o((...args) => $options.saveTenant && $options.saveTenant(...args)),
    v: common_vendor.o((...args) => $options.saveTenant && $options.saveTenant(...args))
  }) : {}, {
    w: $data.loading
  }, $data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tenant-info/tenant-info.js.map
