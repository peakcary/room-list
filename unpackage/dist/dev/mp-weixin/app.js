"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/room-list/room-list.js";
  "./pages/room-detail/room-detail.js";
  "./pages/room-edit/room-edit.js";
  "./pages/tenant-info/tenant-info.js";
  "./pages/utility-record/utility-record.js";
  "./pages/test/test.js";
  "./pages/rental-renewal/rental-renewal.js";
  "./pages/maintenance-record/maintenance-record.js";
  "./pages/system-deploy/system-deploy.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:28", "App Launch");
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:31", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:34", "App Hide");
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
