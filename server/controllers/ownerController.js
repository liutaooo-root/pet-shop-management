const { pool } = require('../config/db');

// 获取所有主人
exports.getAllOwners = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM owners ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取主人列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取主人列表失败',
            error: error.message
        });
    }
};

// 获取单个主人
exports.getOwnerById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM owners WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取主人详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取主人详情失败',
            error: error.message
        });
    }
};

// 创建主人
exports.createOwner = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        
        // 验证必填字段
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: '姓名和电话为必填项'
            });
        }
        
        // 检查电话是否已存在
        const [existing] = await pool.execute(
            'SELECT id FROM owners WHERE phone = ?',
            [phone]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该电话号码已存在'
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO owners (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [name, phone, email, address]
        );
        
        res.status(201).json({
            success: true,
            message: '主人创建成功',
            data: {
                id: result.insertId,
                name,
                phone,
                email,
                address
            }
        });
    } catch (error) {
        console.error('创建主人失败:', error);
        res.status(500).json({
            success: false,
            message: '创建主人失败',
            error: error.message
        });
    }
};

// 更新主人
exports.updateOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, address } = req.body;
        
        // 检查主人是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM owners WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        // 如果更新电话，检查是否与其他记录冲突
        if (phone) {
            const [phoneCheck] = await pool.execute(
                'SELECT id FROM owners WHERE phone = ? AND id != ?',
                [phone, id]
            );
            
            if (phoneCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该电话号码已被其他主人使用'
                });
            }
        }
        
        await pool.execute(
            'UPDATE owners SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
            [name, phone, email, address, id]
        );
        
        res.json({
            success: true,
            message: '主人更新成功'
        });
    } catch (error) {
        console.error('更新主人失败:', error);
        res.status(500).json({
            success: false,
            message: '更新主人失败',
            error: error.message
        });
    }
};

// 删除主人
exports.deleteOwner = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查主人是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM owners WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        // 删除主人（级联删除宠物）
        await pool.execute('DELETE FROM owners WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '主人删除成功'
        });
    } catch (error) {
        console.error('删除主人失败:', error);
        res.status(500).json({
            success: false,
            message: '删除主人失败',
            error: error.message
        });
    }
};

// 获取主人的所有宠物
exports.getOwnerPets = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查主人是否存在
        const [ownerExists] = await pool.execute(
            'SELECT id FROM owners WHERE id = ?',
            [id]
        );
        
        if (ownerExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        const [rows] = await pool.execute(
            'SELECT * FROM pets WHERE owner_id = ? ORDER BY created_at DESC',
            [id]
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取主人的宠物失败:', error);
        res.status(500).json({
            success: false,
            message: '获取主人的宠物失败',
            error: error.message
        });
    }
};
