const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

// 获取所有主人
router.get('/', ownerController.getAllOwners);

// 获取单个主人
router.get('/:id', ownerController.getOwnerById);

// 创建主人
router.post('/', ownerController.createOwner);

// 更新主人
router.put('/:id', ownerController.updateOwner);

// 删除主人
router.delete('/:id', ownerController.deleteOwner);

// 获取主人的所有宠物
router.get('/:id/pets', ownerController.getOwnerPets);

module.exports = router;
