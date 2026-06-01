const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取所有分类
router.get('/', categoryController.getAllCategories);

// 获取单个分类
router.get('/:id', categoryController.getCategoryById);

// 创建分类
router.post('/', categoryController.createCategory);

// 更新分类
router.put('/:id', categoryController.updateCategory);

// 删除分类
router.delete('/:id', categoryController.deleteCategory);

// 获取分类下的所有商品
router.get('/:id/products', categoryController.getCategoryProducts);

module.exports = router;
