const { pool } = require('../config/db');

// 获取所有订单
exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, owner_id } = req.query;
        const offset = (page - 1) * limit;
        
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (status) {
            conditions.push(`o.status = $${paramIndex++}`);
            params.push(status);
        }
        
        if (owner_id) {
            conditions.push(`o.owner_id = $${paramIndex++}`);
            params.push(owner_id);
        }
        
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        const query = `
            SELECT o.*, ow.name as owner_name, ow.phone as owner_phone
            FROM orders o
            LEFT JOIN owners ow ON o.owner_id = ow.id
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(parseInt(limit), parseInt(offset));
        
        const { rows } = await pool.query(query, params);
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM orders';
        const countParams = [];
        let countParamIndex = 1;
        
        if (status || owner_id) {
            const countConditions = [];
            if (status) {
                countConditions.push(`status = $${countParamIndex++}`);
                countParams.push(status);
            }
            if (owner_id) {
                countConditions.push(`owner_id = $${countParamIndex++}`);
                countParams.push(owner_id);
            }
            countQuery += ' WHERE ' + countConditions.join(' AND ');
        }
        
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].total);
        
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
        const { rows: orderRows } = await pool.query(`
            SELECT o.*, ow.name as owner_name, ow.phone as owner_phone, ow.email as owner_email
            FROM orders o
            LEFT JOIN owners ow ON o.owner_id = ow.id
            WHERE o.id = $1
        `, [id]);
        
        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        // 获取订单详情
        const { rows: itemRows } = await pool.query(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
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
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { owner_id, items, payment_method, remarks } = req.body;
        
        // 验证必填字段
        if (!owner_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '主人ID和订单商品为必填项'
            });
        }
        
        // 检查主人是否存在
        const { rows: ownerRows } = await client.query(
            'SELECT id FROM owners WHERE id = $1',
            [owner_id]
        );
        
        if (ownerRows.length === 0) {
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
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: '商品ID和数量必须为有效值'
                });
            }
            
            // 获取商品信息和库存
            const { rows: productRows } = await client.query(
                'SELECT id, name, price, stock FROM products WHERE id = $1 AND status = $2',
                [product_id, 'active']
            );
            
            if (productRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: `商品ID ${product_id} 不存在或已下架`
                });
            }
            
            const product = productRows[0];
            
            if (product.stock < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `商品 ${product.name} 库存不足，当前库存: ${product.stock}`
                });
            }
            
            const subtotal = parseFloat(product.price) * quantity;
            totalAmount += subtotal;
            
            orderItems.push({
                product_id,
                quantity,
                price: parseFloat(product.price),
                subtotal
            });
            
            // 减少库存
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [quantity, product_id]
            );
        }
        
        // 创建订单
        const { rows: orderResult } = await client.query(
            `INSERT INTO orders (order_no, owner_id, total_amount, payment_method, remarks, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [orderNo, owner_id, totalAmount, payment_method, remarks]
        );
        
        const orderId = orderResult[0].id;
        
        // 创建订单详情
        for (const item of orderItems) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.product_id, item.quantity, item.price, item.subtotal]
            );
        }
        
        await client.query('COMMIT');
        
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
        await client.query('ROLLBACK');
        console.error('创建订单失败:', error);
        res.status(500).json({
            success: false,
            message: '创建订单失败',
            error: error.message
        });
    } finally {
        client.release();
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
        const { rows: existing } = await pool.query(
            'SELECT id, status FROM orders WHERE id = $1',
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
        
        await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
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
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // 检查订单是否存在
        const { rows: existing } = await client.query(
            'SELECT id, status FROM orders WHERE id = $1',
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
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '订单已取消'
            });
        }
        
        if (order.status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '已完成的订单不能取消'
            });
        }
        
        // 获取订单详情，恢复库存
        const { rows: orderItems } = await client.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [id]
        );
        
        for (const item of orderItems) {
            await client.query(
                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        
        // 更新订单状态为取消
        await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
            ['cancelled', id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: '订单取消成功，库存已恢复'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('取消订单失败:', error);
        res.status(500).json({
            success: false,
            message: '取消订单失败',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// 获取主人的订单
exports.getOwnerOrders = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        // 检查主人是否存在
        const { rows: ownerRows } = await pool.query(
            'SELECT id FROM owners WHERE id = $1',
            [ownerId]
        );
        
        if (ownerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        const conditions = ['owner_id = $1'];
        const params = [ownerId];
        let paramIndex = 2;
        
        if (status) {
            conditions.push(`status = $${paramIndex++}`);
            params.push(status);
        }
        
        params.push(parseInt(limit), parseInt(offset));
        
        const { rows } = await pool.query(
            `SELECT * FROM orders WHERE ${conditions.join(' AND ')}
             ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            params
        );
        
        // 获取总数
        let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE owner_id = $1';
        const countParams = [ownerId];
        if (status) {
            countQuery += ' AND status = $2';
            countParams.push(status);
        }
        
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const total = parseInt(countRows[0].total);
        
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
        
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (start_date) {
            conditions.push(`created_at >= $${paramIndex++}`);
            params.push(start_date);
        }
        
        if (end_date) {
            conditions.push(`created_at <= $${paramIndex++}`);
            params.push(end_date);
        }
        
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        const { rows } = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as completed_revenue
            FROM orders
            ${whereClause}
        `, params);
        
        // 获取销售额趋势（按天）
        const { rows: trendRows } = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE status = 'completed'
            ${start_date ? `AND created_at >= $1` : ''}
            ${end_date ? `AND created_at <= $${start_date ? 2 : 1}` : ''}
            GROUP BY DATE(created_at) ORDER BY date ASC
        `, [...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])]);
        
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