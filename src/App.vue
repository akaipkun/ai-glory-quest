<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import InkBackground from './components/ink/InkBackground.vue'
import AccountBadge from './components/ink/AccountBadge.vue'
import InkCursor from './components/ink/InkCursor.vue'
import { useGameStore } from './stores/gameStore'
import { useAuthStore } from './stores/authStore'

const router = useRouter()
const route = useRoute()
const game = useGameStore()
const auth = useAuthStore()

// 路由变化时更新当前关卡
watch(() => route.path, (path) => {
  const match = path.match(/\/level\/(\d+)/)
  if (match) {
    game.currentLevel = parseInt(match[1])
  }
})
</script>

<template>
  <div id="ink-app">
    <InkBackground />

    <!-- 认证加载中 -->
    <div v-if="auth.loading" class="ink-loading">
      <span class="ink-loading__text">墨色晕染中...</span>
    </div>

    <template v-else>
      <!-- 全局账户印章（右上角） -->
      <AccountBadge />

      <!-- 水墨笔刷光标 -->
      <InkCursor />

      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <div class="ink-footer" v-if="!route.path.startsWith('/auth')">
        <div class="ink-footer__line"></div>
        <span class="ink-footer__text">AI 荣耀闯关 · 水墨科创</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
#ink-app {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  cursor: none;
}

/* Hide default cursor on interactive elements too */
#ink-app :deep(a),
#ink-app :deep(button),
#ink-app :deep(input),
#ink-app :deep(select),
#ink-app :deep(textarea),
#ink-app :deep([role="button"]),
#ink-app :deep(.clickable) {
  cursor: none;
}

.ink-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  pointer-events: none;
}

.ink-footer__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--ink-pale) 20%,
    var(--ink-light) 50%,
    var(--ink-pale) 80%,
    transparent
  );
}

.ink-footer__text {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--ink-pale);
  letter-spacing: 0.2em;
  white-space: nowrap;
}

/* 页面过渡 */
.page-enter-active {
  animation: page-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.page-leave-active {
  animation: page-out 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes page-in {
  0% { opacity: 0; filter: blur(8px); transform: scale(0.95); }
  100% { opacity: 1; filter: blur(0); transform: scale(1); }
}
@keyframes page-out {
  0% { opacity: 1; filter: blur(0); transform: scale(1); }
  100% { opacity: 0; filter: blur(8px); transform: scale(0.95); }
}

.ink-loading {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: var(--paper); z-index: 1000;
}
.ink-loading__text {
  font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 0.2em;
  color: var(--ink-light); animation: ink-converge 0.8s ease forwards;
}
</style>
