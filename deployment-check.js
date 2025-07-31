// 部署状态检查脚本
// 在HBuilderX控制台或小程序开发工具中运行

class DeploymentChecker {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  // 添加检查结果
  addResult(category, item, status, message = '') {
    this.results.push({
      category,
      item,
      status, // 'success', 'warning', 'error'
      message,
      timestamp: new Date().toISOString()
    });
  }

  // 添加错误
  addError(error) {
    this.errors.push({
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
  }

  // 检查uniCloud连接
  async checkUniCloudConnection() {
    try {
      console.log('🔍 检查uniCloud连接...');
      
      // 检查uniCloud是否可用
      if (typeof uniCloud === 'undefined') {
        this.addResult('连接', 'uniCloud环境', 'error', 'uniCloud未初始化');
        return false;
      }

      // 尝试调用一个简单的云函数
      const result = await uniCloud.callFunction({
        name: 'room-management',
        data: {
          action: 'getRooms',
          data: { pageSize: 1, pageNum: 1 }
        }
      });

      if (result.result && result.result.code === 0) {
        this.addResult('连接', 'room-management云函数', 'success', '连接正常');
        return true;
      } else {
        this.addResult('连接', 'room-management云函数', 'error', 
          `调用失败: ${result.result?.message || '未知错误'}`);
        return false;
      }
    } catch (error) {
      this.addError(error);
      this.addResult('连接', 'uniCloud连接', 'error', error.message);
      return false;
    }
  }

  // 检查数据库初始化状态
  async checkDatabaseStatus() {
    try {
      console.log('🗄️ 检查数据库状态...');

      // 检查各个集合的数据量
      const collections = ['rooms', 'tenants', 'rentals', 'utility_records', 'maintenance_records'];
      
      for (let collection of collections) {
        try {
          const result = await uniCloud.callFunction({
            name: 'room-management',
            data: {
              action: 'debugDatabase'
            }
          });

          if (result.result && result.result.code === 0) {
            const debugInfo = result.result.data.debug_info;
            
            if (debugInfo[collection]) {
              const count = debugInfo[collection].total;
              if (count > 0) {
                this.addResult('数据库', `${collection}集合`, 'success', `${count}条记录`);
              } else {
                this.addResult('数据库', `${collection}集合`, 'warning', '无数据');
              }
            } else {
              this.addResult('数据库', `${collection}集合`, 'error', '集合不存在');
            }
          }
        } catch (error) {
          this.addResult('数据库', `${collection}集合`, 'error', error.message);
        }
      }
    } catch (error) {
      this.addError(error);
      this.addResult('数据库', '数据库检查', 'error', error.message);
    }
  }

  // 检查云函数功能
  async checkCloudFunctions() {
    try {
      console.log('⚡ 检查云函数功能...');

      const functionTests = [
        {
          name: '房间列表',
          action: 'getRooms',
          data: { pageSize: 5, pageNum: 1 }
        },
        {
          name: '统计信息',
          action: 'getRoomOccupancyStatistics',
          data: {}
        },
        {
          name: '收入统计',
          action: 'getIncomeStatistics', 
          data: { year: new Date().getFullYear(), type: 'yearly' }
        }
      ];

      for (let test of functionTests) {
        try {
          const result = await uniCloud.callFunction({
            name: 'room-management',
            data: {
              action: test.action,
              data: test.data
            }
          });

          if (result.result && result.result.code === 0) {
            this.addResult('云函数', test.name, 'success', '功能正常');
          } else {
            this.addResult('云函数', test.name, 'error', 
              result.result?.message || '调用失败');
          }
        } catch (error) {
          this.addResult('云函数', test.name, 'error', error.message);
        }
      }
    } catch (error) {
      this.addError(error);
    }
  }

  // 检查数据完整性
  async checkDataIntegrity() {
    try {
      console.log('🔍 检查数据完整性...');

      const result = await uniCloud.callFunction({
        name: 'room-management',
        data: {
          action: 'debugDatabase'
        }
      });

      if (result.result && result.result.code === 0) {
        const inconsistencies = result.result.data.inconsistencies || [];
        
        if (inconsistencies.length === 0) {
          this.addResult('数据完整性', '数据一致性', 'success', '数据一致');
        } else {
          this.addResult('数据完整性', '数据一致性', 'warning', 
            `发现${inconsistencies.length}个不一致问题`);
          
          // 显示具体的不一致问题
          inconsistencies.forEach(issue => {
            this.addResult('数据完整性', issue.type, 'warning', issue.issue);
          });
        }
      }
    } catch (error) {
      this.addError(error);
      this.addResult('数据完整性', '完整性检查', 'error', error.message);
    }
  }

  // 性能测试
  async performanceTest() {
    try {
      console.log('⚡ 执行性能测试...');

      const startTime = Date.now();
      
      // 并发调用多个云函数测试性能
      const promises = [
        uniCloud.callFunction({
          name: 'room-management',
          data: { action: 'getRooms', data: { pageSize: 10, pageNum: 1 } }
        }),
        uniCloud.callFunction({
          name: 'room-management', 
          data: { action: 'getRoomOccupancyStatistics', data: {} }
        }),
        uniCloud.callFunction({
          name: 'room-management',
          data: { action: 'getIncomeStatistics', data: { year: 2024, type: 'yearly' } }
        })
      ];

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration < 2000) {
        this.addResult('性能', '响应时间', 'success', `${duration}ms`);
      } else if (duration < 5000) {
        this.addResult('性能', '响应时间', 'warning', `${duration}ms`);
      } else {
        this.addResult('性能', '响应时间', 'error', `${duration}ms - 过慢`);
      }
    } catch (error) {
      this.addError(error);
      this.addResult('性能', '性能测试', 'error', error.message);
    }
  }

  // 运行所有检查
  async runAllChecks() {
    console.log('🚀 开始部署状态检查...');
    console.log('=================================');

    try {
      // 检查连接
      const connectionOk = await this.checkUniCloudConnection();
      
      if (connectionOk) {
        // 只有连接正常才继续其他检查
        await this.checkDatabaseStatus();
        await this.checkCloudFunctions();
        await this.checkDataIntegrity();
        await this.performanceTest();
      }

      // 生成报告
      this.generateReport();
      
    } catch (error) {
      this.addError(error);
      console.error('❌ 检查过程中发生错误:', error);
    }
  }

  // 生成检查报告
  generateReport() {
    console.log('\n📊 部署检查报告');
    console.log('=================================');

    // 按类别分组显示结果
    const categories = [...new Set(this.results.map(r => r.category))];
    
    let totalSuccess = 0;
    let totalWarning = 0;
    let totalError = 0;

    categories.forEach(category => {
      console.log(`\n📁 ${category}:`);
      
      const categoryResults = this.results.filter(r => r.category === category);
      categoryResults.forEach(result => {
        const icon = this.getStatusIcon(result.status);
        console.log(`  ${icon} ${result.item}: ${result.message || result.status}`);
        
        if (result.status === 'success') totalSuccess++;
        else if (result.status === 'warning') totalWarning++;
        else if (result.status === 'error') totalError++;
      });
    });

    // 显示汇总
    console.log('\n📈 检查汇总:');
    console.log(`  ✅ 成功: ${totalSuccess}`);
    console.log(`  ⚠️  警告: ${totalWarning}`);
    console.log(`  ❌ 错误: ${totalError}`);

    // 显示错误详情
    if (this.errors.length > 0) {
      console.log('\n🚨 错误详情:');
      this.errors.forEach(error => {
        console.log(`  - ${error.error}`);
      });
    }

    // 部署建议
    this.generateRecommendations(totalError, totalWarning);
  }

  // 获取状态图标
  getStatusIcon(status) {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }

  // 生成建议
  generateRecommendations(errorCount, warningCount) {
    console.log('\n💡 部署建议:');
    
    if (errorCount > 0) {
      console.log('  🚨 发现错误，需要立即处理:');
      console.log('    1. 检查云函数是否正确部署');
      console.log('    2. 确认服务空间配置');
      console.log('    3. 验证网络连接和权限');
    } else if (warningCount > 0) {
      console.log('  ⚠️  发现警告，建议优化:');
      console.log('    1. 运行数据库初始化');
      console.log('    2. 修复数据完整性问题');
      console.log('    3. 添加更多示例数据');
    } else {
      console.log('  ✅ 部署状态良好！');
      console.log('    系统已准备就绪，可以正常使用');
    }

    console.log('\n📖 更多帮助:');
    console.log('  - 查看 deployment-guide.md');
    console.log('  - 检查 HBuilderX 控制台日志');
    console.log('  - 访问 DCloud 开发者中心');
  }
}

// 使用说明
console.log('📋 部署检查脚本');
console.log('=================================');
console.log('使用方法:');
console.log('1. 在HBuilderX中打开控制台');
console.log('2. 复制此脚本并运行');
console.log('3. 或在小程序中调用 checker.runAllChecks()');
console.log('');

// 创建检查器实例
const checker = new DeploymentChecker();

// 如果在小程序环境中，可以直接运行
if (typeof uniCloud !== 'undefined') {
  // 自动运行检查
  checker.runAllChecks().then(() => {
    console.log('✅ 检查完成');
  }).catch(error => {
    console.error('❌ 检查失败:', error);
  });
} else {
  console.log('💡 请在uniCloud环境中运行此脚本');
}

// 导出检查器（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeploymentChecker;
}