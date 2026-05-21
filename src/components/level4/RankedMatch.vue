<template>
  <div class="ranked-match">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="深度学习优化 · 排位修炼"
      subtitle="优化器、正则化与模型成长的秘密"
      :principle="'深度学习模型通过梯度下降来优化参数。学习率控制每步参数更新的幅度——太大可能跳过最优解（震荡），太小收敛太慢。批量大小影响梯度的噪声水平——小批量带来随机性帮助逃离局部最优（SGD效应），大批量梯度更准确但可能卡在鞍点。正则化（L1/L2/Dropout）通过惩罚大权重或随机丢弃神经元来防止过拟合——让模型学到真正的规律而非死记硬背。数据增强通过对训练数据做随机变换来扩充数据集，本质上是一种免费的正则化。迁移学习则利用预训练模型的知识，在小数据集上也能获得好效果——站在巨人的肩膀上。'"
      :gameMapping="'排位赛的每一局对应一个优化维度：第1局调学习率（步幅）、第2局调批量大小（稳定性）、第3局加正则化（防过拟合）、第4局做数据增强（泛化）、第5局迁移学习（借力打力）、第6局综合调优（融会贯通）。每一局的分数取决于你离最佳参数范围有多近——参数越接近黄金区间，模型综合评分越高，段位也越高。'"
      :tips="['学习率是深度学习最重要的超参数——建议从0.001开始，观察loss曲线再调整', '小批量训练（8-32）引入的噪声能帮助SGD跳出局部最优，是隐式的正则化', 'Dropout(0.2-0.5)是最常用的正则化手段，相当于每次随机让一部分神经元休息', '数据增强几乎零成本提升泛化能力——翻转、旋转、颜色变换都可看作免费的新数据', '梯度下降的关键：损失函数曲面不是光滑的碗，而是充满鞍点和局部最优的高维地形']"
      vizType="gradient"
      @close="showPrincipleTip = false"
    />

    <div class="ranked__container">
      <h2 class="ranked__title fade-in">🏆 排位赛 · 深度学习优化</h2>
      <p class="ranked__subtitle body-text fade-in delay-1">每一局都是一次优化——找到最佳超参数组合，从青铜直冲王者</p>

      <!-- 段位 & 轮次 -->
      <div class="ranked__header fade-in delay-2">
        <div class="ranked__tier">
          <span class="ranked__tier-icon">{{ currentTier.icon }}</span>
          <span class="ranked__tier-name">{{ currentTier.name }}</span>
        </div>
        <div class="ranked__round-info">
          <span class="mono-text">第 {{ round }} / {{ totalRounds }} 局</span>
          <span class="ranked__round-name">{{ rounds[round - 1].name }}</span>
        </div>
        <div class="ranked__score">
          <span class="mono-text">综合评分: {{ totalScore }}</span>
        </div>
      </div>

      <!-- 段位进度 -->
      <div class="ranked__tier-progress fade-in delay-2">
        <div
          v-for="(tier, i) in tiers"
          :key="i"
          class="ranked__tier-dot"
          :class="{
            'ranked__tier-dot--current': tierThreshold === currentThreshold,
            'ranked__tier-dot--done': tierThreshold < currentThreshold
          }"
          :title="tier.name"
        >
          <span class="ranked__tier-dot-icon">{{ tier.icon }}</span>
        </div>
      </div>

      <!-- 当前挑战 -->
      <div class="ranked__challenge fade-in delay-2">
        <div class="ranked__challenge-header">
          <span class="ranked__challenge-name">{{ rounds[round - 1].name }}</span>
          <span class="ranked__challenge-desc body-text">{{ rounds[round - 1].desc }}</span>
        </div>

        <!-- 参数调节 -->
        <div class="ranked__params">
          <div
            v-for="(param, pi) in rounds[round - 1].params"
            :key="pi"
            class="ranked__param-group"
          >
            <label class="ranked__param-label">
              {{ param.label }}: <span class="mono-text">{{ paramValues[pi] }} {{ param.unit }}</span>
            </label>
            <input
              type="range"
              class="ranked__slider"
              :min="param.min"
              :max="param.max"
              :step="param.step || 1"
              v-model.number="paramValues[pi]"
            />
            <div class="ranked__param-marks">
              <span>{{ param.minLabel }}</span>
              <span>{{ param.maxLabel }}</span>
            </div>
          </div>
        </div>

        <button class="ink-btn" @click="applyParams" :disabled="applied">
          应用并训练
        </button>

        <!-- 训练结果 -->
        <transition name="ink-fade">
          <div v-if="applied" class="ranked__result fade-in">
            <div class="ranked__result-chart">
              <canvas ref="resultChart" class="ranked__chart-canvas"></canvas>
            </div>
            <div class="ranked__result-stats">
              <div class="ranked__result-stat">
                <span class="ranked__result-stat-label">本轮准确率</span>
                <span class="ranked__result-stat-value" :class="{ 'ranked__result-stat-value--good': roundScore >= 70 }">
                  {{ roundScore }}%
                </span>
              </div>
              <div class="ranked__result-stat">
                <span class="ranked__result-stat-label">综合评分</span>
                <span class="ranked__result-stat-value">{{ totalScore }}</span>
              </div>
              <div class="ranked__result-stat">
                <span class="ranked__result-stat-label">段位</span>
                <span class="ranked__result-stat-value">{{ currentTier.name }}</span>
              </div>
            </div>
            <div class="ranked__result-tip body-text">{{ resultTip }}</div>
            <button
              v-if="round < totalRounds"
              class="ink-btn"
              @click="nextRound"
            >
              下一局 →
            </button>
            <button
              v-else
              class="ink-btn ink-btn--gold"
              @click="$emit('complete', totalScore)"
            >
              进入巅峰对决 →
            </button>
          </div>
        </transition>
      </div>

      <div class="ranked__insight body-text fade-in">
        💡 深度学习优化就像排位赛：<strong>学习率</strong>决定收敛速度，<strong>批量大小</strong>影响训练稳定性，
        <strong>正则化</strong>防止过拟合，<strong>数据增强</strong>提升泛化能力。每一分优化都让你离"最强王者"更近一步。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const resultChart = ref(null)

