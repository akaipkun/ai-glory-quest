<template>
  <div class="auth">
    <canvas ref="bgCanvas" class="auth__bg"></canvas>
    <div class="auth__container">
      <!-- 标题 -->
      <div class="auth__header">
        <div class="auth__emblem ink-animate-splash">🐵</div>
        <h1 class="auth__title">AI 荣耀闯关</h1>
        <p class="auth__subtitle body-text">水墨科创 · 以水墨丹青，悟人工智能</p>
      </div>

      <!-- Tab 切换 -->
      <div class="auth__tabs">
        <button
          class="auth__tab"
          :class="{ 'auth__tab--active': mode === 'login' }"
          @click="switchMode('login')"
        >入山修行</button>
        <button
          class="auth__tab"
          :class="{ 'auth__tab--active': mode === 'register' }"
          @click="switchMode('register')"
        >初临仙境</button>
      </div>

      <!-- 表单 -->
      <div class="auth__form" @keyup.enter="submit">
        <div class="auth__field">
          <label class="auth__label">道号（用户名）</label>
          <input
            v-model="username"
            class="auth__input"
            :placeholder="mode === 'login' ? '输入用户名' : '起一个道号...'"
            autocomplete="username"
          />
        </div>

        <div class="auth__field">
          <label class="auth__label">密钥（密码）</label>
          <input
            v-model="password"
            type="password"
            class="auth__input"
            placeholder="输入密码..."
            autocomplete="current-password"
          />
        </div>

        <div v-if="mode === 'register'" class="auth__field">
          <label class="auth__label">再输一次密钥</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="auth__input"
            placeholder="确认密码..."
          />
        </div>

        <!-- 错误提示 -->
        <transition name="ink-fade">
          <div v-if="errorMsg" class="auth__error">{{ errorMsg }}</div>
        </transition>

        <button class="ink-btn ink-btn--gold auth__submit" @click="submit" :disabled="loading">
          {{ loading ? '稍候...' : (mode === 'login' ? '入山' : '拜师') }}
        </button>
      </div>

      <!-- 提示 -->
      <div class="auth__hint body-text">
        <span v-if="mode === 'login'">教师账号：teacher / admin123</span>
        <span v-else>已注册？<button class="auth__hint-link" @click="mode = 'login'">入山修行</button></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const bgCanvas = ref(null)
let animId = null

function switchMode(m) {
  mode.value = m
  errorMsg.value = ''
}

async function submit() {
  errorMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }

  if (mode.value === 'register') {
    if (password.value !== confirmPassword.value) {
      errorMsg.value = '两次密码不一致'
      return
    }
  }

  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(username.value.trim(), password.value)
    } else {
      await auth.register(username.value.trim(), password.value)
    }
    router.push('/')
  } catch (e) {
    errorMsg.value = e.message || '操作失败'
  } finally {
    loading.value = false
  }
}

function initBg() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  let t = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    t += 0.005

    // 水墨粒子
    for (let i = 0; i < 15; i++) {
      const x = canvas.width * (0.1 + Math.sin(t * 0.7 + i * 1.2) * 0.4 + 0.4)
      const y = canvas.height * (0.2 + Math.cos(t * 0.5 + i * 1.5) * 0.35 + 0.3)
      const size = 2 + Math.sin(t + i * 0.8) * 2

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${0.04 + Math.sin(t + i) * 0.03})`
      ctx.fill()
    }

    animId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => setTimeout(initBg, 100))
onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>

<style scoped>
.auth { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; background: var(--paper); }
.auth__bg { position: absolute; inset: 0; pointer-events: none; }

.auth__container { position: relative; z-index: 1; max-width: 400px; width: 100%; padding: 48px 32px; text-align: center; }

.auth__header { margin-bottom: 32px; }
.auth__emblem { font-size: 3.5rem; margin-bottom: 12px; display: inline-block; }
.auth__title { font-size: 2.2rem; letter-spacing: 0.25em; margin-bottom: 8px; }
.auth__subtitle { font-size: 0.8rem; color: var(--ink-medium); }

.auth__tabs { display: flex; gap: 0; margin-bottom: 24px; border: 1px solid var(--ink-pale); }
.auth__tab { flex: 1; padding: 10px; border: none; background: transparent; font-family: var(--font-display); font-size: 0.9rem; color: var(--ink-light); cursor: pointer; transition: all 0.3s ease; letter-spacing: 0.1em; }
.auth__tab:hover { color: var(--ink-medium); }
.auth__tab--active { color: var(--cinnabar); background: rgba(194, 58, 43, 0.04); }

.auth__form { margin-bottom: 20px; }
.auth__field { margin-bottom: 16px; text-align: left; }
.auth__label { font-family: var(--font-body); font-size: 0.8rem; color: var(--ink-medium); display: block; margin-bottom: 6px; }
.auth__input { width: 100%; padding: 10px 14px; border: 1px solid var(--ink-pale); background: rgba(245, 240, 232, 0.5); font-family: var(--font-body); font-size: 0.9rem; color: var(--ink-dark); outline: none; transition: border-color 0.3s ease; }
.auth__input:focus { border-color: var(--ink-dark); }
.auth__input::placeholder { color: var(--ink-pale); }

.auth__error { color: var(--cinnabar); font-size: 0.8rem; margin-bottom: 12px; padding: 8px 12px; border: 1px solid rgba(194, 58, 43, 0.2); background: rgba(194, 58, 43, 0.04); text-align: left; }

.auth__submit { width: 100%; margin-top: 4px; }

.auth__hint { font-size: 0.75rem; color: var(--ink-light); }
.auth__hint-link { background: none; border: none; color: var(--cinnabar); cursor: pointer; font-family: var(--font-body); font-size: 0.75rem; text-decoration: underline; padding: 0; }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.3s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
