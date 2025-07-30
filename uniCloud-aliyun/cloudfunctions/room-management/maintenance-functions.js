// 维修管理相关业务逻辑函数

const db = uniCloud.database();
const roomsCollection = db.collection('rooms');
const maintenanceRecordsCollection = db.collection('maintenance_records');

// ========== 维修记录管理 ==========

// 添加维修记录
async function addMaintenanceRecord(data) {
  const { roomId, amount, description } = data;
  
  // 检查房间是否存在
  const room = await roomsCollection.doc(roomId).get();
  if (room.data.length === 0) {
    return { code: -1, message: '房间不存在' };
  }
  
  const maintenanceData = {
    room_id: roomId,
    maintenance_date: new Date(),
    maintenance_type: 'general', // 简化为通用类型
    description,
    cost: parseFloat(amount),
    amount: parseFloat(amount), // 添加amount字段以兼容UI
    maintenance_company: '',
    contact_phone: '',
    warranty_period: 0,
    warranty_end_date: null,
    status: 'completed', // 默认为已完成
    notes: '',
    create_date: new Date(),
    update_date: new Date()
  };
  
  const result = await maintenanceRecordsCollection.add(maintenanceData);
  return { code: 0, data: { maintenance_id: result.id } };
}

// 获取维修记录列表
async function getMaintenanceRecords(data) {
  const { roomId, room_id, status, maintenance_type, pageSize = 20, pageNum = 1 } = data || {};
  let query = maintenanceRecordsCollection;
  
  const conditions = {};
  
  // 支持roomId和room_id两种参数
  const targetRoomId = roomId || room_id;
  if (targetRoomId) {
    conditions.room_id = targetRoomId;
  }
  
  if (status) {
    conditions.status = status;
  }
  
  if (maintenance_type) {
    conditions.maintenance_type = maintenance_type;
  }
  
  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('maintenance_date', 'desc')
    .get();
    
  const total = await query.count();
  
  // 简化返回，不需要房间信息
  return {
    code: 0,
    data: result.data
  };
}

// 更新维修记录
async function updateMaintenanceRecord(data) {
  const { id, ...updateData } = data;
  
  // 如果更新了保修期，重新计算保修到期日期
  if (updateData.warranty_period && updateData.maintenance_date) {
    const maintenanceDate = new Date(updateData.maintenance_date);
    const warrantyEndDate = new Date(maintenanceDate);
    warrantyEndDate.setDate(warrantyEndDate.getDate() + updateData.warranty_period);
    updateData.warranty_end_date = warrantyEndDate;
  }
  
  updateData.update_date = new Date();
  
  const result = await maintenanceRecordsCollection.doc(id).update(updateData);
  return { code: 0, data: result };
}

// 删除维修记录
async function deleteMaintenanceRecord(data) {
  const { id } = data;
  
  const result = await maintenanceRecordsCollection.doc(id).remove();
  return { code: 0, data: result };
}

// 获取房间维修统计
async function getRoomMaintenanceStats(data) {
  const { room_id, year } = data;
  
  let query = maintenanceRecordsCollection.where({ room_id });
  
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    query = query.where({
      room_id,
      maintenance_date: db.command.gte(startDate).and(db.command.lte(endDate))
    });
  }
  
  const records = await query.orderBy('maintenance_date', 'desc').get();
  
  // 计算统计信息
  const totalCost = records.data.reduce((sum, record) => sum + (record.cost || 0), 0);
  const recordCount = records.data.length;
  
  // 按维修类型分组统计
  const typeStats = {};
  records.data.forEach(record => {
    const type = record.maintenance_type;
    if (!typeStats[type]) {
      typeStats[type] = { count: 0, cost: 0 };
    }
    typeStats[type].count++;
    typeStats[type].cost += record.cost || 0;
  });
  
  // 按月份统计（如果指定了年份）
  const monthlyStats = {};
  if (year) {
    for (let month = 1; month <= 12; month++) {
      monthlyStats[month] = { count: 0, cost: 0 };
    }
    
    records.data.forEach(record => {
      const month = new Date(record.maintenance_date).getMonth() + 1;
      monthlyStats[month].count++;
      monthlyStats[month].cost += record.cost || 0;
    });
  }
  
  return {
    code: 0,
    data: {
      totalCost,
      recordCount,
      typeStats,
      monthlyStats: year ? monthlyStats : null,
      records: records.data
    }
  };
}

// 获取即将到期的保修记录
async function getExpiringWarranties(data) {
  const { days_ahead = 30 } = data || {};
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days_ahead);
  
  const expiringWarranties = await maintenanceRecordsCollection
    .where({
      warranty_end_date: db.command.gte(now).and(db.command.lte(futureDate)),
      status: db.command.neq('warranty_expired')
    })
    .orderBy('warranty_end_date', 'asc')
    .get();
  
  // 获取房间信息
  const warrantiesWithRoom = await Promise.all(expiringWarranties.data.map(async (warranty) => {
    const room = await roomsCollection.doc(warranty.room_id).get();
    if (room.data.length > 0) {
      warranty.room_info = room.data[0];
    }
    return warranty;
  }));
  
  return {
    code: 0,
    data: {
      list: warrantiesWithRoom,
      total: warrantiesWithRoom.length
    }
  };
}

// 获取维修费用统计（用于收入统计）
async function getMaintenanceCostStats(data) {
  const { start_date, end_date, room_id } = data || {};
  
  let query = maintenanceRecordsCollection;
  const conditions = {};
  
  if (room_id) {
    conditions.room_id = room_id;
  }
  
  if (start_date && end_date) {
    conditions.maintenance_date = db.command.gte(new Date(start_date)).and(db.command.lte(new Date(end_date)));
  }
  
  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }
  
  const records = await query.get();
  
  const totalCost = records.data.reduce((sum, record) => sum + (record.cost || 0), 0);
  
  // 按房间分组统计
  const roomStats = {};
  records.data.forEach(record => {
    const roomId = record.room_id;
    if (!roomStats[roomId]) {
      roomStats[roomId] = { count: 0, cost: 0, records: [] };
    }
    roomStats[roomId].count++;
    roomStats[roomId].cost += record.cost || 0;
    roomStats[roomId].records.push(record);
  });
  
  // 按类型分组统计
  const typeStats = {};
  records.data.forEach(record => {
    const type = record.maintenance_type;
    if (!typeStats[type]) {
      typeStats[type] = { count: 0, cost: 0 };
    }
    typeStats[type].count++;
    typeStats[type].cost += record.cost || 0;
  });
  
  return {
    code: 0,
    data: {
      totalCost,
      recordCount: records.data.length,
      roomStats,
      typeStats,
      records: records.data
    }
  };
}

module.exports = {
  addMaintenanceRecord,
  getMaintenanceRecords,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getRoomMaintenanceStats,
  getExpiringWarranties,
  getMaintenanceCostStats
};