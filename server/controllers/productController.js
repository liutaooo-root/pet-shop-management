const { pool } = require('../config/db');

// 获取所有商品
exports.getAllProducts = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.created_at DESC
        `);
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商品列表失败',
            error: error.message
        });
    }
};

// 获取单个商品
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商品详情失败',
            error: error.message
        });
    }
};

// 创建商品
exports.createProduct = async (req, res) => {
    try {
        const { name, category_id, price, stock, description, image_url, status } = req.body;
        
        // 验证必填字段
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: '商品名称和价格为必填项'
            });
        }
        
        // 如果提供了分类ID，检查分类是否存在
        if (category_id) {
            const [categoryExists] = await pool.execute(
                'SELECT id FROM categories WHERE id = ?',
                [category_id]
            );
            
            if (categoryExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '商品分类不存在'
                });
            }
        }
        
        const [result] = await pool.execute(
            'INSERT INTO products (name, category_id, price, stock, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, category_id, price, stock || 0, description, image_url, status || 'active']
        );
        
        res.status(201).json({
            success: true,
            message: '商品创建成功',
            data: {
                id: result.insertId,
                name,
                category_id,
                price,
                stock: stock || 0,
                description,
                image_url,
                status: status || 'active'
            }
        });
    } catch (error) {
        console.error('创建商品失败:', error);
        res.status(500).json({
            success: false,
            message: '创建商品失败',
            error: error.message
        });
    }
};

// 更新商品
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, price, stock, description, image_url, status } = req.body;
        
        // 检查商品是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        // 如果提供了分类ID，检查分类是否存在
        if (category_id) {
            const [categoryExists] = await pool.execute(
                'SELECT id FROM categories WHERE id = ?',
                [category_id]
            );
            
            if (categoryExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '商品分类不存在'
                });
            }
        }
        
        await pool.execute(
            'UPDATE products SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, image_url = ?, status = ? WHERE id = ?',
            [name, category_id, price, stock, description, image_url, status, id]
        );
        
        res.json({
            success: true,
            message: '商品更新成功'
        });
    } catch (error) {
        console.error('更新商品失败:', error);
        res.status(500).json({
            success: false,
            message: '更新商品失败',
            error: error.message
        });
    }
};

// 删除商品
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查商品是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        // 检查商品是否在订单中使用
        const [orderItems] = await pool.execute(
            'SELECT id FROM order_items WHERE product_id = ? LIMIT 1',
            [id]
        );
        
        if (orderItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该商品已在订单中使用，无法删除'
            });
        }
        
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            success: false,
            message: '删除商品失败',
            error: error.message
        });
    }
};

// 更新商品库存
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, operation } = req.body; // operation: 'set', 'increment', 'decrement'
        
        // 检查商品是否存在
        const [existing] = await pool.execute(
            'SELECT id, stock FROM products WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在'
            });
        }
        
        let newStock = existing[0].stock;
        
        if (operation === 'increment') {
            newStock += parseInt(stock);
        } else if (operation === 'decrement') {
            newStock -= parseInt(stock);
            if (newStock < 0) {
                return res.status(400).json({
                    success: false,
                    message: '库存不足'
                });
            }
        } else {
            newStock = parseInt(stock);
        }
        
        await pool.execute(
            'UPDATE products SET stock = ? WHERE id = ?',
            [newStock, id]
        );
        
        res.json({
            success: true,
            message: '库存更新成功',
            data: { stock: newStock }
        });
    } catch (error) {
        console.error('更新库存失败:', error);
        res.status(500).json({
            success: false,
            message: '更新库存失败',
            error: error.message
        });
    }
};

// 获取低库存商品
exports.getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold || 10; // 默认阈值为10
        
        const [rows] = await pool.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.stock <= ? AND p.status = 'active'
            ORDER BY p.stock ASC
        `, [threshold]);
        
        res.json({
            success: true,
            data: rows,
            threshold: parseInt(threshold)
        });
    } catch (error) {
        console.error('获取低库存商品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取低库存商品失败',
            error: error.message
        });
    }
};
