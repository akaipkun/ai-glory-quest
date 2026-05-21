<template>
  <div class="level6">
    <!-- 开场动画 -->
    <transition name="ink-fade">
      <div v-if="showIntro" class="level6__intro">
        <canvas ref="introCanvas" class="level6__intro-canvas"></canvas>
        <div class="level6__intro-content">
          <div class="level6__intro-icon ink-animate-splash">💥</div>
          <h1 class="level6__intro-title ink-animate-converge delay-1">团战时刻</h1>
          <p class="level6__intro-subtitle ink-animate-converge delay-2">强化学习 · 多智能体协作</p>
          <p class="level6__intro-text body-text ink-animate-converge delay-3">
            五人齐心，其利断金<br/>
            多智能体协作的终极艺术
          </p>
          <button class="ink-btn ink-animate-converge delay-4" @click="startLevel">进入闯关</button>
        </div>
      </div>
    </transition>

    <!-- 交互区域 -->
    <div v-if="!showIntro && !showCompletion" class="level6__content">
      <!-- 顶部导航 -->
      <div class="level6__nav">
        <button class="level6__nav-back" @click="$router.push('/')">← 返回</button>
        <div class="level6__nav-steps">
          <span v-for="(step, i) in steps" :key="i" class="level6__nav-step"
            :class="{
              'level6__nav-step--active': currentStep === i,
              'level6__nav-step--done': i < currentStep,
              'level6__nav-step--clickable': auth.isGodMode
            }"
            @click="auth.isGodMode ? goToStep(i) : null">{{ i + 1 }}</span>
        </div>
        <span class="level6__nav-title">{{ steps[currentStep] }}</span>
      </div>

      <transition name="ink-fade" mode="out-in">
        <RLTraining v-if="currentStep === 0" key="rl" @complete="goNext" />
        <MultiAgentCoop v-else-if="currentStep === 1" key="coop" @complete="goNext" />
        <FiveVFiveBattle v-else-if="currentStep === 2" key="battle" @complete="finishLevel" />
      </transition>
    </div>

    <!-- 通关画面（终极通关） -->
    <transition name="ink-fade">
      <div v-if="showCompletion" class="level6__complete">
        <canvas ref="completeCanvas" class="level6__complete-canvas"></canvas>
        <div class="level6__complete-content">
          <div class="level6__complete-seal ink-animate-splash">
            <div class="level6__complete-seal-inner">
              <span class="level6__complete-seal-icon">💥</span>
              <span class="level6__complete-seal-text">五杀</span>
              <span class="level6__complete-seal-sub">AI战略师</span>
            </div>
          </div>
          <p class="level6__complete-credits ink-animate-converge delay-2">+2 学分</p>
          <p class="level6__complete-desc body-text ink-animate-converge delay-3">
            恭喜你通过了全部六关！<br/>
            从灵石出世到团战时刻，你已走完AI学习之路
          </p>

          <!-- 集齐勋章 -->
          <div class="level6__badges ink-animate-converge delay-4">
            <div class="level6__badges-title">🏆 集齐六枚勋章</div>
            <div class="level6__badges-grid">
              <span v-for="badge in allBadges" :key="badge.id" class="level6__badge">
                <span class="level6__badge-icon">{{ badge.icon }}</span>
                <span class="level6__badge-name">{{ badge.name }}</span>
              </span>
            </div>
            <div class="level6__badges-bonus">
              <span class="level6__badges-bonus-icon">⭐</span>
              <span class="level6__badges-bonus-text">集齐奖励：额外 +3 学分</span>
            </div>
          </div>

          <p class="level6__complete-total body-text ink-animate-converge delay-5">
            总学分: <span class="level6__complete-total-value">{{ game.totalCredits }}</span> / 13
          </p>

          <div class="level6__complete-actions ink-animate-converge delay-5">
            <button class="ink-btn" @click="$router.push('/')">返回地图</button>
            <button class="ink-btn ink-btn--gold" @click="showCertificate = true">🎓 查看成就证书</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 成就证书 -->
    <transition name="ink-fade">
      <div v-if="showCertificate" class="level6__certificate">
        <div class="level6__certificate-content">
          <div class="level6__certificate-seal">
            <span class="level6__certificate-icon">🐵</span>
            <span class="level6__certificate-title">AI齐天大圣</span>
          </div>
          <p class="level6__certificate-subtitle">完成全部六关闯关</p>
          <div class="level6__certificate-badges">
            <span v-for="badge in allBadges" :key="badge.id" class="level6__cert-badge">
              {{ badge.icon }}
            </span>
          </div>
          <p class="level6__certificate-text body-text">
            此证明持有者已完成「AI荣耀闯关」全部六个关卡的学习与挑战，<br/>
            掌握了AI定义、机器学习、神经网络、深度学习、生成式AI和强化学习等核心知识，<br/>
            展现了出色的学习能力和实践技能。
          </p>
          <p class="level6__certificate-credits">
            总获得学分：<strong>{{ game.totalCredits }}</strong> / 13
          </p>
          <div class="level6__certificate-actions">
            <button class="ink-btn" @click="showCertificate = false">关闭</button>
            <button class="ink-btn ink-btn--gold" @click="$router.push('/')">返回地图</button>
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
import RLTraining from '../components/level6/RLTraining.vue'
import MultiAgentCoop from '../components/level6/MultiAgentCoop.vue'
import FiveVFiveBattle from '../components/level6/FiveVFiveBattle.vue'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()

