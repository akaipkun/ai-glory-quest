<template>
  <div class="hero-pool">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="深度学习架构 · 模型选角"
      subtitle="CNN vs RNN vs Transformer——不同架构的修炼之道"
      :principle="'深度学习模型架构的选择决定了模型的擅长领域。CNN（卷积神经网络）通过卷积核提取局部特征，在图像任务上无可匹敌；RNN/LSTM（循环神经网络）通过隐藏状态捕捉序列依赖，适合文本和时间序列；Transformer通过自注意力机制并行处理全局关系，是大语言模型的基石。架构选择 = 为任务选最合适的兵器。'"
      :gameMapping="'在英雄池中，赵云（CNN）擅图像之战，诸葛亮（RNN）精序列之术，武则天（Transformer）是全能型选手。参数量反映了模型的规模——越大的模型能力越强，但修炼（训练）也更慢。选择不是选最强者，而是选最适合当前任务的英雄。'"
      :tips="['CNN：参数量适中，训练快，图像任务首选，但不擅长处理长序列依赖', 'RNN/LSTM：参数少但训练慢（串行），适合时序数据，但容易梯度消失', 'Transformer：参数多，训练可并行加速，通用性最强，但小数据集上可能过拟合', '在实际项目中，通常先用简单架构建立基线，再逐步升级到复杂架构']"
      vizType="network"
      @close="showPrincipleTip = false"
    />

    <div class="hero__container">
      <h2 class="hero__title fade-in">🏆 英雄池 · 选择模型架构</h2>
      <p class="hero__subtitle body-text fade-in delay-1">不同的英雄阵容适合不同的对局——选择你的模型架构</p>

      <div class="hero__cards fade-in delay-2">
        <div
          v-for="(hero, i) in heroes"
          :key="i"
          class="hero__card"
          :class="{ 'hero__card--active': selected === i, 'hero__card--locked': hero.locked }"
          @click="selectHero(i)"
        >
          <div class="hero__card-emoji">{{ hero.emoji }}</div>
          <div class="hero__card-name">{{ hero.name }}</div>
          <div class="hero__card-title">{{ hero.title }}</div>
          <div class="hero__card-desc body-text">{{ hero.desc }}</div>

          <!-- 雷达图 -->
          <canvas :ref="el => setRadarCanvas(i, el)" class="hero__radar"></canvas>

          <div class="hero__stats">
            <div class="hero__stat">
              <span class="hero__stat-label">参数量</span>
              <span class="hero__stat-value">{{ hero.params }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hero__actions fade-in delay-3">
        <button
          class="ink-btn ink-btn--gold"
          :disabled="selected === null"
          @click="confirmSelect"
        >
          选择 {{ selected !== null ? heroes[selected].name : '' }} →
        </button>
      </div>

      <!-- 选中后详情 -->
      <transition name="ink-fade">
        <div v-if="confirmed" class="hero__detail fade-in">
          <div class="hero__detail-header">
            <span class="hero__detail-emoji">{{ heroes[selected].emoji }}</span>
            <span class="hero__detail-name">{{ heroes[selected].name }}</span>
          </div>
          <p class="hero__detail-text body-text">{{ heroes[selected].detail }}</p>
          <div class="hero__detail-bar">
            <div class="hero__detail-bar-label">模型加载中</div>
            <div class="hero__detail-bar-track">
              <div class="hero__detail-bar-fill" :style="{ width: loadProgress + '%' }"></div>
            </div>
            <span class="mono-text">{{ loadProgress }}%</span>
          </div>
          <button v-if="loadProgress >= 100" class="ink-btn" @click="$emit('complete', scoreValue)">
            开始排位 →
          </button>
        </div>
      </transition>

      <div class="hero__insight body-text fade-in delay-4">
        💡 不同模型架构有不同特长：<strong>CNN</strong>擅长图像特征提取，<strong>RNN</strong>擅长序列建模，
        <strong>Transformer</strong>通用性强但计算量大。选择适合任务的架构至关重要。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)

const heroes = [
  {
    emoji: '🗡️', name: '赵云·卷积将军', title: 'CNN 架构',
    desc: '擅长图像识别，局部特征提取王者',
    params: '10M',
    detail: '卷积神经网络通过卷积核在输入上滑动扫描，逐层提取从边缘到语义的特征。它在图像分类、目标检测等视觉任务上表现出色，是计算机视觉的基石架构。',
    radar: [0.9, 0.5, 0.3], // 准确率/速度/参数量效率
    locked: false
  },
  {
    emoji: '🧠', name: '诸葛亮·时序军师', title: 'RNN/LSTM 架构',
    desc: '擅长序列预测，时序数据处理高手',
    params: '5M',
    detail: '循环神经网络通过隐藏状态传递序列信息，LSTM通过遗忘门、输入门、输出门解决长期依赖问题。它适合文本生成、时间序列预测、语音识别等序列任务。',
    radar: [0.6, 0.4, 0.7],
    locked: false
  },
  {
    emoji: '👑', name: '武则天·全能女帝', title: 'Transformer 架构',
    desc: '通用任务全能型，自注意力机制',
    params: '25M',
    detail: 'Transformer完全基于自注意力机制，摒弃了递归结构，通过并行计算大幅提升训练效率。它是GPT、BERT等大语言模型的基础，在NLP、CV等多领域都达到了顶尖水平。',
    radar: [0.8, 0.3, 0.2],
    locked: false
  }
]