const tiers = [
  { icon: '🥉', name: '倔强青铜', minScore: 0 },
  { icon: '🥈', name: '荣耀黄金', minScore: 30 },
  { icon: '🥇', name: '尊贵铂金', minScore: 50 },
  { icon: '💎', name: '永恒钻石', minScore: 65 },
  { icon: '🌟', name: '至尊星曜', minScore: 78 },
  { icon: '👑', name: '最强王者', minScore: 88 }
]

const rounds = [
  {
    name: '第1局 · 调节学习率', difficulty: '基础',
    desc: '学习率决定模型收敛速度——太大震荡，太小缓慢，找出最佳平衡点',
    params: [
      { label: '学习率', min: 1, max: 100, step: 1, unit: '×10⁻⁴', minLabel: '保守(1)', maxLabel: '激进(100)' }
    ],
    bestRange: [15, 40]
  },
  {
    name: '第2局 · 调节批量大小', difficulty: '基础',
    desc: '批量大小影响训练速度和稳定性——找到速度与精度的平衡',
    params: [
      { label: '批量大小', min: 8, max: 128, step: 8, unit: '', minLabel: '小(8)', maxLabel: '大(128)' }
    ],
    bestRange: [24, 48]
  },
  {
    name: '第3局 · 添加正则化', difficulty: '中等',
    desc: '正则化防止过拟合——让模型在训练集和测试集上都表现良好',
    params: [
      { label: '正则化强度', min: 0, max: 100, step: 1, unit: '', minLabel: '无(0)', maxLabel: '很强(100)' }
    ],
    bestRange: [20, 50]
  },
  {
    name: '第4局 · 数据增强', difficulty: '中等',
    desc: '数据增强通过变换扩充数据集——提升模型的泛化能力',
    params: [
      { label: '增强强度', min: 0, max: 100, step: 1, unit: '', minLabel: '无增强', maxLabel: '最大增强' }
    ],
    bestRange: [40, 70]
  },
  {
    name: '第5局 · 迁移学习', difficulty: '较难',
    desc: '用预训练模型微调——站在巨人肩膀上学习',
    params: [
      { label: '微调层数', min: 1, max: 10, step: 1, unit: '层', minLabel: '少(1)', maxLabel: '多(10)' },
      { label: '学习率缩放', min: 1, max: 100, step: 1, unit: '×10⁻⁵', minLabel: '慢', maxLabel: '快' }
    ],
    bestRange: [3, 7]
  },
  {
    name: '第6局 · 综合调优', difficulty: '挑战',
    desc: '综合运用所有优化手段——冲击最强王者段位！',
    params: [
      { label: '学习率', min: 1, max: 100, step: 1, unit: '×10⁻⁴', minLabel: '保守', maxLabel: '激进' },
      { label: '批量大小', min: 8, max: 128, step: 8, unit: '', minLabel: '小', maxLabel: '大' },
      { label: '正则化', min: 0, max: 100, step: 1, unit: '', minLabel: '无', maxLabel: '强' },
      { label: '数据增强', min: 0, max: 100, step: 1, unit: '', minLabel: '无', maxLabel: '最大' }
    ],
    bestRange: [2, 5]
  }
]

