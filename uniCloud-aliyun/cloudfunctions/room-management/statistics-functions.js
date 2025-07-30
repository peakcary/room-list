// 统计相关业务逻辑函数

const db = uniCloud.database();
const roomsCollection = db.collection('rooms');
const rentalsCollection = db.collection('rentals');
const utilityRecordsCollection = db.collection('utility_records');
const maintenanceRecordsCollection = db.collection('maintenance_records');

// ========== 收入统计 ==========

// 获取收入统计数据
async function getIncomeStatistics(data) {
  const { year, month, type = 'monthly' } = data || {};
  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month || (currentDate.getMonth() + 1);
  
  try {
    let incomeData = {};
    
    if (type === 'monthly') {
      // 按月统计
      incomeData = await getMonthlyIncomeStatistics(targetYear, targetMonth);
    } else if (type === 'yearly') {
      // 按年统计
      incomeData = await getYearlyIncomeStatistics(targetYear);
    }
    
    return {
      code: 0,
      data: incomeData
    };
  } catch (error) {
    console.error('获取收入统计失败:', error);
    return {
      code: -1,
      message: '获取收入统计失败: ' + error.message
    };
  }
}

// 获取月度收入统计
async function getMonthlyIncomeStatistics(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  // 1. 租金收入 - 统计当月活跃的租赁关系
  const activeRentals = await rentalsCollection
    .where({
      status: 'active',
      rent_start_date: db.command.lte(endDate),
      rent_end_date: db.command.gte(startDate)
    })
    .get();
  
  const rentIncome = activeRentals.data.reduce((sum, rental) => {
    // 计算租赁在当月的天数占比
    const rentalStart = new Date(Math.max(new Date(rental.rent_start_date), startDate));
    const rentalEnd = new Date(Math.min(new Date(rental.rent_end_date), endDate));
    const daysInMonth = new Date(year, month, 0).getDate();
    const rentalDays = Math.ceil((rentalEnd - rentalStart) / (1000 * 60 * 60 * 24)) + 1;
    const ratio = Math.min(rentalDays / daysInMonth, 1);
    
    return sum + (rental.rent_price * ratio);
  }, 0);
  
  // 2. 水电费收入
  const utilityIncome = await utilityRecordsCollection
    .where({
      billing_year: year,
      billing_month: month,
      payment_status: 'paid'
    })
    .get();
  
  const totalUtilityIncome = utilityIncome.data.reduce((sum, record) => {
    return sum + (record.total_fee || 0);
  }, 0);
  
  // 3. 维修费用（支出）
  const maintenanceExpenses = await maintenanceRecordsCollection
    .where({
      maintenance_date: db.command.gte(startDate).and(db.command.lte(endDate))
    })
    .get();
  
  const totalMaintenanceExpenses = maintenanceExpenses.data.reduce((sum, record) => {
    return sum + (record.cost || record.amount || 0);
  }, 0);
  
  // 4. 计算净收入
  const totalIncome = rentIncome + totalUtilityIncome;
  const netIncome = totalIncome - totalMaintenanceExpenses;
  
  return {
    period: `${year}年${month}月`,
    rent_income: Math.round(rentIncome * 100) / 100,
    utility_income: Math.round(totalUtilityIncome * 100) / 100,
    maintenance_expenses: Math.round(totalMaintenanceExpenses * 100) / 100,
    total_income: Math.round(totalIncome * 100) / 100,
    net_income: Math.round(netIncome * 100) / 100,
    active_rentals_count: activeRentals.data.length,
    utility_records_count: utilityIncome.data.length,
    maintenance_records_count: maintenanceExpenses.data.length
  };
}

