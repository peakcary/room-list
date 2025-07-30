'use strict';

// 数据库初始化云函数
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('数据库初始化开始...');
  
  try {
    // 创建集合
    const roomsCollection = db.collection('rooms');
    const tenantsCollection = db.collection('tenants');
    const rentalsCollection = db.collection('rentals');
    const utilityRecordsCollection = db.collection('utility_records');
    
    // 检查集合是否存在，如果不存在则创建示例数据
    const roomsCount = await roomsCollection.count();
    const tenantsCount = await tenantsCollection.count();
    
    // 创建示例数据
    if (tenantsCount.total === 0) {
      // 创建示例租户
      const sampleTenants = [
        {
          name: '张三',
          id_card: '110101199001011234',
          phone: '13800138000',
          emergency_contact: {
            name: '张父',
            phone: '13800138001',
            relationship: '父亲'
          },
          status: 'active',
          create_date: new Date()
        },
        {
          name: '李四',
          id_card: '110101199002022345',
          phone: '13800138002',
          emergency_contact: {
            name: '李母',
            phone: '13800138003',
            relationship: '母亲'
          },
          status: 'active',
          create_date: new Date()
        }
      ];
      
      for (let tenant of sampleTenants) {
        await tenantsCollection.add(tenant);
      }
      console.log('示例租户数据创建完成');
    }
    
    if (roomsCount.total === 0) {
      // 创建示例房间数据
      const sampleRooms = [
        {
          room_number: '101',
          floor: 1,
          area: 25.5,
          rent_price: 1200,
          status: 'available',
          utilities: {
            electricity_reading: 0,
            water_reading: 0,
            electricity_rate: 0.5,
            water_rate: 3.0
          },
          create_date: new Date(),
          update_date: new Date()
        },
        {
          room_number: '102', 
          floor: 1,
          area: 28.0,
          rent_price: 1400,
          status: 'available',
          utilities: {
            electricity_reading: 150,
            water_reading: 20,
            electricity_rate: 0.5,
            water_rate: 3.0
          },
          create_date: new Date(),
          update_date: new Date()
        },
        {
          room_number: '201',
          floor: 2, 
          area: 30.0,
          rent_price: 1600,
          status: 'available',
          utilities: {
            electricity_reading: 0,
            water_reading: 0,
            electricity_rate: 0.5,
            water_rate: 3.0
          },
          create_date: new Date(),
          update_date: new Date()
        }
      ];
      
      // 批量插入示例数据
      for (let room of sampleRooms) {
        await roomsCollection.add(room);
      }
      
      console.log('示例房间数据创建完成');
    }
    
    return {
      code: 0,
      message: '数据库初始化成功',
      data: {
        roomsCount: roomsCount.total
      }
    };
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      code: -1,
      message: '数据库初始化失败: ' + error.message
    };
  }
};