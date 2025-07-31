"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      recordList: [],
      loading: false,
      hasMore: true,
      pageNum: 1,
      pageSize: 10,
      searchKeyword: "",
      searchTimer: null,
      statistics: {
        totalRecords: 0,
        totalCost: 0,
        thisMonthRecords: 0
      },
      showAddModal: false,
      roomOptions: [],
      selectedRoom: null,
      typeOptions: [
        { value: "plumbing", label: "水管维修" },
        { value: "electrical", label: "电路维修" },
        { value: "appliance", label: "电器维修" },
        { value: "furniture", label: "家具维修" },
        { value: "decoration", label: "装修维护" },
        { value: "other", label: "其他维修" }
      ],
      selectedType: null,
      formData: {
        room_id: "",
        maintenance_type: "",
        maintenance_date: "",
        cost: "",
        description: "",
        maintenance_company: ""
      }
    };
  },
  onLoad() {
    this.loadRecords();
    this.loadStatistics();
    this.loadRoomOptions();
  },
  onPullDownRefresh() {
    this.refreshData();
  },
  methods: {
    // 加载维修记录
    async loadRecords(isRefresh = false) {
      if (this.loading)
        return;
      this.loading = true;
      if (isRefresh) {
        this.pageNum = 1;
        this.recordList = [];
        this.hasMore = true;
      }
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getMaintenanceRecords",
            data: {
              pageNum: this.pageNum,
              pageSize: this.pageSize,
              searchKeyword: this.searchKeyword
            }
          }
        });
        if (result.result.code === 0) {
          const { list, total } = result.result.data;
          if (isRefresh) {
            this.recordList = list;
          } else {
            this.recordList = [...this.recordList, ...list];
          }
          this.hasMore = this.recordList.length < total;
          this.pageNum++;
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/maintenance-record/maintenance-record.vue:249", "加载维修记录失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
        common_vendor.index.stopPullDownRefresh();
      }
    },
    // 加载统计信息
    async loadStatistics() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getMaintenanceCostStats",
            data: {}
          }
        });
        if (result.result.code === 0) {
          const data = result.result.data;
          this.statistics.totalRecords = data.recordCount;
          this.statistics.totalCost = data.totalCost;
          const thisMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
          const thisYear = (/* @__PURE__ */ new Date()).getFullYear();
          this.statistics.thisMonthRecords = data.records.filter((record) => {
            const recordDate = new Date(record.maintenance_date);
            return recordDate.getMonth() + 1 === thisMonth && recordDate.getFullYear() === thisYear;
          }).length;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/maintenance-record/maintenance-record.vue:285", "加载统计信息失败:", error);
      }
    },
    // 加载房间选项
    async loadRoomOptions() {
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "getRooms",
            data: {
              pageSize: 1e3,
              pageNum: 1
            }
          }
        });
        if (result.result.code === 0) {
          this.roomOptions = result.result.data.list.map((room) => ({
            value: room._id,
            label: `${room.room_number}号房`
          }));
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/maintenance-record/maintenance-record.vue:310", "加载房间列表失败:", error);
      }
    },
    // 搜索
    onSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.refreshData();
      }, 500);
    },
    // 刷新数据
    refreshData() {
      this.loadRecords(true);
      this.loadStatistics();
    },
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.loadRecords();
      }
    },
    // 查看记录详情
    viewRecord(record) {
      common_vendor.index.__f__("log", "at pages/maintenance-record/maintenance-record.vue:338", "查看维修记录:", record);
    },
    // 显示添加弹窗
    addRecord() {
      this.showAddModal = true;
      this.resetForm();
    },
    // 隐藏添加弹窗
    hideAddModal() {
      this.showAddModal = false;
      this.resetForm();
    },
    // 重置表单
    resetForm() {
      this.formData = {
        room_id: "",
        maintenance_type: "",
        maintenance_date: this.formatDateForPicker(/* @__PURE__ */ new Date()),
        cost: "",
        description: "",
        maintenance_company: ""
      };
      this.selectedRoom = null;
      this.selectedType = null;
    },
    // 房间选择
    onRoomChange(e) {
      const index = e.detail.value;
      this.selectedRoom = this.roomOptions[index];
      this.formData.room_id = this.selectedRoom.value;
    },
    // 类型选择
    onTypeChange(e) {
      const index = e.detail.value;
      this.selectedType = this.typeOptions[index];
      this.formData.maintenance_type = this.selectedType.value;
    },
    // 日期选择
    onDateChange(e) {
      this.formData.maintenance_date = e.detail.value;
    },
    // 提交记录
    async submitRecord() {
      if (!this.validateForm())
        return;
      common_vendor.index.showLoading({ title: "保存中..." });
      try {
        const result = await common_vendor.tr.callFunction({
          name: "room-management",
          data: {
            action: "addMaintenanceRecord",
            data: this.formData
          }
        });
        if (result.result.code === 0) {
          common_vendor.index.showToast({
            title: "添加成功",
            icon: "success"
          });
          this.hideAddModal();
          this.refreshData();
        } else {
          common_vendor.index.showToast({
            title: result.result.message,
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/maintenance-record/maintenance-record.vue:415", "添加维修记录失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 表单验证
    validateForm() {
      if (!this.formData.room_id) {
        common_vendor.index.showToast({
          title: "请选择房间",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.maintenance_type) {
        common_vendor.index.showToast({
          title: "请选择维修类型",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.maintenance_date) {
        common_vendor.index.showToast({
          title: "请选择维修日期",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.cost) {
        common_vendor.index.showToast({
          title: "请输入维修费用",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.description) {
        common_vendor.index.showToast({
          title: "请输入维修描述",
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 格式化日期
    formatDate(date) {
      if (!date)
        return "--";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 格式化日期为picker格式
    formatDateForPicker(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 获取类型文本
    getTypeText(type) {
      const typeMap = {
        plumbing: "水管",
        electrical: "电路",
        appliance: "电器",
        furniture: "家具",
        decoration: "装修",
        other: "其他"
      };
      return typeMap[type] || "未知";
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: "待维修",
        in_progress: "维修中",
        completed: "已完成",
        warranty_expired: "保修过期"
      };
      return statusMap[status] || "未知";
    },
    // 获取保修文本
    getWarrantyText(warrantyEndDate) {
      if (!warrantyEndDate)
        return "";
      const end = new Date(warrantyEndDate);
      const now = /* @__PURE__ */ new Date();
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays < 0) {
        return "保修已过期";
      } else if (diffDays === 0) {
        return "保修今日到期";
      } else if (diffDays <= 30) {
        return `保修${diffDays}天后到期`;
      } else {
        return `保修中（${Math.floor(diffDays / 30)}个月后到期）`;
      }
    },
    // 获取保修样式类
    getWarrantyClass(warrantyEndDate) {
      if (!warrantyEndDate)
        return "";
      const end = new Date(warrantyEndDate);
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
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o([($event) => $data.searchKeyword = $event.detail.value, (...args) => $options.onSearch && $options.onSearch(...args)]),
    b: $data.searchKeyword,
    c: common_vendor.o((...args) => $options.addRecord && $options.addRecord(...args)),
    d: common_vendor.t($data.statistics.totalRecords),
    e: common_vendor.t($data.statistics.totalCost),
    f: common_vendor.t($data.statistics.thisMonthRecords),
    g: common_vendor.f($data.recordList, (record, k0, i0) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t((_a = record.room_info) == null ? void 0 : _a.room_number),
        b: common_vendor.t($options.getTypeText(record.maintenance_type)),
        c: common_vendor.n("type-" + record.maintenance_type),
        d: common_vendor.t(record.cost),
        e: common_vendor.t(record.description),
        f: common_vendor.t($options.formatDate(record.maintenance_date)),
        g: record.maintenance_company
      }, record.maintenance_company ? {
        h: common_vendor.t(record.maintenance_company)
      } : {}, {
        i: common_vendor.t($options.getStatusText(record.status)),
        j: common_vendor.n("status-" + record.status),
        k: record.warranty_end_date && record.status === "completed"
      }, record.warranty_end_date && record.status === "completed" ? {
        l: common_vendor.t($options.getWarrantyText(record.warranty_end_date)),
        m: common_vendor.n($options.getWarrantyClass(record.warranty_end_date))
      } : {}, {
        n: record._id,
        o: common_vendor.o(($event) => $options.viewRecord(record), record._id)
      });
    }),
    h: $data.hasMore
  }, $data.hasMore ? {
    i: common_vendor.t($data.loading ? "加载中..." : "上拉加载更多")
  } : {}, {
    j: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args)),
    k: $data.showAddModal
  }, $data.showAddModal ? {
    l: common_vendor.o((...args) => $options.hideAddModal && $options.hideAddModal(...args)),
    m: common_vendor.t($data.selectedRoom ? $data.selectedRoom.label : "请选择房间"),
    n: $data.roomOptions,
    o: common_vendor.o((...args) => $options.onRoomChange && $options.onRoomChange(...args)),
    p: common_vendor.t($data.selectedType ? $data.selectedType.label : "请选择类型"),
    q: $data.typeOptions,
    r: common_vendor.o((...args) => $options.onTypeChange && $options.onTypeChange(...args)),
    s: common_vendor.t($data.formData.maintenance_date || "请选择日期"),
    t: $data.formData.maintenance_date,
    v: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args)),
    w: $data.formData.cost,
    x: common_vendor.o(($event) => $data.formData.cost = $event.detail.value),
    y: $data.formData.description,
    z: common_vendor.o(($event) => $data.formData.description = $event.detail.value),
    A: $data.formData.maintenance_company,
    B: common_vendor.o(($event) => $data.formData.maintenance_company = $event.detail.value),
    C: common_vendor.o((...args) => $options.hideAddModal && $options.hideAddModal(...args)),
    D: common_vendor.o((...args) => $options.submitRecord && $options.submitRecord(...args)),
    E: common_vendor.o(() => {
    }),
    F: common_vendor.o((...args) => $options.hideAddModal && $options.hideAddModal(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/maintenance-record/maintenance-record.js.map
