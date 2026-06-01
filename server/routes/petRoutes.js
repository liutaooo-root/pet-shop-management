const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');

// 获取所有宠物
router.get('/', petController.getAllPets);

// 获取单个宠物
router.get('/:id', petController.getPetById);

// 创建宠物
router.post('/', petController.createPet);

// 更新宠物
router.put('/:id', petController.updatePet);

// 删除宠物
router.delete('/:id', petController.deletePet);

// 获取主人的所有宠物（通过主人ID）
router.get('/owner/:ownerId', petController.getPetsByOwnerId);

module.exports = router;
