"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      loginForm: {
        username: "",
        password: ""
      },
      errorMessage: "",
      isLoading: false
    };
  },
  onLoad() {
    this.checkLoginStatus();
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      const token = common_vendor.index.getStorageSync("authToken");
      if (userInfo && token) {
        common_vendor.index.reLaunch({
          url: "/pages/room-list/room-list"
        });
      }
    },
    // 清除错误信息
    clearError() {
      this.errorMessage = "";
    },
    // 处理登录
    async handleLogin() {
      if (!this.loginForm.username.trim()) {
        this.errorMessage = "请输入用户名";
        return;
      }
      if (!this.loginForm.password.trim()) {
        this.errorMessage = "请输入密码";
        return;
      }
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const result = await this.validateLogin(this.loginForm.username, this.loginForm.password);
        if (result.success) {
          await this.handleLoginSuccess(result.userInfo);
        } else {
          this.errorMessage = result.message || "登录失败，请检查用户名和密码";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:135", "登录失败:", error);
        this.errorMessage = "登录过程中发生错误，请重试";
      } finally {
        this.isLoading = false;
      }
    },
    // 验证登录
    async validateLogin(username, password) {
      const validAccounts = [
        { username: "admin", password: "123456", name: "管理员", role: "admin" },
        { username: "manager", password: "888888", name: "房管员", role: "manager" }
      ];
      const account = validAccounts.find(
        (acc) => acc.username === username && acc.password === password
      );
      if (account) {
        return {
          success: true,
          userInfo: {
            username: account.username,
            name: account.name,
            role: account.role,
            loginTime: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: "用户名或密码错误"
        };
      }
    },
    // 处理登录成功
    async handleLoginSuccess(userInfo) {
      try {
        const token = this.generateToken(userInfo);
        common_vendor.index.setStorageSync("userInfo", userInfo);
        common_vendor.index.setStorageSync("authToken", token);
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.reLaunch({
            url: "/pages/room-list/room-list"
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:198", "保存登录信息失败:", error);
        this.errorMessage = "登录信息保存失败，请重试";
      }
    },
    // 生成简单的token
    generateToken(userInfo) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2);
      return `${userInfo.username}_${timestamp}_${randomStr}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.loginForm.username = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    b: $data.loginForm.username,
    c: common_vendor.o([($event) => $data.loginForm.password = $event.detail.value, (...args) => $options.clearError && $options.clearError(...args)]),
    d: $data.loginForm.password,
    e: $data.errorMessage
  }, $data.errorMessage ? {
    f: common_vendor.t($data.errorMessage)
  } : {}, {
    g: !$data.isLoading
  }, !$data.isLoading ? {} : {}, {
    h: $data.isLoading ? 1 : "",
    i: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    j: $data.isLoading
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
