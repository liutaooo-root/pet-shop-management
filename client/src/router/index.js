import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/owners'
  },
  {
    path: '/owners',
    name: 'OwnerList',
    component: () => import('../views/OwnerList.vue'),
    meta: { title: '主人管理' }
  },
  {
    path: '/pets',
    name: 'PetList',
    component: () => import('../views/PetList.vue'),
    meta: { title: '宠物管理' }
  },
  {
    path: '/categories',
    name: 'CategoryList',
    component: () => import('../views/CategoryList.vue'),
    meta: { title: '分类管理' }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../views/ProductList.vue'),
    meta: { title: '商品管理' }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('../views/OrderList.vue'),
    meta: { title: '订单管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '宠物店管理系统'
  next()
})

export default router
