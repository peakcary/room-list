/**
 * 云函数调用包装器
 * 解决体验版云函数调用问题
 */

import { initUniCloud } from './cloud-init.js'

/**
 * 安全的云函数调用
 * @param {string} functionName 云函数名称
 * @param {object} data 调用参数
 * @param {object} options 选项
 */
export async function callCloudFunction(functionName, data, options = {}) {
  const { retryCount = 2, timeout = 10000 } = options
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      console.log(`[CloudAPI] 调用云函数: ${functionName}, 尝试次数: ${i + 1}`)
      
      // 确保 uniCloud 已初始化
      if (typeof uniCloud === 'undefined') {
        console.warn('[CloudAPI] uniCloud 未定义，尝试重新初始化')
        await initUniCloud(true)
      }
      
      // 调用云函数
      const result = await Promise.race([
        uniCloud.callFunction({
          name: functionName,
          data: data
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('调用超时')), timeout)
        })
      ])
      
      console.log(`[CloudAPI] 云函数调用成功:`, result)
      return result
      
    } catch (error) {
      console.error(`[CloudAPI] 云函数调用失败 (尝试 ${i + 1}/${retryCount + 1}):`, error)
      
      // 最后一次尝试失败
      if (i === retryCount) {
        throw new Error(`云函数调用失败: ${error.message}`)
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      
      // 重新初始化 uniCloud
      try {
        await initUniCloud(true)
      } catch (initError) {
        console.error('[CloudAPI] 重新初始化失败:', initError)
      }
    }
  }
}

/**
 * 房间管理 API
 */
export const roomAPI = {
  // 获取房间列表
  async getRooms(params = {}) {
    return await callCloudFunction('room-management', {
      action: 'getRooms',
      data: params
    })
  },
  
  // 根据ID获取房间
  async getRoomById(id) {
    return await callCloudFunction('room-management', {
      action: 'getRoomById',
      data: { id }
    })
  },
  
  // 添加房间
  async addRoom(roomData) {
    return await callCloudFunction('room-management', {
      action: 'addRoom',
      data: roomData
    })
  },
  
  // 更新房间
  async updateRoom(roomData) {
    return await callCloudFunction('room-management', {
      action: 'updateRoom',
      data: roomData
    })
  },
  
  // 删除房间
  async deleteRoom(id) {
    return await callCloudFunction('room-management', {
      action: 'deleteRoom',
      data: { id }
    })
  }
}

/**
 * 租赁管理 API
 */
export const rentalAPI = {
  // 创建租赁
  async createRental(rentalData) {
    return await callCloudFunction('room-management', {
      action: 'createRental',
      data: rentalData
    })
  },
  
  // 获取租赁列表
  async getRentals(params = {}) {
    return await callCloudFunction('room-management', {
      action: 'getRentals',
      data: params
    })
  },
  
  // 终止租赁
  async terminateRental(rentalData) {
    return await callCloudFunction('room-management', {
      action: 'terminateRental',
      data: rentalData
    })
  },
  
  // 续租
  async renewRental(rentalData) {
    return await callCloudFunction('room-management', {
      action: 'renewRental',
      data: rentalData
    })
  }
}

/**
 * 调试 API
 */
export const debugAPI = {
  // 调试数据库
  async debugDatabase() {
    return await callCloudFunction('room-management', {
      action: 'debugDatabase',
      data: {}
    })
  },
  
  // 修复数据不一致
  async fixDataInconsistencies() {
    return await callCloudFunction('room-management', {
      action: 'fixDataInconsistencies',
      data: {}
    })
  }
}