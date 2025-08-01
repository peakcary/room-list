/**
 * 环境管理器 - 确保本地和线上环境一致性
 */

// 环境配置
const ENV_CONFIG = {
  // 开发环境（本地调试）
  development: {
    name: '开发环境',
    useLocalCloudFunction: false, // 强制使用线上云函数
    useRealDatabase: true,        // 使用真实数据库
    enableDebugLog: true,         // 启用调试日志
    mockData: false,              // 禁用模拟数据
    strictValidation: true        // 启用严格验证
  },
  
  // 生产环境（体验版/正式版）
  production: {
    name: '生产环境', 
    useLocalCloudFunction: false,
    useRealDatabase: true,
    enableDebugLog: false,
    mockData: false,
    strictValidation: true
  }
};

/**
 * 获取当前环境配置
 */
function getCurrentEnv() {
  // 检测运行环境
  let currentEnv = 'production';
  
  // #ifdef APP-PLUS
  currentEnv = 'development';
  // #endif
  
  // #ifdef H5
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    currentEnv = 'development';
  }
  // #endif
  
  // #ifdef MP-WEIXIN
  // 微信小程序环境检测
  const accountInfo = uni.getAccountInfoSync();
  if (accountInfo.miniProgram.envVersion === 'develop') {
    currentEnv = 'development';
  }
  // #endif
  
  return {
    env: currentEnv,
    config: ENV_CONFIG[currentEnv]
  };
}

/**
 * 环境一致性检查器
 */
class EnvironmentChecker {
  constructor() {
    this.currentEnv = getCurrentEnv();
    this.errors = [];
    this.warnings = [];
  }
  
