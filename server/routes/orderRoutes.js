const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 获取所有订单
router.get('/', orderController.getAllOrders);

// 获取单个订单详情
router.get('/:id', orderController.getOrderById);

// 创建订单
router.post('/', orderController.createOrder);

// 更新订单状态
router.patch('/:id/status', orderController.updateOrderStatus);

// 取消订单
router.post('/:id/cancel', orderController.cancelOrder);

// 获取主人的订单
router.get('/owner/:ownerId', orderController.getOwnerOrders);

// 获取订单统计
router.get('/stats/summary', orderController.getOrderStats);

module.exports = router;
