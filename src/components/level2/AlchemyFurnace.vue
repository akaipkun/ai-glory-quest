<template>
  <div class="furnace">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="梯度下降 · 炼丹之道"
      subtitle="超参数如何影响模型修炼"
      :principle="'梯度下降是机器学习中最核心的优化算法。想象你站在一座山上，蒙着眼睛，想要走到最低点。你只能感知脚下的坡度——每一步都沿着最陡的下坡方向走。在ML中，损失函数就是这座山的地形，梯度就是脚下的坡度，学习率就是每一步的大小。'"
      :gameMapping="'在这个炼丹炉中：学习率 = 每次调整丹药配方（参数）的幅度——太大可能炸炉（不收敛），太小修炼太慢。迭代轮数 = 你给丹炉加热的时间——时间越长丹越纯，但超过一定轮数后提升微乎其微。批量大小 = 每次投入丹炉的药材数量——小批量让火焰更活泼（随机梯度噪声有助于跳出局部最优），大批量更稳定但可能卡在假的最低点。'"
      :tips="['学习率（0.001~0.1）：越小越稳但慢，越大越快但可能震荡甚至发散', '迭代轮数（10~200）：轮数越多，模型参数越接近最优解，但边际收益递减', '批量大小（8~128）：小批量引入随机性（SGD），有助于逃离局部最优；大批量更平滑但可能错过更好的解', '观察火焰颜色：蓝色火=低学习率（稳），橙火=中学习率，红火=高学习率（猛但可能翻车）']"
      vizType="gradient"
      @close="showPrincipleTip = false"
    />

    <div class="furnace__container">
      <h2 class="furnace__title fade-in">🔥 炼丹炉</h2>
      <p class="furnace__subtitle body-text fade-in delay-1">
        调整丹药配方（超参数），炼出上品金丹（高准确率模型）
      </p>

      <div class="furnace__main">
        <!-- 丹炉可视化 -->
        <div class="furnace__visual">
          <canvas ref="furnaceCanvas" class="furnace__canvas"></canvas>
          <div class="furnace__result" v-if="furnaceResult !== null">
            <span class="mono-text">丹成 · 准确率 {{ furnaceResult.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- 控制面板 -->
        <div class="furnace__panel">
          <div class="furnace__param" v-for="(param, i) in params" :key="i">
            <div class="furnace__param-header">
              <span class="furnace__param-label">{{ param.label }}</span>
              <span class="furnace__param-value mono-text">{{ param.value }}{{ param.unit }}</span>
            </div>
            <div class="furnace__param-desc body-text">{{ param.desc }}</div>
            <input
              type="range"
              class="furnace__slider"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              v-model.number="param.value"
              @input="onParamChange"
            />
          </div>

          <button
            class="ink-btn ink-btn--cinnabar furnace__brew-btn"
            @click="brewElixir"
            :disabled="isBrewing"
          >
            {{ isBrewing ? '🔥 炼丹中...' : '开炉炼丹' }}
          </button>

          <div class="furnace__best" v-if="bestResult > 0">
            最佳记录: <span class="mono-text">{{ bestResult.toFixed(1) }}%</span>
            <span v-if="bestResult >= 85" class="furnace__best-pass"> ✅ 上品金丹</span>
          </div>
        </div>
      </div>

      <!-- 通关 -->
      <div v-if="bestResult >= 85" class="furnace__complete fade-in">
        <button class="ink-btn ink-btn--gold" @click="$emit('complete', Math.round(bestResult))">
          进入下一关 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const furnaceCanvas = ref(null)
let animId = null
let furnaceParticles = []

const showPrincipleTip = ref(true)

const params = ref([
  { label: '学习率', value: 0.01, min: 0.001, max: 0.1, step: 0.001, unit: '', desc: '越浓(低)=越慢但稳' },
  { label: '迭代轮数', value: 50, min: 10, max: 200, step: 1, unit: '', desc: '修炼回合数' },
  { label: '批量大小', value: 32, min: 8, max: 128, step: 8, unit: '', desc: '每次提剑人数' }
])

const isBrewing = ref(false)
const furnaceResult = ref(null)
const bestResult = ref(0)
let brewTimer = null

function onParamChange() {
  // 火焰颜色随学习率变化
  if (furnaceParticles.length > 0) {
    const lr = params.value[0].value
    const hue = lr > 0.05 ? 0 : (lr > 0.01 ? 25 : 220) // 蓝→橙→红
    furnaceParticles.forEach(p => {
      p.hue = hue + (Math.random() - 0.5) * 20
    })
  }
}

function brewElixir() {
  if (isBrewing.value) return
  isBrewing.value = true
  furnaceResult.value = null

  const lr = params.value[0].value
  const epochs = params.value[1].value
  const batch = params.value[2].value

  // 模拟炼丹结果
  let progress = 0
  brewTimer = setInterval(() => {
    progress += 5
    const baseAccuracy = 10 + Math.random() * 5
    const lrEffect = lr <= 0.01 ? 30 : (lr <= 0.05 ? 20 : 10)
    const epochEffect = Math.log(epochs + 1) * 8
    const batchEffect = batch <= 32 ? 15 : 10
    const noise = (Math.random() - 0.5) * 8
    const result = Math.min(99, baseAccuracy + lrEffect + epochEffect + batchEffect + noise)

    furnaceResult.value = result

    if (progress >= 100) {
      clearInterval(brewTimer)
      isBrewing.value = false
      if (result > bestResult.value) bestResult.value = result
    }
  }, 200)
}

function initFurnace() {
  const canvas = furnaceCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = 300
  }
  window.addEventListener('resize', resize)
  resize()

  // 丹炉粒子
  for (let i = 0; i < 60; i++) {
    furnaceParticles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.6 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -0.5 - Math.random() * 2,
      size: 3 + Math.random() * 8,
      life: 0.5 + Math.random() * 0.5,
      hue: Math.random() > 0.5 ? 0 : 25 // 红或橙
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const w = canvas.width
    const h = canvas.height

    // 丹炉轮廓（水墨风格）
    ctx.save()
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.3)'
    ctx.lineWidth = 3

    // 炉身
    ctx.beginPath()
    ctx.moveTo(w * 0.2, h * 0.85)
    ctx.lineTo(w * 0.15, h * 0.4)
    ctx.quadraticCurveTo(w * 0.3, h * 0.15, w * 0.5, h * 0.1)
    ctx.quadraticCurveTo(w * 0.7, h * 0.15, w * 0.85, h * 0.4)
    ctx.lineTo(w * 0.8, h * 0.85)
    ctx.closePath()
    ctx.stroke()

    // 炉脚
    for (const x of [w * 0.3, w * 0.5, w * 0.7]) {
      ctx.beginPath()
      ctx.moveTo(x, h * 0.85)
      ctx.lineTo(x - 10, h * 0.95)
      ctx.lineTo(x + 10, h * 0.95)
      ctx.closePath()
      ctx.stroke()
    }

    ctx.restore()

    // 火焰粒子
    const result = furnaceResult.value || 0
    const intensity = result / 100

    // 更新粒子
    for (const p of furnaceParticles) {
      p.x += p.vx + (Math.random() - 0.5) * 0.5
      p.y += p.vy * (0.8 + intensity * 0.5)
      p.life -= 0.008
      p.size *= 0.99

      if (p.life <= 0 || p.y < h * 0.2) {
        p.x = w / 2 + (Math.random() - 0.5) * 80 * (1 - intensity * 0.5)
        p.y = h * 0.7 + Math.random() * 40
        p.life = 0.5 + Math.random() * 0.5
        p.size = 3 + Math.random() * 8 * (0.5 + intensity)
      }

      // 绘制火焰
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
      const alpha = p.life * (0.4 + intensity * 0.3)
      gradient.addColorStop(0, `hsla(${p.hue - intensity * 20}, 80%, ${50 + intensity * 30}%, ${alpha})`)
      gradient.addColorStop(1, `hsla(${p.hue - intensity * 30}, 70%, 30%, 0)`)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    animId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  setTimeout(initFurnace, 100)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (brewTimer) clearInterval(brewTimer)
})
</script>

<style scoped>
.furnace {
  min-height: 80vh;
  padding: 40px 24px;
}

.furnace__container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.furnace__title {
  font-size: 2rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.furnace__subtitle {
  font-size: 0.85rem;
  color: var(--ink-medium);
  margin-bottom: 40px;
}

.furnace__main {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.furnace__visual {
  flex: 1;
  position: relative;
}

.furnace__canvas {
  width: 100%;
  height: 300px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.4);
}

.furnace__result {
  margin-top: 12px;
  font-size: 1rem;
  color: var(--cinnabar);
}

.furnace__panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.furnace__param {
  text-align: left;
}

.furnace__param-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.furnace__param-label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.furnace__param-value {
  font-size: 0.8rem;
  color: var(--cinnabar);
}

.furnace__param-desc {
  font-size: 0.7rem;
  color: var(--ink-light);
  margin-bottom: 8px;
}

.furnace__slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--ink-pale);
  border-radius: 2px;
  outline: none;
}

.furnace__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ink-black);
  cursor: pointer;
  border: 2px solid var(--paper);
  box-shadow: 0 0 4px rgba(0,0,0,0.2);
}

.furnace__brew-btn {
  width: 100%;
}

.furnace__brew-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.furnace__best {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--ink-medium);
}

.furnace__best .mono-text {
  color: var(--gold);
  font-size: 1rem;
}

.furnace__best-pass {
  color: var(--verdant);
}

.furnace__complete {
  margin-top: 32px;
}

@media (max-width: 768px) {
  .furnace__main {
    flex-direction: column;
    align-items: center;
  }
  .furnace__panel {
    width: 100%;
  }
}
</style>
