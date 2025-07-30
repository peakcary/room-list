"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        room_number: "",
        floor: ""
      }
    };
  },
  onLoad(options) {
    common_vendor.index.setNavigationBarTitle({
      title: "添加房间"
    });
  },
  methods: {
    // 表单验证
    validateForm() {
      if (!this.formData.room_number.trim()) {
        common_vendor.index.showToast({
          title: "请输入房间号",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 保存房间
    async saveRoom() {
      if (!this.validateForm())
        return;
      common_vendor.index.showLoading({
        title: "添加中..."
      });
      try {
        const roomData = {
          ...this.formData,
          status: "available"
          // 新房间默认为可租用状态
        };
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "addRoom",
            data: roomData
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "添加成功",
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
        common_vendor.index.__f__("error", "at pages/room-edit/room-edit.vue:108", "添加房间失败:", error);
        common_vendor.index.showToast({
          title: "添加失败",
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
  return {
    a: $data.formData.room_number,
    b: common_vendor.o(($event) => $data.formData.room_number = $event.detail.value),
    c: $data.formData.floor,
    d: common_vendor.o(common_vendor.m(($event) => $data.formData.floor = $event.detail.value, {
      number: true
    })),
    e: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    f: common_vendor.o((...args) => $options.saveRoom && $options.saveRoom(...args)),
    g: common_vendor.o((...args) => $options.saveRoom && $options.saveRoom(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/room-edit/room-edit.js.map
