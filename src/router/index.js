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
  },
  {
    path: '/level/3',
    name: 'Level3',
    component: () => import('../views/Level3View.vue')
  },
  {
    path: '/level/4',
    name: 'Level4',
    component: () => import('../views/Level4View.vue')
  },
  {
    path: '/level/5',
    name: 'Level5',
    component: () => import('../views/Level5View.vue')
  },
  {
    path: '/level/6',
    name: 'Level6',
    component: () => import('../views/Level6View.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
