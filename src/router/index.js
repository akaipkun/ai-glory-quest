import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/level/1',
    name: 'Level1',
    component: () => import('../views/Level1View.vue')
  },
  {
    path: '/level/2',
    name: 'Level2',
    component: () => import('../views/Level2View.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
