'use strict';

// 获取数据库引用
const db = uniCloud.database();

// 获取集合引用
const roomsCollection = db.collection('rooms');
const tenantsCollection = db.collection('tenants');
const rentalsCollection = db.collection('rentals');
const utilityRecordsCollection = db.collection('utility_records');

// 引入业务逻辑模块
const rentalFunctions = require('./rental-functions.js');
const utilityFunctions = require('./utility-functions.js');
const maintenanceFunctions = require('./maintenance-functions.js');
const statisticsFunctions = require('./statistics-functions.js');

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      // 房间管理
      case 'getRooms':
        return await getRooms(data);
      case 'getRoomById':
        return await getRoomById(data);
      case 'addRoom':
        return await addRoom(data);
      case 'updateRoom':
        return await updateRoom(data);
      case 'deleteRoom':
        return await deleteRoom(data);
      
      // 租户管理
      case 'getTenants':
        return await rentalFunctions.getTenants(data);
      case 'addTenant':
        return await rentalFunctions.addTenant(data);
      case 'updateTenant':
        return await rentalFunctions.updateTenant(data);
      case 'deleteTenant':
        return await rentalFunctions.deleteTenant(data);
      
      // 租赁管理
      case 'createRental':
        return await rentalFunctions.createRental(data);
      case 'getRentals':
        return await rentalFunctions.getRentals(data);
      case 'getRentalsByRoom':
        return await rentalFunctions.getRentalsByRoom(data);
      case 'terminateRental':
        return await rentalFunctions.terminateRental(data);
      case 'getRentalInfo':
        return await rentalFunctions.getRentalInfo(data);
      case 'renewRental':
        return await rentalFunctions.renewRental(data);
      case 'getRentalHistory':
        return await rentalFunctions.getRentalHistory(data);
      case 'getExpiringRentals':
        return await rentalFunctions.getExpiringRentals(data);
      
      // 水电费管理
      case 'addMonthlyUtilityRecord':
        return await utilityFunctions.addMonthlyUtilityRecord(data);
      case 'getUtilityRecords':
        return await utilityFunctions.getUtilityRecords(data);
      case 'updateUtilityPayment':
        return await utilityFunctions.updateUtilityPayment(data);
      case 'getMonthlyBills':
        return await utilityFunctions.getMonthlyBills(data);
      case 'checkOverduePayments':
        return await utilityFunctions.checkOverduePayments();
      
      // 维修管理
      case 'addMaintenanceRecord':
        return await maintenanceFunctions.addMaintenanceRecord(data);
      case 'getMaintenanceRecords':
        return await maintenanceFunctions.getMaintenanceRecords(data);
      case 'updateMaintenanceRecord':
        return await maintenanceFunctions.updateMaintenanceRecord(data);
      case 'deleteMaintenanceRecord':
        return await maintenanceFunctions.deleteMaintenanceRecord(data);
      case 'getRoomMaintenanceStats':
        return await maintenanceFunctions.getRoomMaintenanceStats(data);
      case 'getExpiringWarranties':
        return await maintenanceFunctions.getExpiringWarranties(data);
      case 'getMaintenanceCostStats':
        return await maintenanceFunctions.getMaintenanceCostStats(data);
      
      // 统计功能
      case 'getIncomeStatistics':
        return await statisticsFunctions.getIncomeStatistics(data);
      case 'getRoomOccupancyStatistics':
        return await statisticsFunctions.getRoomOccupancyStatistics(data);
      case 'getIncomeTrend':
        return await statisticsFunctions.getIncomeTrend(data);
      case 'getDashboardStatistics':
        return await statisticsFunctions.getDashboardStatistics(data);
      
      // 调试功能
      case 'debugDatabase':
        return await debugDatabase(data);
      case 'fixDataInconsistencies':
        return await fixDataInconsistencies(data);
      
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return { code: -1, message: error.message };
  }
};

