import axios from 'axios'

const API_URL = '/api/owners'

// 获取所有主人
export const getOwners = () => {
  return axios.get(API_URL)
}

// 获取单个主人
export const getOwnerById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

// 创建主人
export const createOwner = (data) => {
  return axios.post(API_URL, data)
}

// 更新主人
export const updateOwner = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data)
}

// 删除主人
export const deleteOwner = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}

// 获取主人的宠物
export const getOwnerPets = (id) => {
  return axios.get(`${API_URL}/${id}/pets`)
}
