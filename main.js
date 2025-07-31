import App from './App'

// 微信小程序uniCloud初始化 - 解决体验版问题
// #ifdef MP-WEIXIN
import { initUniCloud } from './utils/cloud-init.js'

// 延迟初始化确保小程序环境完全加载
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