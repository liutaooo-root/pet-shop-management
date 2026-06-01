const { pool } = require('../config/db');

// 获取所有分类
exports.getAllCategories = async (req, res) => {
    try {
        const { rows } = await pool.query(
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
        const { rows } = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
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
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '分类名称为必填项'
            });
        }
        
        const { rows: existing } = await pool.query(
            'SELECT id FROM categories WHERE name = $1',
            [name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该分类名称已存在'
            });
        }
        
        const { rows: result } = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
            [name, description]
        );
        
        res.status(201).json({
            success: true,
            message: '分类创建成功',
            data: {
                id: result[0].id,
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
        
        const { rows: existing } = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        if (name) {
            const { rows: nameCheck } = await pool.query(
                'SELECT id FROM categories WHERE name = $1 AND id != $2',
                [name, id]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该分类名称已被其他分类使用'
                });
            }
        }
        
        await pool.query(
            'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
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
        
        const { rows: existing } = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        const { rows: products } = await pool.query(
            'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
            [id]
        );
        
        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该分类下还有商品，无法删除'
            });
        }
        
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        
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
        
        const { rows: categoryExists } = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [id]
        );
        
        if (categoryExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        const { rows } = await pool.query(
            'SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC',
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