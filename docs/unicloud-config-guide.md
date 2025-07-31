# uniCloud 配置完整指南

## 📋 配置检查清单

### ✅ 必需文件和配置

#### 1. 服务空间配置文件
**文件位置**: `uniCloud-aliyun/spaces.json`
```json
[
  {
    "id": "mp-82beb92d-779d-44d1-a1d3-7fee8609024d",
    "name": "pang-0217", 
    "provider": "aliyun",
    "clientSecret": "950wKtihe/ZN9Q4B8lYudg==",
    "endpoint": "https://api.next.bspapp.com"
  }
]
```

#### 2. 小程序配置文件
**文件位置**: `manifest.json`
```json
{
  "mp-weixin": {
    "appid": "wxf9702eeacb1fdb80",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "postcss": true,
      "minified": true,
      "checkSiteMap": false
    },
    "networkTimeout": {
      "request": 60000,
      "uploadFile": 60000,
      "downloadFile": 60000
    }
  }
}
```

#### 3. 初始化代码
**文件位置**: `main.js`
```javascript
// 微信小程序uniCloud初始化
// #ifdef MP-WEIXIN
import { initUniCloud } from './utils/cloud-init.js'

setTimeout(() => {
  initUniCloud()
    .then((success) => {
      console.log('[App] uniCloud初始化完成:', success ? '成功' : '部分成功')
    })
    .catch((error) => {
      console.error('[App] uniCloud初始化失败:', error.message)
    })
}, 100)
// #endif
```

## 🚨 关键注意事项

### 环境差异问题
- **开发环境**: 真机调试时使用开发配置，容错性较高
- **生产环境**: 体验版/正式版严格校验所有配置
- **解决方案**: 确保所有配置在生产环境下都正确

### 常见错误和解决方案

#### 1. "未关联云服务空间"
**原因**: HBuilderX 项目未正确关联服务空间
**解决**: 
- 右键 uniCloud-aliyun → 关联云服务空间
- 使用已有服务空间，输入 SpaceId 和 ClientSecret

#### 2. "云函数不存在或未部署"
**原因**: 云函数未上传到服务空间
**解决**:
- 先上传公共模块: 右键 uni_modules → 上传公共模块
- 再上传云函数: 右键 cloudfunctions → 上传所有云函数

#### 3. "request:fail 网络请求失败"
**原因**: 微信小程序域名白名单未配置
**解决**:
- 微信公众平台 → 开发设置 → 服务器域名
- 添加 request 合法域名: https://api.next.bspapp.com

#### 4. "真机调试正常，体验版异常"
**原因**: 环境配置差异，体验版强制域名校验
**解决**:
- 确保域名白名单完整配置
- 使用健壮的初始化代码
- 添加重试机制和错误处理

## 🔍 部署流程标准操作

### 1. 应用注册阶段 (最关键)
```bash
1. 访问 https://dev.dcloud.net.cn/
2. 登录 DCloud 账户
3. 创建新应用
4. 关联小程序 AppID 和 uniCloud 服务空间
5. 确认应用创建成功
```

### 2. 开发阶段
```bash
1. HBuilderX 关联服务空间 (通常会自动关联)
2. 配置 spaces.json 
3. 上传公共模块
4. 上传云函数
5. 本地调试测试
```

### 3. 发布前检查
```bash
1. 确认服务空间绑定状态
2. 验证域名白名单配置
3. 测试云函数连接
4. 检查初始化代码
5. 清除缓存重新编译
```

### 4. 发布后验证
```bash
1. 体验版功能测试
2. 查看控制台日志
3. 验证数据同步
4. 性能监控检查
```

## 🛠️ 调试工具和技巧

### 1. 使用测试页面
- 创建专门的测试页面验证云函数连接
- 包含详细的日志输出和错误信息
- 测试不同环境下的表现

### 2. 控制台日志分析
```javascript
// 关键日志标识
[App] uniCloud初始化完成    // 初始化状态
[CloudAPI] 调用云函数       // API调用状态  
[CloudTest] 云函数调用成功  // 连接测试结果
```

### 3. 分环境配置
```javascript
// 区分开发和生产环境
const isDev = process.env.NODE_ENV === 'development'
const config = isDev ? devConfig : prodConfig
```

## 📱 最佳实践

### 1. 错误处理
- 实现重试机制
- 提供友好的错误提示
- 记录详细的错误日志

### 2. 性能优化
- 合理使用缓存
- 批量处理数据请求
- 避免频繁的云函数调用

### 3. 安全考虑
- 不在前端暴露敏感信息
- 使用适当的权限控制
- 定期更新 ClientSecret

### 4. 监控和维护
- 定期检查云函数运行状态
- 监控API调用频率和错误率
- 及时处理异常情况

## 🎯 问题排查步骤

遇到问题时，按以下顺序检查：

1. **服务空间绑定** - uniCloud控制台确认
2. **域名白名单** - 微信公众平台确认  
3. **云函数部署** - HBuilderX上传状态
4. **项目配置** - spaces.json和manifest.json
5. **初始化代码** - main.js和工具函数
6. **网络环境** - 真机vs体验版差异
7. **缓存清理** - 重新编译发布

通过这个完整的配置指南，可以有效避免和解决 uniCloud 相关的配置问题。