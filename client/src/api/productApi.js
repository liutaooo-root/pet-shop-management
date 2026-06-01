import axios from 'axios'

const API_URL = '/api/products'

// 获取所有商品
export const getProducts = () => {
  return axios.get(API_URL)
}

// 获取单个商品
export const getProductById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

// 创建商品
export const createProduct = (data) => {
  return axios.post(API_URL, data)
}

// 更新商品
export const updateProduct = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data)
}

// 删除商品
export const deleteProduct = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}

// 更新库存
export const updateStock = (id, data) => {
  return axios.patch(`${API_URL}/${id}/stock`, data)
}

// 获取低库存商品
export const getLowStockProducts = (threshold) => {
  return axios.get(`${API_URL}/alert/low-stock`, {
    params: { threshold }
  })
}