const showIntro = ref(true)
const showCompletion = ref(false)
const showCertificate = ref(false)
const currentStep = ref(0)
const steps = ['新手训练营', '团战演练', '巅峰对决']
const introCanvas = ref(null)
const completeCanvas = ref(null)
let introAnimId = null
let completeAnimId = null

const allBadges = [
  { id: 1, icon: '🪨', name: '灵石出世' },
  { id: 2, icon: '🔰', name: '峡谷修炼' },
  { id: 3, icon: '🔥', name: '火眼金睛' },
  { id: 4, icon: '👑', name: '王者排位' },
  { id: 5, icon: '🪶', name: '七十二变' },
  { id: 6, icon: '💥', name: '团战时刻' }
]

function startLevel() { showIntro.value = false }
function goToStep(index) { if (auth.isGodMode) { currentStep.value = index } }
function goNext() { if (currentStep.value < 2) { game.earnStepBadge(6, currentStep.value); currentStep.value++ } }
function finishLevel(score = 85) { game.completeLevel(6, score); showCompletion.value = true; initCompleteCanvas(); celebrate('grand') }

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

    // Five converging lines (representing 5 heroes)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + t * 0.3
      const r1 = 30, r2 = 120
      const cx = canvas.width / 2, cy = canvas.height * 0.4

      const x1 = cx + Math.cos(angle) * r1
      const y1 = cy + Math.sin(angle) * r1
      const x2 = cx + Math.cos(angle) * r2
      const y2 = cy + Math.sin(angle) * r2

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(194, 58, 43, ${0.1 + Math.sin(t + i) * 0.05})`
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Center glow
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height * 0.4, 0,
      canvas.width / 2, canvas.height * 0.4, 80
    )
    grad.addColorStop(0, 'rgba(194, 58, 43, 0.08)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height * 0.4, 80, 0, Math.PI * 2)
    ctx.fill()

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
    t += 0.006

    // Celebratory particles - all colors
    const colors = [
      { r: 194, g: 58, b: 43 },
      { r: 201, g: 168, b: 76 },
      { r: 74, g: 124, b: 111 },
      { r: 106, g: 74, b: 124 }
    ]

    for (let i = 0; i < 20; i++) {
      const x = canvas.width * (0.05 + Math.sin(t + i * 1.3) * 0.45 + 0.45)
      const y = canvas.height * (0.1 + Math.cos(t * 0.8 + i * 1.7) * 0.4 + 0.4)
      const col = colors[i % 4]

      ctx.beginPath()
      ctx.arc(x, y, 2 + Math.sin(t * 2 + i) * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.1 + Math.sin(t + i) * 0.05})`
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
.level6 { min-height: 100vh; position: relative; }

.level6__intro { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); }
.level6__intro::before { content: ''; position: absolute; inset: 0; background: url('/images/level6-illustration.png') center/cover; opacity: 0.08; pointer-events: none; }
.level6__intro-canvas { position: absolute; inset: 0; pointer-events: none; }
.level6__intro-content { position: relative; z-index: 1; text-align: center; max-width: 500px; padding: 24px; }
.level6__intro-icon { font-size: 4rem; margin-bottom: 24px; display: inline-block; }
.level6__intro-title { font-size: 3rem; letter-spacing: 0.3em; margin-bottom: 12px; }
.level6__intro-subtitle { font-family: var(--font-display); font-size: 1rem; color: var(--ink-medium); letter-spacing: 0.2em; margin-bottom: 24px; }
.level6__intro-text { font-size: 0.9rem; color: var(--ink-light); margin-bottom: 32px; line-height: 2; }