// 获取房间列表（包含当前租户信息）
async function getRooms(data) {
  const { status, searchKeyword, pageSize = 20, pageNum = 1 } = data || {};
  let query = roomsCollection;
  
  const conditions = {};
  
  if (status) {
    conditions.status = status;
  }
  
  if (searchKeyword) {
    // 使用正则表达式进行模糊搜索房间号
    conditions.room_number = new RegExp(searchKeyword, 'i');
  }
  
  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('room_number', 'asc')
    .get();
    
  const total = await query.count();
  
  // 获取每个房间的当前租户信息
  const roomsWithTenant = await Promise.all(result.data.map(async (room) => {
    try {
      if (room.current_rental_id) {
        console.log(`处理房间 ${room.room_number} 的租赁信息，rental_id: ${room.current_rental_id}`);
        
        // 获取租赁信息
        const rental = await rentalsCollection.doc(room.current_rental_id).get();
        if (rental.data.length > 0) {
          const rentalInfo = rental.data[0];
          console.log(`找到租赁信息，租户ID: ${rentalInfo.tenant_id}, 状态: ${rentalInfo.status}`);
          
          // 只处理活跃的租赁关系
          if (rentalInfo.status === 'active') {
            // 获取租户信息
            const tenant = await tenantsCollection.doc(rentalInfo.tenant_id).get();
            if (tenant.data.length > 0) {
              room.current_rental = rentalInfo;
              room.current_tenant = tenant.data[0];
              console.log(`成功关联租户信息: ${tenant.data[0].name}`);
            } else {
              console.warn(`租户信息不存在，租户ID: ${rentalInfo.tenant_id}`);
              // 如果租户不存在，清除无效的租赁关系
              await roomsCollection.doc(room._id).update({
                status: 'available',
                current_rental_id: null,
                update_date: new Date()
              });
              await rentalsCollection.doc(room.current_rental_id).update({
                status: 'terminated',
                termination_reason: '租户数据不存在',
                update_date: new Date()
              });
              room.status = 'available';
              room.current_rental_id = null;
            }
          } else {
            console.warn(`租赁关系非活跃状态: ${rentalInfo.status}，清理房间状态`);
            // 如果租赁关系已终止，更新房间状态
            await roomsCollection.doc(room._id).update({
              status: 'available',
              current_rental_id: null,
              update_date: new Date()
            });
            room.status = 'available';
            room.current_rental_id = null;
          }
        } else {
          console.warn(`租赁记录不存在，rental_id: ${room.current_rental_id}`);
          // 如果租赁记录不存在，清除房间的租赁ID
          await roomsCollection.doc(room._id).update({
            status: 'available',
            current_rental_id: null,
            update_date: new Date()
          });
          room.status = 'available';
          room.current_rental_id = null;
        }
      } else if (room.status === 'rented') {
        console.warn(`房间 ${room.room_number} 状态为已租用但缺少rental_id，修正状态`);
        // 如果房间状态是已租用但没有租赁ID，修正状态
        await roomsCollection.doc(room._id).update({
          status: 'available',
          update_date: new Date()
        });
        room.status = 'available';
      }
    } catch (error) {
      console.error(`处理房间 ${room.room_number} 的租户信息时出错:`, error);
    }
    return room;
  }));
  
  return {
    code: 0,
    data: {
      list: roomsWithTenant,
      total: total.total,
      pageNum,
      pageSize
    }
  };
}

// 根据ID获取房间信息
async function getRoomById(data) {
  const { id } = data;
  const result = await roomsCollection.doc(id).get();
  
  if (result.data.length === 0) {
    return { code: -1, message: '房间不存在' };
  }
  
  return { code: 0, data: result.data[0] };
}

// 新增房间
async function addRoom(data) {
  // 检查房间号是否重复
  const existRoom = await roomsCollection.where({
    room_number: data.room_number
  }).get();
  
  if (existRoom.data.length > 0) {
    return { code: -1, message: '房间号已存在' };
  }
  
  const roomData = {
    ...data,
    status: data.status || 'available',
    utilities: data.utilities || {
      electricity_reading: 0,
      water_reading: 0,
      electricity_rate: 0.5,
      water_rate: 3.0
    },
    create_date: new Date(),
    update_date: new Date()
  };
  
  const result = await roomsCollection.add(roomData);
  return { code: 0, data: result };
}

// 更新房间信息
async function updateRoom(data) {
  const { id, ...updateData } = data;
  updateData.update_date = new Date();
  
  const result = await roomsCollection.doc(id).update(updateData);
  return { code: 0, data: result };
}

// 删除房间
async function deleteRoom(data) {
  const { id } = data;
  
  // 检查房间是否有租户
  const room = await roomsCollection.doc(id).get();
  if (room.data[0].status === 'rented') {
    return { code: -1, message: '该房间有租户，无法删除' };
  }
  
  const result = await roomsCollection.doc(id).remove();
  return { code: 0, data: result };
}

// 更新租户信息
async function updateTenant(data) {
  const { roomId, tenantInfo } = data;
  
  const updateData = {
    tenant_info: tenantInfo,
    status: 'rented',
    update_date: new Date()
  };
  
  const result = await roomsCollection.doc(roomId).update(updateData);
  return { code: 0, data: result };
}

// 移除租户
async function removeTenant(data) {
  const { roomId } = data;
  
  const updateData = {
    tenant_info: null,
    status: 'available',
    update_date: new Date()
  };
  
  const result = await roomsCollection.doc(roomId).update(updateData);
  return { code: 0, data: result };
}

