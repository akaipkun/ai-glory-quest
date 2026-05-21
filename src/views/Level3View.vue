<template>
  <div class="level3">
    <transition name="ink-fade">
      <div v-if="showIntro" class="level3__intro">
        <canvas ref="introCanvas" class="level3__intro-canvas"></canvas>
        <div class="level3__intro-content">
          <div class="level3__intro-icon ink-animate-splash">👁️</div>
          <h1 class="level3__intro-title ink-animate-converge delay-1">火眼金睛</h1>
          <p class="level3__intro-subtitle ink-animate-converge delay-2">神经网络 · 从像素到认知</p>
          <p class="level3__intro-text body-text ink-animate-converge delay-3">
            火眼金睛，辨尽天下万象<br/>
            AI 的"看"，从像素开始
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">进入闯关</button>
        </div>
      </div>
    </transition>

    <div v-if="!showIntro && !showCompletion" class="level3__content">
      <div class="level3__nav">
        <button class="level3__nav-back" @click="$router.push('/')">← 返回</button>
        <div class="level3__nav-steps">
          <span v-for="(step, i) in steps" :key="i" class="level3__nav-step"
            :class="{
              'level3__nav-step--active': currentStep === i,
              'level3__nav-step--done': i < currentStep,
              'level3__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null">{{ i + 1 }}</span>
        </div>
        <span class="level3__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <transition name="ink-fade" mode="out-in">
        <FieryEyes v-if="currentStep === 0" key="eyes" @complete="goNext" />
        <BeastIdentifier v-else-if="currentStep === 1" key="beast" @complete="goNext" />
        <AdversarialExamples v-else-if="currentStep === 2" key="adv" @complete="finishLevel" />
      </transition>
    </div>

    <transition name="ink-fade">
      <div v-if="showCompletion" class="level3__complete">
        <div class="level3__complete-content">
          <div class="level3__complete-seal ink-animate-splash">
            <div class="level3__complete-seal-inner">
              <span class="level3__complete-seal-icon">🔥</span>
              <span class="level3__complete-seal-text">火眼金睛</span>
              <span class="level3__complete-seal-sub">AI鉴别师</span>
            </div>
          </div>
          <p class="level3__complete-credits ink-animate-converge delay-2">+2 学分</p>
          <p class="level3__complete-desc body-text ink-animate-converge delay-3">
            你已掌握神经网络如何"看"世界<br/>下一关，进入深度学习优化之道
          </p>
          <div class="level3__complete-actions ink-animate-converge delay-4">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="goNextLevel">进入第四关 →</button>
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
import FieryEyes from '../components/level3/FieryEyes.vue'
import BeastIdentifier from '../components/level3/BeastIdentifier.vue'
import AdversarialExamples from '../components/level3/AdversarialExamples.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()
const showIntro = ref(true)
const showCompletion = ref(false)
const currentStep = ref(0)
const steps = ['火眼金睛', '辨妖', '真假美猴王']
const introCanvas = ref(null)
let introAnimId = null

function startLevel() { showIntro.value = false }
function goToStep(index) { if (auth.isGodMode) { currentStep.value = index } }
function goNext() { if (currentStep.value < 2) { game.earnStepBadge(3, currentStep.value); currentStep.value++ } }
function finishLevel(score = 85) { game.completeLevel(3, score); showCompletion.value = true; celebrate('medium') }
function goNextLevel() { game.unlockLevel(4); router.push('/level/4') }

function initIntro() {
  const canvas = introCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  window.addEventListener('resize', resize); resize()

  let angle = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); angle += 0.02
    // 发光的眼睛
    const cx = canvas.width / 2, cy = canvas.height * 0.45
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120)
    grad.addColorStop(0, 'rgba(194, 58, 43, 0.12)')
    grad.addColorStop(0.5, 'rgba(194, 58, 43, 0.05)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.fill()

    // 瞳孔发光
    const px = cx + Math.cos(angle) * 8, py = cy + Math.sin(angle * 0.7) * 5
    ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(194, 58, 43, ${0.08 + Math.sin(angle) * 0.04})`; ctx.fill()

    introAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => setTimeout(initIntro, 100))
onUnmounted(() => { if (introAnimId) cancelAnimationFrame(introAnimId) })
</script>

<style scoped>
.level3 { min-height: 100vh; position: relative; }
.level3__intro { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level3__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level3-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }
.level3__intro-canvas { position: absolute; inset: 0; pointer-events: none; }
.level3__intro-content { position: relative; z-index: 1; text-align: center; max-width: 500px; padding: 24px; }
.level3__intro-icon { font-size: 4rem; margin-bottom: 24px; display: inline-block; }
.level3__intro-title { font-size: 3rem; letter-spacing: 0.3em; margin-bottom: 12px; }
.level3__intro-subtitle { font-family: var(--font-display); font-size: 1rem; color: var(--ink-medium); letter-spacing: 0.2em; margin-bottom: 24px; }
.level3__intro-text { font-size: 0.9rem; color: var(--ink-light); margin-bottom: 32px; line-height: 2; }
.level3__nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: rgba(245,240,232,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ink-pale); }
.level3__nav-back { background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-medium); cursor: pointer; padding: 4px 8px; }
.level3__nav-back:hover { color: var(--ink-black); }
.level3__nav-steps { display: flex; gap: 8px; }
.level3__nav-step { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--ink-pale); font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-light); transition: all 0.3s ease; }
.level3__nav-step--active { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.05); }
.level3__nav-step--done { border-color: var(--verdant); color: var(--verdant); }
.level3__nav-step--clickable { cursor: pointer; }
.level3__nav-step--clickable:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
.level3__nav-title { flex: 1; font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.15em; text-align: right; }
.level3__content { padding-top: 60px; min-height: 100vh; }
.level3__complete { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level3__complete-content { position: relative; z-index: 1; text-align: center; }
.level3__complete-seal { display: inline-block; margin-bottom: 24px; }
.level3__complete-seal-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 48px; border: 4px solid var(--cinnabar); transform: rotate(-3deg); position: relative; }
.level3__complete-seal-inner::after { content: ''; position: absolute; inset: 6px; border: 1px solid var(--cinnabar); opacity: 0.3; }
.level3__complete-seal-icon { font-size: 3rem; }
.level3__complete-seal-text { font-family: var(--font-display); font-size: 2rem; color: var(--cinnabar); letter-spacing: 0.3em; }
.level3__complete-seal-sub { font-family: var(--font-body); font-size: 0.8rem; color: var(--cinnabar); letter-spacing: 0.2em; }
.level3__complete-credits { font-family: var(--font-display); font-size: 2rem; color: var(--gold); letter-spacing: 0.2em; margin-bottom: 16px; }
.level3__complete-desc { color: var(--ink-medium); margin-bottom: 32px; line-height: 2; }
.level3__complete-actions { display: flex; gap: 16px; justify-content: center; }
.ink-fade-enter-active { animation: ink-bleed 1s cubic-bezier(0.22,1,0.36,1) forwards; }
.ink-fade-leave-active { animation: ink-converge 0.6s cubic-bezier(0.22,1,0.36,1) reverse forwards; }
</style>
