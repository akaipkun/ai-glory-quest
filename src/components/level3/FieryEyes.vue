<template>
  <div class="fiery-eyes">
    <canvas ref="bgCanvas" class="fe__bg"></canvas>
    <div class="fe__container">
      <h2 class="fe__title fade-in">👁️ 火眼金睛 · 逐层看穿</h2>
      <p class="fe__subtitle body-text fade-in delay-1">神经网络如何一层层"看"懂图像？选择一张图片，观察每一层的变化</p>

      <div class="fe__demo fade-in delay-2">
        <!-- 图片选择 -->
        <div class="fe__gallery">
          <div v-for="(img, i) in images" :key="i" class="fe__thumb"
            :class="{ 'fe__thumb--active': selectedImage === i }"
            @click="selectImage(i)">
            <span class="fe__thumb-emoji">{{ img.emoji }}</span>
            <span class="fe__thumb-label">{{ img.label }}</span>
          </div>
        </div>

        <!-- 层级可视化 -->
        <div class="fe__layers">
          <div v-for="(layer, li) in layers" :key="li" class="fe__layer"
            :class="{ 'fe__layer--active': activeLayer === li }">
            <div class="fe__layer-header">
              <span class="fe__layer-name">{{ layer.name }}</span>
              <span class="fe__layer-desc body-text">{{ layer.desc }}</span>
            </div>
            <canvas :ref="el => setLayerCanvas(li, el)" class="fe__layer-canvas"
              @click="activeLayer = li"></canvas>
            <div class="fe__layer-hint" v-if="activeLayer === li">🖱️ 点击其他层查看</div>
          </div>
        </div>

        <!-- 卷积核调节 -->
        <div class="fe__controls fade-in" v-if="activeLayer >= 0">
          <div class="fe__slider-group">
            <label class="fe__slider-label">卷积核数量: <span class="mono-text">{{ kernelCount }}</span></label>
            <input type="range" class="fe__slider" min="4" max="64" step="4" v-model.number="kernelCount" />
          </div>
          <p class="fe__insight body-text">{{ insightText }}</p>
        </div>
      </div>

      <div class="fe__actions fade-in">
        <button class="ink-btn" @click="$emit('complete')">完成观察，继续闯关 →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])
const bgCanvas = ref(null)
let animId = null

const images = [
  { emoji: '🐯', label: '老虎', activations: [0.9, 0.6, 0.3, 0.8, 0.4] },
  { emoji: '🐵', label: '猴子', activations: [0.8, 0.5, 0.4, 0.7, 0.5] },
  { emoji: '🌳', label: '山林', activations: [0.3, 0.8, 0.7, 0.4, 0.6] },
  { emoji: '🖌️', label: '书法', activations: [0.2, 0.7, 0.8, 0.3, 0.7] }
]

const layers = [
  { name: '输入层', desc: '原始像素', insight: '计算机看到的只是数字矩阵，每个像素一个数值' },
  { name: '卷积层1', desc: '边缘检测', insight: '这一层识别边缘和纹理——横线、竖线、斜线、斑点' },
  { name: '卷积层2', desc: '形状组合', insight: '组合低级特征为中级形状——弧形、方块、圆形纹理' },
  { name: '全连接层', desc: '语义识别', insight: '高级特征组合成完整概念——"这是一只老虎"' },
  { name: '输出层', desc: '分类结果', insight: '最终判断：每个类别的概率分布，最高者胜出' }
]

const selectedImage = ref(0)
const activeLayer = ref(0)
const kernelCount = ref(16)
const layerCanvases = ref([])

const insightText = computed(() => layers[activeLayer.value]?.insight || '')

function setLayerCanvas(index, el) {
  if (el) layerCanvases.value[index] = el
}

function selectImage(index) {
  selectedImage.value = index
  renderAllLayers()
}

