"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dbInitResult: "",
      roomTestResult: "",
      addRoomResult: "",
      getRoomsResult: "",
      availableRoomsResult: "",
      rentedRoomsResult: "",
      debugInfo: "等待测试..."
    };
  },
  methods: {
    // 初始化数据库
    async initDatabase() {
      this.dbInitResult = "初始化中...";
      this.debugInfo = "正在初始化数据库...";
      try {
        const result = await common_vendor.tr.callFunction({
          name: "db-init",
          data: {}
        });
        this.dbInitResult = `初始化完成: ${result.result.message}`;
        this.debugInfo = JSON.stringify(result.result, null, 2);
      } catch (error) {
        this.dbInitResult = `初始化失败: ${error.message}`;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        common_vendor.index.__f__("error", "at pages/test/test.vue:78", "数据库初始化失败:", error);
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
        common_vendor.index.__f__("error", "at pages/test/test.vue:105", "房间管理接口测试失败:", error);
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
        common_vendor.index.__f__("error", "at pages/test/test.vue:143", "添加测试房间失败:", error);
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
        common_vendor.index.__f__("error", "at pages/test/test.vue:176", "获取房间列表失败:", error);
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
        common_vendor.index.__f__("error", "at pages/test/test.vue:210", "获取可租用房间失败:", error);
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
        common_vendor.index.__f__("error", "at pages/test/test.vue:244", "获取已租用房间失败:", error);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.initDatabase && $options.initDatabase(...args)),
    b: common_vendor.t($data.dbInitResult),
    c: common_vendor.o((...args) => $options.testRoomManagement && $options.testRoomManagement(...args)),
    d: common_vendor.t($data.roomTestResult),
    e: common_vendor.o((...args) => $options.addTestRoom && $options.addTestRoom(...args)),
    f: common_vendor.t($data.addRoomResult),
    g: common_vendor.o((...args) => $options.getRooms && $options.getRooms(...args)),
    h: common_vendor.t($data.getRoomsResult),
    i: common_vendor.o((...args) => $options.getAvailableRooms && $options.getAvailableRooms(...args)),
    j: common_vendor.t($data.availableRoomsResult),
    k: common_vendor.o((...args) => $options.getRentedRooms && $options.getRentedRooms(...args)),
    l: common_vendor.t($data.rentedRoomsResult),
    m: common_vendor.t($data.debugInfo)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/test/test.js.map