// 添加水电费记录
async function addUtilityRecord(data) {
  const { roomId, electricity_reading, water_reading } = data;
  
  // 获取房间信息
  const room = await roomsCollection.doc(roomId).get();
  const roomData = room.data[0];
  
  // 计算用量和费用
  const prevElectricity = roomData.utilities.electricity_reading || 0;
  const prevWater = roomData.utilities.water_reading || 0;
  
  const electricityUsage = Math.max(0, electricity_reading - prevElectricity);
  const waterUsage = Math.max(0, water_reading - prevWater);
  
  const electricityFee = electricityUsage * roomData.utilities.electricity_rate;
  const waterFee = waterUsage * roomData.utilities.water_rate;
  const totalFee = electricityFee + waterFee;
  
  // 添加记录
  const recordData = {
    room_id: roomId,
    record_date: new Date(),
    electricity_reading,
    water_reading,
    electricity_usage: electricityUsage,
    water_usage: waterUsage,
    electricity_fee: electricityFee,
    water_fee: waterFee,
    total_fee: totalFee,
    is_paid: false,
    create_date: new Date()
  };
  
  const result = await utilityRecordsCollection.add(recordData);
  
  // 更新房间的水电表读数
  await roomsCollection.doc(roomId).update({
    'utilities.electricity_reading': electricity_reading,
    'utilities.water_reading': water_reading,
    update_date: new Date()
  });
  
  return { code: 0, data: result };
}

