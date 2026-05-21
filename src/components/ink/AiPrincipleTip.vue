<template>
  <transition name="principle-fade">
    <div v-if="show" class="ap-tip-overlay" @click.self="dismiss">
      <div class="ap-tip-card">
        <button class="ap-tip-close" @click="dismiss">✕</button>

        <div class="ap-tip-header">
          <span class="ap-tip-badge">AI 原理</span>
          <h2 class="ap-tip-title">{{ title }}</h2>
          <p class="ap-tip-subtitle">{{ subtitle }}</p>
        </div>

        <!-- 动态原理图 -->
        <div class="ap-tip-viz">
          <canvas ref="vizCanvas" class="ap-tip-canvas"></canvas>
          <div v-if="vizLabel" class="ap-tip-viz-label">{{ vizLabel }}</div>
        </div>

        <!-- 原理说明 -->
        <div class="ap-tip-body">
          <div class="ap-tip-section">
            <h3 class="ap-tip-section-title">📖 核心原理</h3>
            <p class="ap-tip-text">{{ principle }}</p>
          </div>

          <div class="ap-tip-section">
            <h3 class="ap-tip-section-title">🎮 游戏对照</h3>
            <p class="ap-tip-text ap-tip-mapping">{{ gameMapping }}</p>
          </div>

          <div v-if="tips && tips.length" class="ap-tip-section">
            <h3 class="ap-tip-section-title">💡 通关提示</h3>
            <ul class="ap-tip-tips">
              <li v-for="(tip, i) in tips" :key="i">{{ tip }}</li>
            </ul>
          </div>
        </div>

        <button class="ink-btn ink-btn--gold ap-tip-start" @click="dismiss">
          开始挑战 →
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  principle: { type: String, default: '' },
  gameMapping: { type: String, default: '' },
  tips: { type: Array, default: () => [] },
  vizType: { type: String, default: 'default' }, // 'curve' | 'gradient' | 'tree' | 'network' | 'default'
})

const emit = defineEmits(['close'])

const vizCanvas = ref(null)
const vizLabel = ref('')
let animId = null

function dismiss() {
  emit('close')
}

// ── Dynamic Visualizations ──

function drawFittingCurve(ctx, w, h, time) {
  const cx = w * 0.08, cy = h * 0.85, pw = w * 0.84, ph = h * 0.7
  const points = []
  const noiseAmp = 18

  // Generate noisy data points
  for (let i = 0; i < 30; i++) {
    const x = cx + (i / 29) * pw
    const y = cy - (0.15 + (i / 29) * 0.6 + Math.sin(i * 0.5) * 0.08) * ph
    const noise = (Math.sin(i * 3.7 + time * 1.2) * noiseAmp * (1 - Math.abs(i - 15) / 15)) * (0.5 + 0.5 * Math.sin(time * 0.3))
    points.push({ x, y: y + noise, cleanY: y })
  }

  // Draw axes
  ctx.strokeStyle = 'rgba(26,26,26,0.15)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + pw, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - ph); ctx.stroke()

  // Axis labels
  ctx.fillStyle = 'var(--ink-light)'; ctx.font = '10px "Noto Serif SC"'
  ctx.textAlign = 'center'; ctx.fillText('特征 X', cx + pw / 2, cy + 16)
  ctx.save(); ctx.translate(cx - 14, cy - ph / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillText('目标 Y', 0, 0); ctx.restore()

  // Draw scatter data points
  for (const p of points) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(26, 26, 26, 0.35)'; ctx.fill()
  }

  // Draw fitting curve (animates in)
  const progress = Math.min(time / 3, 1)
  ctx.beginPath()
  let started = false
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const t = i / (points.length - 1)
    const showT = t <= progress
    if (!showT && !started) continue
    if (!started) { ctx.moveTo(p.x, p.cleanY); started = true }
    else { ctx.lineTo(p.x, p.cleanY) }
  }
  ctx.strokeStyle = 'rgba(194, 58, 43, 0.7)'; ctx.lineWidth = 2.5
  ctx.setLineDash([]); ctx.stroke()

  // Animate curve reveal dots
  for (let i = 0; i < points.length; i++) {
    if (i / points.length > progress) continue
    ctx.beginPath(); ctx.arc(points[i].x, points[i].cleanY, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(194, 58, 43, 0.5)'; ctx.fill()
  }
}

