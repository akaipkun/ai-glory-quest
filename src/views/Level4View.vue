<template>
  <div class="level4">
    <!-- 开场动画 -->
    <transition name="ink-fade">
      <div v-if="showIntro" class="level4__intro">
        <canvas ref="introCanvas" class="level4__intro-canvas"></canvas>
        <div class="level4__intro-content">
          <div class="level4__intro-icon ink-animate-splash">👑</div>
          <h1 class="level4__intro-title ink-animate-converge delay-1">王者排位</h1>
          <p class="level4__intro-subtitle ink-animate-converge delay-2">深度学习 · 从调参到最优</p>
          <p class="level4__intro-text body-text ink-animate-converge delay-3">
            排位即优化，上分即调参<br/>
            最强王者之路，从每一轮调优开始
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">进入闯关</button>
        </div>
      </div>
    </transition>

    <!-- 交互区域 -->
    <div v-if="!showIntro && !showCompletion" class="level4__content">
      <!-- 顶部导航 -->
      <div class="level4__nav">
        <button class="level4__nav-back" @click="$router.push('/')">← 返回</button>
        <div class="level4__nav-steps">
          <span v-for="(step, i) in steps" :key="i" class="level4__nav-step"
            :class="{
              'level4__nav-step--active': currentStep === i,
              'level4__nav-step--done': i < currentStep,
              'level4__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null">{{ i + 1 }}</span>
        </div>
        <span class="level4__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <!-- 步骤内容 -->
      <transition name="ink-fade" mode="out-in">
        <HeroPool v-if="currentStep === 0" key="pool" @complete="onPoolComplete" />
        <RankedMatch v-else-if="currentStep === 1" key="ranked" @complete="onRankedComplete" />
        <FinalShowdown v-else-if="currentStep === 2" key="showdown" :score="finalScore" ref="showdownRef" @complete="finishLevel" />
      </transition>
    </div>

    <!-- 通关画面 -->
    <transition name="ink-fade">
      <div v-if="showCompletion" class="level4__complete">
        <canvas ref="completeCanvas" class="level4__complete-canvas"></canvas>
        <div class="level4__complete-content">
          <div class="level4__complete-seal ink-animate-splash">
            <div class="level4__complete-seal-inner">
              <span class="level4__complete-seal-icon">👑</span>
              <span class="level4__complete-seal-text">最强王者</span>
              <span class="level4__complete-seal-sub">AI调优师</span>
            </div>
          </div>
          <p class="level4__complete-credits ink-animate-converge delay-2">+2 学分</p>
          <p class="level4__complete-desc body-text ink-animate-converge delay-3">
            你已掌握深度学习模型调优的精髓<br/>下一关，进入生成式AI的创造世界
          </p>
          <div class="level4__complete-actions ink-animate-converge delay-4">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="goNextLevel">进入第五关 →</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { celebrate } from '../utils/confetti.js'
import HeroPool from '../components/level4/HeroPool.vue'
import RankedMatch from '../components/level4/RankedMatch.vue'
import FinalShowdown from '../components/level4/FinalShowdown.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()

const showIntro = ref(true)
const showCompletion = ref(false)
const currentStep = ref(0)
const steps = ['英雄池', '排位赛', '巅峰对决']
const showdownRef = ref(null)
const introCanvas = ref(null)
const completeCanvas = ref(null)
let introAnimId = null
let completeAnimId = null

let heroScore = 65
const finalScore = ref(60)

function startLevel() { showIntro.value = false }

function goToStep(index) { if (auth.isGodMode) { currentStep.value = index } }

function onPoolComplete(score) {
  heroScore = score
  game.earnStepBadge(4, 0)
  currentStep.value = 1
}

function onRankedComplete(score) {
  finalScore.value = score
  game.earnStepBadge(4, 1)
  currentStep.value = 2
}

function finishLevel(score) {
  game.completeLevel(4, score)
  showCompletion.value = true
  initCompleteCanvas()
  celebrate('medium')
}

function goNextLevel() {
  game.unlockLevel(5)
  router.push('/level/5')
}