const selected = ref(null)
const confirmed = ref(false)
const loadProgress = ref(0)
const radarCanvases = ref([])
const scoreValue = ref(70)
let loadTimer = null

function setRadarCanvas(index, el) {
  if (el) radarCanvases.value[index] = el
}

function selectHero(index) {
  if (heroes[index].locked) return
  selected.value = index
  drawAllRadars()
}

function confirmSelect() {
  if (selected.value === null) return
  confirmed.value = true
  // Simulate model loading
  loadTimer = setInterval(() => {
    loadProgress.value += 2
    if (loadProgress.value >= 100) {
      clearInterval(loadTimer)
      loadTimer = null
      scoreValue.value = 65 + selected.value * 5 // Base score: 65/70/75
    }
  }, 50)
}

function drawRadar(index) {
  const canvas = radarCanvases.value[index]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const size = 120
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.scale(dpr, dpr)

  const cx = size / 2, cy = size / 2, r = 45
  const labels = ['准确率', '速度', '轻量']
  const values = heroes[index].radar

  ctx.clearRect(0, 0, size, size)

  // 网格
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * r * (ring / 3)
      const y = cy + Math.sin(angle) * r * (ring / 3)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // 轴线
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.12)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // 数据区域
  ctx.beginPath()
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
    const val = values[i] * r * 0.85
    const x = cx + Math.cos(angle) * val
    const y = cy + Math.sin(angle) * val
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()

  const isActive = index === selected.value
  ctx.fillStyle = isActive
    ? 'rgba(194, 58, 43, 0.15)'
    : 'rgba(26, 26, 26, 0.06)'
  ctx.fill()
  ctx.strokeStyle = isActive ? 'var(--cinnabar)' : 'rgba(26, 26, 26, 0.2)'
  ctx.lineWidth = isActive ? 2 : 1
  ctx.stroke()

  // 标签
  ctx.font = '9px "Noto Serif SC"'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'var(--ink-light)'
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
    const lx = cx + Math.cos(angle) * (r + 14)
    const ly = cy + Math.sin(angle) * (r + 14)
    ctx.fillText(labels[i], lx, ly + 3)
  }
}

function drawAllRadars() {
  heroes.forEach((_, i) => drawRadar(i))
}

onMounted(() => setTimeout(drawAllRadars, 200))
onUnmounted(() => { if (loadTimer) clearInterval(loadTimer) })
</script>

<style scoped>
.hero-pool { min-height: 80vh; padding: 40px 24px; }
.hero__container { max-width: 800px; margin: 0 auto; text-align: center; }
.hero__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.hero__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.hero__cards { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px; }

.hero__card {
  width: 220px; padding: 24px 16px 20px;
  border: 2px solid var(--ink-pale);
  cursor: pointer; transition: all 0.4s ease;
  background: rgba(245, 240, 232, 0.5);
  text-align: center;
}
.hero__card:hover { border-color: var(--ink-medium); transform: translateY(-6px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.hero__card--active { border-color: var(--cinnabar); background: rgba(194, 58, 43, 0.04); box-shadow: 0 0 20px rgba(194,58,43,0.1); }
.hero__card--locked { opacity: 0.4; cursor: not-allowed; }

.hero__card-emoji { font-size: 2.5rem; display: block; margin-bottom: 8px; }
.hero__card-name { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.1em; margin-bottom: 2px; }
.hero__card-title { font-family: var(--font-body); font-size: 0.75rem; color: var(--cinnabar); margin-bottom: 6px; }
.hero__card-desc { font-size: 0.75rem; color: var(--ink-light); margin-bottom: 12px; }

.hero__radar { margin: 0 auto 8px; }

.hero__stats { display: flex; justify-content: center; gap: 12px; }
.hero__stat { text-align: center; }
.hero__stat-label { font-size: 0.65rem; color: var(--ink-light); display: block; }
.hero__stat-value { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-dark); }

.hero__actions { margin-bottom: 20px; }

.hero__detail {
  padding: 24px; border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.6);
  margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;
}
.hero__detail-header { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 12px; }
.hero__detail-emoji { font-size: 2rem; }
.hero__detail-name { font-family: var(--font-display); font-size: 1.2rem; }
.hero__detail-text { font-size: 0.82rem; color: var(--ink-medium); line-height: 1.8; margin-bottom: 16px; text-align: left; }

.hero__detail-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.hero__detail-bar-label { font-size: 0.75rem; color: var(--ink-light); white-space: nowrap; }
.hero__detail-bar-track { flex: 1; height: 6px; background: var(--ink-pale); border-radius: 3px; overflow: hidden; }
.hero__detail-bar-fill { height: 100%; background: var(--cinnabar); transition: width 0.3s ease; border-radius: 3px; }

.hero__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.hero__insight strong { color: var(--cinnabar); }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.5s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