function renderLayer(index) {
  const canvas = layerCanvases.value[index]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.parentElement.offsetWidth - 4
  canvas.height = 100

  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const img = images[selectedImage.value]
  const intensity = img.activations[index] || 0.5
  const k = kernelCount.value / 64

  // 模拟特征图
  const cols = 4 + index * 2, rows = 3 + index
  const cw = w / cols, rh = h / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = (0.3 + Math.random() * 0.4) * intensity * (0.5 + k * 0.5)
      const phase = (r / rows + c / cols + index * 0.3)
      const alpha = val * (0.4 + Math.sin(phase * 10) * 0.15)

      ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
      ctx.fillRect(c * cw + 1, r * rh + 1, cw - 2, rh - 2)
    }
  }

  // 边框
  ctx.strokeStyle = activeLayer.value === index ? 'var(--cinnabar)' : 'rgba(26,26,26,0.1)'
  ctx.lineWidth = activeLayer.value === index ? 2 : 1
  ctx.strokeRect(0, 0, w, h)

  // 标签
  ctx.fillStyle = activeLayer.value === index ? 'var(--cinnabar)' : 'var(--ink-light)'
  ctx.font = '12px "Noto Serif SC"'
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
  ctx.fillText(`${layers[index].name}`, 8, h - 4)
}

function renderAllLayers() {
  for (let i = 0; i < layers.length; i++) renderLayer(i)
}

watch(kernelCount, () => renderAllLayers())
watch(activeLayer, () => renderAllLayers())

function initBg() {
  const canvas = bgCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  window.addEventListener('resize', resize); resize()

  let t = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); t += 0.01
    for (let i = 0; i < 6; i++) {
      const x = canvas.width * (0.1 + Math.random() * 0.8)
      const y = canvas.height * (0.1 + Math.random() * 0.8)
      const r = 20 + Math.sin(t + i) * 10
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, 0.02)`; ctx.fill()
    }
    animId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => { setTimeout(() => { initBg(); renderAllLayers() }, 100) })
onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>

<style scoped>
.fiery-eyes { min-height: 80vh; padding: 40px 24px; position: relative; }
.fe__bg { position: fixed; inset: 0; pointer-events: none; z-index: -1; }
.fe__container { max-width: 800px; margin: 0 auto; text-align: center; }
.fe__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.fe__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }
.fe__gallery { display: flex; gap: 12px; justify-content: center; margin-bottom: 28px; }
.fe__thumb { padding: 12px 20px; border: 1px solid var(--ink-pale); cursor: pointer; transition: all 0.3s ease; background: rgba(245,240,232,0.5); }
.fe__thumb:hover { border-color: var(--ink-medium); transform: translateY(-2px); }
.fe__thumb--active { border-color: var(--cinnabar); background: rgba(194,58,43,0.04); box-shadow: 0 0 12px rgba(194,58,43,0.1); }
.fe__thumb-emoji { font-size: 1.8rem; display: block; margin-bottom: 4px; }
.fe__thumb-label { font-family: var(--font-body); font-size: 0.78rem; }
.fe__layers { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.fe__layer { border: 1px solid var(--ink-pale); cursor: pointer; transition: all 0.3s ease; background: rgba(245,240,232,0.4); }
.fe__layer:hover, .fe__layer--active { border-color: var(--ink-medium); }
.fe__layer--active { border-color: var(--cinnabar); background: rgba(194,58,43,0.03); }
.fe__layer-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; }
.fe__layer-name { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; }
.fe__layer-desc { font-size: 0.75rem; color: var(--ink-light); }
.fe__layer-canvas { width: 100%; height: 100px; display: block; }
.fe__layer-hint { font-size: 0.7rem; color: var(--ink-light); padding: 4px; }
.fe__controls { margin-bottom: 24px; padding: 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); }
.fe__slider-group { margin-bottom: 8px; }
.fe__slider-label { font-family: var(--font-body); font-size: 0.85rem; }
.fe__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; margin-top: 8px; }
.fe__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--ink-black); cursor: pointer; border: 2px solid var(--paper); }
.fe__insight { font-size: 0.78rem; color: var(--cinnabar); font-style: italic; }
.fe__actions { margin-top: 20px; }
</style>
