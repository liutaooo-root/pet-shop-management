import axios from 'axios'

const API_URL = '/api/categories'

// 获取所有分类
export const getCategories = () => {
  return axios.get(API_URL)
}

// 获取单个分类
export const getCategoryById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

// 创建分类
export const createCategory = (data) => {
  return axios.post(API_URL, data)
}

// 更新分类
export const updateCategory = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data)
}

// 删除分类
export const deleteCategory = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}

// 获取分类下的商品
export const getCategoryProducts = (id) => {
  return axios.get(`${API_URL}/${id}/products`)
}