  /**
   * 检查uniCloud连接状态
   */
  async checkUniCloudConnection() {
    try {
      console.log('🔍 检查uniCloud连接状态...');
      
      if (typeof uniCloud === 'undefined') {
        this.errors.push('uniCloud未加载，检查main.js中的导入');
        return false;
      }
      
      // 测试基本连接
      const result = await uniCloud.callFunction({
        name: 'db-init',
        data: { action: 'ping' }
      });
      
      console.log('✅ uniCloud连接正常');
      return true;
    } catch (error) {
      this.errors.push(`uniCloud连接失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 检查云函数部署状态
   */
  async checkCloudFunctions() {
    const functions = [
      'room-management',
      'tenant-management',
      'rental-management', 
      'utility-management',
      'maintenance-management',
      'stats-management',
      'db-init',
      'user-management'
    ];
    
    console.log('🔍 检查云函数部署状态...');
    
    const results = {};
    
    for (const funcName of functions) {
      try {
        await uniCloud.callFunction({
          name: funcName,
          data: { action: 'ping' }
        });
        
        results[funcName] = true;
        console.log(`✅ ${funcName}: 已部署`);
      } catch (error) {
        results[funcName] = false;
        this.errors.push(`${funcName}: 未部署或异常 - ${error.message}`);
        console.error(`❌ ${funcName}: 未部署`);
      }
    }
    
    return results;
  }
  
  /**
   * 检查数据库连接和权限
   */
  async checkDatabase() {
    try {
      console.log('🔍 检查数据库连接...');
      
      const result = await uniCloud.callFunction({
        name: 'db-init',
        data: { action: 'check_tables' }
      });
      
      if (result.result && result.result.code === 0) {
        console.log('✅ 数据库连接正常');
        return true;
      } else {
        this.warnings.push('数据库表可能未初始化');
        return false;
      }
    } catch (error) {
      this.errors.push(`数据库连接失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 检查网络环境
   */
  checkNetworkEnvironment() {
    console.log('🔍 检查网络环境...');
    
    const networkType = uni.getNetworkType();
    const systemInfo = uni.getSystemInfoSync();
    
    console.log('📱 设备信息:', {
      platform: systemInfo.platform,
      system: systemInfo.system,
      version: systemInfo.version
    });
    
    // 检查网络类型
    if (networkType === 'none') {
      this.errors.push('网络连接异常');
      return false;
    }
    
    console.log('✅ 网络环境正常');
    return true;
  }
  
  /**
   * 执行完整的环境检查
   */
  async performFullCheck() {
    console.log(`🚀 开始环境一致性检查 - ${this.currentEnv.config.name}`);
    console.log('==================================');
    
    this.errors = [];
    this.warnings = [];
    
    // 1. 检查网络环境
    this.checkNetworkEnvironment();
    
    // 2. 检查uniCloud连接
    const cloudConnected = await this.checkUniCloudConnection();
    
    if (!cloudConnected) {
      return this.getCheckResult();
    }
    
    // 3. 检查云函数部署
    const functionResults = await this.checkCloudFunctions();
    
    // 4. 检查数据库
    await this.checkDatabase();
    
    return this.getCheckResult();
  }
  
  /**
   * 获取检查结果
   */
  getCheckResult() {
    const hasErrors = this.errors.length > 0;
    const hasWarnings = this.warnings.length > 0;
    
    const result = {
      success: !hasErrors,
      environment: this.currentEnv.env,
      environmentName: this.currentEnv.config.name,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length
      }
    };
    
    // 输出检查结果
    console.log('==================================');
    console.log(`📊 环境检查完成 - ${result.environmentName}`);
    
    if (!hasErrors && !hasWarnings) {
      console.log('🎉 环境状态完全正常！');
    } else {
      if (hasErrors) {
        console.error(`❌ 发现 ${this.errors.length} 个错误:`);
        this.errors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error}`);
        });
      }
      
      if (hasWarnings) {
        console.warn(`⚠️ 发现 ${this.warnings.length} 个警告:`);
        this.warnings.forEach((warning, index) => {
          console.warn(`   ${index + 1}. ${warning}`);
        });
      }
    }
    
    return result;
  }
}

/**
 * 环境同步工具
 */
class EnvironmentSync {
  /**
   * 同步本地开发环境到线上配置
   */
  static async syncToProduction() {
    console.log('🔄 开始环境同步...');
    
    try {
      // 1. 检查并部署云函数
      console.log('1. 检查云函数部署状态...');
      const checker = new EnvironmentChecker();
      const functions = await checker.checkCloudFunctions();
      
      const undeployedFunctions = Object.entries(functions)
        .filter(([name, deployed]) => !deployed)
        .map(([name]) => name);
      
      if (undeployedFunctions.length > 0) {
        console.log('❌ 以下云函数未部署:', undeployedFunctions);
        console.log('请在HBuilderX中手动部署这些云函数');
        return false;
      }
      
      // 2. 初始化数据库
      console.log('2. 检查数据库初始化状态...');
      const dbResult = await uniCloud.callFunction({
        name: 'db-init',
        data: { action: 'init' }
      });
      
      if (dbResult.result.code === 0) {
        console.log('✅ 数据库初始化完成');
      }
      
      console.log('🎉 环境同步完成！');
      return true;
    } catch (error) {
      console.error('❌ 环境同步失败:', error);
      return false;
    }
  }
}

/**
 * 统一的云函数调用器 - 确保环境一致性
 */
class CloudFunctionCaller {
  static async call(functionName, data = {}) {
    const env = getCurrentEnv();
    
    // 添加环境信息到请求数据
    const requestData = {
      ...data,
      _env: env.env,
      _timestamp: Date.now()
    };
    
    try {
      if (env.config.enableDebugLog) {
        console.log(`📤 调用云函数 [${functionName}]:`, requestData);
      }
      
      const result = await uniCloud.callFunction({
        name: functionName,
        data: requestData
      });
      
      if (env.config.enableDebugLog) {
        console.log(`📥 云函数响应 [${functionName}]:`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ 云函数调用失败 [${functionName}]:`, error);
      throw error;
    }
  }
}

// 导出工具
export {
  getCurrentEnv,
  EnvironmentChecker,
  EnvironmentSync,
  CloudFunctionCaller
};