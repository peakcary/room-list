"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      },
      errorMessage: "",
      isLoading: false
    };
  },
  onLoad() {
    this.checkAuth();
  },
  methods: {
    // 检查认证状态
    checkAuth() {
      const { checkPageAuth } = require("../../utils/auth.js");
      return checkPageAuth();
    },
    // 清除错误信息
    clearError() {
      this.errorMessage = "";
    },
    // 表单验证
    validateForm() {
      if (!this.formData.currentPassword.trim()) {
        this.errorMessage = "请输入当前密码";
        return false;
      }
      if (!this.formData.newPassword.trim()) {
        this.errorMessage = "请输入新密码";
        return false;
      }
      if (this.formData.newPassword.length < 6) {
        this.errorMessage = "新密码长度至少6位";
        return false;
      }
      if (!this.formData.confirmPassword.trim()) {
        this.errorMessage = "请确认新密码";
        return false;
      }
      if (this.formData.newPassword !== this.formData.confirmPassword) {
        this.errorMessage = "两次输入的新密码不一致";
        return false;
      }
      if (this.formData.currentPassword === this.formData.newPassword) {
        this.errorMessage = "新密码不能与当前密码相同";
        return false;
      }
      return true;
    },
    // 处理修改密码
    async handleChangePassword() {
      if (!this.validateForm())
        return;
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const result = await this.changePassword(
          this.formData.currentPassword,
          this.formData.newPassword
        );
        if (result.success) {
          common_vendor.index.showToast({
            title: "密码修改成功",
            icon: "success",
            duration: 2e3
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 2e3);
        } else {
          this.errorMessage = result.message || "密码修改失败";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/change-password/change-password.vue:183", "修改密码失败:", error);
        this.errorMessage = "修改过程中发生错误，请重试";
      } finally {
        this.isLoading = false;
      }
    },
    // 修改密码逻辑
    async changePassword(currentPassword, newPassword) {
      try {
        const { getCurrentUser, changeUserPassword } = require("../../utils/auth.js");
        const currentUser = getCurrentUser();
        if (!currentUser) {
          return { success: false, message: "用户信息不存在，请重新登录" };
        }
        const result = changeUserPassword(currentUser.username, currentPassword, newPassword);
        return result;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/change-password/change-password.vue:206", "修改密码过程中出错:", error);
        return { success: false, message: "系统错误，请稍后重试" };
      }
    },
    // 取消修改
    handleCancel() {
      if (this.formData.currentPassword || this.formData.newPassword || this.formData.confirmPassword) {
        common_vendor.index.showModal({
          title: "确认取消",
          content: "确定要取消修改密码吗？已输入的内容将丢失。",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateBack();
            }
          }
        });
      } else {
        common_vendor.index.navigateBack();
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.formData.currentPassword = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    b: $data.formData.currentPassword,
    c: common_vendor.o([($event) => $data.formData.newPassword = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    d: $data.formData.newPassword,
    e: common_vendor.o([($event) => $data.formData.confirmPassword = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    f: $data.formData.confirmPassword,
    g: $data.errorMessage
  }, $data.errorMessage ? {
    h: common_vendor.t($data.errorMessage)
  } : {}, {
    i: common_vendor.o((...args) => $options.handleCancel && $options.handleCancel(...args)),
    j: !$data.isLoading
  }, !$data.isLoading ? {} : {}, {
    k: $data.isLoading ? 1 : "",
    l: common_vendor.o((...args) => $options.handleChangePassword && $options.handleChangePassword(...args)),
    m: $data.isLoading
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/change-password/change-password.js.map
