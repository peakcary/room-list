"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dbInitResult: "",
      initButtonText: "立即初始化",
      initResultClass: "",
      isInitializing: false,
      roomTestResult: "",
      addRoomResult: "",
      getRoomsResult: "",
      availableRoomsResult: "",
      rentedRoomsResult: "",
      debugResult: "",
      fixResult: "",
      resetResult: "",
      debugInfo: "等待测试...",
      connectionResult: ""
    };
  },
  methods: {
    // 初始化数据库
    async initDatabase() {
      if (this.isInitializing)
        return;
      this.isInitializing = true;
      this.initButtonText = "初始化中...";
      this.dbInitResult = "正在创建示例数据...";
      this.initResultClass = "loading";
      this.debugInfo = "正在初始化数据库...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "db-init",
          data: {}
        });
        if (result.result.code === 0) {
          this.dbInitResult = "✅ 初始化成功！已创建示例房间、租户和租赁关系数据";
          this.initResultClass = "success";
          this.initButtonText = "重新初始化";
          this.debugInfo = "初始化完成，现在可以在房间列表中看到租户信息了";
          common_vendor.index.showToast({
            title: "初始化成功",
            icon: "success"
          });
        } else {
          this.dbInitResult = `❌ 初始化失败: ${result.result.message}`;
          this.initResultClass = "error";
          this.initButtonText = "重试初始化";
        }
        this.debugInfo = JSON.stringify(result.result, null, 2);
      } catch (error) {
        this.dbInitResult = `❌ 初始化失败: ${error.message}`;
        this.initResultClass = "error";
        this.initButtonText = "重试初始化";
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:148", "数据库初始化失败:", error);
        common_vendor.index.showToast({
          title: "初始化失败",
          icon: "none"
        });
      } finally {
        this.isInitializing = false;
      }
    },
    // 测试房间管理接口
    async testRoomManagement() {
      var _a;
      this.roomTestResult = "测试中...";
      this.debugInfo = "正在测试房间管理接口...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        this.roomTestResult = `测试成功: 找到 ${((_a = result.result.data) == null ? void 0 : _a.total) || 0} 个房间`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
      } catch (error) {
        this.roomTestResult = `测试失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:182", "房间管理接口测试失败:", error);
      }
    },
    // 添加测试房间
    async addTestRoom() {
      this.addRoomResult = "添加中...";
      this.debugInfo = "正在添加测试房间...";
      try {
        const testRoom = {
          room_number: `TEST${Date.now()}`,
          floor: 1,
          area: 25,
          rent_price: 1e3,
          status: "available",
          utilities: {
            electricity_reading: 0,
            water_reading: 0,
            electricity_rate: 0.5,
            water_rate: 3
          }
        };
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "addRoom",
            data: testRoom
          }
        });
        this.addRoomResult = `添加成功: 房间号 ${testRoom.room_number}`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
      } catch (error) {
        this.addRoomResult = `添加失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:220", "添加测试房间失败:", error);
      }
    },
    // 获取房间列表
    async getRooms() {
      this.getRoomsResult = "获取中...";
      this.debugInfo = "正在获取房间列表...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.getRoomsResult = `获取成功: 共 ${result.result.data.total} 个房间`;
          this.debugInfo = `房间列表: ${rooms.map((r) => r.room_number).join(", ")}`;
        } else {
          this.getRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
      } catch (error) {
        this.getRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:253", "获取房间列表失败:", error);
      }
    },
    // 获取可租用房间
    async getAvailableRooms() {
      this.availableRoomsResult = "获取中...";
      this.debugInfo = "正在获取可租用房间...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              status: "available",
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.availableRoomsResult = `获取成功: 共 ${result.result.data.total} 个可租用房间`;
          this.debugInfo = `可租用房间: ${rooms.map((r) => r.room_number).join(", ")}`;
        } else {
          this.availableRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
      } catch (error) {
        this.availableRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:287", "获取可租用房间失败:", error);
      }
    },
    // 获取已租用房间
    async getRentedRooms() {
      this.rentedRoomsResult = "获取中...";
      this.debugInfo = "正在获取已租用房间...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              status: "rented",
              pageSize: 10,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          const rooms = result.result.data.list;
          this.rentedRoomsResult = `获取成功: 共 ${result.result.data.total} 个已租用房间`;
          this.debugInfo = `已租用房间: ${rooms.map((r) => r.room_number + (r.current_tenant ? ` (${r.current_tenant.name})` : "")).join(", ")}`;
        } else {
          this.rentedRoomsResult = `获取失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
      } catch (error) {
        this.rentedRoomsResult = `获取失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:321", "获取已租用房间失败:", error);
      }
    },
    // 调试数据库状态
    async debugDatabase() {
      this.debugResult = "调试中...";
      this.debugInfo = "正在检查数据库状态...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "debugDatabase",
            data: {}
          }
        });
        if (result.result.code === 0) {
          const { debug_info, inconsistencies } = result.result.data;
          this.debugResult = `调试完成: 房间${debug_info.rooms.total}个, 租赁${debug_info.rentals.total}个, 租户${debug_info.tenants.total}个, 数据不一致${inconsistencies.length}处`;
          let debugText = `=== 数据库状态 ===
`;
          debugText += `房间总数: ${debug_info.rooms.total}
`;
          debugText += `租赁总数: ${debug_info.rentals.total}
`;
          debugText += `租户总数: ${debug_info.tenants.total}

`;
          if (inconsistencies.length > 0) {
            debugText += `=== 数据不一致问题 ===
`;
            inconsistencies.forEach((issue, index) => {
              debugText += `${index + 1}. ${issue.issue}
`;
              debugText += `   房间: ${issue.room_number} (${issue.room_id})
`;
              if (issue.current_rental_id) {
                debugText += `   租赁ID: ${issue.current_rental_id}
`;
              }
              debugText += `
`;
            });
          } else {
            debugText += `✅ 数据一致性检查通过
`;
          }
          debugText += `
=== 房间详情 ===
`;
          debug_info.rooms.data.forEach((room) => {
            debugText += `${room.room_number}: ${room.status}`;
            if (room.current_rental_id) {
              debugText += ` (租赁ID: ${room.current_rental_id})`;
            }
            debugText += `
`;
          });
          this.debugInfo = debugText;
        } else {
          this.debugResult = `调试失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
      } catch (error) {
        this.debugResult = `调试失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:381", "调试数据库失败:", error);
      }
    },
    // 修复数据不一致
    async fixDataInconsistencies() {
      this.fixResult = "修复中...";
      this.debugInfo = "正在修复数据不一致问题...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "fixDataInconsistencies",
            data: {}
          }
        });
        if (result.result.code === 0) {
          const { fixes_applied, fixes } = result.result.data;
          this.fixResult = `✅ 修复完成！共处理 ${fixes_applied} 个问题`;
          let debugText = `=== 数据修复报告 ===
`;
          debugText += `修复问题数量: ${fixes_applied}

`;
          if (fixes.length > 0) {
            debugText += `=== 修复详情 ===
`;
            fixes.forEach((fix, index) => {
              debugText += `${index + 1}. ${fix.action}
`;
              if (fix.room_number) {
                debugText += `   房间: ${fix.room_number}
`;
              }
              if (fix.rental_id) {
                debugText += `   租赁ID: ${fix.rental_id}
`;
              }
              debugText += `   类型: ${fix.type}

`;
            });
          } else {
            debugText += `✅ 未发现需要修复的问题
`;
          }
          this.debugInfo = debugText;
          common_vendor.index.showToast({
            title: "修复完成",
            icon: "success"
          });
        } else {
          this.fixResult = `❌ 修复失败: ${result.result.message}`;
          this.debugInfo = JSON.stringify(result.result, null, 2);
        }
      } catch (error) {
        this.fixResult = `修复失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:437", "修复数据不一致失败:", error);
      }
    },
    // 强制重置数据库
    async forceResetDatabase() {
      this.resetResult = "重置中...";
      this.debugInfo = "正在强制重置数据库...";
      try {
        common_vendor.index.showModal({
          title: "确认重置",
          content: "这将删除所有数据并重新创建，确定继续吗？",
          success: async (res) => {
            if (res.confirm) {
              const result = await common_vendor.tr.callFunction({
                name: "db-init",
                data: {
                  forceReset: true
                }
              });
              if (result.result.code === 0) {
                this.resetResult = "✅ 数据库重置成功！";
                this.debugInfo = "数据库已重置，所有旧数据已清空，新的示例数据已创建";
                common_vendor.index.showToast({
                  title: "重置成功",
                  icon: "success"
                });
              } else {
                this.resetResult = `❌ 重置失败: ${result.result.message}`;
                this.debugInfo = JSON.stringify(result.result, null, 2);
              }
            } else {
              this.resetResult = "重置已取消";
              this.debugInfo = "用户取消了重置操作";
            }
          }
        });
      } catch (error) {
        this.resetResult = `重置失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:481", "强制重置数据库失败:", error);
      }
    },
    // 跳转到系统部署管理页面
    goToSystemDeploy() {
      common_vendor.index.navigateTo({
        url: "/pages/system-deploy/system-deploy"
      });
    },
    // 测试云函数连接
    async testCloudConnection() {
      this.connectionResult = "测试中...";
      common_vendor.index.__f__("log", "at pages/test/test.vue:495", "开始测试云函数连接");
      try {
        if (typeof common_vendor.tr === "undefined") {
          this.connectionResult = "❌ uniCloud 未定义";
          return;
        }
        common_vendor.index.__f__("log", "at pages/test/test.vue:504", "uniCloud 对象存在，开始调用云函数");
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: { pageSize: 1, pageNum: 1 }
          }
        });
        common_vendor.index.__f__("log", "at pages/test/test.vue:515", "云函数调用结果:", result);
        if (result.result && result.result.code === 0) {
          this.connectionResult = `✅ 连接成功！返回数据: ${JSON.stringify(result.result.data).substring(0, 100)}...`;
        } else {
          this.connectionResult = `⚠️ 云函数返回错误: ${result.result ? result.result.message : "未知错误"}`;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/test/test.vue:524", "云函数连接测试失败:", error);
        if (error.message && error.message.includes("request:fail")) {
          this.connectionResult = `❌ 网络请求失败: ${error.message}`;
        } else if (error.message && error.message.includes("not found")) {
          this.connectionResult = "❌ 云函数不存在或未部署";
        } else {
          this.connectionResult = `❌ 连接失败: ${error.message}`;
        }
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.initButtonText),
    b: common_vendor.o((...args) => $options.initDatabase && $options.initDatabase(...args)),
    c: common_vendor.t($data.dbInitResult),
    d: common_vendor.n($data.initResultClass),
    e: common_vendor.o((...args) => $options.testRoomManagement && $options.testRoomManagement(...args)),
    f: common_vendor.t($data.roomTestResult),
    g: common_vendor.o((...args) => $options.addTestRoom && $options.addTestRoom(...args)),
    h: common_vendor.t($data.addRoomResult),
    i: common_vendor.o((...args) => $options.getRooms && $options.getRooms(...args)),
    j: common_vendor.t($data.getRoomsResult),
    k: common_vendor.o((...args) => $options.getAvailableRooms && $options.getAvailableRooms(...args)),
    l: common_vendor.t($data.availableRoomsResult),
    m: common_vendor.o((...args) => $options.getRentedRooms && $options.getRentedRooms(...args)),
    n: common_vendor.t($data.rentedRoomsResult),
    o: common_vendor.o((...args) => $options.debugDatabase && $options.debugDatabase(...args)),
    p: common_vendor.t($data.debugResult),
    q: common_vendor.o((...args) => $options.testCloudConnection && $options.testCloudConnection(...args)),
    r: common_vendor.t($data.connectionResult),
    s: common_vendor.o((...args) => $options.goToSystemDeploy && $options.goToSystemDeploy(...args)),
    t: common_vendor.o((...args) => $options.forceResetDatabase && $options.forceResetDatabase(...args)),
    v: common_vendor.t($data.resetResult),
    w: common_vendor.o((...args) => $options.fixDataInconsistencies && $options.fixDataInconsistencies(...args)),
    x: common_vendor.t($data.fixResult),
    y: common_vendor.o((...args) => $options.forceResetDatabase && $options.forceResetDatabase(...args)),
    z: common_vendor.t($data.resetResult),
    A: common_vendor.t($data.debugInfo)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/test/test.js.map
