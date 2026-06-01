const { Pool } = require('pg');

// 数据库配置 (兼容本地开发和 Supabase / Railway 部署)
const pool = new Pool({
    host: process.env.PGHOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.PGUSER || process.env.MYSQLUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.PGDATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'pet_shop_db',
    port: process.env.PGPORT || process.env.MYSQLPORT || process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// 测试数据库连接
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ 数据库连接成功');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};