const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function init() {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'database', 'schema_pg.sql'),
    'utf-8'
  );

  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'postgres',
    port: process.env.PGPORT || 5432,
  });

  try {
    await pool.query(sql);
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
    await pool.end();
  }
}

init();