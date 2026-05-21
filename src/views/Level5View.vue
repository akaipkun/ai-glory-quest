<template>
  <div class="level5">
    <!-- 开场动画 -->
    <transition name="ink-fade">
      <div v-if="showIntro" class="level5__intro">
        <canvas ref="introCanvas" class="level5__intro-canvas"></canvas>
        <div class="level5__intro-content">
          <div class="level5__intro-icon ink-animate-splash">🪶</div>
          <h1 class="level5__intro-title ink-animate-converge delay-1">七十二变</h1>
          <p class="level5__intro-subtitle ink-animate-converge delay-2">生成式AI · 从描述到创造</p>
          <p class="level5__intro-text body-text ink-animate-converge delay-3">
            悟空七十二变，AI万变不离其宗<br/>
            一句提示词，万物皆可生
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">进入闯关</button>
        </div>
      </div>
    </transition>

    <!-- 交互区域 -->
    <div v-if="!showIntro && !showCompletion" class="level5__content">
      <!-- 顶部导航 -->
      <div class="level5__nav">
        <button class="level5__nav-back" @click="$router.push('/')">← 返回</button>
        <div class="level5__nav-steps">
          <span v-for="(step, i) in steps" :key="i" class="level5__nav-step"
            :class="{
              'level5__nav-step--active': currentStep === i,
              'level5__nav-step--done': i < currentStep,
              'level5__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null">{{ i + 1 }}</span>
        </div>
        <span class="level5__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <transition name="ink-fade" mode="out-in">
        <TransformationWorkshop v-if="currentStep === 0" key="workshop" @complete="goNext" />
        <LatentSpace v-else-if="currentStep === 1" key="latent" @complete="goNext" />
        <AIGeneratedDetection v-else-if="currentStep === 2" key="detection" @complete="finishLevel" />
      </transition>
    </div>

    <!-- 通关画面 -->
    <transition name="ink-fade">
      <div v-if="showCompletion" class="level5__complete">
        <canvas ref="completeCanvas" class="level5__complete-canvas"></canvas>
        <div class="level5__complete-content">
          <div class="level5__complete-seal ink-animate-splash">
            <div class="level5__complete-seal-inner">
              <span class="level5__complete-seal-icon">🪶</span>
              <span class="level5__complete-seal-text">七十二变</span>
              <span class="level5__complete-seal-sub">AI创作师</span>
            </div>
          </div>
          <p class="level5__complete-credits ink-animate-converge delay-2">+2 学分</p>
          <p class="level5__complete-desc body-text ink-animate-converge delay-3">
            你已掌握生成式AI的核心原理<br/>下一关，进入多智能体协作的终极挑战
          </p>
          <div class="level5__complete-actions ink-animate-converge delay-4">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="goNextLevel">进入第六关 →</button>
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
import TransformationWorkshop from '../components/level5/TransformationWorkshop.vue'
import LatentSpace from '../components/level5/LatentSpace.vue'
import AIGeneratedDetection from '../components/level5/AIGeneratedDetection.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()

const showIntro = ref(true)
const showCompletion = ref(false)
const currentStep = ref(0)
const steps = ['提示词工坊', '潜空间漫游', '真假难辨']
const introCanvas = ref(null)
const completeCanvas = ref(null)
let introAnimId = null
let completeAnimId = null

