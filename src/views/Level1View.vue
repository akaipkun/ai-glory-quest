<template>
  <div class="level1">
    <!-- 开场动画 -->
    <transition name="ink-fade">
      <div v-if="showIntro" class="level1__intro">
        <canvas ref="introCanvas" class="level1__intro-canvas"></canvas>
        <div class="level1__intro-content">
          <div class="level1__intro-icon ink-animate-splash">🪨</div>
          <h1 class="level1__intro-title ink-animate-converge delay-1">灵石出世</h1>
          <p class="level1__intro-subtitle ink-animate-converge delay-2">AI · 从混沌中诞生</p>
          <p class="level1__intro-text body-text ink-animate-converge delay-3">
            天地初开，花果山顶的灵石吸收日月精华<br/>
            ——正如人工智能从人类千年智慧中孕育而生
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">
            进入闯关
          </button>
        </div>
      </div>
    </transition>

    <!-- 交互区域 -->
    <div v-if="!showIntro && !showCompletion" class="level1__content">
      <!-- 顶部导航 -->
      <div class="level1__nav">
        <button class="level1__nav-back" @click="$router.push('/')">
          ← 返回
        </button>
        <div class="level1__nav-steps">
          <span
            v-for="(step, i) in steps"
            :key="i"
            class="level1__nav-step"
            :class="{
              'level1__nav-step--active': currentStep === i,
              'level1__nav-step--done': i < currentStep,
              'level1__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null"
          >
            {{ i + 1 }}
          </span>
        </div>
        <span class="level1__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <!-- 步骤内容 -->
      <transition name="ink-fade" mode="out-in">
        <TimelineScroll
          v-if="currentStep === 0"
          key="timeline"
          @complete="goNext"
        />
        <TuringTest
          v-else-if="currentStep === 1"
          key="turing"
          @complete="goNext"
        />
        <ThreeRealms
          v-else-if="currentStep === 2"
          key="realms"
          @complete="finishLevel"
        />
      </transition>
    </div>

    <!-- 通关画面 -->
    <transition name="ink-fade">
      <div v-if="showCompletion" class="level1__complete">
        <canvas ref="completeCanvas" class="level1__complete-canvas"></canvas>
        <div class="level1__complete-content">
          <div class="level1__complete-seal ink-animate-splash">
            <div class="level1__complete-seal-inner">
              <span class="level1__complete-seal-icon">🪨</span>
              <span class="level1__complete-seal-text">灵石出世</span>
              <span class="level1__complete-seal-sub">AI启蒙者</span>
            </div>
          </div>
          <p class="level1__complete-credits ink-animate-converge delay-2">+1 学分</p>
          <p class="level1__complete-desc body-text ink-animate-converge delay-3">
            你已领悟 AI 的起源与三大流派<br/>
            下一关，将进入机器学习的世界
          </p>
          <div class="level1__complete-actions ink-animate-converge delay-4">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="goNextLevel">进入第二关 →</button>
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
import TimelineScroll from '../components/level1/TimelineScroll.vue'
import TuringTest from '../components/level1/TuringTest.vue'
import ThreeRealms from '../components/level1/ThreeRealms.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()

const showIntro = ref(true)
const showCompletion = ref(false)
const currentStep = ref(0)
const steps = ['AI千年卷轴', '辨妖辨AI', 'AI三界']

const introCanvas = ref(null)
const completeCanvas = ref(null)
let introAnimId = null
let completeAnimId = null

function startLevel() {
  showIntro.value = false
}

function goToStep(index) {
  if (auth.isGodMode) { currentStep.value = index }
}

function goNext() {
  if (currentStep.value < 2) {
    game.earnStepBadge(1, currentStep.value)
    currentStep.value++
  }
}

function finishLevel(score = 85) {
  game.completeLevel(1, score)
  showCompletion.value = true
  initCompleteCanvas()
  celebrate('medium')
}

function goNextLevel() {
  game.unlockLevel(2)
  router.push('/level/2')
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

  let particles = []

  // 创建初始粒子
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 400,
      y: canvas.height * 0.5 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.3 - Math.random() * 0.5,
      size: 1 + Math.random() * 4,
      life: Math.random()
    })
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 大墨晕
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height * 0.55, 0,
      canvas.width / 2, canvas.height * 0.55, 250
    )
    gradient.addColorStop(0, 'rgba(26, 26, 26, 0.06)')
    gradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.03)')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 粒子上升
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.005
      if (p.life <= 0) {
        p.life = 1
        p.x = canvas.width / 2 + (Math.random() - 0.5) * 400
        p.y = canvas.height * 0.7
        p.vx = (Math.random() - 0.5) * 0.8
        p.size = 1 + Math.random() * 4
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${p.life * 0.12})`
      ctx.fill()
    }

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

  let angle = 0

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    angle += 0.005

    // 旋转墨蝶
    for (let i = 0; i < 6; i++) {
      const a = angle + (i / 6) * Math.PI * 2
      const r = 120 + Math.sin(angle * 0.5 + i) * 30
      const x = canvas.width / 2 + Math.cos(a) * r
      const y = canvas.height / 2 + Math.sin(a * 0.7) * 50

      ctx.beginPath()
      ctx.ellipse(x - 6, y, 6, 3, a * 0.5, 0, Math.PI * 2)
      ctx.ellipse(x + 6, y, 6, 3, -a * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${0.1 + Math.sin(a) * 0.05})`
      ctx.fill()
    }

    completeAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  setTimeout(() => initIntroCanvas(), 100)
})

onUnmounted(() => {
  if (introAnimId) cancelAnimationFrame(introAnimId)
  if (completeAnimId) cancelAnimationFrame(completeAnimId)
})
</script>

<style scoped>
.level1 {
  min-height: 100vh;
  position: relative;
}

/* 开场 */
.level1__intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
}
.level1__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level1-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }

.level1__intro-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.level1__intro-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
  padding: 24px;
}

.level1__intro-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  display: inline-block;
}

.level1__intro-title {
  font-size: 3rem;
  letter-spacing: 0.3em;
  margin-bottom: 12px;
}

.level1__intro-subtitle {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--ink-medium);
  letter-spacing: 0.2em;
  margin-bottom: 24px;
}

.level1__intro-text {
  font-size: 0.9rem;
  color: var(--ink-light);
  margin-bottom: 32px;
  line-height: 2;
}

/* 导航 */
.level1__nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: rgba(245, 240, 232, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--ink-pale);
}

.level1__nav-back {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--ink-medium);
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.3s;
}

.level1__nav-back:hover {
  color: var(--ink-black);
}

.level1__nav-steps {
  display: flex;
  gap: 8px;
}

.level1__nav-step {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ink-pale);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-light);
  transition: all 0.3s ease;
}

.level1__nav-step--active {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.05);
}

.level1__nav-step--done {
  border-color: var(--verdant);
  color: var(--verdant);
}

.level1__nav-step--clickable {
  cursor: pointer;
}
.level1__nav-step--clickable:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(201,168,76,0.08);
}

.level1__nav-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  text-align: right;
}

/* 内容区 */
.level1__content {
  padding-top: 60px;
  min-height: 100vh;
}

/* 通关 */
.level1__complete {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
}

.level1__complete-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.level1__complete-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.level1__complete-seal {
  display: inline-block;
  margin-bottom: 24px;
}

.level1__complete-seal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 48px;
  border: 4px solid var(--cinnabar);
  transform: rotate(-3deg);
  position: relative;
}

.level1__complete-seal-inner::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid var(--cinnabar);
  opacity: 0.3;
}

.level1__complete-seal-icon {
  font-size: 3rem;
}

.level1__complete-seal-text {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--cinnabar);
  letter-spacing: 0.3em;
}

.level1__complete-seal-sub {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--cinnabar);
  letter-spacing: 0.2em;
}

.level1__complete-credits {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  margin-bottom: 16px;
}

.level1__complete-desc {
  color: var(--ink-medium);
  margin-bottom: 32px;
  line-height: 2;
}

.level1__complete-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 过渡 */
.ink-fade-enter-active {
  animation: ink-bleed 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.ink-fade-leave-active {
  animation: ink-converge 0.6s cubic-bezier(0.22, 1, 0.36, 1) reverse forwards;
}
</style>