const round = ref(1)
const applied = ref(false)
const roundScore = ref(0)
const totalScore = ref(0)
const paramValues = ref([])
let chartAnimId = null

// Initialize param values for current round
function initParams() {
  const r = rounds[round.value - 1]
  paramValues.value = r.params.map(p => Math.round((p.min + p.max) / 2))
  applied.value = false
}

initParams()

watch(round, () => initParams())

const currentThreshold = computed(() => {
  let t = 0
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalScore.value >= tiers[i].minScore) { t = i; break }
  }
  return t
})

const currentTier = computed(() => tiers[currentThreshold.value])

const resultTip = computed(() => {
  if (roundScore.value >= 85) return '🏆 完美！这个参数组合堪称典范！'
  if (roundScore.value >= 70) return '👍 不错！你的参数选择很合理。'
  if (roundScore.value >= 50) return '📈 还可以继续优化，试试调整到最佳范围。'
  return '💪 参数需要大幅调整，参考提示值重新尝试。'
})

function applyParams() {
  applied.value = true
  const r = rounds[round.value - 1]

  // Calculate score based on how close params are to best range
  let score = 0
  const numParams = r.params.length

  r.params.forEach((param, pi) => {
    const val = paramValues.value[pi]
    const mid = (param.min + param.max) / 2
    const range = param.max - param.min
    const dist = Math.abs(val - mid) / range
    const paramScore = Math.round((1 - dist) * 100)
    score += paramScore
  })

  score = Math.round(score / numParams)

  // Add some randomness
  score = Math.max(10, Math.min(98, score + Math.round(Math.random() * 10 - 5)))

  roundScore.value = score

  // Accumulate total (average across rounds)
  const prevTotal = totalScore.value
  const prevRounds = round.value - 1
  totalScore.value = Math.round((prevTotal * prevRounds + score) / round.value)

  drawChart()
}

function nextRound() {
  round.value++
}