function startLevel() { showIntro.value = false }
function goToStep(index) { if (auth.isGodMode) { currentStep.value = index } }
function goNext() { if (currentStep.value < 2) { game.earnStepBadge(5, currentStep.value); currentStep.value++ } }
function finishLevel(score = 80) { game.completeLevel(5, score); showCompletion.value = true; initCompleteCanvas(); celebrate('medium') }
function goNextLevel() { game.unlockLevel(6); router.push('/level/6') }

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
    t += 0.008

    // Colorful morphing particles (representing transformation)
    const colors = [
      { r: 201, g: 168, b: 76 },
      { r: 194, g: 58, b: 43 },
      { r: 74, g: 124, b: 111 },
      { r: 106, g: 74, b: 124 }
    ]

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + t
      const r = 60 + Math.sin(t + i * 0.5) * 30
      const cx = canvas.width / 2 + Math.cos(angle) * r
      const cy = canvas.height * 0.4 + Math.sin(angle * 0.7 + t) * r * 0.3

      const col = colors[i % colors.length]
      ctx.beginPath()
      ctx.arc(cx, cy, 3 + Math.sin(t + i) * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + Math.sin(t * 2 + i) * 0.05})`
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

  let t = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    t += 0.01

    for (let i = 0; i < 15; i++) {
      const x = canvas.width * (0.1 + Math.sin(t + i * 1.5) * 0.4 + 0.4)
      const y = canvas.height * (0.2 + Math.cos(t * 0.6 + i * 1.8) * 0.3 + 0.3)
      ctx.beginPath()
      ctx.arc(x, y, 2 + Math.sin(t + i) * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(201, 168, 76, ${0.08 + Math.sin(t + i) * 0.04})`
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
.level5 { min-height: 100vh; position: relative; }

.level5__intro { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level5__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level5-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }
.level5__intro-canvas { position: absolute; inset: 0; pointer-events: none; }
.level5__intro-content { position: relative; z-index: 1; text-align: center; max-width: 500px; padding: 24px; }
.level5__intro-icon { font-size: 4rem; margin-bottom: 24px; display: inline-block; }
.level5__intro-title { font-size: 3rem; letter-spacing: 0.3em; margin-bottom: 12px; }
.level5__intro-subtitle { font-family: var(--font-display); font-size: 1rem; color: var(--ink-medium); letter-spacing: 0.2em; margin-bottom: 24px; }
.level5__intro-text { font-size: 0.9rem; color: var(--ink-light); margin-bottom: 32px; line-height: 2; }

.level5__nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: rgba(245,240,232,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ink-pale); }
.level5__nav-back { background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-medium); cursor: pointer; padding: 4px 8px; }
.level5__nav-back:hover { color: var(--ink-black); }
.level5__nav-steps { display: flex; gap: 8px; }
.level5__nav-step { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--ink-pale); font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-light); transition: all 0.3s ease; }
.level5__nav-step--active { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.05); }
.level5__nav-step--done { border-color: var(--verdant); color: var(--verdant); }
.level5__nav-step--clickable { cursor: pointer; }
.level5__nav-step--clickable:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
.level5__nav-title { flex: 1; font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.15em; text-align: right; }

.level5__content { padding-top: 60px; min-height: 100vh; }

.level5__complete { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level5__complete-canvas { position: absolute; inset: 0; pointer-events: none; }
.level5__complete-content { position: relative; z-index: 1; text-align: center; }
.level5__complete-seal { display: inline-block; margin-bottom: 24px; }
.level5__complete-seal-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 48px; border: 4px solid var(--cinnabar); transform: rotate(-3deg); position: relative; }
.level5__complete-seal-inner::after { content: ''; position: absolute; inset: 6px; border: 1px solid var(--cinnabar); opacity: 0.3; }
.level5__complete-seal-icon { font-size: 3rem; }
.level5__complete-seal-text { font-family: var(--font-display); font-size: 2rem; color: var(--cinnabar); letter-spacing: 0.3em; }
.level5__complete-seal-sub { font-family: var(--font-body); font-size: 0.8rem; color: var(--cinnabar); letter-spacing: 0.2em; }
.level5__complete-credits { font-family: var(--font-display); font-size: 2rem; color: var(--gold); letter-spacing: 0.2em; margin-bottom: 16px; }
.level5__complete-desc { color: var(--ink-medium); margin-bottom: 32px; line-height: 2; }
.level5__complete-actions { display: flex; gap: 16px; justify-content: center; }

.ink-fade-enter-active { animation: ink-bleed 1s cubic-bezier(0.22,1,0.36,1) forwards; }
.ink-fade-leave-active { animation: ink-converge 0.6s cubic-bezier(0.22,1,0.36,1) reverse forwards; }
</style>
