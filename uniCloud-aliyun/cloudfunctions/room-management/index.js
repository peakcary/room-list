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
    if (room.current_rental_id) {
      // 获取租赁信息
      const rental = await rentalsCollection.doc(room.current_rental_id).get();
      if (rental.data.length > 0) {
        const rentalInfo = rental.data[0];
        // 获取租户信息
        const tenant = await tenantsCollection.doc(rentalInfo.tenant_id).get();
        if (tenant.data.length > 0) {
          room.current_rental = rentalInfo;
          room.current_tenant = tenant.data[0];
        }
      }
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