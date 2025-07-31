# Git 仓库清理指南

## 📋 需要清理的文件类型

### 1. 系统文件
- `.DS_Store` (macOS 系统文件)
- `Thumbs.db` (Windows 系统文件)

### 2. 编译输出文件
- `unpackage/` 目录（编译输出）
- `.sourcemap` 文件
- 各种编译缓存文件

### 3. 开发工具配置
- `.hbuilderx/` 目录
- `.vscode/` 目录
- `.idea/` 目录

### 4. 依赖和缓存
- `node_modules/` 目录
- 各种日志文件

## 🧹 清理步骤

### 步骤1: 从Git中移除已追踪的不需要文件

```bash
# 移除系统文件
git rm --cached .DS_Store
git rm --cached pages/.DS_Store  
git rm --cached uniCloud-aliyun/.DS_Store
git rm --cached uniCloud-aliyun/cloudfunctions/.DS_Store
git rm --cached uni_modules/.DS_Store
git rm --cached unpackage/.DS_Store

# 移除编译输出目录
git rm -r --cached unpackage/dist/

# 移除开发工具配置
git rm -r --cached .hbuilderx/

# 如果有其他不需要的文件，类似处理
```

### 步骤2: 提交 .gitignore 文件

```bash
# 添加 .gitignore 文件
git add .gitignore

# 提交更改
git commit -m "Add .gitignore and remove unnecessary files"
```

### 步骤3: 清理本地文件（可选）

```bash
# 删除本地的系统文件
find . -name ".DS_Store" -delete

# 清理编译缓存
rm -rf unpackage/dist/
```

## 📋 重要的项目文件（应该提交）

### 源代码文件
- `pages/` - 页面源码
- `components/` - 组件源码
- `utils/` - 工具函数
- `static/` - 静态资源

### 配置文件
- `pages.json` - 页面配置
- `manifest.json` - 应用配置
- `App.vue` - 应用入口
- `main.js` - 主入口文件
- `uni.scss` - 全局样式

### 云函数和数据库
- `uniCloud-aliyun/cloudfunctions/` - 云函数源码
- `uniCloud-aliyun/database/` - 数据库结构
- `uniCloud-aliyun/spaces.json` - 服务空间配置（注意：包含密钥，根据团队政策决定是否提交）

### 文档
- `README.md` - 项目说明
- `deployment-guide.md` - 部署指南
- 其他 `.md` 文档文件

## ⚠️ 敏感文件处理

### spaces.json 文件
这个文件包含服务空间的密钥信息：

**选项1: 不提交（推荐）**
```bash
git rm --cached uniCloud-aliyun/spaces.json
# 然后将其添加到 .gitignore
```

**选项2: 创建模板文件**
```bash
# 创建 spaces.json.template 文件，移除敏感信息
cp uniCloud-aliyun/spaces.json uniCloud-aliyun/spaces.json.template
# 手动编辑 template 文件，替换敏感信息为占位符
```

## 🔧 自动化脚本

### 清理脚本 (cleanup.sh)
```bash
#!/bin/bash
echo "🧹 清理项目文件..."

# 删除系统文件
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# 清理编译输出
rm -rf unpackage/dist/

# 清理日志文件
find . -name "*.log" -delete

echo "✅ 清理完成"
```

### Git 清理脚本 (git-cleanup.sh)
```bash
#!/bin/bash
echo "🗑️ 从Git中移除不需要的文件..."

# 移除已追踪的系统文件
git rm --cached .DS_Store 2>/dev/null || true
git rm --cached pages/.DS_Store 2>/dev/null || true
git rm --cached uniCloud-aliyun/.DS_Store 2>/dev/null || true
git rm --cached uniCloud-aliyun/cloudfunctions/.DS_Store 2>/dev/null || true
git rm --cached uni_modules/.DS_Store 2>/dev/null || true
git rm --cached unpackage/.DS_Store 2>/dev/null || true

# 移除编译输出
git rm -r --cached unpackage/dist/ 2>/dev/null || true

# 移除开发工具配置
git rm -r --cached .hbuilderx/ 2>/dev/null || true

echo "✅ Git清理完成"
echo "💡 请运行: git commit -m 'Remove unnecessary files from git tracking'"
```

## 📊 推荐的提交频率

### 经常提交
- 源代码更改
- 配置文件更新
- 文档更新

### 偶尔提交
- 依赖版本更新
- 构建配置更改

### 不要提交
- 编译输出文件
- 系统临时文件
- 个人开发工具配置
- 敏感信息（密钥、密码等）

## 🎯 最佳实践

1. **在项目开始时就添加 .gitignore**
2. **定期检查 git status，确保不提交不必要的文件**
3. **团队统一 .gitignore 规则**
4. **敏感信息使用环境变量或配置模板**
5. **使用 git hooks 自动检查提交内容**