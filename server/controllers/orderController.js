const { pool } = require('../config/db');

// 获取所有订单
exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, owner_id } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT o.*, ow.name as owner_name, ow.phone as owner_phone
            FROM orders o
            LEFT JOIN owners ow ON o.owner_id = ow.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }
        
        if (owner_id) {
            query += ' AND o.owner_id = ?';
            params.push(owner_id);
        }
        
        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [rows] = await pool.execute(query, params);
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
        const countParams = [];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        if (owner_id) {
            countQuery += ' AND owner_id = ?';
            countParams.push(owner_id);
        }
        
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单列表失败',
            error: error.message
        });
    }
};

// 获取单个订单详情
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 获取订单头信息
        const [orderRows] = await pool.execute(`
            SELECT o.*, ow.name as owner_name, ow.phone as owner_phone, ow.email as owner_email
            FROM orders o
            LEFT JOIN owners ow ON o.owner_id = ow.id
            WHERE o.id = ?
        `, [id]);
        
        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        // 获取订单详情
        const [itemRows] = await pool.execute(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...orderRows[0],
                items: itemRows
            }
        });
    } catch (error) {
        console.error('获取订单详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单详情失败',
            error: error.message
        });
    }
};

// 创建订单
exports.createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { owner_id, items, payment_method, remarks } = req.body;
        
        // 验证必填字段
        if (!owner_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '主人ID和订单商品为必填项'
            });
        }
        
        // 检查主人是否存在
        const [ownerExists] = await connection.execute(
            'SELECT id FROM owners WHERE id = ?',
            [owner_id]
        );
        
        if (ownerExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        // 生成订单编号
        const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
        
        let totalAmount = 0;
        const orderItems = [];
        
        // 检查库存并计算总价
        for (const item of items) {
            const { product_id, quantity } = item;
            
            if (!product_id || !quantity || quantity <= 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: '商品ID和数量必须为有效值'
                });
            }
            
            // 获取商品信息和库存
            const [productRows] = await connection.execute(
                'SELECT id, name, price, stock FROM products WHERE id = ? AND status = "active"',
                [product_id]
            );
            
            if (productRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `商品ID ${product_id} 不存在或已下架`
                });
            }
            
            const product = productRows[0];
            
            if (product.stock < quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `商品 ${product.name} 库存不足，当前库存: ${product.stock}`
                });
            }
            
            const subtotal = product.price * quantity;
            totalAmount += subtotal;
            
            orderItems.push({
                product_id,
                quantity,
                price: product.price,
                subtotal
            });
            
            // 减少库存
            await connection.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [quantity, product_id]
            );
        }
        
        // 创建订单
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (order_no, owner_id, total_amount, payment_method, remarks, status) VALUES (?, ?, ?, ?, ?, "pending")',
            [orderNo, owner_id, totalAmount, payment_method, remarks]
        );
        
        const orderId = orderResult.insertId;
        
        // 创建订单详情
        for (const item of orderItems) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price, item.subtotal]
            );
        }
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: '订单创建成功',
            data: {
                id: orderId,
                order_no: orderNo,
                total_amount: totalAmount,
                status: 'pending'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('创建订单失败:', error);
        res.status(500).json({
            success: false,
            message: '创建订单失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// 更新订单状态
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // 验证状态值
        const validStatuses = ['pending', 'paid', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的订单状态'
            });
        }
        
        // 检查订单是否存在
        const [existing] = await pool.execute(
            'SELECT id, status FROM orders WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        const oldStatus = existing[0].status;
        
        // 如果订单已取消，不能再更改状态
        if (oldStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: '已取消的订单不能更改状态'
            });
        }
        
        await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        
        res.json({
            success: true,
            message: '订单状态更新成功'
        });
    } catch (error) {
        console.error('更新订单状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新订单状态失败',
            error: error.message
        });
    }
};

// 取消订单
exports.cancelOrder = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // 检查订单是否存在
        const [existing] = await connection.execute(
            'SELECT id, status FROM orders WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        const order = existing[0];
        
        // 如果订单已取消或已完成，不能取消
        if (order.status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '订单已取消'
            });
        }
        
        if (order.status === 'completed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '已完成的订单不能取消'
            });
        }
        
        // 获取订单详情，恢复库存
        const [orderItems] = await connection.execute(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [id]
        );
        
        for (const item of orderItems) {
            await connection.execute(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }
        
        // 更新订单状态为取消
        await connection.execute(
            'UPDATE orders SET status = "cancelled" WHERE id = ?',
            [id]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: '订单取消成功，库存已恢复'
        });
    } catch (error) {
        await connection.rollback();
        console.error('取消订单失败:', error);
        res.status(500).json({
            success: false,
            message: '取消订单失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// 获取主人的订单
exports.getOwnerOrders = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        // 检查主人是否存在
        const [ownerExists] = await pool.execute(
            'SELECT id FROM owners WHERE id = ?',
            [ownerId]
        );
        
        if (ownerExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        let query = `
            SELECT * FROM orders 
            WHERE owner_id = ?
        `;
        const params = [ownerId];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [rows] = await pool.execute(query, params);
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE owner_id = ?';
        const countParams = [ownerId];
        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }
        
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取主人的订单失败:', error);
        res.status(500).json({
            success: false,
            message: '获取主人的订单失败',
            error: error.message
        });
    }
};

// 获取订单统计
exports.getOrderStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
                SUM(total_amount) as total_revenue,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_revenue
            FROM orders
            WHERE 1=1
        `;
        
        const params = [];
        
        if (start_date) {
            query += ' AND created_at >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND created_at <= ?';
            params.push(end_date);
        }
        
        const [rows] = await pool.execute(query, params);
        
        // 获取销售额趋势（按天）
        let trendQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status = 'completed'
        `;
        
        const trendParams = [];
        
        if (start_date) {
            trendQuery += ' AND created_at >= ?';
            trendParams.push(start_date);
        }
        
        if (end_date) {
            trendQuery += ' AND created_at <= ?';
            trendParams.push(end_date);
        }
        
        trendQuery += ' GROUP BY DATE(created_at) ORDER BY date ASC';
        
        const [trendRows] = await pool.execute(trendQuery, trendParams);
        
        res.json({
            success: true,
            data: {
                summary: rows[0],
                trend: trendRows
            }
        });
    } catch (error) {
        console.error('获取订单统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单统计失败',
            error: error.message
        });
    }
};