function initIntroCanvas() {
  const canvas = introCanvas.value
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
    t += 0.01

    // Crown-like particles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + t
      const r = 80 + Math.sin(t * 2 + i) * 20
      const cx = canvas.width / 2 + Math.cos(angle) * r * 0.3
      const cy = canvas.height * 0.4 + Math.sin(angle) * r * 0.15

      ctx.beginPath()
      ctx.arc(cx, cy, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(201, 168, 76, ${0.15 + Math.sin(t * 2 + i) * 0.08})`
      ctx.fill()
    }

    // Center glow
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height * 0.4, 0,
      canvas.width / 2, canvas.height * 0.4, 100
    )
    grad.addColorStop(0, 'rgba(201, 168, 76, 0.06)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    introAnimId = requestAnimationFrame(animate)
  }
  animate()
}

function initCompleteCanvas() {
  const canvas = completeCanvas.value
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
    t += 0.008

    // Floating gold particles
    for (let i = 0; i < 12; i++) {
      const x = canvas.width * (0.1 + Math.sin(t + i * 1.7) * 0.4 + 0.4)
      const y = canvas.height * (0.2 + Math.cos(t * 0.7 + i * 2.1) * 0.3 + 0.3)
      const size = 2 + Math.sin(t + i * 1.3) * 1.5

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(201, 168, 76, ${0.1 + Math.sin(t + i) * 0.06})`
      ctx.fill()
    }

    completeAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => setTimeout(initIntroCanvas, 100))
onUnmounted(() => {
  if (introAnimId) cancelAnimationFrame(introAnimId)
  if (completeAnimId) cancelAnimationFrame(completeAnimId)
})
</script>

<style scoped>
.level4 { min-height: 100vh; position: relative; }

.level4__intro { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level4__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level4-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }
.level4__intro-canvas { position: absolute; inset: 0; pointer-events: none; }
.level4__intro-content { position: relative; z-index: 1; text-align: center; max-width: 500px; padding: 24px; }
.level4__intro-icon { font-size: 4rem; margin-bottom: 24px; display: inline-block; }
.level4__intro-title { font-size: 3rem; letter-spacing: 0.3em; margin-bottom: 12px; }
.level4__intro-subtitle { font-family: var(--font-display); font-size: 1rem; color: var(--ink-medium); letter-spacing: 0.2em; margin-bottom: 24px; }
.level4__intro-text { font-size: 0.9rem; color: var(--ink-light); margin-bottom: 32px; line-height: 2; }

.level4__nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: rgba(245,240,232,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ink-pale); }
.level4__nav-back { background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-medium); cursor: pointer; padding: 4px 8px; }
.level4__nav-back:hover { color: var(--ink-black); }
.level4__nav-steps { display: flex; gap: 8px; }
.level4__nav-step { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--ink-pale); font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-light); transition: all 0.3s ease; }
.level4__nav-step--active { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.05); }
.level4__nav-step--done { border-color: var(--verdant); color: var(--verdant); }
.level4__nav-step--clickable { cursor: pointer; }
.level4__nav-step--clickable:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
.level4__nav-title { flex: 1; font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.15em; text-align: right; }

.level4__content { padding-top: 60px; min-height: 100vh; }

.level4__complete { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level4__complete-canvas { position: absolute; inset: 0; pointer-events: none; }
.level4__complete-content { position: relative; z-index: 1; text-align: center; }
.level4__complete-seal { display: inline-block; margin-bottom: 24px; }
.level4__complete-seal-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 48px; border: 4px solid var(--cinnabar); transform: rotate(-3deg); position: relative; }
.level4__complete-seal-inner::after { content: ''; position: absolute; inset: 6px; border: 1px solid var(--cinnabar); opacity: 0.3; }
.level4__complete-seal-icon { font-size: 3rem; }
.level4__complete-seal-text { font-family: var(--font-display); font-size: 2rem; color: var(--cinnabar); letter-spacing: 0.3em; }
.level4__complete-seal-sub { font-family: var(--font-body); font-size: 0.8rem; color: var(--cinnabar); letter-spacing: 0.2em; }
.level4__complete-credits { font-family: var(--font-display); font-size: 2rem; color: var(--gold); letter-spacing: 0.2em; margin-bottom: 16px; }
.level4__complete-desc { color: var(--ink-medium); margin-bottom: 32px; line-height: 2; }
.level4__complete-actions { display: flex; gap: 16px; justify-content: center; }

.ink-fade-enter-active { animation: ink-bleed 1s cubic-bezier(0.22,1,0.36,1) forwards; }
.ink-fade-leave-active { animation: ink-converge 0.6s cubic-bezier(0.22,1,0.36,1) reverse forwards; }
</style>
