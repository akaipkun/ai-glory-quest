<template>
  <div class="hero-training">
    <div class="training__container">
      <h2 class="training__title fade-in">英雄修炼场</h2>
      <p class="training__subtitle body-text fade-in delay-1">
        选择你的英雄，开始机器学习修炼之路
      </p>

      <!-- 英雄选择 -->
      <div class="training__heroes fade-in delay-2">
        <div
          v-for="(hero, i) in heroes"
          :key="i"
          class="training__hero"
          :class="{ 'training__hero--selected': selectedHero === i }"
          @click="selectHero(i)"
        >
          <div class="training__hero-avatar">{{ hero.icon }}</div>
          <div class="training__hero-name">{{ hero.name }}</div>
          <div class="training__hero-type mono-text">{{ hero.type }}</div>
          <div class="training__hero-desc body-text">{{ hero.desc }}</div>
        </div>
      </div>

      <!-- 训练区域 -->
      <div v-if="selectedHero !== null" class="training__arena fade-in">
        <div class="training__arena-header">
          <span class="training__arena-label">{{ heroes[selectedHero].name }} · 修炼中</span>
          <span class="training__arena-level mono-text">
            Lv.{{ trainingLevel }}
          </span>
        </div>

        <!-- 训练可视化 -->
        <canvas ref="trainCanvas" class="training__canvas"></canvas>

        <!-- 训练控制 -->
        <div class="training__controls">
          <div class="training__status">
            <div class="training__progress-bar">
              <div
                class="training__progress-fill"
                :style="{ width: trainingProgress + '%' }"
              ></div>
            </div>
            <div class="training__stats">
              <span class="mono-text">准确率: {{ currentAccuracy.toFixed(1) }}%</span>
              <span class="mono-text">轮次: {{ epoch }}/{{ maxEpochs }}</span>
            </div>
          </div>

          <div class="training__actions">
            <button
              class="ink-btn"
              @click="startTraining"
              :disabled="isTraining"
            >
              {{ isTraining ? '修炼中...' : '开始修炼' }}
            </button>
            <button
              class="ink-btn"
              @click="resetTraining"
              :disabled="isTraining"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 完成 -->
      <div v-if="trainingComplete" class="training__result fade-in">
        <div class="training__result-icon ink-animate-splash">
          {{ currentAccuracy >= 85 ? '🏆' : '💪' }}
        </div>
        <p class="training__result-text">
          {{ heroes[selectedHero].name }} 修炼完成！
        </p>
        <p class="training__result-accuracy mono-text">
          最终准确率: {{ currentAccuracy.toFixed(1) }}%
        </p>
        <p v-if="currentAccuracy >= 85" class="training__result-pass">
          ✅ 已达到通关标准(≥85%)
        </p>
        <p v-else class="training__result-fail">
          未达到85%，试试调优参数
        </p>
        <button
          class="ink-btn ink-btn--gold"
          @click="$emit('complete', Math.round(currentAccuracy))"
          v-if="currentAccuracy >= 85"
        >
          进入下一关 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])

const trainCanvas = ref(null)
let animId = null

const heroes = [
  { icon: '🗡️', name: '李白', type: '线性回归', desc: '直线攻击，一剑封喉。适合处理线性关系的数据。' },
  { icon: '🏹', name: '后羿', type: '决策树', desc: '远程精确打击，分支判断。适合分类任务。' },
  { icon: '🛡️', name: '程咬金', type: '神经网络', desc: '皮糙肉厚，越战越强。适合复杂模式识别。' }
]

const selectedHero = ref(null)
const isTraining = ref(false)
const trainingProgress = ref(0)
const currentAccuracy = ref(0)
const epoch = ref(0)
const maxEpochs = 50
const trainingLevel = ref(0)
const trainingComplete = ref(false)

const historyData = ref([])

function selectHero(index) {
  selectedHero.value = index
  resetTraining()
}

function startTraining() {
  if (isTraining.value) return
  isTraining.value = true
  trainingComplete.value = false
  historyData.value = []
  epoch.value = 0
  currentAccuracy.value = 5 + Math.random() * 10

  runEpoch()
}

