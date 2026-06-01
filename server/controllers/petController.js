const { pool } = require('../config/db');

// 获取所有宠物
exports.getAllPets = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT p.*, o.name as owner_name, o.phone as owner_phone 
            FROM pets p 
            LEFT JOIN owners o ON p.owner_id = o.id 
            ORDER BY p.created_at DESC
        `);
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('获取宠物列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取宠物列表失败',
            error: error.message
        });
    }
};

// 获取单个宠物
exports.getPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT p.*, o.name as owner_name, o.phone as owner_phone 
            FROM pets p 
            LEFT JOIN owners o ON p.owner_id = o.id 
            WHERE p.id = $1
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '宠物不存在'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('获取宠物详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取宠物详情失败',
            error: error.message
        });
    }
};

// 创建宠物
exports.createPet = async (req, res) => {
    try {
        const { name, species, breed, age, gender, color, weight, owner_id, remarks } = req.body;
        
        if (!name || !species || !owner_id) {
            return res.status(400).json({
                success: false,
                message: '宠物名字、品种和主人ID为必填项'
            });
        }
        
        const { rows: ownerExists } = await pool.query(
            'SELECT id FROM owners WHERE id = $1',
            [owner_id]
        );
        
        if (ownerExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        const { rows: result } = await pool.query(
            `INSERT INTO pets (name, species, breed, age, gender, color, weight, owner_id, remarks) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [name, species, breed, age, gender, color, weight, owner_id, remarks]
        );
        
        res.status(201).json({
            success: true,
            message: '宠物创建成功',
            data: {
                id: result[0].id,
                name,
                species,
                breed,
                age,
                gender,
                color,
                weight,
                owner_id,
                remarks
            }
        });
    } catch (error) {
        console.error('创建宠物失败:', error);
        res.status(500).json({
            success: false,
            message: '创建宠物失败',
            error: error.message
        });
    }
};

// 更新宠物
exports.updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, breed, age, gender, color, weight, owner_id, remarks } = req.body;
        
        const { rows: existing } = await pool.query(
            'SELECT id FROM pets WHERE id = $1',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '宠物不存在'
            });
        }
        
        if (owner_id) {
            const { rows: ownerExists } = await pool.query(
                'SELECT id FROM owners WHERE id = $1',
                [owner_id]
            );
            
            if (ownerExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '新主人不存在'
                });
            }
        }
        
        await pool.query(
            `UPDATE pets SET name = $1, species = $2, breed = $3, age = $4, gender = $5, 
             color = $6, weight = $7, owner_id = $8, remarks = $9 WHERE id = $10`,
            [name, species, breed, age, gender, color, weight, owner_id, remarks, id]
        );
        
        res.json({
            success: true,
            message: '宠物更新成功'
        });
    } catch (error) {
        console.error('更新宠物失败:', error);
        res.status(500).json({
            success: false,
            message: '更新宠物失败',
            error: error.message
        });
    }
};

// 删除宠物
exports.deletePet = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { rows: existing } = await pool.query(
            'SELECT id FROM pets WHERE id = $1',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '宠物不存在'
            });
        }
        
        await pool.query('DELETE FROM pets WHERE id = $1', [id]);
        
        res.json({
            success: true,
            message: '宠物删除成功'
        });
    } catch (error) {
        console.error('删除宠物失败:', error);
        res.status(500).json({
            success: false,
            message: '删除宠物失败',
            error: error.message
        });
    }
};

// 获取主人的所有宠物
exports.getPetsByOwnerId = async (req, res) => {
    try {
        const { ownerId } = req.params;
        
        const { rows: ownerExists } = await pool.query(
            'SELECT id FROM owners WHERE id = $1',
            [ownerId]
        );
        
        if (ownerExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主人不存在'
            });
        }
        
        const { rows } = await pool.query(
            'SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC',
            [ownerId]
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