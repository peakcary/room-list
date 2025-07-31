"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_cloudInit = require("./utils/cloud-init.js");
if (!Math) {
  "./pages/login/login.js";
  "./pages/room-list/room-list.js";
  "./pages/index/index.js";
  "./pages/room-detail/room-detail.js";
  "./pages/room-edit/room-edit.js";
  "./pages/tenant-info/tenant-info.js";
  "./pages/utility-record/utility-record.js";
  "./pages/test/test.js";
  "./pages/rental-renewal/rental-renewal.js";
  "./pages/maintenance-record/maintenance-record.js";
  "./pages/system-deploy/system-deploy.js";
  "./pages/change-password/change-password.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:28", "App Launch");
    this.checkInitialAuth();
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:33", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:36", "App Hide");
  },
  methods: {
    // 检查应用启动时的认证状态
    checkInitialAuth() {
      try {
        const { isLoggedIn } = require("./utils/auth.js");
        const pages = getCurrentPages();
        const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
        const currentRoute = currentPage ? `/${currentPage.route}` : "";
        common_vendor.index.__f__("log", "at App.vue:50", "App启动检查认证状态, 当前路由:", currentRoute);
        if (currentRoute !== "/pages/login/login" && !isLoggedIn()) {
          common_vendor.index.__f__("log", "at App.vue:54", "未登录，跳转到登录页面");
          setTimeout(() => {
            common_vendor.index.reLaunch({
              url: "/pages/login/login"
            });
          }, 100);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:62", "检查认证状态失败:", error);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
setTimeout(() => {
  utils_cloudInit.initUniCloud().then((success) => {
    common_vendor.index.__f__("log", "at main.js:11", "[App] uniCloud初始化完成:", success ? "成功" : "部分成功");
  }).catch((error) => {
    common_vendor.index.__f__("error", "at main.js:14", "[App] uniCloud初始化失败:", error.message);
  });
}, 100);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
