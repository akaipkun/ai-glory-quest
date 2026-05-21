<template>
  <div class="latent">
    <div class="latent__container">
      <h2 class="latent__title fade-in">🌀 变化之道 · 潜空间漫游</h2>
      <p class="latent__subtitle body-text fade-in delay-1">72变之间是有联系的——"潜空间"就是所有变化之间的桥梁</p>

      <div class="latent__demo fade-in delay-2">
        <!-- 潜空间可视化 -->
        <div class="latent__visual">
          <canvas ref="spaceCanvas" class="latent__canvas"></canvas>

          <!-- 插值滑块 -->
          <div class="latent__interpolate">
            <div class="latent__interpolate-endpoints">
              <span class="latent__endpoint">
                <span class="latent__endpoint-emoji">{{ creatures[currentCreature].emoji }}</span>
                <span class="latent__endpoint-label">{{ creatures[currentCreature].label }}</span>
              </span>
              <span class="latent__arrow">→</span>
              <span class="latent__endpoint">
                <span class="latent__endpoint-emoji">{{ creatures[nextCreature].emoji }}</span>
                <span class="latent__endpoint-label">{{ creatures[nextCreature].label }}</span>
              </span>
            </div>
            <input type="range" class="latent__slider" min="0" max="100" v-model.number="interpolate" />
            <div class="latent__slider-marks">
              <span>{{ creatures[currentCreature].label }}</span>
              <span>融合</span>
              <span>{{ creatures[nextCreature].label }}</span>
            </div>
          </div>
        </div>

        <!-- Creature Grid -->
        <div class="latent__creatures">
          <div
            v-for="(c, i) in creatures"
            :key="i"
            class="latent__creature"
            :class="{ 'latent__creature--active': i === currentCreature || i === nextCreature }"
            @click="selectCreature(i)"
          >
            <canvas :ref="el => setCreatureCanvas(i, el)" class="latent__creature-canvas"></canvas>
            <span class="latent__creature-label">{{ c.label }}</span>
          </div>
        </div>

        <div class="latent__insight-text body-text">
          💡 当前插值: <strong>{{ creatures[currentCreature].label }}</strong>
          → <strong>{{ creatures[nextCreature].label }}</strong>
          （{{ interpolate }}%）
        </div>
      </div>

      <div class="latent__actions fade-in">
        <button class="ink-btn" @click="$emit('complete')">完成探索，继续闯关 →</button>
      </div>

      <div class="latent__insight body-text fade-in">
        💡 潜空间是生成式AI的核心概念——它将高维数据压缩为低维向量，相似的输入在潜空间中靠近。
        在两点间插值，就能看到"老虎→龙→凤凰"的神兽渐变演化。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])

const spaceCanvas = ref(null)
const creatureCanvases = ref([])
const interpolate = ref(0)
const currentCreature = ref(0)
let animId = null

const creatures = [
  { emoji: '🐯', label: '老虎', color: '#C23A2B' },
  { emoji: '🐉', label: '龙', color: '#4A7C6F' },
  { emoji: '🐦', label: '凤凰', color: '#C9A84C' },
  { emoji: '🦄', label: '麒麟', color: '#6A4A7C' },
  { emoji: '🐢', label: '玄武', color: '#3A5A3A' },
  { emoji: '🦋', label: '灵蝶', color: '#7C4A6A' }
]

const nextCreature = computed(() => (currentCreature.value + 1) % creatures.length)

function setCreatureCanvas(index, el) {
  if (el) creatureCanvases.value[index] = el
}

function selectCreature(index) {
  currentCreature.value = index
  interpolate.value = 0
  drawAllCreatures()
}

