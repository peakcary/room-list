'use strict';

// 数据库初始化云函数
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('数据库初始化开始...');
  
  const { forceReset } = event || {};
  
  try {
    // 创建集合
    const roomsCollection = db.collection('rooms');
    const tenantsCollection = db.collection('tenants');
    const rentalsCollection = db.collection('rentals');
    const utilityRecordsCollection = db.collection('utility_records');
    const maintenanceRecordsCollection = db.collection('maintenance_records');
    
    // 如果是强制重置，先清空所有数据
    if (forceReset) {
      console.log('强制重置: 清空现有数据...');
      await Promise.all([
        utilityRecordsCollection.where({}).remove(),
        rentalsCollection.where({}).remove(),
        roomsCollection.where({}).remove(),
        tenantsCollection.where({}).remove()
      ]);
      console.log('现有数据已清空');
    }
    
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
          status: 'available',
          create_date: new Date(),
          update_date: new Date()
        },
        {
          room_number: '102', 
          floor: 1,
          status: 'available',
          create_date: new Date(),
          update_date: new Date()
        },
        {
          room_number: '201',
          floor: 2, 
          status: 'available',
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
    
    // 检查是否需要创建示例租赁关系
    const rentalsCount = await rentalsCollection.count();
    if (rentalsCount.total === 0) {
      // 获取刚创建的租户和房间数据
      const tenants = await tenantsCollection.get();
      const rooms = await roomsCollection.get();
      
      if (tenants.data.length > 0 && rooms.data.length > 0) {
        // 创建多个示例租赁关系
        const rentalRelationships = [
          {
            roomIndex: 0, // 101号房
            tenantIndex: 0, // 张三
            rent_price: 1200,
            deposit: 1200,
            rent_start_date: new Date('2024-01-01'),
            rent_end_date: new Date('2024-12-31'),
            contract_notes: '101号房租赁合同'
          },
          {
            roomIndex: 2, // 201号房  
            tenantIndex: 1, // 李四
            rent_price: 1600,
            deposit: 1600,
            rent_start_date: new Date('2024-02-01'),
            rent_end_date: new Date('2025-01-31'),
            contract_notes: '201号房租赁合同'
          }
        ];
        
        for (let relationship of rentalRelationships) {
          const rental = {
            room_id: rooms.data[relationship.roomIndex]._id,
            tenant_id: tenants.data[relationship.tenantIndex]._id,
            rent_price: relationship.rent_price,
            deposit: relationship.deposit,
            rent_start_date: relationship.rent_start_date,
            rent_end_date: relationship.rent_end_date,
            status: 'active',
            utilities_included: false,
            electricity_start_reading: 0,
            water_start_reading: 0,
            contract_notes: relationship.contract_notes,
            create_date: new Date(),
            update_date: new Date()
          };
          
          // 添加租赁记录
          const rentalResult = await rentalsCollection.add(rental);
          const rentalId = rentalResult.id;
          
          // 更新房间状态和租赁ID
          await roomsCollection.doc(rooms.data[relationship.roomIndex]._id).update({
            status: 'rented',
            current_rental_id: rentalId,
            update_date: new Date()
          });
        }
        
        console.log('示例租赁关系创建完成 - 已创建2个租赁关系');
      }
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