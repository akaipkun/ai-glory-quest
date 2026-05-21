<template>
  <div class="acct" v-if="auth.isAuthenticated && !route.path.startsWith('/auth')">
    <!-- 身份印章 -->
    <div class="acct__seal" @click="toggleExpanded" title="点击展开">
      <span class="acct__icon">{{ auth.isTeacher ? '夫' : '生' }}</span>
    </div>

    <!-- 展开面板 -->
    <transition name="acct-panel">
      <div v-if="expanded" class="acct__panel">
        <!-- 用户信息行 -->
        <div class="acct__info">
          <span class="acct__name">{{ auth.currentUser?.username }}</span>
          <span
            class="acct__role"
            :class="{ 'acct__role--teacher': auth.isTeacher }"
          >
            {{ auth.isTeacher ? '师' : '徒' }}
          </span>
        </div>

        <!-- 上帝模式指示 -->
        <div v-if="auth.isGodMode" class="acct__god">
          <span class="acct__god-eye">👁</span>
          <span class="acct__god-text">上帝模式</span>
        </div>

        <!-- 分割线 -->
        <div class="acct__divider"></div>

        <!-- 操作按钮 -->
        <div class="acct__actions">
          <button
            v-if="auth.isTeacher"
            class="acct__btn acct__btn--gold"
            @click="goDashboard"
          >
            学生管理
          </button>
          <button
            v-if="auth.isTeacher"
            class="acct__btn"
            @click="toggleGodMode"
          >
            {{ auth.godMode ? '关闭神力' : '开启神力' }}
          </button>
          <button class="acct__btn acct__btn--cinnabar" @click="handleLogout">
            退出修行
          </button>
        </div>

        <!-- 学分 -->
        <div class="acct__divider"></div>
        <div class="acct__credits">
          <span class="acct__credits-nb">{{ game.totalCredits }}</span>
          <span class="acct__credits-label">学分</span>
          <span class="acct__credits-badges">{{ game.badges.length }}/6关 · {{ game.stepBadges.length }}步</span>
        </div>

        <!-- 影神册入口 -->
        <button class="acct__btn acct__btn--bestiary" @click="goBestiary">
          📜 影神册
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const game = useGameStore()

const expanded = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
}

function toggleGodMode() {
  auth.toggleGodMode()
}

function goDashboard() {
  expanded.value = false
  router.push('/dashboard')
}

function goBestiary() {
  expanded.value = false
  router.push('/bestiary')
}

async function handleLogout() {
  expanded.value = false
  await auth.logout()
  router.push('/auth')
}
</script>

<style scoped>
.acct {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* ---- 印章按钮 ---- */
.acct__seal {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid var(--cinnabar);
  background: rgba(245, 240, 232, 0.85);
  cursor: pointer;
  position: relative;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  transform: rotate(2deg);
  user-select: none;
}

.acct__seal::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(194, 58, 43, 0.4);
  pointer-events: none;
}

.acct__seal:hover {
  transform: rotate(0deg) scale(1.08);
  box-shadow: 0 0 20px rgba(194, 58, 43, 0.15);
  background: var(--paper);
}

.acct__icon {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--cinnabar);
  line-height: 1;
}

/* ---- 展开面板 ---- */
.acct__panel {
  background: rgba(245, 240, 232, 0.95);
  border: 1px solid var(--ink-pale);
  padding: 20px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 面板顶部毛笔飞白装饰 */
.acct__panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    var(--ink-pale) 20%,
    var(--ink-dark) 50%,
    var(--ink-pale) 80%,
    transparent
  );
  opacity: 0.6;
}

/* 面板底部飞白 */
.acct__panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--ink-pale) 30%,
    var(--ink-medium) 50%,
    var(--ink-pale) 70%,
    transparent
  );
  opacity: 0.4;
}

/* ---- 用户信息行 ---- */
.acct__info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.acct__name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink-black);
  letter-spacing: 0.08em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.acct__role {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1.5px solid var(--ink-medium);
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--ink-medium);
  flex-shrink: 0;
}

.acct__role--teacher {
  border-color: var(--gold);
  color: var(--gold);
}

/* ---- 上帝模式 ---- */
.acct__god {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  margin-bottom: 4px;
}

.acct__god-eye {
  font-size: 0.85rem;
  animation: glow-pulse 2s ease-in-out infinite;
}

.acct__god-text {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--cinnabar);
  letter-spacing: 0.1em;
}

/* ---- 分割线 ---- */
.acct__divider {
  height: 1px;
  margin: 10px 0;
  background: linear-gradient(
    to right,
    transparent,
    var(--ink-pale) 30%,
    var(--ink-light) 50%,
    var(--ink-pale) 70%,
    transparent
  );
}

/* ---- 按钮组 ---- */
.acct__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.acct__btn {
  display: block;
  width: 100%;
  padding: 7px 12px;
  background: transparent;
  border: 1px solid var(--ink-pale);
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--ink-dark);
  cursor: pointer;
  text-align: center;
  letter-spacing: 0.06em;
  transition: all 0.3s ease;
}

.acct__btn:hover {
  border-color: var(--ink-dark);
  color: var(--ink-black);
  background: rgba(26, 26, 26, 0.03);
}

.acct__btn--gold {
  border-color: var(--gold);
  color: #8B7A3A;
}

.acct__btn--gold:hover {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
  color: var(--gold);
}

.acct__btn--cinnabar {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.acct__btn--cinnabar:hover {
  background: rgba(194, 58, 43, 0.06);
}

.acct__btn--bestiary {
  border-color: var(--ink-medium);
  color: var(--ink-dark);
  margin-top: 6px;
  font-family: var(--font-display);
  letter-spacing: 0.1em;
}

.acct__btn--bestiary:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(201, 168, 76, 0.06);
}

/* ---- 学分 ---- */
.acct__credits {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.acct__credits-nb {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--gold);
  line-height: 1;
}

.acct__credits-label {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--ink-medium);
  letter-spacing: 0.1em;
}

.acct__credits-badges {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ink-light);
}

/* ---- 面板动画 ---- */
.acct-panel-enter-active {
  animation: acct-drop 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.acct-panel-leave-active {
  animation: acct-drop 0.25s cubic-bezier(0.22, 1, 0.36, 1) reverse forwards;
}

@keyframes acct-drop {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
