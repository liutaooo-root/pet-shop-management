const { Pool } = require('pg');

// 优先从 DATABASE_URL 解析连接信息 (Supabase / Railway / Render 等平台标准)
let poolConfig = {};
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    poolConfig = {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // 去掉开头的 /
        ssl: { rejectUnauthorized: false }, // 云数据库通常需要 SSL
    };
} else {
    // 回退到独立环境变量或默认值（本地开发）
    poolConfig = {
        host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
        database: process.env.PGDATABASE || process.env.DB_NAME || 'pet_shop_db',
        port: parseInt(process.env.PGPORT || process.env.DB_PORT) || 5432,
    };
}

const pool = new Pool({
    ...poolConfig,
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