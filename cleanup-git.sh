#!/bin/bash

echo "🗑️  开始清理Git仓库..."
echo "=================================="

# 检查是否在git仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 错误: 当前目录不是Git仓库"
    exit 1
fi

# 显示当前状态
echo "📊 当前Git状态:"
git status --short

echo -e "\n🧹 正在从Git中移除不需要的文件..."

# 移除系统文件
echo "  移除 .DS_Store 文件..."
git rm --cached .DS_Store 2>/dev/null && echo "    ✅ .DS_Store (根目录)" || echo "    ⏭️  .DS_Store (根目录) - 未追踪"
git rm --cached pages/.DS_Store 2>/dev/null && echo "    ✅ pages/.DS_Store" || echo "    ⏭️  pages/.DS_Store - 未追踪"
git rm --cached uniCloud-aliyun/.DS_Store 2>/dev/null && echo "    ✅ uniCloud-aliyun/.DS_Store" || echo "    ⏭️  uniCloud-aliyun/.DS_Store - 未追踪"
git rm --cached uniCloud-aliyun/cloudfunctions/.DS_Store 2>/dev/null && echo "    ✅ uniCloud-aliyun/cloudfunctions/.DS_Store" || echo "    ⏭️  cloudfunctions/.DS_Store - 未追踪"
git rm --cached uni_modules/.DS_Store 2>/dev/null && echo "    ✅ uni_modules/.DS_Store" || echo "    ⏭️  uni_modules/.DS_Store - 未追踪"
git rm --cached unpackage/.DS_Store 2>/dev/null && echo "    ✅ unpackage/.DS_Store" || echo "    ⏭️  unpackage/.DS_Store - 未追踪"

# 移除编译输出目录
echo "  移除编译输出目录..."
if git ls-files | grep -q "unpackage/dist/"; then
    git rm -r --cached unpackage/dist/ 2>/dev/null && echo "    ✅ unpackage/dist/ 目录已移除" || echo "    ⚠️  unpackage/dist/ 移除失败"
else
    echo "    ⏭️  unpackage/dist/ - 未追踪"
fi

# 移除开发工具配置
echo "  移除开发工具配置..."
if git ls-files | grep -q ".hbuilderx/"; then
    git rm -r --cached .hbuilderx/ 2>/dev/null && echo "    ✅ .hbuilderx/ 目录已移除" || echo "    ⚠️  .hbuilderx/ 移除失败"
else
    echo "    ⏭️  .hbuilderx/ - 未追踪"
fi

# 移除其他可能的不需要文件
echo "  检查其他不需要的文件..."
git rm --cached *.log 2>/dev/null && echo "    ✅ 日志文件已移除" || echo "    ⏭️  没有日志文件需要移除"

echo -e "\n📋 清理后的状态:"
git status --short

echo -e "\n💡 接下来的步骤:"
echo "1. 检查上面的状态，确认要提交的更改"
echo "2. 运行: git add .gitignore"
echo "3. 运行: git commit -m 'Add .gitignore and remove unnecessary files'"
echo "4. 运行: git push (如果需要推送到远程仓库)"

echo -e "\n🎯 可选的本地清理："
echo "如果想要删除本地的这些文件，可以运行："
echo "  find . -name '.DS_Store' -delete"
echo "  rm -rf unpackage/dist/"

echo -e "\n✅ Git清理脚本执行完成!"