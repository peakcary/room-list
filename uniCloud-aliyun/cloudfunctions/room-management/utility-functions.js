// 水电费管理业务逻辑函数

const db = uniCloud.database();
const roomsCollection = db.collection('rooms');
const tenantsCollection = db.collection('tenants');
const rentalsCollection = db.collection('rentals');
const utilityRecordsCollection = db.collection('utility_records');

// ========== 月度水电费管理 ==========

// 添加月度水电费记录
async function addMonthlyUtilityRecord(data) {
  const { rental_id, billing_year, billing_month, electricity_reading, water_reading, record_date, notes } = data;
  
  // 获取租赁信息
  const rental = await rentalsCollection.doc(rental_id).get();
  if (rental.data.length === 0) {
    return { code: -1, message: '租赁关系不存在' };
  }
  
  const rentalInfo = rental.data[0];
  if (rentalInfo.status !== 'active') {
    return { code: -1, message: '租赁关系已终止' };
  }
  
  // 检查该月是否已有记录
  const existRecord = await utilityRecordsCollection.where({
    rental_id,
    billing_year,
    billing_month
  }).get();
  
  if (existRecord.data.length > 0) {
    return { code: -1, message: `${billing_year}年${billing_month}月的水电费记录已存在` };
  }
  
  // 获取房间信息（水电单价）
  const room = await roomsCollection.doc(rentalInfo.room_id).get();
  const roomInfo = room.data[0];
  const electricityRate = roomInfo.utilities?.electricity_rate || 0.5;
  const waterRate = roomInfo.utilities?.water_rate || 3.0;
  
  // 获取上月读数
  let previousElectricityReading = rentalInfo.electricity_start_reading;
  let previousWaterReading = rentalInfo.water_start_reading;
  
  // 查找上个月的记录
  const prevMonth = billing_month === 1 ? 12 : billing_month - 1;
  const prevYear = billing_month === 1 ? billing_year - 1 : billing_year;
  
  const previousRecord = await utilityRecordsCollection.where({
    rental_id,
    billing_year: prevYear,
    billing_month: prevMonth
  }).get();
  
  if (previousRecord.data.length > 0) {
    previousElectricityReading = previousRecord.data[0].electricity_reading;
    previousWaterReading = previousRecord.data[0].water_reading;
  }
  
  // 计算用量和费用
  const electricityUsage = Math.max(0, (electricity_reading || 0) - previousElectricityReading);
  const waterUsage = Math.max(0, (water_reading || 0) - previousWaterReading);
  
  const electricityFee = electricityUsage * electricityRate;
  const waterFee = waterUsage * waterRate;
  const totalFee = electricityFee + waterFee;
  
  // 计算应缴费日期（默认下个月5号）
  const nextMonth = billing_month === 12 ? 1 : billing_month + 1;
  const nextYear = billing_month === 12 ? billing_year + 1 : billing_year;
  const dueDate = new Date(nextYear, nextMonth - 1, 5); // 月份从0开始
  
  // 创建水电费记录
  const recordData = {
    rental_id,
    room_id: rentalInfo.room_id,
    tenant_id: rentalInfo.tenant_id,
    billing_year,
    billing_month,
    record_date: new Date(record_date),
    electricity_reading: electricity_reading || 0,
    water_reading: water_reading || 0,
    previous_electricity_reading: previousElectricityReading,
    previous_water_reading: previousWaterReading,
    electricity_usage: electricityUsage,
    water_usage: waterUsage,
    electricity_fee: electricityFee,
    water_fee: waterFee,
    total_fee: totalFee,
    payment_status: 'unpaid',
    due_date: dueDate,
    notes: notes || '',
    create_date: new Date()
  };
  
  const result = await utilityRecordsCollection.add(recordData);
  
  // 更新房间的当前读数
  await roomsCollection.doc(rentalInfo.room_id).update({
    'utilities.electricity_reading': electricity_reading || 0,
    'utilities.water_reading': water_reading || 0,
    update_date: new Date()
  });
  
  return { code: 0, data: { record_id: result.id, total_fee: totalFee } };
}

