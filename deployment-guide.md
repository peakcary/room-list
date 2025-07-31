# 房间管理系统 - 云函数部署指南

## 📋 部署前检查清单

### 1. 开发环境要求
- ✅ HBuilderX 3.8+ 
- ✅ uni-app CLI
- ✅ 已注册 DCloud 开发者账号
- ✅ 阿里云 uniCloud 服务空间

### 2. 项目结构确认
```
uniCloud-aliyun/
├── cloudfunctions/           # 云函数目录
│   ├── room-management/      # 主要业务云函数
│   └── db-init/             # 数据库初始化函数
├── database/                # 数据库结构定义
│   ├── rooms.schema.json
│   ├── tenants.schema.json
│   ├── rentals.schema.json
│   ├── utility_records.schema.json
│   └── maintenance_records.schema.json
└── spaces.json             # 服务空间配置
```

## 🚀 部署步骤

### 步骤1: 确认服务空间绑定
1. 检查 `uniCloud-aliyun/spaces.json` 配置
2. 确认服务空间ID：`mp-82beb92d-779d-44d1-a1d3-7fee8609024d`
3. 服务空间名称：`pang-0217`

### 步骤2: 部署云函数

#### 2.1 在HBuilderX中部署
1. 右键点击 `uniCloud-aliyun/cloudfunctions/room-management`
2. 选择"上传并部署"
3. 等待部署完成

#### 2.2 部署数据库初始化函数
1. 右键点击 `uniCloud-aliyun/cloudfunctions/db-init`
2. 选择"上传并部署"
3. 等待部署完成

### 步骤3: 上传数据库表结构
1. 右键点击 `uniCloud-aliyun/database`
2. 选择"上传所有DB Schema"
3. 确认所有表结构上传完成

### 步骤4: 初始化数据库
1. 在HBuilderX中打开云函数调试
2. 调用 `db-init` 函数
3. 或在小程序中访问系统测试页面

## 🔧 云函数功能说明

### room-management 主函数
支持以下操作：

#### 房间管理
- `getRooms` - 获取房间列表
- `getRoomById` - 获取房间详情
- `addRoom` - 添加房间
- `updateRoom` - 更新房间信息
- `deleteRoom` - 删除房间

#### 租户管理
- `getTenants` - 获取租户列表
- `addTenant` - 添加租户
- `updateTenant` - 更新租户信息
- `deleteTenant` - 删除租户

#### 租赁管理
- `createRental` - 创建租赁关系
- `getRentals` - 获取租赁列表
- `terminateRental` - 终止租赁
- `renewRental` - 续租
- `getRentalHistory` - 获取租赁历史

#### 水电费管理
- `addMonthlyUtilityRecord` - 添加水电记录
- `getUtilityRecords` - 获取水电记录
- `updateUtilityPayment` - 更新缴费状态

#### 维修管理
- `addMaintenanceRecord` - 添加维修记录
- `getMaintenanceRecords` - 获取维修记录
- `updateMaintenanceRecord` - 更新维修记录

#### 统计功能
- `getIncomeStatistics` - 收入统计
- `getRoomOccupancyStatistics` - 房间入住统计
- `getIncomeTrend` - 收入趋势
- `getDashboardStatistics` - 仪表板统计

### db-init 初始化函数
- 创建示例数据
- 初始化数据库结构
- 支持强制重置（`forceReset: true`）

## 📊 数据库表结构

### rooms (房间表)
- room_number: 房间号
- floor: 楼层
- status: 状态 (available/rented/maintenance)
- current_rental_id: 当前租赁ID

### tenants (租户表)
- name: 姓名
- id_card: 身份证号
- phone: 电话
- emergency_contact: 紧急联系人

### rentals (租赁表)
- room_id: 房间ID
- tenant_id: 租户ID
- rent_price: 租金
- deposit: 押金
- rent_start_date: 开始日期
- rent_end_date: 结束日期
- status: 状态 (active/terminated/expired)

### utility_records (水电记录表)
- room_id: 房间ID
- record_date: 记录日期
- electricity_reading: 电表读数
- water_reading: 水表读数
- total_fee: 总费用
- is_paid: 是否已缴费

### maintenance_records (维修记录表)
- room_id: 房间ID
- description: 维修描述
- amount: 费用
- status: 状态

## 🔍 部署验证

### 1. 云函数测试
在HBuilderX云函数调试中测试：
```javascript
// 测试获取房间列表
{
  "action": "getRooms",
  "data": {
    "pageSize": 10,
    "pageNum": 1
  }
}
```

### 2. 小程序测试
1. 启动小程序
2. 登录系统（admin/123456 或 manager/888888）
3. 检查房间列表是否显示
4. 测试各项功能

## 🚨 常见问题

### 问题1: 云函数调用失败
**解决方案:**
1. 检查服务空间绑定
2. 确认云函数已正确部署
3. 检查网络权限配置

### 问题2: 数据不显示
**解决方案:**
1. 运行数据库初始化
2. 检查数据库表结构
3. 验证云函数权限

### 问题3: 小程序体验版无法访问
**解决方案:**
1. 确认在 https://dev.dcloud.net.cn/ 创建了应用
2. 检查服务空间关联
3. 添加域名白名单

## 📱 域名白名单配置

在微信小程序后台添加以下域名：
- `https://api.next.bspapp.com`
- 其他uniCloud相关域名

## 🔐 安全配置

1. **数据库权限**: 当前为开发模式，生产环境需要配置安全规则
2. **云函数权限**: 建议添加用户身份验证
3. **API安全**: 建议添加请求签名验证

## 📈 性能优化建议

1. **索引优化**: 为经常查询的字段添加数据库索引
2. **缓存策略**: 使用Redis缓存热点数据
3. **分页查询**: 大数据量查询使用分页
4. **CDN加速**: 静态资源使用CDN

## 🔄 维护和更新

### 日常维护
1. 定期备份数据库
2. 监控云函数执行情况
3. 检查系统日志

### 版本更新
1. 测试环境验证
2. 灰度发布
3. 生产环境部署

---

**部署支持**: 如有问题请查看HBuilderX文档或联系技术支持