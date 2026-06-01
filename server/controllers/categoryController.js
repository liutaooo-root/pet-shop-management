const { pool } = require('../config/db');

// 获取所有分类
exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM categories ORDER BY id ASC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类列表失败',
            error: error.message
        });
    }
};

// 获取单个分类
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取分类详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类详情失败',
            error: error.message
        });
    }
};

// 创建分类
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // 验证必填字段
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '分类名称为必填项'
            });
        }
        
        // 检查分类名是否已存在
        const [existing] = await pool.execute(
            'SELECT id FROM categories WHERE name = ?',
            [name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该分类名称已存在'
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        res.status(201).json({
            success: true,
            message: '分类创建成功',
            data: {
                id: result.insertId,
                name,
                description
            }
        });
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(500).json({
            success: false,
            message: '创建分类失败',
            error: error.message
        });
    }
};

// 更新分类
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        // 检查分类是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM categories WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        // 如果更新名称，检查是否与其他记录冲突
        if (name) {
            const [nameCheck] = await pool.execute(
                'SELECT id FROM categories WHERE name = ? AND id != ?',
                [name, id]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该分类名称已被其他分类使用'
                });
            }
        }
        
        await pool.execute(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        
        res.json({
            success: true,
            message: '分类更新成功'
        });
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({
            success: false,
            message: '更新分类失败',
            error: error.message
        });
    }
};

// 删除分类
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查分类是否存在
        const [existing] = await pool.execute(
            'SELECT id FROM categories WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        // 检查分类下是否有商品
        const [products] = await pool.execute(
            'SELECT id FROM products WHERE category_id = ? LIMIT 1',
            [id]
        );
        
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该分类下还有商品，无法删除'
            });
        }
        
        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: '分类删除成功'
        });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({
            success: false,
            message: '删除分类失败',
            error: error.message
        });
    }
};

// 获取分类下的所有商品
exports.getCategoryProducts = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查分类是否存在
        const [categoryExists] = await pool.execute(
            'SELECT id FROM categories WHERE id = ?',
            [id]
        );
        
        if (categoryExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC',
            [id]
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取分类下的商品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取分类下的商品失败',
            error: error.message
        });
    }
};
