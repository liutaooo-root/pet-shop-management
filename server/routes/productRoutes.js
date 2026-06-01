const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 获取所有商品
router.get('/', productController.getAllProducts);

// 获取单个商品
router.get('/:id', productController.getProductById);

// 创建商品
router.post('/', productController.createProduct);

// 更新商品
router.put('/:id', productController.updateProduct);

// 删除商品
router.delete('/:id', productController.deleteProduct);

// 更新商品库存
router.patch('/:id/stock', productController.updateStock);

// 获取低库存商品
router.get('/alert/low-stock', productController.getLowStockProducts);

module.exports = router;
