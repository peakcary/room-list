'use strict';

// 用户管理云函数
const db = uniCloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      // 用户认证
      case 'login':
        return await loginUser(data);
      case 'verifyToken':
        return await verifyToken(data);
      case 'changePassword':
        return await changePassword(data);
      case 'getUserInfo':
        return await getUserInfo(data);
      
      // 用户管理
      case 'createUser':
        return await createUser(data);
      case 'updateUser':
        return await updateUser(data);
      case 'deleteUser':
        return await deleteUser(data);
      case 'getUsers':
        return await getUsers(data);
      
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (error) {
    console.error('用户管理云函数执行错误:', error);
    return { code: -1, message: error.message };
  }
};

// 用户登录
async function loginUser(data) {
  const { username, password } = data;
  
  if (!username || !password) {
    return { code: -1, message: '用户名和密码不能为空' };
  }
  
  try {
    // 查找用户
    const userResult = await usersCollection.where({
      username: username,
      status: 'active'
    }).get();
    
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在或已禁用' };
    }
    
    const user = userResult.data[0];
    
    // 验证密码（这里使用简单比较，生产环境应该使用加密）
    if (user.password !== password) {
      return { code: -1, message: '密码错误' };
    }
    
    // 生成token
    const token = generateToken(user);
    
    // 更新最后登录时间
    await usersCollection.doc(user._id).update({
      last_login_time: new Date(),
      update_date: new Date()
    });
    
    // 返回用户信息（不包含密码）
    const userInfo = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
      create_date: user.create_date,
      last_login_time: new Date()
    };
    
    return {
      code: 0,
      data: {
        userInfo: userInfo,
        token: token
      },
      message: '登录成功'
    };
    
  } catch (error) {
    console.error('登录失败:', error);
    return { code: -1, message: '登录过程中发生错误' };
  }
}

// 验证token
async function verifyToken(data) {
  const { token } = data;
  
  if (!token) {
    return { code: -1, message: 'Token不能为空' };
  }
  
  try {
    // 解析token
    const tokenParts = token.split('_');
    if (tokenParts.length < 3) {
      return { code: -1, message: 'Token格式错误' };
    }
    
    const username = tokenParts[0];
    const timestamp = parseInt(tokenParts[1]);
    const now = Date.now();
    
    // 检查token是否过期（7天）
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if ((now - timestamp) > SEVEN_DAYS) {
      return { code: -1, message: 'Token已过期' };
    }
    
    // 查找用户
    const userResult = await usersCollection.where({
      username: username,
      status: 'active'
    }).get();
    
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在或已禁用' };
    }
    
    const user = userResult.data[0];
    const userInfo = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status
    };
    
    return {
      code: 0,
      data: { userInfo },
      message: 'Token验证成功'
    };
    
  } catch (error) {
    console.error('Token验证失败:', error);
    return { code: -1, message: 'Token验证过程中发生错误' };
  }
}

// 修改密码
async function changePassword(data) {
  const { username, oldPassword, newPassword } = data;
  
  if (!username || !oldPassword || !newPassword) {
    return { code: -1, message: '参数不完整' };
  }
  
  if (newPassword.length < 6) {
    return { code: -1, message: '新密码长度至少6位' };
  }
  
  try {
    // 查找用户
    const userResult = await usersCollection.where({
      username: username,
      status: 'active'
    }).get();
    
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在或已禁用' };
    }
    
    const user = userResult.data[0];
    
    // 验证当前密码
    if (user.password !== oldPassword) {
      return { code: -1, message: '当前密码错误' };
    }
    
    if (oldPassword === newPassword) {
      return { code: -1, message: '新密码不能与当前密码相同' };
    }
    
    // 更新密码
    await usersCollection.doc(user._id).update({
      password: newPassword,
      password_update_date: new Date(),
      update_date: new Date()
    });
    
    return {
      code: 0,
      message: '密码修改成功'
    };
    
  } catch (error) {
    console.error('修改密码失败:', error);
    return { code: -1, message: '修改密码过程中发生错误' };
  }
}

// 获取用户信息
async function getUserInfo(data) {
  const { userId } = data;
  
  try {
    const userResult = await usersCollection.doc(userId).get();
    
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    
    const user = userResult.data[0];
    const userInfo = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
      create_date: user.create_date,
      last_login_time: user.last_login_time
    };
    
    return {
      code: 0,
      data: userInfo
    };
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return { code: -1, message: '获取用户信息失败' };
  }
}

// 创建用户
async function createUser(data) {
  const { username, password, name, role = 'user' } = data;
  
  if (!username || !password || !name) {
    return { code: -1, message: '用户名、密码和姓名不能为空' };
  }
  
  if (password.length < 6) {
    return { code: -1, message: '密码长度至少6位' };
  }
  
  try {
    // 检查用户名是否已存在
    const existUser = await usersCollection.where({
      username: username
    }).get();
    
    if (existUser.data.length > 0) {
      return { code: -1, message: '用户名已存在' };
    }
    
    // 创建用户
    const userData = {
      username: username,
      password: password, // 生产环境应该加密
      name: name,
      role: role,
      status: 'active',
      create_date: new Date(),
      update_date: new Date()
    };
    
    const result = await usersCollection.add(userData);
    
    return {
      code: 0,
      data: { userId: result.id },
      message: '用户创建成功'
    };
    
  } catch (error) {
    console.error('创建用户失败:', error);
    return { code: -1, message: '创建用户失败' };
  }
}

// 获取用户列表
async function getUsers(data) {
  const { pageSize = 20, pageNum = 1, role, status } = data || {};
  
  try {
    let query = usersCollection;
    const conditions = {};
    
    if (role) {
      conditions.role = role;
    }
    
    if (status) {
      conditions.status = status;
    }
    
    if (Object.keys(conditions).length > 0) {
      query = query.where(conditions);
    }
    
    const result = await query
      .field('username,name,role,status,create_date,last_login_time')
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
    
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { code: -1, message: '获取用户列表失败' };
  }
}

// 更新用户
async function updateUser(data) {
  const { userId, ...updateData } = data;
  
  try {
    // 移除敏感字段
    delete updateData.password;
    delete updateData._id;
    
    updateData.update_date = new Date();
    
    await usersCollection.doc(userId).update(updateData);
    
    return {
      code: 0,
      message: '用户信息更新成功'
    };
    
  } catch (error) {
    console.error('更新用户失败:', error);
    return { code: -1, message: '更新用户失败' };
  }
}

// 删除用户
async function deleteUser(data) {
  const { userId } = data;
  
  try {
    // 软删除，将状态改为inactive
    await usersCollection.doc(userId).update({
      status: 'inactive',
      update_date: new Date()
    });
    
    return {
      code: 0,
      message: '用户删除成功'
    };
    
  } catch (error) {
    console.error('删除用户失败:', error);
    return { code: -1, message: '删除用户失败' };
  }
}

// 生成token
function generateToken(user) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2);
  return `${user.username}_${timestamp}_${randomStr}`;
}