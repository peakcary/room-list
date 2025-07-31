"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      loading: true,
      rentalId: "",
      roomId: "",
      roomInfo: null,
      rentalInfo: null,
      formData: {
        new_rent_end_date: "",
        new_rent_price: "",
        electricity_reading: "",
        water_reading: "",
        contract_notes: ""
      }
    };
  },
  onLoad(options) {
    this.rentalId = options.rentalId;
    this.roomId = options.roomId;
    this.loadData();
  },
  methods: {
    // 加载数据
    async loadData() {
      try {
        const rentalResult = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRentalInfo",
            data: { rental_id: this.rentalId }
          }
        });
        if (rentalResult.result.code === 0) {
          this.rentalInfo = rentalResult.result.data;
          this.roomInfo = this.rentalInfo.room_info;
          const endDate = new Date(this.rentalInfo.rent_end_date);
          endDate.setFullYear(endDate.getFullYear() + 1);
          this.formData.new_rent_end_date = this.formatDateForPicker(endDate);
          this.formData.electricity_reading = this.rentalInfo.electricity_start_reading || 0;
          this.formData.water_reading = this.rentalInfo.water_start_reading || 0;
        } else {
          common_vendor.index.showToast({
            title: rentalResult.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/rental-renewal/rental-renewal.vue:180", "加载数据失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    },
    // 日期选择
    onEndDateChange(e) {
      this.formData.new_rent_end_date = e.detail.value;
    },
    // 格式化日期为picker格式
    formatDateForPicker(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
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
    // 获取剩余天数样式
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
          common_vendor.index.__f__("error", "at pages/rental-renewal/rental-renewal.vue:267", "拨打电话失败:", err);
          common_vendor.index.showToast({
            title: "拨打失败",
            icon: "none"
          });
        }
      });
    },
    // 表单验证
    validateForm() {
      if (!this.formData.new_rent_end_date) {
        common_vendor.index.showToast({
          title: "请选择新的结束日期",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 确认续租
    async confirmRenewal() {
      if (!this.validateForm())
        return;
      common_vendor.index.showModal({
        title: "确认续租",
        content: `确定要将${this.roomInfo.room_number}号房续租到${this.formData.new_rent_end_date}吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.submitRenewal();
          }
        }
      });
    },
    // 提交续租
    async submitRenewal() {
      common_vendor.index.showLoading({ title: "处理中..." });
      try {
        const renewalData = {
          rental_id: this.rentalId,
          new_rent_end_date: this.formData.new_rent_end_date,
          new_rent_price: this.formData.new_rent_price ? parseFloat(this.formData.new_rent_price) : null,
          electricity_reading: parseFloat(this.formData.electricity_reading) || 0,
          water_reading: parseFloat(this.formData.water_reading) || 0,
          contract_notes: this.formData.contract_notes
        };
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "renewRental",
            data: renewalData
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "续租成功",
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
        common_vendor.index.__f__("error", "at pages/rental-renewal/rental-renewal.vue:342", "续租失败:", error);
        common_vendor.index.showToast({
          title: "续租失败",
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
    a: $data.loading
  }, $data.loading ? {} : common_vendor.e({
    b: common_vendor.t($data.roomInfo.room_number),
    c: common_vendor.t($data.roomInfo.rent_price),
    d: $data.roomInfo.deposit_amount
  }, $data.roomInfo.deposit_amount ? {
    e: common_vendor.t($data.roomInfo.deposit_amount)
  } : {}, {
    f: common_vendor.t($data.rentalInfo.tenant_info.name),
    g: common_vendor.t($data.rentalInfo.tenant_info.phone),
    h: common_vendor.o(($event) => $options.callTenant($data.rentalInfo.tenant_info.phone)),
    i: common_vendor.t($options.formatDateRange($data.rentalInfo.rent_start_date, $data.rentalInfo.rent_end_date)),
    j: common_vendor.t($options.getDaysRemaining($data.rentalInfo.rent_end_date)),
    k: common_vendor.n($options.getDaysRemainingClass($data.rentalInfo.rent_end_date)),
    l: common_vendor.t($data.formData.new_rent_end_date || "请选择结束日期"),
    m: $data.formData.new_rent_end_date,
    n: common_vendor.o((...args) => $options.onEndDateChange && $options.onEndDateChange(...args)),
    o: $data.formData.new_rent_price,
    p: common_vendor.o(($event) => $data.formData.new_rent_price = $event.detail.value),
    q: common_vendor.t($data.rentalInfo.electricity_start_reading || 0),
    r: $data.formData.electricity_reading,
    s: common_vendor.o(($event) => $data.formData.electricity_reading = $event.detail.value),
    t: common_vendor.t($data.rentalInfo.water_start_reading || 0),
    v: $data.formData.water_reading,
    w: common_vendor.o(($event) => $data.formData.water_reading = $event.detail.value),
    x: $data.formData.contract_notes,
    y: common_vendor.o(($event) => $data.formData.contract_notes = $event.detail.value),
    z: common_vendor.o((...args) => $options.cancel && $options.cancel(...args)),
    A: common_vendor.o((...args) => $options.confirmRenewal && $options.confirmRenewal(...args))
  }));
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/rental-renewal/rental-renewal.js.map
