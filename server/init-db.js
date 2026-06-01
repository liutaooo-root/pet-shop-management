const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function init() {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'database', 'schema.sql'),
    'utf-8'
  );

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    multipleStatements: true
  });

  try {
    await conn.query(sql);
    console.log('✅ 数据库初始化成功！');
    console.log('   - owners (3条测试数据)');
    console.log('   - pets (5条测试数据)');
    console.log('   - categories (4条测试数据)');
    console.log('   - products (4条测试数据)');
    console.log('   - orders');
    console.log('   - order_items');
  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
  } finally {
    await conn.end();
  }
}

init();
