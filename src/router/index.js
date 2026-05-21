import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/AuthView.vue'),
    meta: { guest: true }
  },
  {
    path: '/bestiary',
    name: 'Bestiary',
    component: () => import('../views/BestiaryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/TeacherDashboard.vue'),
    meta: { requiresAuth: true, requiresTeacher: true }
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('../views/KnowledgeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/1',
    name: 'Level1',
    component: () => import('../views/Level1View.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/2',
    name: 'Level2',
    component: () => import('../views/Level2View.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/3',
    name: 'Level3',
    component: () => import('../views/Level3View.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/4',
    name: 'Level4',
    component: () => import('../views/Level4View.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/5',
    name: 'Level5',
    component: () => import('../views/Level5View.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/level/6',
    name: 'Level6',
    component: () => import('../views/Level6View.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转登录页
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // 首次导航时初始化认证状态
  if (!auth._initialized) {
    auth._initialized = true
    await auth.init()
  }

  // 登录/注册页：已登录用户重定向到首页
  if (to.meta.guest && auth.isAuthenticated) {
    return next('/')
  }

  // 需要认证的页面：未登录跳转登录页
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/auth')
  }

  // 教师专属页面
  if (to.meta.requiresTeacher && !auth.isTeacher) {
    return next('/')
  }

  next()
})

export default router
