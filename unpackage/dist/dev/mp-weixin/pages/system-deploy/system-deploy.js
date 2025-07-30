"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      loading: false,
      systemStatus: {
        cloudFunction: { text: "未检查", class: "unknown" },
        database: { text: "未检查", class: "unknown" },
        sampleData: { text: "未检查", class: "unknown" }
      },
      logs: []
    };
  },
  onLoad() {
    this.addLog("info", "系统部署管理页面已加载");
    setTimeout(() => {
      this.checkSystemStatus();
    }, 1e3);
  },
  methods: {
    // 添加日志
    addLog(type, message) {
      const now = /* @__PURE__ */ new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      this.logs.unshift({
        type,
        message,
        time
      });
      if (this.logs.length > 50) {
        this.logs = this.logs.slice(0, 50);
      }
    },
    // 检查系统状态
    async checkSystemStatus() {
      this.loading = true;
      this.addLog("info", "开始检查系统状态...");
      try {
        await this.checkCloudFunction();
        await this.checkDatabase();
        await this.checkSampleData();
        this.addLog("success", "系统状态检查完成");
      } catch (error) {
        this.addLog("error", `系统状态检查失败: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    // 检查云函数状态
    async checkCloudFunction() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: { pageSize: 1, pageNum: 1 }
          }
        });
        if (result.result.code === 0) {
          this.systemStatus.cloudFunction = { text: "正常", class: "success" };
          this.addLog("success", "云函数连接正常");
        } else {
          this.systemStatus.cloudFunction = { text: "异常", class: "error" };
          this.addLog("error", `云函数异常: ${result.result.message}`);
        }
      } catch (error) {
        this.systemStatus.cloudFunction = { text: "未部署", class: "error" };
        this.addLog("error", `云函数未部署或配置错误: ${error.message}`);
      }
    },
    // 检查数据库状态
    async checkDatabase() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "debugDatabase"
          }
        });
        if (result.result.code === 0) {
          this.systemStatus.database = { text: "正常", class: "success" };
          this.addLog("success", "数据库连接正常");
        } else {
          this.systemStatus.database = { text: "异常", class: "warning" };
          this.addLog("warning", `数据库异常: ${result.result.message}`);
        }
      } catch (error) {
        this.systemStatus.database = { text: "错误", class: "error" };
        this.addLog("error", `数据库检查失败: ${error.message}`);
      }
    },
    // 检查示例数据
    async checkSampleData() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: { pageSize: 10, pageNum: 1 }
          }
        });
        if (result.result.code === 0) {
          const total = result.result.data.total;
          if (total > 0) {
            this.systemStatus.sampleData = { text: `已有${total}条数据`, class: "success" };
            this.addLog("success", `发现${total}条房间数据`);
          } else {
            this.systemStatus.sampleData = { text: "无数据", class: "warning" };
            this.addLog("warning", "数据库中没有房间数据");
          }
        }
      } catch (error) {
        this.systemStatus.sampleData = { text: "检查失败", class: "error" };
        this.addLog("error", `示例数据检查失败: ${error.message}`);
      }
    },
    // 初始化数据库
    async initDatabase(forceReset = false) {
      const action = forceReset ? "重置数据库" : "初始化数据库";
      common_vendor.index.showModal({
        title: "确认操作",
        content: `确定要${action}吗？${forceReset ? "这将删除所有现有数据！" : ""}`,
        success: async (res) => {
          if (res.confirm) {
            await this.performDatabaseInit(forceReset);
          }
        }
      });
    },
    // 执行数据库初始化
    async performDatabaseInit(forceReset) {
      this.loading = true;
      this.addLog("info", `开始${forceReset ? "重置" : "初始化"}数据库...`);
      try {
        const result = await common_vendor.tr.callFunction({
          name: "db-init",
          data: { forceReset }
        });
        if (result.result.code === 0) {
          this.addLog("success", `数据库${forceReset ? "重置" : "初始化"}成功`);
          common_vendor.index.showToast({
            title: "操作成功",
            icon: "success"
          });
          setTimeout(() => {
            this.checkSystemStatus();
          }, 2e3);
        } else {
          this.addLog("error", `数据库操作失败: ${result.result.message}`);
          common_vendor.index.showToast({
            title: "操作失败",
            icon: "error"
          });
        }
      } catch (error) {
        this.addLog("error", `数据库操作异常: ${error.message}`);
        common_vendor.index.showToast({
          title: "操作异常",
          icon: "error"
        });
      } finally {
        this.loading = false;
      }
    },
    // 测试功能
    async testFunction(functionName) {
      this.loading = true;
      this.addLog("info", `测试功能: ${functionName}`);
      try {
        let testData = {};
        switch (functionName) {
          case "getRooms":
            testData = { pageSize: 10, pageNum: 1 };
            break;
          case "getIncomeStatistics":
            testData = { type: "monthly" };
            break;
          case "getRoomOccupancyStatistics":
            testData = {};
            break;
          case "debugDatabase":
            testData = {};
            break;
        }
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: functionName,
            data: testData
          }
        });
        if (result.result.code === 0) {
          this.addLog("success", `${functionName} 测试成功`);
          common_vendor.index.__f__("log", "at pages/system-deploy/system-deploy.vue:324", `${functionName} 结果:`, result.result.data);
          common_vendor.index.showModal({
            title: "测试成功",
            content: `${functionName} 功能正常，详细结果请查看控制台`,
            showCancel: false
          });
        } else {
          this.addLog("error", `${functionName} 测试失败: ${result.result.message}`);
          common_vendor.index.showModal({
            title: "测试失败",
            content: result.result.message,
            showCancel: false
          });
        }
      } catch (error) {
        this.addLog("error", `${functionName} 测试异常: ${error.message}`);
        common_vendor.index.showModal({
          title: "测试异常",
          content: error.message,
          showCancel: false
        });
      } finally {
        this.loading = false;
      }
    },
    // 修复数据不一致
    async fixDataInconsistencies() {
      common_vendor.index.showModal({
        title: "确认修复",
        content: "确定要修复数据不一致问题吗？",
        success: async (res) => {
          if (res.confirm) {
            this.loading = true;
            this.addLog("info", "开始修复数据不一致问题...");
            try {
              const result = await common_vendor.tr.callFunction({
                name: "room-management",
                data: {
                  action: "fixDataInconsistencies"
                }
              });
              if (result.result.code === 0) {
                const fixes = result.result.data.fixes_applied;
                this.addLog("success", `数据修复完成，共修复${fixes}个问题`);
                common_vendor.index.showToast({
                  title: `修复了${fixes}个问题`,
                  icon: "success"
                });
              } else {
                this.addLog("error", `数据修复失败: ${result.result.message}`);
                common_vendor.index.showToast({
                  title: "修复失败",
                  icon: "error"
                });
              }
            } catch (error) {
              this.addLog("error", `数据修复异常: ${error.message}`);
              common_vendor.index.showToast({
                title: "修复异常",
                icon: "error"
              });
            } finally {
              this.loading = false;
            }
          }
        }
      });
    },
    // 清空日志
    clearLogs() {
      this.logs = [];
      this.addLog("info", "日志已清空");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.systemStatus.cloudFunction.text),
    b: common_vendor.n($data.systemStatus.cloudFunction.class),
    c: common_vendor.t($data.systemStatus.database.text),
    d: common_vendor.n($data.systemStatus.database.class),
    e: common_vendor.t($data.systemStatus.sampleData.text),
    f: common_vendor.n($data.systemStatus.sampleData.class),
    g: common_vendor.t($data.loading ? "检查中..." : "🔍 检查系统状态"),
    h: common_vendor.o((...args) => $options.checkSystemStatus && $options.checkSystemStatus(...args)),
    i: $data.loading,
    j: common_vendor.o(($event) => $options.initDatabase(false)),
    k: $data.loading,
    l: common_vendor.o(($event) => $options.initDatabase(true)),
    m: $data.loading,
    n: common_vendor.o(($event) => $options.testFunction("getRooms")),
    o: $data.loading,
    p: common_vendor.o(($event) => $options.testFunction("getIncomeStatistics")),
    q: $data.loading,
    r: common_vendor.o(($event) => $options.testFunction("getRoomOccupancyStatistics")),
    s: $data.loading,
    t: common_vendor.o(($event) => $options.testFunction("debugDatabase")),
    v: $data.loading,
    w: common_vendor.o((...args) => $options.fixDataInconsistencies && $options.fixDataInconsistencies(...args)),
    x: $data.loading,
    y: common_vendor.f($data.logs, (log, index, i0) => {
      return {
        a: common_vendor.t(log.time),
        b: common_vendor.t(log.message),
        c: index,
        d: common_vendor.n(log.type)
      };
    }),
    z: $data.logs.length === 0
  }, $data.logs.length === 0 ? {} : {}, {
    A: common_vendor.o((...args) => $options.clearLogs && $options.clearLogs(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/system-deploy/system-deploy.js.map