// 获取水电费记录列表
async function getUtilityRecords(data) {
  const { rental_id, room_id, tenant_id, billing_year, payment_status, pageSize = 20, pageNum = 1 } = data || {};
  
  let query = utilityRecordsCollection;
  const conditions = {};
  
  if (rental_id) conditions.rental_id = rental_id;
  if (room_id) conditions.room_id = room_id;
  if (tenant_id) conditions.tenant_id = tenant_id;
  if (billing_year) conditions.billing_year = billing_year;
  if (payment_status) conditions.payment_status = payment_status;
  
  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }
  
  const result = await query
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .orderBy('billing_year', 'desc')
    .orderBy('billing_month', 'desc')
    .get();
    
  const total = await query.count();
  
  // 关联房间和租户信息
  const recordsWithInfo = await Promise.all(result.data.map(async (record) => {
    // 获取房间信息
    const room = await roomsCollection.doc(record.room_id).get();
    if (room.data.length > 0) {
      record.room_info = room.data[0];
    }
    
    // 获取租户信息
    const tenant = await tenantsCollection.doc(record.tenant_id).get();
    if (tenant.data.length > 0) {
      record.tenant_info = tenant.data[0];
    }
    
    // 获取租赁信息
    const rental = await rentalsCollection.doc(record.rental_id).get();
    if (rental.data.length > 0) {
      record.rental_info = rental.data[0];
    }
    
    return record;
  }));
  
  return {
    code: 0,
    data: {
      list: recordsWithInfo,
      total: total.total,
      pageNum,
      pageSize
    }
  };
}

// 更新缴费状态
async function updateUtilityPayment(data) {
  const { record_id, payment_status, payment_date } = data;
  
  const updateData = {
    payment_status,
    update_date: new Date()
  };
  
  if (payment_status === 'paid' && payment_date) {
    updateData.payment_date = new Date(payment_date);
  }
  
  const result = await utilityRecordsCollection.doc(record_id).update(updateData);
  return { code: 0, data: result };
}

// 获取月度账单汇总
async function getMonthlyBills(data) {
  const { rental_id, billing_year, billing_month } = data;
  
  let query = utilityRecordsCollection;
  const conditions = {};
  
  if (rental_id) conditions.rental_id = rental_id;
  if (billing_year) conditions.billing_year = billing_year;
  if (billing_month) conditions.billing_month = billing_month;
  
  if (Object.keys(conditions).length > 0) {
    query = query.where(conditions);
  }
  
  const result = await query.get();
  
  // 计算汇总信息
  const summary = {
    total_records: result.data.length,
    total_amount: 0,
    paid_amount: 0,
    unpaid_amount: 0,
    overdue_amount: 0,
    paid_count: 0,
    unpaid_count: 0,
    overdue_count: 0
  };
  
  const now = new Date();
  
  result.data.forEach(record => {
    summary.total_amount += record.total_fee;
    
    if (record.payment_status === 'paid') {
      summary.paid_amount += record.total_fee;
      summary.paid_count++;
    } else if (record.payment_status === 'overdue' || (record.due_date && new Date(record.due_date) < now)) {
      summary.overdue_amount += record.total_fee;
      summary.overdue_count++;
    } else {
      summary.unpaid_amount += record.total_fee;
      summary.unpaid_count++;
    }
  });
  
  return {
    code: 0,
    data: {
      summary,
      records: result.data
    }
  };
}

// 检查并更新逾期状态
async function checkOverduePayments() {
  const now = new Date();
  
  // 查找所有未缴费且已过期的记录
  const overdueRecords = await utilityRecordsCollection.where({
    payment_status: 'unpaid',
    due_date: db.command.lt(now)
  }).get();
  
  // 批量更新为逾期状态
  const updatePromises = overdueRecords.data.map(record => {
    return utilityRecordsCollection.doc(record._id).update({
      payment_status: 'overdue'
    });
  });
  
  await Promise.all(updatePromises);
  
  return {
    code: 0,
    message: `更新了${overdueRecords.data.length}條逾期记录`
  };
}

module.exports = {
  addMonthlyUtilityRecord,
  getUtilityRecords,
  updateUtilityPayment,
  getMonthlyBills,
  checkOverduePayments
};