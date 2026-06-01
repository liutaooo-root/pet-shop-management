import axios from 'axios'

const API_URL = '/api/pets'

// 获取所有宠物
export const getPets = () => {
  return axios.get(API_URL)
}

// 获取单个宠物
export const getPetById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

// 创建宠物
export const createPet = (data) => {
  return axios.post(API_URL, data)
}

// 更新宠物
export const updatePet = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data)
}

// 删除宠物
export const deletePet = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}

// 获取主人的宠物
export const getPetsByOwnerId = (ownerId) => {
  return axios.get(`${API_URL}/owner/${ownerId}`)
}
