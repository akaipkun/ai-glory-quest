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
  { name: '输入层', desc: '原始像素', insight: '👈 左边是原始图像（emoji），右边是计算机看到的数字矩阵——每个小方块对应一个像素亮度值' },
  { name: '卷积层1', desc: '边缘检测', insight: '每个小格是一个「卷积核」的输出——它检测特定方向的边缘（水平、垂直、斜向）。线条越密，该方向边缘越强' },
  { name: '卷积层2', desc: '形状组合', insight: '边缘组合成几何形状——圆形、矩形、菱形。这就是低级特征（边缘）被组合成中级特征（形状）的过程' },
  { name: '全连接层', desc: '语义识别', insight: '红点是激活的「神经元」，连线是它们之间的加权连接。形状特征在此组合成高级语义——"这是一只老虎的轮廓"' },
  { name: '输出层', desc: '分类结果', insight: '每个柱子的高度代表模型对该类别的置信度。红色柱子是最高分——模型最终判断「这最可能是老虎」' }
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

// Deterministic seed for pseudo-random values based on position + layer + image
function seededRand(r, c, layerIdx, imgIdx) {
  let h = ((r * 31 + c * 17 + layerIdx * 53 + imgIdx * 7) * 2654435761) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Draw edge lines within a cell — Layer 1 style
function drawEdgeCell(ctx, cx, cy, cw, rh, r, c, layerIdx, imgIdx, intensity) {
  const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]
  const angle = angles[Math.floor(seededRand(r, c, layerIdx, imgIdx) * 4)]
  const alpha = 0.25 + intensity * seededRand(r, c, layerIdx, imgIdx + 100) * 0.55

  for (let k = 0; k < 4; k++) {
    const offset = ((k / 3) - 0.5) * cw * 0.7
    const cxCell = cx + cw / 2, cyCell = cy + rh / 2
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    const halfLen = Math.min(cw, rh) * 0.4

    ctx.beginPath()
    ctx.moveTo(cxCell + cosA * offset - cosA * halfLen, cyCell + sinA * offset - sinA * halfLen)
    ctx.lineTo(cxCell + cosA * offset + cosA * halfLen, cyCell + sinA * offset + sinA * halfLen)
    ctx.strokeStyle = `rgba(26, 26, 26, ${alpha * 0.35})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// Draw shape primitives — Layer 2 style
function drawShapeCell(ctx, cx, cy, cw, rh, r, c, layerIdx, imgIdx, intensity) {
  const shapeType = Math.floor(seededRand(r, c, layerIdx, imgIdx) * 3)
  const alpha = 0.2 + intensity * seededRand(r, c, layerIdx, imgIdx + 200) * 0.5
  const s = Math.min(cw, rh) * (0.3 + seededRand(r, c, layerIdx, imgIdx + 300) * 0.35)
  const sx = cx + cw / 2, sy = cy + rh / 2

  ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
  ctx.strokeStyle = `rgba(26, 26, 26, ${alpha * 0.6})`
  ctx.lineWidth = 1

  if (shapeType === 0) {
    // Circle
    ctx.beginPath(); ctx.arc(sx, sy, s / 2, 0, Math.PI * 2); ctx.fill()
  } else if (shapeType === 1) {
    // Rectangle
    ctx.fillRect(sx - s / 2, sy - s / 2, s, s)
  } else {
    // Diamond
    ctx.beginPath()
    ctx.moveTo(sx, sy - s / 2); ctx.lineTo(sx + s / 2, sy)
    ctx.lineTo(sx, sy + s / 2); ctx.lineTo(sx - s / 2, sy)
    ctx.closePath(); ctx.fill()
  }
}

// Draw network nodes — Layer 3 style
function drawNetworkCell(ctx, cx, cy, cw, rh, r, c, layerIdx, imgIdx, intensity) {
  const alpha = 0.15 + intensity * 0.6
  const nodeCount = 3 + Math.floor(seededRand(r, c, layerIdx, imgIdx) * 4)
  const nodes = []

  for (let n = 0; n < nodeCount; n++) {
    nodes.push({
      x: cx + cw * (0.15 + seededRand(r, c, layerIdx, imgIdx + n * 10) * 0.7),
      y: cy + rh * (0.15 + seededRand(r, c, layerIdx, imgIdx + n * 20) * 0.7)
    })
  }

  // Draw connections
  ctx.strokeStyle = `rgba(26, 26, 26, ${alpha * 0.3})`
  ctx.lineWidth = 0.5
  for (let n = 0; n < nodes.length - 1; n++) {
    for (let m = n + 1; m < nodes.length; m++) {
      if (seededRand(r, c, layerIdx, imgIdx + n * 30 + m) > 0.3) {
        ctx.beginPath()
        ctx.moveTo(nodes[n].x, nodes[n].y)
        ctx.lineTo(nodes[m].x, nodes[m].y)
        ctx.stroke()
      }
    }
  }

  // Draw nodes
  ctx.fillStyle = `rgba(194, 58, 43, ${alpha})`
  for (const nd of nodes) {
    ctx.beginPath()
    ctx.arc(nd.x, nd.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Draw probability bars — Layer 4 (output) style
function drawOutputBars(ctx, w, h, layerIdx, imgIdx, intensity) {
  const numBars = 5
  const barW = (w - 16) / numBars
  const maxH = h - 24

  const img = images[imgIdx]
  const activations = img.activations || [0.3, 0.5, 0.8, 0.4, 0.9]

  for (let b = 0; b < numBars; b++) {
    const val = activations[b] || (0.3 + seededRand(0, b, layerIdx, imgIdx) * 0.6)
    const barH = val * maxH
    const bx = 8 + b * barW + 2
    const by = h - 8 - barH

    // Bar fill
    const isMax = val === Math.max(...activations)
    ctx.fillStyle = isMax
      ? 'rgba(194, 58, 43, 0.7)'
      : `rgba(26, 26, 26, ${0.15 + val * 0.35})`
    ctx.fillRect(bx, by, barW - 4, barH)

    // Bar outline
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(bx, by, barW - 4, barH)

    // Label below bar
    ctx.fillStyle = 'var(--ink-light)'
    ctx.font = '9px "Noto Serif SC"'
    ctx.textAlign = 'center'
    const labels = ['🐯虎', '🐵猴', '🌳林', '🖌书', '❓其他']
    ctx.fillText(labels[b] || `类${b + 1}`, bx + (barW - 4) / 2, h - 2)
  }
}

function renderLayer(index) {
  const canvas = layerCanvases.value[index]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.parentElement.offsetWidth - 4
  canvas.height = index === 4 ? 120 : 100

  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const imgIdx = selectedImage.value
  const intensity = images[imgIdx].activations[index] || 0.5

  if (index === 0) {
    // ── Layer 0: Input — big emoji + pixel grid ──
    ctx.fillStyle = 'var(--ink-light)'
    ctx.font = `${h * 0.5}px serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(images[imgIdx].emoji, w * 0.25, h / 2)

    // Pixel grid on the right
    const gridCols = 8, gridRows = 6
    const gx = w * 0.42, gy = h * 0.1, gw = w * 0.54, gh = h * 0.8
    const cellW = gw / gridCols, cellH = gh / gridRows
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const v = 0.1 + seededRand(r, c, 0, imgIdx) * 0.8 * intensity
        ctx.fillStyle = `rgba(26, 26, 26, ${v})`
        ctx.fillRect(gx + c * cellW + 1, gy + r * cellH + 1, cellW - 1, cellH - 1)
      }
    }
    ctx.strokeStyle = 'rgba(26,26,26,0.06)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(gx, gy, gw, gh)
    // Grid label
    ctx.fillStyle = 'var(--ink-light)'
    ctx.font = '8px "Noto Serif SC"'
    ctx.textAlign = 'center'
    ctx.fillText('← 像素矩阵 (8×6)', gx + gw / 2, gy + gh + 10)
  } else if (index === 4) {
    // ── Layer 4: Output — classification bars ──
    drawOutputBars(ctx, w, h, index, imgIdx, intensity)
  } else {
    // ── Layers 1-3: Feature map cells ──
    const density = kernelCount.value / 16  // 0.25 → 4.0
    const baseCols = 4 + index * 2, baseRows = 3 + index
    const cols = Math.max(3, Math.floor(baseCols * (0.5 + density * 0.5)))
    const rows = Math.max(2, Math.floor(baseRows * (0.5 + density * 0.5)))
    const cw = w / cols, rh = h / rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cw, cy = r * rh

        if (index === 1) {
          drawEdgeCell(ctx, cx, cy, cw, rh, r, c, index, imgIdx, intensity)
        } else if (index === 2) {
          drawShapeCell(ctx, cx, cy, cw, rh, r, c, index, imgIdx, intensity)
        } else if (index === 3) {
          drawNetworkCell(ctx, cx, cy, cw, rh, r, c, index, imgIdx, intensity)
        }
      }
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