function drawGradient3D(ctx, w, h, time) {
  const cx = w / 2, cy = h * 0.5
  const scale = Math.min(w, h) * 0.35

  // 3D surface wireframe
  const rows = 16, cols = 16
  const points = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      const nx = (c / (cols - 1) - 0.5) * 2
      const ny = (r / (rows - 1) - 0.5) * 2
      const z = -(nx * nx + ny * ny) * 0.7 + Math.sin(nx * 3 + time * 0.4) * 0.15 * ny * ny
      const sx = cx + nx * scale + ny * scale * 0.35
      const sy = cy - ny * scale * 0.35 + z * scale * 0.5
      row.push({ sx, sy, z })
    }
    points.push(row)
  }

  // Draw wireframe
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = points[r][c]
      if (c < cols - 1) {
        const p2 = points[r][c + 1]
        ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p2.sx, p2.sy)
        ctx.strokeStyle = `rgba(26,26,26,${0.06 + p.z * 0.08})`; ctx.lineWidth = 0.8; ctx.stroke()
      }
      if (r < rows - 1) {
        const p2 = points[r + 1][c]
        ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p2.sx, p2.sy)
        ctx.strokeStyle = `rgba(26,26,26,${0.06 + p.z * 0.08})`; ctx.lineWidth = 0.8; ctx.stroke()
      }
    }
  }

  // Gradient descent path
  const gdSteps = 12
  ctx.beginPath()
  let gdX = 0.7, gdY = 0.8
  for (let s = 0; s < gdSteps; s++) {
    const nx = gdX, ny = gdY
    const gradX = 2 * nx, gradY = 2 * ny
    gdX -= gradX * 0.12; gdY -= gradY * 0.12
    const p = { sx: cx + nx * scale + ny * scale * 0.35, sy: cy - ny * scale * 0.35 + (-(nx * nx + ny * ny) * 0.7) * scale * 0.5 }
    if (s === 0) ctx.moveTo(p.sx, p.sy)
    else ctx.lineTo(p.sx, p.sy)
  }
  ctx.strokeStyle = 'rgba(194, 58, 43, 0.7)'; ctx.lineWidth = 2.5; ctx.stroke()

  // Gradient descent points
  gdX = 0.7; gdY = 0.8
  for (let s = 0; s < gdSteps; s++) {
    const gradX = 2 * gdX, gradY = 2 * gdY
    gdX -= gradX * 0.12; gdY -= gradY * 0.12
    const p = { sx: cx + gdX * scale + gdY * scale * 0.35, sy: cy - gdY * scale * 0.35 + (-(gdX * gdX + gdY * gdY) * 0.7) * scale * 0.5 }
    ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.5 + s * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(194, 58, 43, ${0.4 + s * 0.06})`; ctx.fill()
  }

  // Labels
  ctx.fillStyle = 'var(--ink-light)'; ctx.font = '10px "Noto Serif SC"'; ctx.textAlign = 'left'
  ctx.fillText('← 梯度下降路径', cx - scale * 0.7, cy + scale * 0.5)
  ctx.fillText('损失最低点 →', cx + scale * 0.3, cy + scale * 0.2)
}

function drawDecisionTree(ctx, w, h, time) {
  const cx = w * 0.5, startY = h * 0.08
  const levels = 4
  const nodeCounts = [1, 2, 4, 4]
  const colors = ['rgba(194,58,43,0.7)', 'rgba(201,168,76,0.65)', 'rgba(74,124,111,0.6)', 'rgba(26,26,26,0.5)']

  const allNodes = []

  for (let L = 0; L < levels; L++) {
    const count = nodeCounts[L]
    const levelY = startY + (L / (levels - 0.5)) * h * 0.72
    const spread = w * (0.15 + L * 0.14)
    const nodes = []

    for (let n = 0; n < count; n++) {
      const nx = cx + (n / (count - 1 || 1) - 0.5) * spread
      const ny = levelY
      // Sway animation
      const sway = Math.sin(time * 1.5 + L + n) * 3
      nodes.push({ x: nx, y: ny + sway, level: L, idx: n })
    }
    allNodes.push(nodes)
  }

  // Draw connections first
  for (let L = 0; L < levels - 1; L++) {
    const parentNodes = allNodes[L]
    const childNodes = allNodes[L + 1]
    for (let p = 0; p < parentNodes.length; p++) {
      const parent = parentNodes[p]
      // Each parent connects to approximately 2 children
      const startChild = Math.floor(p * childNodes.length / parentNodes.length)
      const endChild = Math.min(Math.ceil((p + 1) * childNodes.length / parentNodes.length), childNodes.length)
      for (let c = startChild; c < endChild; c++) {
        const child = childNodes[c]
        ctx.beginPath()
        ctx.moveTo(parent.x, parent.y + 12)
        ctx.lineTo(child.x, child.y - 12)
        ctx.strokeStyle = 'rgba(26,26,26,0.1)'; ctx.lineWidth = 1; ctx.stroke()
      }
    }
  }

  // Draw nodes
  for (let L = 0; L < levels; L++) {
    const nodes = allNodes[L]
    for (const nd of nodes) {
      const pulse = 1 + Math.sin(time * 2 + L + nd.idx) * 0.08
      const r = (12 - L * 1.5) * pulse
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2)
      ctx.fillStyle = colors[L]; ctx.fill()
      ctx.strokeStyle = 'rgba(26,26,26,0.2)'; ctx.lineWidth = 0.8; ctx.stroke()

      // Small label on leaf nodes
      if (L === levels - 1) {
        ctx.fillStyle = 'var(--ink-light)'; ctx.font = '9px "Noto Serif SC"'; ctx.textAlign = 'center'
        const labels = ['分类A', '分类B', '分类A', '分类B']
        ctx.fillText(labels[nd.idx % 4], nd.x, nd.y + r + 12)
      }
    }
  }

  // Root label
  ctx.fillStyle = 'var(--ink-light)'; ctx.font = '9px "Noto Serif SC"'; ctx.textAlign = 'center'
  ctx.fillText('根节点', allNodes[0][0].x, allNodes[0][0].y - 16)
  ctx.fillText('特征分裂', cx + w * 0.18, startY + h * 0.25)

  // Question marks on edges
  ctx.fillStyle = 'var(--ink-pale)'; ctx.font = 'italic 8px "Noto Serif SC"'
  for (let L = 0; L < 3; L++) {
    ctx.fillText('条件?', cx + (L - 1) * w * 0.18, startY + (L + 0.5) * h * 0.24)
  }
}

function drawNetworkDiagram(ctx, w, h, time) {
  const layers = [4, 6, 5, 3]
  const layerX = layers.map((_, i) => w * 0.1 + (i / (layers.length - 1)) * w * 0.8)
  const allNodes = []

  for (let L = 0; L < layers.length; L++) {
    const count = layers[L]
    const nodes = []
    for (let n = 0; n < count; n++) {
      const ny = h * 0.15 + (n / (count - 1 || 1)) * h * 0.7
      const nx = layerX[L]
      nodes.push({ x: nx, y: ny, level: L })
    }
    allNodes.push(nodes)
  }

  // Draw connections with signal animation
  const animatedLayer = Math.floor(time * 0.4) % (layers.length - 1)
  const animProgress = (time * 0.4) % 1

  for (let L = 0; L < layers.length - 1; L++) {
    const fromNodes = allNodes[L]
    const toNodes = allNodes[L + 1]
    for (const fn of fromNodes) {
      for (const tn of toNodes) {
        ctx.beginPath()
        ctx.moveTo(fn.x, fn.y)
        ctx.lineTo(tn.x, tn.y)
        const isAnim = L === animatedLayer
        const alpha = isAnim ? 0.04 + animProgress * 0.08 : 0.03
        ctx.strokeStyle = `rgba(26,26,26,${alpha})`; ctx.lineWidth = 0.5; ctx.stroke()
      }
    }
  }

  // Animated signal dot
  if (animatedLayer >= 0) {
    const fs = allNodes[animatedLayer]
    const ts = allNodes[animatedLayer + 1]
    const fi = Math.floor((time * 1.7) % fs.length)
    const ti = Math.floor((time * 1.3) % ts.length)
    const fx = fs[fi].x, fy = fs[fi].y
    const tx = ts[ti].x, ty = ts[ti].y
    const sx = fx + (tx - fx) * animProgress
    const sy = fy + (ty - fy) * animProgress

    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8)
    glow.addColorStop(0, 'rgba(194, 58, 43, 0.6)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill()
  }

  // Draw nodes
  for (let L = 0; L < layers.length; L++) {
    const nodes = allNodes[L]
    for (const nd of nodes) {
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = L === 0 ? 'rgba(26,26,26,0.6)' : L === layers.length - 1 ? 'rgba(194,58,43,0.6)' : 'rgba(26,26,26,0.3)'
      ctx.fill()
    }
  }

  // Layer labels
  const layerNames = ['输入层', '隐藏层1', '隐藏层2', '输出层']
  ctx.fillStyle = 'var(--ink-light)'; ctx.font = '9px "Noto Serif SC"'; ctx.textAlign = 'center'
  for (let L = 0; L < layers.length; L++) {
    ctx.fillText(layerNames[L], layerX[L], h * 0.92)
  }
}

// ── Main visualization loop ──

function initViz() {
  const canvas = vizCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height

  let time = 0
  function animate() {
    ctx.clearRect(0, 0, w, h)

    if (props.vizType === 'curve') {
      vizLabel.value = '拟合曲线 —— 模型学习数据中的规律'
      drawFittingCurve(ctx, w, h, time)
    } else if (props.vizType === 'gradient') {
      vizLabel.value = '梯度下降 —— 沿最陡方向优化参数'
      drawGradient3D(ctx, w, h, time)
    } else if (props.vizType === 'tree') {
      vizLabel.value = '决策树 —— 逐层分裂特征做判断'
      drawDecisionTree(ctx, w, h, time)
    } else if (props.vizType === 'network') {
      vizLabel.value = '神经网络 —— 层层传递，逐级抽象'
      drawNetworkDiagram(ctx, w, h, time)
    }

    time += 0.016
    animId = requestAnimationFrame(animate)
  }
  animate()
}

function resizeCanvas() {
  const canvas = vizCanvas.value
  if (!canvas) return
  const parent = canvas.parentElement
  canvas.width = parent.offsetWidth
  canvas.height = Math.min(parent.offsetWidth * 0.45, 260)
}

watch(() => props.show, (val) => {
  if (val) {
    setTimeout(() => { resizeCanvas(); initViz() }, 200)
  } else {
    if (animId) cancelAnimationFrame(animId)
  }
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.ap-tip-overlay {
  position: fixed; inset: 0; z-index: 500;
  display: flex; align-items: center; justify-content: center;
  background: rgba(26, 26, 26, 0.5);
  backdrop-filter: blur(4px);
  padding: 20px;
}

.ap-tip-card {
  position: relative;
  max-width: 580px; max-height: 90vh; overflow-y: auto;
  width: 100%;
  background: var(--paper);
  border: 4px double var(--cinnabar);
  padding: 32px 28px 24px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}

.ap-tip-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; font-size: 1.2rem;
  color: var(--ink-light); cursor: pointer; padding: 4px;
  transition: color 0.3s;
}
.ap-tip-close:hover { color: var(--cinnabar); }

.ap-tip-header { text-align: center; margin-bottom: 20px; }
.ap-tip-badge {
  display: inline-block; font-family: var(--font-mono); font-size: 0.7rem;
  color: var(--cinnabar); border: 1px solid var(--cinnabar);
  padding: 2px 12px; letter-spacing: 0.1em; margin-bottom: 8px;
}
.ap-tip-title {
  font-size: 1.8rem; letter-spacing: 0.2em; margin-bottom: 4px;
  font-family: var(--font-display);
}
.ap-tip-subtitle {
  font-family: var(--font-body); font-size: 0.85rem;
  color: var(--ink-medium); letter-spacing: 0.08em;
}

.ap-tip-viz {
  position: relative; margin-bottom: 16px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.4);
  min-height: 180px;
}
.ap-tip-canvas { display: block; width: 100%; }
.ap-tip-viz-label {
  position: absolute; bottom: 4px; right: 12px;
  font-family: var(--font-mono); font-size: 0.6rem;
  color: var(--ink-pale); letter-spacing: 0.06em;
}

.ap-tip-section { margin-bottom: 16px; }
.ap-tip-section-title {
  font-family: var(--font-display); font-size: 0.95rem;
  letter-spacing: 0.1em; margin-bottom: 6px; color: var(--ink-black);
}
.ap-tip-text {
  font-family: var(--font-body); font-size: 0.85rem;
  color: var(--ink-medium); line-height: 1.9; letter-spacing: 0.04em;
}
.ap-tip-mapping {
  color: var(--cinnabar); font-style: italic;
  border-left: 3px solid var(--cinnabar); padding-left: 12px;
}

.ap-tip-tips {
  margin: 0; padding-left: 18px;
}
.ap-tip-tips li {
  font-family: var(--font-body); font-size: 0.82rem;
  color: var(--ink-medium); line-height: 1.7; margin-bottom: 4px;
}

.ap-tip-start {
  display: block; margin: 0 auto; margin-top: 8px;
  font-size: 1rem; padding: 10px 40px;
}

/* Transition */
.principle-fade-enter-active { animation: ink-bleed 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
.principle-fade-leave-active { animation: ink-converge 0.35s cubic-bezier(0.22,1,0.36,1) reverse forwards; }
</style>