// 获取年度收入统计
async function getYearlyIncomeStatistics(year) {
  const monthlyData = [];
  let yearTotals = {
    rent_income: 0,
    utility_income: 0,
    maintenance_expenses: 0,
    total_income: 0,
    net_income: 0
  };
  
  // 获取每个月的统计数据
  for (let month = 1; month <= 12; month++) {
    const monthData = await getMonthlyIncomeStatistics(year, month);
    monthlyData.push({
      month: month,
      ...monthData
    });
    
    // 累计年度总计
    yearTotals.rent_income += monthData.rent_income;
    yearTotals.utility_income += monthData.utility_income;
    yearTotals.maintenance_expenses += monthData.maintenance_expenses;
    yearTotals.total_income += monthData.total_income;
    yearTotals.net_income += monthData.net_income;
  }
  
  // 四舍五入年度总计
  Object.keys(yearTotals).forEach(key => {
    yearTotals[key] = Math.round(yearTotals[key] * 100) / 100;
  });
  
  return {
    period: `${year}年`,
    monthly_data: monthlyData,
    year_totals: yearTotals
  };
}

// ========== 房间出租统计 ==========

// 获取房间出租统计
async function getRoomOccupancyStatistics(data) {
  try {
    // 1. 获取所有房间基本统计
    const allRooms = await roomsCollection.get();
    const totalRooms = allRooms.data.length;
    
    const roomStats = {
      available: 0,
      rented: 0,
      maintenance: 0
    };
    
    allRooms.data.forEach(room => {
      roomStats[room.status] = (roomStats[room.status] || 0) + 1;
    });
    
    // 计算出租率
    const occupancyRate = totalRooms > 0 ? Math.round((roomStats.rented / totalRooms) * 100) : 0;
    
    // 2. 获取当月新增租赁
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    const newRentalsThisMonth = await rentalsCollection
      .where({
        create_date: db.command.gte(monthStart).and(db.command.lte(monthEnd))
      })
      .get();
    
    // 3. 获取即将到期的租赁（30天内）
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const expiringRentals = await rentalsCollection
      .where({
        status: 'active',
        rent_end_date: db.command.gte(currentDate).and(db.command.lte(futureDate))
      })
      .get();
    
    // 4. 获取已过期但未处理的租赁
    const overdueRentals = await rentalsCollection
      .where({
        status: 'active',
        rent_end_date: db.command.lt(currentDate)
      })
      .get();
    
    return {
      code: 0,
      data: {
        room_status: {
          total: totalRooms,
          available: roomStats.available || 0,
          rented: roomStats.rented || 0,
          maintenance: roomStats.maintenance || 0,
          occupancy_rate: occupancyRate
        },
        rental_activity: {
          new_rentals_this_month: newRentalsThisMonth.data.length,
          expiring_soon: expiringRentals.data.length,
          overdue: overdueRentals.data.length
        },
        period: `${currentYear}年${currentMonth}月`
      }
    };
  } catch (error) {
    console.error('获取房间出租统计失败:', error);
    return {
      code: -1,
      message: '获取房间出租统计失败: ' + error.message
    };
  }
}

// 获取收入趋势数据（最近6个月）
async function getIncomeTrend(data) {
  try {
    const trendData = [];
    const currentDate = new Date();
    
    // 获取最近6个月的数据
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const monthData = await getMonthlyIncomeStatistics(year, month);
      trendData.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        rent_income: monthData.rent_income,
        utility_income: monthData.utility_income,
        maintenance_expenses: monthData.maintenance_expenses,
        net_income: monthData.net_income
      });
    }
    
    return {
      code: 0,
      data: trendData
    };
  } catch (error) {
    console.error('获取收入趋势失败:', error);
    return {
      code: -1,
      message: '获取收入趋势失败: ' + error.message
    };
  }
}

// 获取首页概览统计
async function getDashboardStatistics(data) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // 并行获取各项统计数据
    const [incomeStats, occupancyStats, trendStats] = await Promise.all([
      getMonthlyIncomeStatistics(currentYear, currentMonth),
      getRoomOccupancyStatistics(),
      getIncomeTrend()
    ]);
    
    return {
      code: 0,
      data: {
        current_month_income: incomeStats,
        room_occupancy: occupancyStats.data,
        income_trend: trendStats.data
      }
    };
  } catch (error) {
    console.error('获取首页统计失败:', error);
    return {
      code: -1,
      message: '获取首页统计失败: ' + error.message
    };
  }
}

module.exports = {
  getIncomeStatistics,
  getRoomOccupancyStatistics,
  getIncomeTrend,
  getDashboardStatistics,
  getMonthlyIncomeStatistics,
  getYearlyIncomeStatistics
};