function drawSpace() {
  const canvas = spaceCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement.offsetWidth || 600
  canvas.width = w * dpr
  canvas.height = 300 * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = '300px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, 300)
  ctx.fillStyle = 'var(--paper)'
  ctx.fillRect(0, 0, w, 300)

  const centerX = w / 2, centerY = 150
  const radius = 110

  // Draw latent space ring
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.stroke()
  ctx.setLineDash([])

  // Draw connectivity lines
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.04)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < creatures.length; i++) {
    for (let j = i + 1; j < creatures.length; j++) {
      const a1 = (i / creatures.length) * Math.PI * 2 - Math.PI / 2
      const a2 = (j / creatures.length) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(a1) * radius, centerY + Math.sin(a1) * radius)
      ctx.lineTo(centerX + Math.cos(a2) * radius, centerY + Math.sin(a2) * radius)
      ctx.stroke()
    }
  }

  // Draw creatures in latent space
  creatures.forEach((c, i) => {
    const angle = (i / creatures.length) * Math.PI * 2 - Math.PI / 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    const isActive = i === currentCreature.value || i === nextCreature.value

    // Glow for active
    if (isActive) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 25)
      grad.addColorStop(0, `rgba(194, 58, 43, 0.1)`)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, 25, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dot
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? 'var(--cinnabar)' : 'rgba(26, 26, 26, 0.2)'
    ctx.fill()

    // Label
    ctx.fillStyle = isActive ? 'var(--cinnabar)' : 'var(--ink-light)'
    ctx.font = '10px "Noto Serif SC"'
    ctx.textAlign = 'center'
    ctx.fillText(c.emoji + ' ' + c.label, x, y + 20)

    // Connection highlight
    if (isActive) {
      const otherIdx = i === currentCreature.value ? nextCreature.value : currentCreature.value
      const aOther = (otherIdx / creatures.length) * Math.PI * 2 - Math.PI / 2
      const ox = centerX + Math.cos(aOther) * radius
      const oy = centerY + Math.sin(aOther) * radius

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(ox, oy)
      ctx.strokeStyle = 'rgba(194, 58, 43, 0.15)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }
  })

  // Draw interpolation point
  if (interpolate.value > 0 && interpolate.value < 100) {
    const a1 = (currentCreature.value / creatures.length) * Math.PI * 2 - Math.PI / 2
    const a2 = (nextCreature.value / creatures.length) * Math.PI * 2 - Math.PI / 2
    const t = interpolate.value / 100
    const ix = centerX + Math.cos(a1 + (a2 - a1) * t) * radius
    const iy = centerY + Math.sin(a1 + (a2 - a1) * t) * radius

    ctx.beginPath()
    ctx.arc(ix, iy, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'var(--gold)'
    ctx.fill()
    ctx.strokeStyle = 'var(--paper)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

function drawCreature(index) {
  const canvas = creatureCanvases.value[index]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const size = 80
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = 'rgba(245, 240, 232, 0.3)'
  ctx.fillRect(0, 0, size, size)

  const c = creatures[index]
  const isActive = index === currentCreature.value || index === nextCreature.value

  // Abstract creature shape
  ctx.save()
  ctx.translate(size / 2, size / 2)

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const r = 15 + Math.sin(Date.now() / 1000 + i) * 5
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r

    ctx.beginPath()
    ctx.arc(x, y, 8 + Math.sin(Date.now() / 800 + i * 1.3) * 3, 0, Math.PI * 2)
    ctx.fillStyle = isActive
      ? `rgba(194, 58, 43, ${0.1 + Math.sin(Date.now() / 500 + i) * 0.05})`
      : `rgba(26, 26, 26, 0.06)`
    ctx.fill()
  }

  ctx.restore()

  // Border
  ctx.strokeStyle = isActive ? 'var(--cinnabar)' : 'rgba(26, 26, 26, 0.08)'
  ctx.lineWidth = isActive ? 2 : 1
  ctx.strokeRect(0, 0, size, size)
}

function drawAllCreatures() {
  creatures.forEach((_, i) => drawCreature(i))
}

watch([interpolate, currentCreature], () => {
  drawSpace()
  drawAllCreatures()
})

onMounted(() => {
  setTimeout(() => {
    drawSpace()
    drawAllCreatures()
  }, 200)

  // Animate creatures
  function animate() {
    drawAllCreatures()
    animId = requestAnimationFrame(animate)
  }
  animId = requestAnimationFrame(animate)
})

onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>

<style scoped>
.latent { min-height: 80vh; padding: 40px 24px; }
.latent__container { max-width: 700px; margin: 0 auto; text-align: center; }
.latent__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.latent__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.latent__demo { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }

.latent__visual { margin-bottom: 24px; }
.latent__canvas { display: block; width: 100%; height: 300px; }

.latent__interpolate { max-width: 500px; margin: 0 auto; }
.latent__interpolate-endpoints { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; }
.latent__endpoint { text-align: center; }
.latent__endpoint-emoji { font-size: 1.5rem; display: block; }
.latent__endpoint-label { font-size: 0.75rem; color: var(--ink-medium); }
.latent__arrow { font-size: 1.5rem; color: var(--cinnabar); }

.latent__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.latent__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.latent__slider-marks { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--ink-light); margin-top: 2px; }

.latent__creatures { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
.latent__creature { text-align: center; cursor: pointer; padding: 8px; border: 1px solid transparent; transition: all 0.3s ease; }
.latent__creature:hover { border-color: var(--ink-pale); }
.latent__creature--active { border-color: var(--cinnabar); background: rgba(194,58,43,0.03); }
.latent__creature-canvas { display: block; margin: 0 auto 4px; }
.latent__creature-label { font-size: 0.7rem; color: var(--ink-medium); }

.latent__insight-text { font-size: 0.8rem; color: var(--ink-medium); margin-bottom: 12px; }
.latent__insight-text strong { color: var(--cinnabar); }

.latent__actions { margin-bottom: 20px; }

.latent__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.latent__insight strong { color: var(--cinnabar); }
</style>
