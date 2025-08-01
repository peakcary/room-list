// 云函数部署状态检查脚本
// 在微信小程序开发者工具控制台运行

console.log('=== 云函数部署状态检查 ===');

// 检查uniCloud连接
console.log('1. 检查uniCloud连接状态...');
console.log('uniCloud对象:', typeof uniCloud);

// 检查服务空间配置
if (typeof uniCloud !== 'undefined') {
  console.log('✅ uniCloud已加载');
  
  // 测试基本连接
  console.log('2. 测试服务空间连接...');
  
  // 检查云函数是否存在
  const cloudFunctions = [
    'room-management',
    'tenant-management', 
    'rental-management',
    'utility-management',
    'maintenance-management',
    'stats-management',
    'db-init',
    'user-management'
  ];
  
  async function checkCloudFunctions() {
    console.log('3. 检查云函数部署状态...');
    
    for (const funcName of cloudFunctions) {
      try {
        console.log(`检查云函数: ${funcName}`);
        
        const result = await uniCloud.callFunction({
          name: funcName,
          data: { action: 'ping' } // 发送ping测试
        });
        
        console.log(`✅ ${funcName}: 部署成功`, result);
      } catch (error) {
        console.error(`❌ ${funcName}: 未部署或出错`, error.message);
        
        // 分析错误类型
        if (error.message.includes('cloud function') && error.message.includes('not found')) {
          console.log(`   → 该云函数未部署到线上环境`);
        } else if (error.message.includes('permission')) {
          console.log(`   → 权限问题，检查数据库权限配置`);
        } else if (error.message.includes('timeout')) {
          console.log(`   → 网络超时，检查网络连接`);
        }
      }
    }
  }
  
  // 检查数据库连接
  async function checkDatabase() {
    console.log('4. 检查数据库连接...');
    
    try {
      const result = await uniCloud.callFunction({
        name: 'db-init',
        data: { action: 'check' }
      });
      
      console.log('✅ 数据库连接正常:', result);
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      
      if (error.message.includes('not found')) {
        console.log('   → db-init云函数未部署，需要先部署云函数');
      }
    }
  }
  
  // 执行检查
  checkCloudFunctions().then(() => {
    return checkDatabase();
  }).then(() => {
    console.log('=== 检查完成 ===');
    console.log('请根据上面的结果进行相应的修复操作');
  });
  
} else {
  console.error('❌ uniCloud未加载，检查以下配置:');
  console.log('1. manifest.json中的uniCloud配置');
  console.log('2. spaces.json文件是否存在');
  console.log('3. main.js中的uniCloud初始化');
}

// 环境信息
console.log('=== 环境信息 ===');
console.log('当前环境:', process.env.NODE_ENV);
console.log('平台:', uni.getSystemInfoSync().platform);
console.log('uniCloud版本:', uni.getSystemInfoSync().uniRuntimeVersion);