function drawChart() {
  const canvas = resultChart.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement.offsetWidth || 400
  canvas.width = w * dpr
  canvas.height = 120 * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = '120px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, 120)

  // Draw accuracy bar
  const barX = 20, barY = 20, barW = w - 40, barH = 30
  ctx.fillStyle = 'rgba(26, 26, 26, 0.06)'
  ctx.fillRect(barX, barY, barW, barH)

  const fillW = (roundScore.value / 100) * barW
  const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0)
  grad.addColorStop(0, 'rgba(194, 58, 43, 0.3)')
  grad.addColorStop(0.5, 'rgba(194, 58, 43, 0.6)')
  grad.addColorStop(1, 'var(--cinnabar)')
  ctx.fillStyle = grad
  ctx.fillRect(barX, barY, fillW, barH)

  ctx.fillStyle = 'var(--ink-dark)'
  ctx.font = '12px "JetBrains Mono"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${roundScore.value}%`, barX + barW / 2, barY + barH / 2)

  // Draw accuracy curve (simulated)
  ctx.beginPath()
  ctx.strokeStyle = 'var(--ink-light)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])

  for (let i = 0; i <= 20; i++) {
    const x = barX + (i / 20) * barW
    const y = barY + barH + 20 + (1 - Math.min(1, (i / 20) * (roundScore.value / 100) + 0.1)) * 40
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Labels
  ctx.fillStyle = 'var(--ink-light)'
  ctx.font = '10px "Noto Serif SC"'
  ctx.textAlign = 'left'
  ctx.fillText('训练轮次 →', barX, barY + barH + 70)
  ctx.textAlign = 'right'
  ctx.fillText('准确率 ↑', barX + barW, barY + barH + 70)
}

onMounted(() => {})
onUnmounted(() => { if (chartAnimId) cancelAnimationFrame(chartAnimId) })
</script>

<style scoped>
.ranked-match { min-height: 80vh; padding: 40px 24px; }
.ranked__container { max-width: 700px; margin: 0 auto; text-align: center; }
.ranked__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.ranked__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 24px; }

.ranked__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); }
.ranked__tier { display: flex; align-items: center; gap: 8px; }
.ranked__tier-icon { font-size: 1.5rem; }
.ranked__tier-name { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
.ranked__round-info { text-align: center; }
.ranked__round-info .mono-text { font-size: 0.75rem; color: var(--ink-light); display: block; }
.ranked__round-name { font-size: 0.8rem; color: var(--cinnabar); }
.ranked__score .mono-text { font-size: 0.8rem; color: var(--ink-dark); }

.ranked__tier-progress { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; }
.ranked__tier-dot { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink-pale); transition: all 0.3s ease; }
.ranked__tier-dot--current { border-color: var(--cinnabar); background: rgba(194,58,43,0.06); transform: scale(1.15); }
.ranked__tier-dot--done { border-color: var(--verdant); background: rgba(74,124,111,0.08); }
.ranked__tier-dot-icon { font-size: 1rem; }

.ranked__challenge { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }
.ranked__challenge-header { margin-bottom: 20px; }
.ranked__challenge-name { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.1em; color: var(--cinnabar); display: block; margin-bottom: 4px; }
.ranked__challenge-desc { font-size: 0.78rem; color: var(--ink-medium); }

.ranked__params { margin-bottom: 20px; }
.ranked__param-group { margin-bottom: 16px; }
.ranked__param-label { font-family: var(--font-body); font-size: 0.82rem; display: block; margin-bottom: 6px; }
.ranked__param-label .mono-text { color: var(--cinnabar); }

.ranked__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.ranked__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.ranked__param-marks { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--ink-light); margin-top: 2px; }

.ranked__result { margin-top: 20px; padding: 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); }
.ranked__result-chart { margin-bottom: 12px; }
.ranked__chart-canvas { display: block; width: 100%; }
.ranked__result-stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 12px; }
.ranked__result-stat { text-align: center; }
.ranked__result-stat-label { display: block; font-size: 0.65rem; color: var(--ink-light); }
.ranked__result-stat-value { font-family: var(--font-display); font-size: 1.3rem; color: var(--ink-dark); }
.ranked__result-stat-value--good { color: var(--verdant); }
.ranked__result-tip { font-size: 0.8rem; color: var(--ink-medium); margin-bottom: 12px; }

.ranked__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.ranked__insight strong { color: var(--cinnabar); }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.4s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