.level6__nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: rgba(245,240,232,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--ink-pale); }
.level6__nav-back { background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-medium); cursor: pointer; padding: 4px 8px; }
.level6__nav-back:hover { color: var(--ink-black); }
.level6__nav-steps { display: flex; gap: 8px; }
.level6__nav-step { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--ink-pale); font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-light); transition: all 0.3s ease; }
.level6__nav-step--active { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.05); }
.level6__nav-step--done { border-color: var(--verdant); color: var(--verdant); }
.level6__nav-step--clickable { cursor: pointer; }
.level6__nav-step--clickable:hover { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
.level6__nav-title { flex: 1; font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.15em; text-align: right; }

.level6__content { padding-top: 60px; min-height: 100vh; }

.level6__complete { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: var(--paper); overflow-y: auto; }
.level6__complete-canvas { position: fixed; inset: 0; pointer-events: none; }
.level6__complete-content { position: relative; z-index: 1; text-align: center; padding: 40px 24px; max-width: 600px; }

.level6__complete-seal { display: inline-block; margin-bottom: 24px; }
.level6__complete-seal-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 48px; border: 4px solid var(--cinnabar); transform: rotate(-3deg); position: relative; }
.level6__complete-seal-inner::after { content: ''; position: absolute; inset: 6px; border: 1px solid var(--cinnabar); opacity: 0.3; }
.level6__complete-seal-icon { font-size: 3rem; }
.level6__complete-seal-text { font-family: var(--font-display); font-size: 2rem; color: var(--cinnabar); letter-spacing: 0.3em; }
.level6__complete-seal-sub { font-family: var(--font-body); font-size: 0.8rem; color: var(--cinnabar); letter-spacing: 0.2em; }

.level6__complete-credits { font-family: var(--font-display); font-size: 2rem; color: var(--gold); letter-spacing: 0.2em; margin-bottom: 16px; }
.level6__complete-desc { color: var(--ink-medium); margin-bottom: 24px; line-height: 2; }

.level6__badges { margin-bottom: 24px; padding: 20px; border: 1px solid var(--gold); background: rgba(201,168,76,0.04); }
.level6__badges-title { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 12px; }
.level6__badges-grid { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
.level6__badge { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 14px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); }
.level6__badge-icon { font-size: 1.5rem; }
.level6__badge-name { font-size: 0.65rem; color: var(--ink-medium); }
.level6__badges-bonus { display: flex; align-items: center; gap: 8px; justify-content: center; }
.level6__badges-bonus-icon { font-size: 1.2rem; color: var(--gold); }
.level6__badges-bonus-text { font-family: var(--font-display); font-size: 0.9rem; color: var(--gold); letter-spacing: 0.1em; }

.level6__complete-total { font-size: 1.1rem; color: var(--ink-medium); margin-bottom: 24px; }
.level6__complete-total-value { font-family: var(--font-display); font-size: 2rem; color: var(--gold); letter-spacing: 0.1em; }

.level6__complete-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

/* Certificate */
.level6__certificate { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(26,26,26,0.6); }
.level6__certificate-content { max-width: 500px; padding: 48px 40px; background: var(--paper); text-align: center; border: 8px double var(--cinnabar); position: relative; }
.level6__certificate-seal { margin-bottom: 16px; }
.level6__certificate-icon { font-size: 4rem; display: block; margin-bottom: 8px; }
.level6__certificate-title { font-family: var(--font-display); font-size: 2.5rem; color: var(--cinnabar); letter-spacing: 0.3em; }
.level6__certificate-subtitle { font-family: var(--font-body); font-size: 0.9rem; color: var(--ink-medium); margin-bottom: 20px; }
.level6__certificate-badges { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.level6__cert-badge { font-size: 2rem; }
.level6__certificate-text { font-size: 0.85rem; color: var(--ink-dark); line-height: 2; margin-bottom: 20px; }
.level6__certificate-credits { font-size: 1.1rem; color: var(--ink-dark); margin-bottom: 24px; }
.level6__certificate-credits strong { color: var(--gold); font-family: var(--font-display); font-size: 1.5rem; }
.level6__certificate-actions { display: flex; gap: 12px; justify-content: center; }

.ink-fade-enter-active { animation: ink-bleed 1s cubic-bezier(0.22,1,0.36,1) forwards; }
.ink-fade-leave-active { animation: ink-converge 0.6s cubic-bezier(0.22,1,0.36,1) reverse forwards; }
</style>
