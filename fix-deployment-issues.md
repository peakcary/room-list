# 🔧 体验版数据库连接问题解决方案

## 🚨 问题分析

**根本原因**：本地调试使用本地云函数，体验版需要部署到uniCloud服务空间的云函数。

## ✅ 解决步骤

### 步骤1：确认云函数部署状态

1. **在微信开发者工具中运行检查脚本**：
   - 打开微信开发者工具
   - 在控制台中复制粘贴 `deployment-status-check.js` 的内容
   - 查看哪些云函数未部署

### 步骤2：部署云函数到uniCloud

在HBuilderX中执行以下操作：

1. **右键点击 `uniCloud-aliyun/cloudfunctions` 目录**
2. **选择 "上传所有云函数"**
3. **或者逐个部署云函数**：
   - 右键单个云函数文件夹
   - 选择 "上传并部署"

**需要部署的云函数列表**：
- ✅ `room-management` - 房间管理
- ✅ `tenant-management` - 租户管理  
- ✅ `rental-management` - 租赁管理
- ✅ `utility-management` - 水电管理
- ✅ `maintenance-management` - 维修管理
- ✅ `stats-management` - 统计管理
- ✅ `db-init` - 数据库初始化
- ✅ `user-management` - 用户管理

### 步骤3：初始化数据库

云函数部署完成后：

1. **在HBuilderX云函数控制台调用 `db-init`**
2. **或在小程序中访问测试页面初始化数据库**

### 步骤4：检查服务空间配置

确认以下配置正确：

#### **manifest.json 小程序配置**
```json
{
  "mp-weixin": {
    "appid": "wxf9702eeacb1fdb80",  // 你的小程序appid
    "uniCloud": true
  }
}
```

#### **spaces.json 服务空间配置**  
```json
[
  {
    "id": "mp-82beb92d-779d-44d1-a1d3-7fee8609024d",
    "name": "pang-0217",
    "provider": "aliyun"
  }
]
```

#### **main.js uniCloud初始化**
确保包含：
```javascript
import uniCloud from '@dcloudio/uni-cloud'
```

### 步骤5：验证部署结果

1. **上传体验版**
2. **测试关键功能**：
   - 房间列表加载
   - 数据统计显示
   - 用户登录功能

## 🔍 常见错误及解决方案

### ❌ "cloud function not found"
**原因**：云函数未部署到线上环境
**解决**：在HBuilderX中上传对应的云函数

### ❌ "request permission denied"  
**原因**：数据库权限配置问题
**解决**：检查 `uniCloud-aliyun/database/*.schema.json` 文件中的权限配置

### ❌ "connection timeout"
**原因**：网络连接问题或服务空间配置错误
**解决**：
1. 检查网络连接
2. 确认服务空间ID和配置正确
3. 重新生成并上传代码

### ❌ "appid not match"
**原因**：小程序appid与uniCloud服务空间绑定不匹配
**解决**：
1. 登录 [uniCloud控制台](https://unicloud.dcloud.net.cn/)
2. 检查服务空间绑定的小程序appid
3. 确保与manifest.json中的appid一致

## ⚡ 快速诊断命令

在微信开发者工具控制台运行：

```javascript
// 检查uniCloud连接
console.log('uniCloud对象:', typeof uniCloud);

// 测试云函数调用
uniCloud.callFunction({
  name: 'db-init',
  data: { action: 'ping' }
}).then(res => {
  console.log('✅ 云函数连接正常:', res);
}).catch(err => {
  console.error('❌ 云函数连接失败:', err.message);
});
```

## 📋 部署检查清单

- [ ] 所有云函数已上传到uniCloud服务空间
- [ ] 数据库已初始化（调用db-init云函数）
- [ ] 服务空间配置正确（spaces.json）
- [ ] 小程序appid与服务空间绑定匹配
- [ ] 体验版重新上传并测试
- [ ] 关键功能验证通过

## 🎯 预期结果

完成以上步骤后：
- ✅ 体验版可以正常连接数据库
- ✅ 房间数据正常加载
- ✅ 统计功能正常显示
- ✅ 用户登录系统正常工作

如果仍有问题，请提供具体的错误信息以便进一步诊断。