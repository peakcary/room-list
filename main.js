import App from './App'

// uniCloud初始化 - 环境一致性保障
import { initUniCloud } from './utils/cloud-init.js'

// 延迟初始化确保环境完全加载
setTimeout(async () => {
  try {
    // 1. 初始化uniCloud连接
    const cloudInitSuccess = await initUniCloud();
    console.log('[App] uniCloud初始化:', cloudInitSuccess ? '成功' : '部分成功');
    
    // 2. 初始化环境一致性管理（强制使用线上环境）
    // #ifdef APP-PLUS || H5
    console.log('🔧 开发环境启用线上一致性模式');
    const { initDevelopmentParity } = await import('./utils/development-parity.js');
    await initDevelopmentParity();
    // #endif
    
    // 3. 执行环境状态检查
    const { EnvironmentChecker } = await import('./utils/env-manager.js');
    const checker = new EnvironmentChecker();
    const checkResult = await checker.performFullCheck();
    
    if (!checkResult.success) {
      console.warn('⚠️ 环境检查发现问题:', checkResult.errors);
    } else {
      console.log('✅ 环境状态检查通过');
    }
    
  } catch (error) {
    console.error('[App] 环境初始化失败:', error.message);
  }
}, 100);

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif