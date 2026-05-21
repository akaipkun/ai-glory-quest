<template>
  <div class="level2">
    <!-- 开场动画 -->
    <transition name="ink-fade">
      <div v-if="showIntro" class="level2__intro">
        <canvas ref="introCanvas" class="level2__intro-canvas"></canvas>
        <div class="level2__intro-content">
          <div class="level2__intro-icon ink-animate-splash">⚔️</div>
          <h1 class="level2__intro-title ink-animate-converge delay-1">峡谷修炼</h1>
          <p class="level2__intro-subtitle ink-animate-converge delay-2">机器学习 · 从青铜到王者</p>
          <p class="level2__intro-text body-text ink-animate-converge delay-3">
            英雄不问出处，模型无论高低<br/>
            唯看修炼几何
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">
            进入闯关
          </button>
        </div>
      </div>
    </transition>

    <!-- 交互区域 -->
    <div v-if="!showIntro && !showCompletion" class="level2__content">
      <!-- 顶部导航 -->
      <div class="level2__nav">
        <button class="level2__nav-back" @click="$router.push('/')">
          ← 返回
        </button>
        <div class="level2__nav-steps">
          <span
            v-for="(step, i) in steps"
            :key="i"
            class="level2__nav-step"
            :class="{
              'level2__nav-step--active': currentStep === i,
              'level2__nav-step--done': i < currentStep,
              'level2__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null"
          >
            {{ i + 1 }}
          </span>
        </div>
        <span class="level2__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <!-- 步骤内容 -->
      <transition name="ink-fade" mode="out-in">
        <HeroTraining
          v-if="currentStep === 0"
          key="training"
          @complete="onTrainingComplete"
        />
        <AlchemyFurnace
          v-else-if="currentStep === 1"
          key="furnace"
          @complete="onFurnaceComplete"
        />
        <ArenaRanking
          v-else-if="currentStep === 2"
          key="arena"
          ref="arenaRef"
          @complete="finishLevel"
        />
      </transition>
    </div>

    <!-- 通关画面 -->
    <transition name="ink-fade">
      <div v-if="showCompletion" class="level2__complete">
        <canvas ref="completeCanvas" class="level2__complete-canvas"></canvas>
        <div class="level2__complete-content">
          <div class="level2__complete-seal ink-animate-splash">
            <div class="level2__complete-seal-inner">
              <span class="level2__complete-seal-icon">🔰</span>
              <span class="level2__complete-seal-text">修炼之印</span>
              <span class="level2__complete-seal-sub">AI训练师</span>
            </div>
          </div>
          <p class="level2__complete-credits ink-animate-converge delay-2">+1 学分</p>
          <p class="level2__complete-desc body-text ink-animate-converge delay-3">
            你已掌握机器学习训练的核心流程<br/>
            下一关，将进入神经网络的世界
          </p>
          <div class="level2__complete-actions ink-animate-converge delay-4">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="goNextLevel">进入第三关 →</button>
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
import HeroTraining from '../components/level2/HeroTraining.vue'
import AlchemyFurnace from '../components/level2/AlchemyFurnace.vue'
import ArenaRanking from '../components/level2/ArenaRanking.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()

const showIntro = ref(true)
const showCompletion = ref(false)
const currentStep = ref(0)
const steps = ['英雄修炼场', '炼丹炉', '峡谷排位赛']
const arenaRef = ref(null)

const introCanvas = ref(null)
const completeCanvas = ref(null)
let introAnimId = null
let completeAnimId = null

let trainingAccuracy = 0
let furnaceBest = 0

function startLevel() {
  showIntro.value = false
}

function goToStep(index) {
  if (auth.isGodMode) { currentStep.value = index }
}

function onTrainingComplete(accuracy) {
  trainingAccuracy = accuracy
  game.earnStepBadge(2, 0)
  currentStep.value = 1
}

function onFurnaceComplete(best) {
  furnaceBest = best
  game.earnStepBadge(2, 1)
  const finalAccuracy = Math.max(trainingAccuracy, furnaceBest)
  if (arenaRef.value) {
    arenaRef.value.setAccuracy(finalAccuracy)
  }
  currentStep.value = 2
}

function finishLevel(score) {
  game.completeLevel(2, score)
  showCompletion.value = true
  initCompleteCanvas()
  celebrate('medium')
}

function goNextLevel() {
  game.unlockLevel(3)
  router.push('/level/3')
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

  const particles = []
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.7 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
      size: 2 + Math.random() * 5,
      life: Math.random()
    })
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.005
      if (p.life <= 0) {
        p.life = 1
        p.x = Math.random() * canvas.width
        p.y = canvas.height * 0.8
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${p.life * 0.1})`
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

    // 墨点旋转
    for (let i = 0; i < 6; i++) {
      const a = angle + (i / 6) * Math.PI * 2
      const r = 100 + Math.sin(angle + i) * 20
      const x = canvas.width / 2 + Math.cos(a) * r
      const y = canvas.height / 2 + Math.sin(a) * 30

      ctx.beginPath()
      ctx.arc(x, y, 3 + Math.sin(a) * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${0.08 + Math.sin(a) * 0.04})`
      ctx.fill()
    }

    completeAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  setTimeout(initIntroCanvas, 100)
})

onUnmounted(() => {
  if (introAnimId) cancelAnimationFrame(introAnimId)
  if (completeAnimId) cancelAnimationFrame(completeAnimId)
})
</script>

<style scoped>
.level2 {
  min-height: 100vh;
  position: relative;
}

/* 开场 */
.level2__intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
}
.level2__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level2-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }

.level2__intro-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.level2__intro-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
  padding: 24px;
}

.level2__intro-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  display: inline-block;
}

.level2__intro-title {
  font-size: 3rem;
  letter-spacing: 0.3em;
  margin-bottom: 12px;
}

.level2__intro-subtitle {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--ink-medium);
  letter-spacing: 0.2em;
  margin-bottom: 24px;
}

.level2__intro-text {
  font-size: 0.9rem;
  color: var(--ink-light);
  margin-bottom: 32px;
  line-height: 2;
}

/* 导航 */
.level2__nav {
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

.level2__nav-back {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--ink-medium);
  cursor: pointer;
  padding: 4px 8px;
}

.level2__nav-back:hover { color: var(--ink-black); }

.level2__nav-steps { display: flex; gap: 8px; }

.level2__nav-step {
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

.level2__nav-step--active {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.05);
}

.level2__nav-step--done {
  border-color: var(--verdant);
  color: var(--verdant);
}

.level2__nav-step--clickable {
  cursor: pointer;
}
.level2__nav-step--clickable:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(201,168,76,0.08);
}

.level2__nav-title {
  flex: 1;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  text-align: right;
}

/* 内容区 */
.level2__content {
  padding-top: 60px;
  min-height: 100vh;
}

/* 通关 */
.level2__complete {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
}

.level2__complete-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.level2__complete-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.level2__complete-seal { display: inline-block; margin-bottom: 24px; }

.level2__complete-seal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 48px;
  border: 4px solid var(--cinnabar);
  transform: rotate(-3deg);
  position: relative;
}

.level2__complete-seal-inner::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid var(--cinnabar);
  opacity: 0.3;
}

.level2__complete-seal-icon { font-size: 3rem; }

.level2__complete-seal-text {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--cinnabar);
  letter-spacing: 0.3em;
}

.level2__complete-seal-sub {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--cinnabar);
  letter-spacing: 0.2em;
}

.level2__complete-credits {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  margin-bottom: 16px;
}

.level2__complete-desc {
  color: var(--ink-medium);
  margin-bottom: 32px;
  line-height: 2;
}

.level2__complete-actions {
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