function runEpoch() {
  if (epoch.value >= maxEpochs) {
    isTraining.value = false
    trainingComplete.value = true
    return
  }

  epoch.value++
  trainingProgress.value = (epoch.value / maxEpochs) * 100

  // 模拟训练过程
  const baseAccuracy = 5 + Math.random() * 3
  const improvement = Math.log(epoch.value + 1) * 3
  const noise = (Math.random() - 0.5) * 4
  currentAccuracy.value = Math.min(99, baseAccuracy + improvement + noise)

  // 等级提升
  trainingLevel.value = Math.floor(currentAccuracy.value / 7) + 1

  historyData.value.push({
    epoch: epoch.value,
    accuracy: currentAccuracy.value,
    loss: 1.5 / (1 + epoch.value * 0.08) + Math.random() * 0.1
  })

  drawTrainingChart()

  setTimeout(runEpoch, 150)
}

function resetTraining() {
  isTraining.value = false
  trainingProgress.value = 0
  currentAccuracy.value = 0
  epoch.value = 0
  trainingLevel.value = 0
  trainingComplete.value = false
  historyData.value = []
  drawTrainingChart()
}

function drawTrainingChart() {
  const canvas = trainCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  if (historyData.value.length < 2) return

  // 绘制手写风格损失曲线
  ctx.beginPath()
  const data = historyData.value
  for (let i = 0; i < data.length; i++) {
    const x = 40 + (i / maxEpochs) * (w - 80)
    const y = h - 30 - (data[i].loss / 1.8) * (h - 60)

    if (i === 0) ctx.moveTo(x, y)
    else {
      const prevX = 40 + ((i - 1) / maxEpochs) * (w - 80)
      const cpx = (prevX + x) / 2
      ctx.quadraticCurveTo(cpx, y + (Math.random() - 0.5) * 2, x, y)
    }
  }
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()
}

function initCanvas() {
  const canvas = trainCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = 200
    drawTrainingChart()
  }
  window.addEventListener('resize', resize)
  resize()
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.hero-training {
  min-height: 80vh;
  padding: 40px 24px;
}

.training__container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.training__title {
  font-size: 2rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.training__subtitle {
  font-size: 0.9rem;
  color: var(--ink-medium);
  margin-bottom: 40px;
}

/* 英雄选择 */
.training__heroes {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
}

.training__hero {
  flex: 1;
  max-width: 220px;
  padding: 24px 16px;
  border: 1px solid var(--ink-pale);
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(245, 240, 232, 0.5);
}

.training__hero:hover {
  border-color: var(--ink-medium);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.training__hero--selected {
  border-color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.04);
  box-shadow: 0 0 20px rgba(194, 58, 43, 0.08);
}

.training__hero-avatar {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.training__hero-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 0.15em;
  margin-bottom: 4px;
}

.training__hero-type {
  font-size: 0.75rem;
  color: var(--cinnabar);
  margin-bottom: 8px;
}

.training__hero-desc {
  font-size: 0.78rem;
  color: var(--ink-light);
  line-height: 1.6;
}

/* 训练场 */
.training__arena {
  border: 1px solid var(--ink-pale);
  padding: 24px;
  background: rgba(245, 240, 232, 0.6);
}

.training__arena-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.training__arena-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

.training__arena-level {
  font-size: 0.85rem;
  color: var(--cinnabar);
}

.training__canvas {
  width: 100%;
  height: 200px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.3);
  margin-bottom: 20px;
}

/* 控制 */
.training__controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.training__status {
  text-align: left;
}

.training__progress-bar {
  height: 4px;
  background: var(--ink-pale);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.training__progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--ink-light), var(--ink-black));
  transition: width 0.3s ease;
  border-radius: 2px;
}

.training__stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--ink-medium);
}

.training__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.training__actions .ink-btn {
  font-size: 0.85rem;
  padding: 10px 24px;
}

.training__actions .ink-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 结果 */
.training__result {
  margin-top: 32px;
  padding: 32px;
  border: 1px solid var(--ink-pale);
}

.training__result-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.training__result-text {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.training__result-accuracy {
  font-size: 1.5rem;
  color: var(--cinnabar);
  margin-bottom: 12px;
}

.training__result-pass {
  color: var(--verdant);
  font-family: var(--font-body);
  margin-bottom: 20px;
}

.training__result-fail {
  color: var(--ink-light);
  margin-bottom: 12px;
}
</style>
