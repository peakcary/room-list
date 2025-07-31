"use strict";
const common_vendor = require("../common/vendor.js");
const CLOUD_CONFIG = {
  provider: "aliyun",
  spaceId: "mp-82beb92d-779d-44d1-a1d3-7fee8609024d",
  clientSecret: "950wKtihe/ZN9Q4B8lYudg==",
  endpoint: "https://api.next.bspapp.com"
};
function initUniCloud(force = false) {
  return new Promise((resolve, reject) => {
    try {
      const platform = common_vendor.index.getSystemInfoSync().platform;
      const environment = "development";
      common_vendor.index.__f__("log", "at utils/cloud-init.js:25", `[CloudInit] 运行环境: ${platform}, 构建环境: ${environment}`);
      if (typeof common_vendor.tr === "undefined") {
        const error = "uniCloud 对象未定义，请检查是否正确引入";
        common_vendor.index.__f__("error", "at utils/cloud-init.js:30", `[CloudInit] ${error}`);
        reject(new Error(error));
        return;
      }
      if (!force && common_vendor.tr.getCurrentUserInfo) {
        try {
          common_vendor.index.__f__("log", "at utils/cloud-init.js:39", "[CloudInit] uniCloud 已初始化，跳过重复初始化");
          resolve(true);
          return;
        } catch (e) {
          common_vendor.index.__f__("log", "at utils/cloud-init.js:43", "[CloudInit] uniCloud 未正确初始化，开始初始化");
        }
      }
      common_vendor.index.__f__("log", "at utils/cloud-init.js:48", "[CloudInit] 开始初始化 uniCloud...");
      common_vendor.index.__f__("log", "at utils/cloud-init.js:49", "[CloudInit] 配置信息:", {
        provider: CLOUD_CONFIG.provider,
        spaceId: CLOUD_CONFIG.spaceId,
        endpoint: CLOUD_CONFIG.endpoint
      });
      common_vendor.tr.init(CLOUD_CONFIG);
      common_vendor.index.__f__("log", "at utils/cloud-init.js:57", "[CloudInit] uniCloud 初始化完成");
      setTimeout(() => {
        testCloudConnection().then((success) => {
          if (success) {
            common_vendor.index.__f__("log", "at utils/cloud-init.js:64", "[CloudInit] 云函数连接测试成功");
            resolve(true);
          } else {
            common_vendor.index.__f__("warn", "at utils/cloud-init.js:67", "[CloudInit] 云函数连接测试失败，但初始化完成");
            resolve(false);
          }
        }).catch((error) => {
          common_vendor.index.__f__("warn", "at utils/cloud-init.js:72", "[CloudInit] 云函数连接测试异常:", error.message);
          resolve(false);
        });
      }, 1e3);
    } catch (error) {
      const errorMsg = `uniCloud 初始化失败: ${error.message}`;
      common_vendor.index.__f__("error", "at utils/cloud-init.js:79", `[CloudInit] ${errorMsg}`);
      reject(new Error(errorMsg));
    }
  });
}
function testCloudConnection() {
  return new Promise((resolve) => {
    try {
      common_vendor.index.__f__("log", "at utils/cloud-init.js:91", "[CloudTest] 开始测试云函数连接...");
      common_vendor.tr.callFunction({
        name: "room-management",
        data: {
          action: "getRooms",
          data: { pageSize: 1, pageNum: 1 }
        }
      }).then((result) => {
        common_vendor.index.__f__("log", "at utils/cloud-init.js:100", "[CloudTest] 云函数调用成功:", result);
        resolve(true);
      }).catch((error) => {
        common_vendor.index.__f__("error", "at utils/cloud-init.js:103", "[CloudTest] 云函数调用失败:", error);
        resolve(false);
      });
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/cloud-init.js:108", "[CloudTest] 云函数连接测试异常:", error);
      resolve(false);
    }
  });
}
exports.initUniCloud = initUniCloud;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/cloud-init.js.map
