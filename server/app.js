const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/db');

// 导入路由
const ownerRoutes = require('./routes/ownerRoutes');
const petRoutes = require('./routes/petRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/owners', ownerRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// 根路由
app.get('/', (req, res) => {
    res.json({
        message: '宠物店管理系统API',
        version: '1.0.0',
        endpoints: {
            owners: '/api/owners',
            pets: '/api/pets',
            products: '/api/products',
            orders: '/api/orders',
            categories: '/api/categories'
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('无法连接到数据库，服务器启动失败');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`📚 API文档: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
