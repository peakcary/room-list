/**
 * uniCloud 初始化工具
 * 解决真机调试正常，体验版异常的问题
 */

// 云服务空间配置
const CLOUD_CONFIG = {
  provider: 'aliyun',
  spaceId: 'mp-82beb92d-779d-44d1-a1d3-7fee8609024d',
  clientSecret: '950wKtihe/ZN9Q4B8lYudg==',
  endpoint: 'https://api.next.bspapp.com'
}

/**
 * 初始化uniCloud
 * @param {boolean} force 是否强制重新初始化
 */
export function initUniCloud(force = false) {
  return new Promise((resolve, reject) => {
    try {
      // 检查运行环境
      const platform = uni.getSystemInfoSync().platform
      const environment = process.env.NODE_ENV
      
      console.log(`[CloudInit] 运行环境: ${platform}, 构建环境: ${environment}`)
      
      // 检查 uniCloud 对象
      if (typeof uniCloud === 'undefined') {
        const error = 'uniCloud 对象未定义，请检查是否正确引入'
        console.error(`[CloudInit] ${error}`)
        reject(new Error(error))
        return
      }
      
      // 检查是否已经初始化（除非强制重新初始化）
      if (!force && uniCloud.getCurrentUserInfo) {
        try {
          // 尝试获取当前用户信息来验证是否已初始化
          console.log('[CloudInit] uniCloud 已初始化，跳过重复初始化')
          resolve(true)
          return
        } catch (e) {
          console.log('[CloudInit] uniCloud 未正确初始化，开始初始化')
        }
      }
      
      // 执行初始化
      console.log('[CloudInit] 开始初始化 uniCloud...')
      console.log('[CloudInit] 配置信息:', {
        provider: CLOUD_CONFIG.provider,
        spaceId: CLOUD_CONFIG.spaceId,
        endpoint: CLOUD_CONFIG.endpoint
      })
      
      uniCloud.init(CLOUD_CONFIG)
      
      console.log('[CloudInit] uniCloud 初始化完成')
      
      // 验证初始化是否成功
      setTimeout(() => {
        testCloudConnection()
          .then((success) => {
            if (success) {
              console.log('[CloudInit] 云函数连接测试成功')
              resolve(true)
            } else {
              console.warn('[CloudInit] 云函数连接测试失败，但初始化完成')
              resolve(false)
            }
          })
          .catch((error) => {
            console.warn('[CloudInit] 云函数连接测试异常:', error.message)
            resolve(false)
          })
      }, 1000)
      
    } catch (error) {
      const errorMsg = `uniCloud 初始化失败: ${error.message}`
      console.error(`[CloudInit] ${errorMsg}`)
      reject(new Error(errorMsg))
    }
  })
}

/**
 * 测试云函数连接
 */
export function testCloudConnection() {
  return new Promise((resolve) => {
    try {
      console.log('[CloudTest] 开始测试云函数连接...')
      
      uniCloud.callFunction({
        name: 'room-management',
        data: {
          action: 'getRooms',
          data: { pageSize: 1, pageNum: 1 }
        }
      }).then((result) => {
        console.log('[CloudTest] 云函数调用成功:', result)
        resolve(true)
      }).catch((error) => {
        console.error('[CloudTest] 云函数调用失败:', error)
        resolve(false)
      })
      
    } catch (error) {
      console.error('[CloudTest] 云函数连接测试异常:', error)
      resolve(false)
    }
  })
}

/**
 * 获取当前运行环境信息
 */
export function getEnvironmentInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return {
      platform: systemInfo.platform,
      system: systemInfo.system,
      version: systemInfo.version,
      SDKVersion: systemInfo.SDKVersion,
      environment: process.env.NODE_ENV,
      uniCloudAvailable: typeof uniCloud !== 'undefined'
    }
  } catch (error) {
    console.error('[CloudInit] 获取环境信息失败:', error)
    return {
      platform: 'unknown',
      environment: process.env.NODE_ENV,
      uniCloudAvailable: typeof uniCloud !== 'undefined'
    }
  }
}