// 获取水电费记录
async function getUtilityRecords(data) {
  const { roomId, pageSize = 20, pageNum = 1 } = data;
  
  let query = utilityRecordsCollection;
  if (roomId) {
    query = query.where({ room_id: roomId });
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('record_date', 'desc')
    .get();
    
  const total = await query.count();
  
  return {
    code: 0,
    data: {
      list: result.data,
      total: total.total,
      pageNum,
      pageSize
    }
  };
}

// 更新缴费状态
async function updateUtilityPayment(data) {
  const { recordId, isPaid } = data;
  
  const result = await utilityRecordsCollection.doc(recordId).update({
    is_paid: isPaid
  });
  
  return { code: 0, data: result };
}

// 调试数据库状态
async function debugDatabase(data) {
  try {
    // 获取所有房间数据
    const allRooms = await roomsCollection.get();
    
    // 获取所有租赁数据
    const allRentals = await rentalsCollection.get();
    
    // 获取所有租户数据
    const allTenants = await tenantsCollection.get();
    
    const debugInfo = {
      rooms: {
        total: allRooms.data.length,
        data: allRooms.data.map(room => ({
          _id: room._id,
          room_number: room.room_number,
          status: room.status,
          current_rental_id: room.current_rental_id
        }))
      },
      rentals: {
        total: allRentals.data.length,
        data: allRentals.data.map(rental => ({
          _id: rental._id,
          room_id: rental.room_id,
          tenant_id: rental.tenant_id,
          status: rental.status
        }))
      },
      tenants: {
        total: allTenants.data.length,
        data: allTenants.data.map(tenant => ({
          _id: tenant._id,
          name: tenant.name,
          status: tenant.status
        }))
      }
    };
    
    // 检查数据一致性
    const inconsistencies = [];
    
    for (let room of allRooms.data) {
      if (room.status === 'rented') {
        if (!room.current_rental_id) {
          inconsistencies.push({
            type: 'missing_rental_id',
            room_id: room._id,
            room_number: room.room_number,
            issue: '房间状态为已租用但缺少current_rental_id'
          });
        } else {
          // 检查租赁记录是否存在
          const rental = allRentals.data.find(r => r._id === room.current_rental_id);
          if (!rental) {
            inconsistencies.push({
              type: 'invalid_rental_id',
              room_id: room._id,
              room_number: room.room_number,
              current_rental_id: room.current_rental_id,
              issue: '房间的current_rental_id指向不存在的租赁记录'
            });
          } else if (rental.status !== 'active') {
            inconsistencies.push({
              type: 'inactive_rental',
              room_id: room._id,
              room_number: room.room_number,
              rental_id: rental._id,
              rental_status: rental.status,
              issue: '房间状态为已租用但租赁记录状态不是active'
            });
          }
        }
      }
    }
    
    return {
      code: 0,
      data: {
        debug_info: debugInfo,
        inconsistencies: inconsistencies
      }
    };
    
  } catch (error) {
    console.error('调试数据库失败:', error);
    return {
      code: -1,
      message: '调试失败: ' + error.message
    };
  }
}

// 修复数据不一致问题
async function fixDataInconsistencies(data) {
  try {
    console.log('开始修复数据不一致问题...');
    
    // 获取所有房间数据
    const allRooms = await roomsCollection.get();
    
    // 获取所有租赁数据
    const allRentals = await rentalsCollection.get();
    
    // 获取所有租户数据
    const allTenants = await tenantsCollection.get();
    
    const fixes = [];
    
    // 检查和修复房间状态问题
    for (let room of allRooms.data) {
      if (room.status === 'rented') {
        if (!room.current_rental_id) {
          // 房间状态为已租用但缺少rental_id
          console.log(`修复房间 ${room.room_number}: 状态为已租用但缺少rental_id`);
          await roomsCollection.doc(room._id).update({
            status: 'available',
            update_date: new Date()
          });
          fixes.push({
            type: 'room_status_fix',
            room_number: room.room_number,
            action: '将状态从已租用改为可租用（缺少rental_id）'
          });
        } else {
          // 检查租赁记录是否存在且有效
          const rental = allRentals.data.find(r => r._id === room.current_rental_id);
          if (!rental) {
            console.log(`修复房间 ${room.room_number}: 租赁记录不存在`);
            await roomsCollection.doc(room._id).update({
              status: 'available',
              current_rental_id: null,
              update_date: new Date()
            });
            fixes.push({
              type: 'invalid_rental_fix',
              room_number: room.room_number,
              action: '清除无效的rental_id，状态改为可租用'
            });
          } else if (rental.status !== 'active') {
            console.log(`修复房间 ${room.room_number}: 租赁状态非活跃 (${rental.status})`);
            await roomsCollection.doc(room._id).update({
              status: 'available',
              current_rental_id: null,
              update_date: new Date()
            });
            fixes.push({
              type: 'inactive_rental_fix',
              room_number: room.room_number,
              action: `清除非活跃租赁关系 (${rental.status})，状态改为可租用`
            });
          } else {
            // 检查租户是否存在
            const tenant = allTenants.data.find(t => t._id === rental.tenant_id);
            if (!tenant) {
              console.log(`修复房间 ${room.room_number}: 租户不存在`);
              await roomsCollection.doc(room._id).update({
                status: 'available',
                current_rental_id: null,
                update_date: new Date()
              });
              await rentalsCollection.doc(rental._id).update({
                status: 'terminated',
                termination_reason: '租户数据不存在',
                termination_date: new Date(),
                update_date: new Date()
              });
              fixes.push({
                type: 'missing_tenant_fix',
                room_number: room.room_number,
                action: '终止租赁关系（租户不存在），状态改为可租用'
              });
            }
          }
        }
      }
    }
    
    // 检查孤立的租赁记录
    for (let rental of allRentals.data) {
      if (rental.status === 'active') {
        const room = allRooms.data.find(r => r._id === rental.room_id);
        if (!room) {
          console.log(`修复孤立租赁记录: 房间不存在，租赁ID ${rental._id}`);
          await rentalsCollection.doc(rental._id).update({
            status: 'terminated',
            termination_reason: '房间数据不存在',
            termination_date: new Date(),
            update_date: new Date()
          });
          fixes.push({
            type: 'orphaned_rental_fix',
            rental_id: rental._id,
            action: '终止孤立租赁记录（房间不存在）'
          });
        } else if (room.current_rental_id !== rental._id) {
          console.log(`修复不匹配的租赁关系: 房间 ${room.room_number}`);
          if (room.status === 'rented' && room.current_rental_id) {
            // 房间已有其他租赁关系，终止当前这个
            await rentalsCollection.doc(rental._id).update({
              status: 'terminated',
              termination_reason: '房间已有其他租赁关系',
              termination_date: new Date(),
              update_date: new Date()
            });
            fixes.push({
              type: 'duplicate_rental_fix',
              room_number: room.room_number,
              action: '终止重复的租赁记录'
            });
          } else {
            // 更新房间的租赁关系
            await roomsCollection.doc(room._id).update({
              status: 'rented',
              current_rental_id: rental._id,
              update_date: new Date()
            });
            fixes.push({
              type: 'rental_link_fix',
              room_number: room.room_number,
              action: '修复房间和租赁关系的关联'
            });
          }
        }
      }
    }
    
    console.log(`修复完成，共处理 ${fixes.length} 个问题`);
    
    return {
      code: 0,
      data: {
        fixes_applied: fixes.length,
        fixes: fixes
      },
      message: `修复完成，共处理 ${fixes.length} 个数据不一致问题`
    };
    
  } catch (error) {
    console.error('修复数据不一致失败:', error);
    return {
      code: -1,
      message: '修复失败: ' + error.message
    };
  }
}