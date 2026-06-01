import axios from 'axios'

const API_URL = '/api/orders'

// 获取所有订单
export const getOrders = (params) => {
  return axios.get(API_URL, { params })
}

// 获取单个订单
export const getOrderById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

// 创建订单
export const createOrder = (data) => {
  return axios.post(API_URL, data)
}

// 更新订单状态
export const updateOrderStatus = (id, data) => {
  return axios.patch(`${API_URL}/${id}/status`, data)
}

// 取消订单
export const cancelOrder = (id) => {
  return axios.post(`${API_URL}/${id}/cancel`)
}

// 获取主人的订单
export const getOwnerOrders = (ownerId, params) => {
  return axios.get(`${API_URL}/owner/${ownerId}`, { params })
}

// 获取订单统计
export const getOrderStats = (params) => {
  return axios.get(`${API_URL}/stats/summary`, { params })
}
