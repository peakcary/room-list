"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      isEdit: false,
      roomId: "",
      formData: {
        room_number: "",
        floor: "",
        area: "",
        rent_price: "",
        status: "available",
        utilities: {
          electricity_reading: 0,
          water_reading: 0,
          electricity_rate: 0.5,
          water_rate: 3
        }
      },
      statusIndex: 0,
      statusOptions: [
        { value: "available", text: "可租用" },
        { value: "rented", text: "已租用" },
        { value: "maintenance", text: "维修中" }
      ]
    };
  },
  onLoad(options) {
    if (options.id) {
      this.isEdit = true;
      this.roomId = options.id;
      this.loadRoomInfo();
      common_vendor.index.setNavigationBarTitle({
        title: "编辑房间"
      });
    } else {
      common_vendor.index.setNavigationBarTitle({
        title: "添加房间"
      });
    }
  },
  methods: {
    // 加载房间信息（编辑时）
    async loadRoomInfo() {
      var _a, _b, _c, _d;
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRoomById",
            data: { id: this.roomId }
          }
        });
        if (result.result.code === 0) {
          const roomData = result.result.data;
          this.formData = {
            room_number: roomData.room_number,
            floor: roomData.floor || "",
            area: roomData.area || "",
            rent_price: roomData.rent_price,
            status: roomData.status,
            utilities: {
              electricity_reading: ((_a = roomData.utilities) == null ? void 0 : _a.electricity_reading) || 0,
              water_reading: ((_b = roomData.utilities) == null ? void 0 : _b.water_reading) || 0,
              electricity_rate: ((_c = roomData.utilities) == null ? void 0 : _c.electricity_rate) || 0.5,
              water_rate: ((_d = roomData.utilities) == null ? void 0 : _d.water_rate) || 3
            }
          };
          this.statusIndex = this.statusOptions.findIndex((option) => option.value === roomData.status);
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/room-edit/room-edit.vue:193", "加载房间信息失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
    },
    // 状态选择
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      this.formData.status = this.statusOptions[this.statusIndex].value;
    },
    // 表单验证
    validateForm() {
      if (!this.formData.room_number.trim()) {
        common_vendor.index.showToast({
          title: "请输入房间号",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.rent_price || this.formData.rent_price <= 0) {
        common_vendor.index.showToast({
          title: "请输入有效的租金",
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
        title: "保存中..."
      });
      try {
        const action = this.isEdit ? "updateRoom" : "addRoom";
        const data = this.isEdit ? { id: this.roomId, ...this.formData } : this.formData;
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action,
            data
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: this.isEdit ? "更新成功" : "添加成功",
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
        common_vendor.index.__f__("error", "at pages/room-edit/room-edit.vue:266", "保存房间失败:", error);
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
  return {
    a: $data.isEdit,
    b: $data.formData.room_number,
    c: common_vendor.o(($event) => $data.formData.room_number = $event.detail.value),
    d: $data.formData.floor,
    e: common_vendor.o(common_vendor.m(($event) => $data.formData.floor = $event.detail.value, {
      number: true
    })),
    f: $data.formData.area,
    g: common_vendor.o(common_vendor.m(($event) => $data.formData.area = $event.detail.value, {
      number: true
    })),
    h: $data.formData.rent_price,
    i: common_vendor.o(common_vendor.m(($event) => $data.formData.rent_price = $event.detail.value, {
      number: true
    })),
    j: common_vendor.t($data.statusOptions[$data.statusIndex].text),
    k: common_vendor.o((...args) => $options.onStatusChange && $options.onStatusChange(...args)),
    l: $data.statusIndex,
    m: $data.statusOptions,
    n: $data.formData.utilities.electricity_reading,
    o: common_vendor.o(common_vendor.m(($event) => $data.formData.utilities.electricity_reading = $event.detail.value, {
      number: true
    })),
    p: $data.formData.utilities.water_reading,
    q: common_vendor.o(common_vendor.m(($event) => $data.formData.utilities.water_reading = $event.detail.value, {
      number: true
    })),
    r: $data.formData.utilities.electricity_rate,
    s: common_vendor.o(common_vendor.m(($event) => $data.formData.utilities.electricity_rate = $event.detail.value, {
      number: true
    })),
    t: $data.formData.utilities.water_rate,
    v: common_vendor.o(common_vendor.m(($event) => $data.formData.utilities.water_rate = $event.detail.value, {
      number: true
    })),
    w: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    x: common_vendor.o((...args) => $options.saveRoom && $options.saveRoom(...args)),
    y: common_vendor.o((...args) => $options.saveRoom && $options.saveRoom(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/room-edit/room-edit.js.map
