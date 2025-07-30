// 租赁相关业务逻辑函数

const db = uniCloud.database();
const roomsCollection = db.collection('rooms');
const tenantsCollection = db.collection('tenants');
const rentalsCollection = db.collection('rentals');
const utilityRecordsCollection = db.collection('utility_records');

// ========== 租户管理 ==========

// 获取租户列表
async function getTenants(data) {
  const { status, pageSize = 20, pageNum = 1 } = data || {};
  let query = tenantsCollection;
  
  if (status) {
    query = query.where({ status });
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('create_date', 'desc')
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

// 添加租户
async function addTenant(data) {
  // 检查身份证号是否重复
  const existTenant = await tenantsCollection.where({
    id_card: data.id_card
  }).get();
  
  if (existTenant.data.length > 0) {
    return { code: -1, message: '该身份证号已存在' };
  }
  
  
  const tenantData = {
    ...data,
    status: data.status || 'active',
    create_date: new Date()
  };
  
  const result = await tenantsCollection.add(tenantData);
  return { code: 0, data: result };
}

// 更新租户信息
async function updateTenant(data) {
  const { id, ...updateData } = data;
  
  // 如果更新身份证号，检查是否重复
  if (updateData.id_card) {
    const existTenant = await tenantsCollection.where({
      id_card: updateData.id_card,
      _id: db.command.neq(id)
    }).get();
    
    if (existTenant.data.length > 0) {
      return { code: -1, message: '该身份证号已存在' };
    }
  }
  
  const result = await tenantsCollection.doc(id).update(updateData);
  return { code: 0, data: result };
}

// 删除租户
async function deleteTenant(data) {
  const { id } = data;
  
  // 检查是否有活跃的租赁关系
  const activeRentals = await rentalsCollection.where({
    tenant_id: id,
    status: 'active'
  }).get();
  
  if (activeRentals.data.length > 0) {
    return { code: -1, message: '该租户有活跃的租赁关系，无法删除' };
  }
  
  const result = await tenantsCollection.doc(id).remove();
  return { code: 0, data: result };
}

// ========== 租赁关系管理 ==========

// 创建租赁关系
async function createRental(data) {
  const { room_id, tenant_id, rent_price, deposit, rent_start_date, rent_end_date, utilities_included, electricity_start_reading, water_start_reading, contract_notes } = data;
  
  // 检查房间是否可租
  const room = await roomsCollection.doc(room_id).get();
  if (room.data.length === 0) {
    return { code: -1, message: '房间不存在' };
  }
  
  if (room.data[0].status !== 'available') {
    return { code: -1, message: '房间不可租用' };
  }
  
  // 检查租户是否存在
  const tenant = await tenantsCollection.doc(tenant_id).get();
  if (tenant.data.length === 0) {
    return { code: -1, message: '租户不存在' };
  }
  
  // 检查租户是否已有活跃租赁
  const existRental = await rentalsCollection.where({
    tenant_id,
    status: 'active'
  }).get();
  
  if (existRental.data.length > 0) {
    return { code: -1, message: '该租户已有活跃租赁关系' };
  }
  
  // 创建租赁关系
  const rentalData = {
    room_id,
    tenant_id,
    rent_price,
    deposit: deposit || 0,
    rent_start_date: new Date(rent_start_date),
    rent_end_date: new Date(rent_end_date),
    status: 'active',
    utilities_included: utilities_included || false,
    electricity_start_reading: electricity_start_reading || 0,
    water_start_reading: water_start_reading || 0,
    contract_notes: contract_notes || '',
    create_date: new Date(),
    update_date: new Date()
  };
  
  const rentalResult = await rentalsCollection.add(rentalData);
  
  // 更新房间状态
  await roomsCollection.doc(room_id).update({
    status: 'rented',
    current_rental_id: rentalResult.id,
    update_date: new Date()
  });
  
  // 水电读数已经记录在租赁记录中，不需要在房间中单独存储
  
  return { code: 0, data: { rental_id: rentalResult.id } };
}

// 获取租赁关系列表
async function getRentals(data) {
  const { status, pageSize = 20, pageNum = 1 } = data || {};
  let query = rentalsCollection;
  
  if (status) {
    query = query.where({ status });
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('create_date', 'desc')
    .get();
    
  const total = await query.count();
  
  // 关联房间和租户信息
  const rentalsWithInfo = await Promise.all(result.data.map(async (rental) => {
    // 获取房间信息
    const room = await roomsCollection.doc(rental.room_id).get();
    if (room.data.length > 0) {
      rental.room_info = room.data[0];
    }
    
    // 获取租户信息
    const tenant = await tenantsCollection.doc(rental.tenant_id).get();
    if (tenant.data.length > 0) {
      rental.tenant_info = tenant.data[0];
    }
    
    return rental;
  }));
  
  return {
    code: 0,
    data: {
      list: rentalsWithInfo,
      total: total.total,
      pageNum,
      pageSize
    }
  };
}

// 根据房间获取租赁历史
async function getRentalsByRoom(data) {
  const { room_id } = data;
  
  const result = await rentalsCollection.where({
    room_id
  }).orderBy('create_date', 'desc').get();
  
  // 关联租户信息
  const rentalsWithTenant = await Promise.all(result.data.map(async (rental) => {
    const tenant = await tenantsCollection.doc(rental.tenant_id).get();
    if (tenant.data.length > 0) {
      rental.tenant_info = tenant.data[0];
    }
    return rental;
  }));
  
  return { code: 0, data: rentalsWithTenant };
}

// 终止租赁关系
async function terminateRental(data) {
  const { rental_id, termination_reason } = data;
  
  // 获取租赁信息
  const rental = await rentalsCollection.doc(rental_id).get();
  if (rental.data.length === 0) {
    return { code: -1, message: '租赁关系不存在' };
  }
  
  const rentalInfo = rental.data[0];
  
  // 更新租赁状态
  await rentalsCollection.doc(rental_id).update({
    status: 'terminated',
    termination_date: new Date(),
    termination_reason: termination_reason || '',
    update_date: new Date()
  });
  
  // 更新房间状态
  await roomsCollection.doc(rentalInfo.room_id).update({
    status: 'available',
    current_rental_id: null,
    update_date: new Date()
  });
  
  return { code: 0, message: '租赁关系已终止' };
}

// 获取租赁详情
async function getRentalInfo(data) {
  const { rental_id } = data;
  
  const rental = await rentalsCollection.doc(rental_id).get();
  if (rental.data.length === 0) {
    return { code: -1, message: '租赁关系不存在' };
  }
  
  const rentalInfo = rental.data[0];
  
  // 获取房间信息
  const room = await roomsCollection.doc(rentalInfo.room_id).get();
  if (room.data.length > 0) {
    rentalInfo.room_info = room.data[0];
  }
  
  // 获取租户信息
  const tenant = await tenantsCollection.doc(rentalInfo.tenant_id).get();
  if (tenant.data.length > 0) {
    rentalInfo.tenant_info = tenant.data[0];
  }
  
  return { code: 0, data: rentalInfo };
}

// 续租功能
async function renewRental(data) {
  const { 
    rental_id, 
    new_rent_end_date, 
    new_rent_price, 
    electricity_reading, 
    water_reading,
    contract_notes 
  } = data;
  
  // 获取当前租赁信息
  const currentRental = await rentalsCollection.doc(rental_id).get();
  if (currentRental.data.length === 0) {
    return { code: -1, message: '租赁关系不存在' };
  }
  
  const rentalInfo = currentRental.data[0];
  
  // 检查租赁是否为活跃状态
  if (rentalInfo.status !== 'active') {
    return { code: -1, message: '只有活跃的租赁关系才能续租' };
  }
  
  // 获取房间信息
  const room = await roomsCollection.doc(rentalInfo.room_id).get();
  if (room.data.length === 0) {
    return { code: -1, message: '房间不存在' };
  }
  
  const roomInfo = room.data[0];
  
  try {
    // 结束当前租赁
    await rentalsCollection.doc(rental_id).update({
      status: 'completed',
      actual_end_date: new Date(),
      update_date: new Date()
    });
    
    // 创建新的续租记录
    const renewalData = {
      room_id: rentalInfo.room_id,
      tenant_id: rentalInfo.tenant_id,
      rent_price: new_rent_price || rentalInfo.rent_price,
      deposit: rentalInfo.deposit, // 续租时通常不需要重新交押金
      rent_start_date: new Date(), // 续租开始日期为当前日期
      rent_end_date: new Date(new_rent_end_date),
      status: 'active',
      utilities_included: rentalInfo.utilities_included,
      electricity_start_reading: electricity_reading || 0,
      water_start_reading: water_reading || 0,
      contract_notes: contract_notes || `续租合同 - 原租赁ID: ${rental_id}`,
      is_renewal: true,
      previous_rental_id: rental_id,
      renewal_date: new Date(),
      electricity_renewal_reading: electricity_reading || 0,
      water_renewal_reading: water_reading || 0,
      create_date: new Date(),
      update_date: new Date()
    };
    
    const newRentalResult = await rentalsCollection.add(renewalData);
    
    // 更新房间的当前租赁ID
    await roomsCollection.doc(rentalInfo.room_id).update({
      current_rental_id: newRentalResult.id,
      update_date: new Date()
    });
    
    return { 
      code: 0, 
      message: '续租成功',
      data: { 
        new_rental_id: newRentalResult.id,
        previous_rental_id: rental_id
      }
    };
    
  } catch (error) {
    console.error('续租失败:', error);
    return { code: -1, message: '续租操作失败: ' + error.message };
  }
}

// 获取房间的租赁历史
async function getRentalHistory(data) {
  const { room_id, roomId } = data;
  const targetRoomId = roomId || room_id; // 支持两种参数名
  
  if (!targetRoomId) {
    return { code: -1, message: '房间ID不能为空' };
  }
  
  const rentals = await rentalsCollection
    .where({ room_id: targetRoomId })
    .orderBy('create_date', 'desc')
    .get();
  
  // 获取租户信息
  const rentalsWithTenant = await Promise.all(rentals.data.map(async (rental) => {
    const tenant = await tenantsCollection.doc(rental.tenant_id).get();
    if (tenant.data.length > 0) {
      rental.tenant_info = tenant.data[0];
    }
    return rental;
  }));
  
  return {
    code: 0,
    data: rentalsWithTenant
  };
}

// 检查即将到期的租赁
async function getExpiringRentals(data) {
  const { days_ahead = 30 } = data || {};
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days_ahead);
  
  const expiringRentals = await rentalsCollection
    .where({
      status: 'active',
      rent_end_date: db.command.lte(futureDate)
    })
    .orderBy('rent_end_date', 'asc')
    .get();
  
  // 获取房间和租户信息
  const rentalsWithInfo = await Promise.all(expiringRentals.data.map(async (rental) => {
    // 获取房间信息
    const room = await roomsCollection.doc(rental.room_id).get();
    if (room.data.length > 0) {
      rental.room_info = room.data[0];
    }
    
    // 获取租户信息
    const tenant = await tenantsCollection.doc(rental.tenant_id).get();
    if (tenant.data.length > 0) {
      rental.tenant_info = tenant.data[0];
    }
    
    return rental;
  }));
  
  return {
    code: 0,
    data: {
      list: rentalsWithInfo,
      total: rentalsWithInfo.length
    }
  };
}

module.exports = {
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  createRental,
  getRentals,
  getRentalsByRoom,
  terminateRental,
  getRentalInfo,
  renewRental,
  getRentalHistory,
  getExpiringRentals
};