<template>
  <div class="home">
    <!-- 山水画布背景 -->
    <canvas ref="mapCanvas" class="home__map-bg"></canvas>

    <!-- 顶部标题 -->
    <div class="home__hero">
      <div class="home__hero-content">
        <h1 class="home__title ink-animate-converge">
          <span class="home__title-ink">AI</span>
          <span class="home__title-main">荣耀闯关</span>
        </h1>
        <p class="home__subtitle ink-animate-converge delay-2">
          以水墨丹青，悟人工智能
        </p>
      </div>
    </div>

    <!-- 山水路线图 -->
    <div class="home__map">
      <div class="home__map-legend">
        <span class="home__map-legend-item"><span class="legend-dot legend-dot--done"></span> 已通关</span>
        <span class="home__map-legend-item"><span class="legend-dot legend-dot--open"></span> 可挑战</span>
        <span class="home__map-legend-item"><span class="legend-dot legend-dot--locked"></span> 未解锁</span>
      </div>

      <div class="landscape-grid" ref="gridRef">
        <!-- 山路画布 -->
        <canvas ref="trailCanvas" class="home__trail-canvas"></canvas>
        <!-- L1: 山顶 -->
        <div class="landscape-cell cell-top" @click="enterLevel(game.levels[0])">
          <div class="level-node" :class="nodeClass(game.levels[0])">
            <div class="level-node__icon">{{ game.levels[0].icon }}</div>
            <div class="level-node__name">{{ game.levels[0].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[0].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[0].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">花果山</div>
        </div>

        <!-- Connector L1→L2 -->
        <div class="cell-path path-down"></div>

        <!-- L2: 峡谷 -->
        <div class="landscape-cell cell-mid" @click="enterLevel(game.levels[1])">
          <div class="level-node" :class="nodeClass(game.levels[1])">
            <div class="level-node__icon">{{ game.levels[1].icon }}</div>
            <div class="level-node__name">{{ game.levels[1].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[1].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[1].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">修炼峡谷</div>
        </div>

        <!-- 分支：L3 ← 岔路 → L5 -->
        <div class="cell-path path-split-left"></div>
        <div class="cell-path path-split-label">⚡ 岔路</div>
        <div class="cell-path path-split-right"></div>

        <!-- L3: 火眼 -->
        <div class="landscape-cell cell-left" @click="enterLevel(game.levels[2])">
          <div class="level-node" :class="nodeClass(game.levels[2])">
            <div class="level-node__icon">{{ game.levels[2].icon }}</div>
            <div class="level-node__name">{{ game.levels[2].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[2].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[2].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">火焰山</div>
        </div>

        <!-- L5: 七十二变 -->
        <div class="landscape-cell cell-right" @click="enterLevel(game.levels[4])">
          <div class="level-node" :class="nodeClass(game.levels[4])">
            <div class="level-node__icon">{{ game.levels[4].icon }}</div>
            <div class="level-node__name">{{ game.levels[4].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[4].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[4].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">变化之森</div>
        </div>

        <!-- Connector L3→L4 -->
        <div class="cell-path path-down-left"></div>
        <!-- Connector L5→L6 -->
        <div class="cell-path path-down-right"></div>

        <!-- L4: 王者 -->
        <div class="landscape-cell cell-left-bottom" @click="enterLevel(game.levels[3])">
          <div class="level-node" :class="nodeClass(game.levels[3])">
            <div class="level-node__icon">{{ game.levels[3].icon }}</div>
            <div class="level-node__name">{{ game.levels[3].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[3].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[3].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">王者殿堂</div>
        </div>

        <!-- L6: 团战 -->
        <div class="landscape-cell cell-right-bottom" @click="enterLevel(game.levels[5])">
          <div class="level-node" :class="nodeClass(game.levels[5])">
            <div class="level-node__icon">{{ game.levels[5].icon }}</div>
            <div class="level-node__name">{{ game.levels[5].name }}</div>
            <div class="level-node__status">
              <span v-if="game.levels[5].completed" class="node-badge node-badge--done">✓</span>
              <span v-else-if="game.levels[5].unlocked || auth.isTeacher" class="node-badge node-badge--go">GO</span>
              <span v-else class="node-badge node-badge--lock">🔒</span>
            </div>
          </div>
          <div class="landscape-label">团战平原</div>
        </div>
      </div>
    </div>

    <!-- 成就进度 → 影神册入口 -->
    <div class="home__progress" @click="$router.push('/bestiary')">
      <div class="home__progress-header">
        <span class="home__progress-label">📜 影神册</span>
        <span class="home__progress-count">
          {{ game.badges.length }}/6关 · {{ game.stepBadges.length }}/{{ game.totalStepBadges }}步 · {{ game.totalCredits }} 学分
        </span>
      </div>
      <div class="home__progress-bar">
        <div class="home__progress-fill" :style="{ width: (game.badges.length / 6 * 100) + '%' }"></div>
      </div>
      <div class="home__progress-hint">点击翻阅图鉴 →</div>
    </div>

    <!-- 重置 -->
    <button class="ink-btn home__reset" @click="game.reset()" v-if="game.badges.length > 0">重置进度</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const game = useGameStore()
const auth = useAuthStore()
const mapCanvas = ref(null)
const trailCanvas = ref(null)
const gridRef = ref(null)
let mapAnimId = null
let trailObserver = null

function nodeClass(level) {
  if (level.completed) return 'level-node--completed'
  if (level.unlocked || auth.isTeacher) return 'level-node--unlocked'
  return 'level-node--locked'
}

function enterLevel(level) {
  if (!level.unlocked && !auth.isTeacher) return
  router.push(`/level/${level.id}`)
}

// ── 山水画布背景：层峦叠嶂 + 云雾 ──
function initMapCanvas() {
  const canvas = mapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = canvas.parentElement.offsetHeight
  }
  window.addEventListener('resize', resize)
  resize()

  // 雾滴
  const mists = []
  for (let i = 0; i < 50; i++) {
    mists.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.03 - Math.random() * 0.06,
      size: 30 + Math.random() * 80,
      life: Math.random(),
    })
  }

  // 远山轮廓点
  function ridgeHeight(x, seed, amp) {
    let h = 0
    h += Math.sin(x * 0.004 + seed) * amp * 0.5
    h += Math.sin(x * 0.011 + seed * 1.7) * amp * 0.3
    h += Math.sin(x * 0.023 + seed * 2.9) * amp * 0.15
    h += Math.sin(x * 0.037 + seed * 4.1) * amp * 0.05
    return h
  }

  let time = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    time += 0.003
    const W = canvas.width
    const H = canvas.height

    // ── 天空层 ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
    skyGrad.addColorStop(0, 'rgba(245, 240, 232, 0)')
    skyGrad.addColorStop(0.25, 'rgba(235, 228, 218, 0.015)')
    skyGrad.addColorStop(0.55, 'rgba(210, 200, 188, 0.025)')
    skyGrad.addColorStop(1, 'rgba(26, 26, 26, 0.05)')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    // ── 远山（淡墨） ──
    for (let ridge = 0; ridge < 2; ridge++) {
      const baseY = H * (0.22 + ridge * 0.16)
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 3) {
        const y = baseY + ridgeHeight(x, 42 + ridge * 13, H * (0.18 - ridge * 0.05))
        ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      const alpha = 0.06 - ridge * 0.02
      ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
      ctx.fill()
    }

    // ── 中景山（浓墨） ──
    for (let ridge = 0; ridge < 3; ridge++) {
      const baseY = H * (0.35 + ridge * 0.13)
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 2) {
        const y = baseY + ridgeHeight(x, 78 + ridge * 19, H * (0.12 - ridge * 0.03))
        ctx.lineTo(x, Math.min(y, H * 0.9))
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      const alpha = 0.08 - ridge * 0.02
      ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
      ctx.fill()

      // 山脊线
      ctx.beginPath()
      for (let x = 0; x <= W; x += 2) {
        const y = baseY + ridgeHeight(x, 78 + ridge * 19, H * (0.12 - ridge * 0.03))
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(26, 26, 26, ${0.03 - ridge * 0.008})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    // ── 朱砂远峰 ──
    const cinnabarBase = H * 0.18
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 3) {
      const y = cinnabarBase + ridgeHeight(x, 99, H * 0.08) - H * 0.03
      ctx.lineTo(x, y)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fillStyle = 'rgba(194, 58, 43, 0.025)'
    ctx.fill()

    // ── 金色微光 ──
    const goldX = W * 0.45 + Math.sin(time * 0.3) * W * 0.08
    const goldY = H * 0.28
    const goldGrad = ctx.createRadialGradient(goldX, goldY, 0, goldX, goldY, W * 0.2)
    goldGrad.addColorStop(0, 'rgba(201, 168, 76, 0.04)')
    goldGrad.addColorStop(0.5, 'rgba(201, 168, 76, 0.012)')
    goldGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = goldGrad
    ctx.beginPath()
    ctx.arc(goldX, goldY, W * 0.2, 0, Math.PI * 2)
    ctx.fill()

    // ── 云雾飘动 ──
    for (const m of mists) {
      m.x += m.vx + Math.sin(time * 0.7 + m.life) * 0.3
      m.y += m.vy
      m.life -= 0.0008
      if (m.life <= 0) {
        m.life = 1
        m.x = Math.random() * W
        m.y = H * 0.5 + Math.random() * H * 0.45
        m.size = 30 + Math.random() * 80
      }
      const mx = m.x
      const my = m.y
      const fogGrad = ctx.createRadialGradient(mx, my, 0, mx, my, m.size)
      fogGrad.addColorStop(0, `rgba(245, 240, 232, ${m.life * 0.06})`)
      fogGrad.addColorStop(0.6, `rgba(245, 240, 232, ${m.life * 0.02})`)
      fogGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = fogGrad
      ctx.beginPath()
      ctx.ellipse(mx, my, m.size, m.size * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    mapAnimId = requestAnimationFrame(animate)
  }
  animate()
}

// ── 山水山路编织（Canvas 贝塞尔曲线） ──
function drawTrails() {
  const canvas = trailCanvas.value
  const grid = gridRef.value
  if (!canvas || !grid) return

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = grid.getBoundingClientRect()
  const W = rect.width
  const H = rect.height

  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.scale(dpr, dpr)

  // 获取各节点的中心坐标（相对 grid）
  function nodeCenter(selector) {
    const el = grid.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top }
  }

  // 获取节点底部中心（路径起点）/ 顶部中心（路径终点）
  function nodeBottom(selector) {
    const el = grid.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 - rect.left, y: r.bottom - rect.top }
  }

  function nodeTop(selector) {
    const el = grid.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2 - rect.left, y: r.top - rect.top }
  }

  // 各节点选择器
  const L1 = nodeBottom('.cell-top .level-node')
  const L2_top = nodeTop('.cell-mid .level-node')
  const L2_bot = nodeBottom('.cell-mid .level-node')
  const L3 = nodeTop('.cell-left .level-node')
  const L5 = nodeTop('.cell-right .level-node')
  const L4 = nodeTop('.cell-left-bottom .level-node')
  const L6 = nodeTop('.cell-right-bottom .level-node')

  // 路径定义: { from, to, cp1偏移, cp2偏移 }
  // 每条路径: L1→L2, L2→L3, L2→L5, L3→L4, L5→L6
  const connections = []

  if (L1 && L2_top) connections.push({ from: L1, to: L2_top, wobble: 0.12 })
  if (L2_bot && L3) connections.push({ from: L2_bot, to: L3, wobble: -0.18 })
  if (L2_bot && L5) connections.push({ from: L2_bot, to: L5, wobble: 0.18 })
  if (L3 && L4) connections.push({ from: { x: (nodeCenter('.cell-left .level-node') || L3).x, y: (nodeBottom('.cell-left .level-node') || L3).y }, to: L4, wobble: -0.1 })
  if (L5 && L6) connections.push({ from: { x: (nodeCenter('.cell-right .level-node') || L5).x, y: (nodeBottom('.cell-right .level-node') || L5).y }, to: L6, wobble: 0.1 })

  // 修复 L3→L4 和 L5→L6 的起点（使用节点底部）
  {
    const l3Bot = nodeBottom('.cell-left .level-node')
    const l5Bot = nodeBottom('.cell-right .level-node')
    if (l3Bot && L4) {
      connections[3] = { from: l3Bot, to: L4, wobble: -0.1 }
    }
    if (l5Bot && L6) {
      connections[4] = { from: l5Bot, to: L6, wobble: 0.1 }
    }
  }

  ctx.clearRect(0, 0, W, H)

  // 先行绘制苔点层（z-index 低于主线）
  const mossDots = []
  function addMoss(pathPoints) {
    const count = 8 + Math.floor(Math.random() * 12)
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      const idx = Math.floor(t * (pathPoints.length - 1))
      const p = pathPoints[idx]
      const offsetX = (Math.random() - 0.5) * 18
      const offsetY = (Math.random() - 0.5) * 18
      mossDots.push({ x: p.x + offsetX, y: p.y + offsetY, r: 0.4 + Math.random() * 1.2 })
    }
  }

  // 采样贝塞尔曲线为点集
  function sampleBezier(p0, p1, p2, p3, steps = 60) {
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const mt = 1 - t
      const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x
      const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y
      pts.push({ x, y })
    }
    return pts
  }

  // 存储所有路径点用于苔点
  const allPathPoints = []

  for (const conn of connections) {
    const { from, to, wobble } = conn
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 控制点：垂直方向自然弯曲
    const cp1 = { x: from.x + dx * 0.2 + dy * wobble, y: from.y + dy * 0.35 }
    const cp2 = { x: to.x - dx * 0.2 + dy * wobble, y: to.y - dy * 0.35 }

    const pathPts = sampleBezier(from, cp1, cp2, to, 80)
    allPathPoints.push(...pathPts)
    addMoss(pathPts)

    // 绘制主线：毛笔提按效果（中间粗，两端细）
    ctx.beginPath()
    ctx.moveTo(pathPts[0].x, pathPts[0].y)

    for (let i = 1; i < pathPts.length; i++) {
      // 分段绘制以实现可变线宽
      const t = i / pathPts.length
      // 线宽：两端细(0.4) 中间粗(1.8)
      const width = 0.4 + Math.sin(t * Math.PI) * 1.4

      if (i % 3 === 0 || i === pathPts.length - 1) {
        ctx.lineWidth = width
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.12 + Math.sin(t * Math.PI) * 0.08})`
        ctx.lineTo(pathPts[i].x, pathPts[i].y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pathPts[i].x, pathPts[i].y)
      } else {
        ctx.lineTo(pathPts[i].x, pathPts[i].y)
      }
    }
    ctx.stroke()

    // 淡墨背景层（更宽的浅墨迹）
    ctx.beginPath()
    ctx.moveTo(pathPts[0].x, pathPts[0].y)
    for (let i = 1; i < pathPts.length; i++) {
      ctx.lineTo(pathPts[i].x, pathPts[i].y)
    }
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.03)'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  // 绘制苔点
  for (const dot of mossDots) {
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${0.04 + Math.random() * 0.07})`
    ctx.fill()
  }
}

// 清理旧的 trail observer
function cleanupTrailObserver() {
  if (trailObserver) { trailObserver.disconnect(); trailObserver = null }
}

onMounted(() => {
  initMapCanvas()
  // 初始绘制山路
  setTimeout(() => drawTrails(), 300)
  // 监听 grid 大小变化重绘
  if (gridRef.value) {
    trailObserver = new ResizeObserver(() => {
      setTimeout(() => drawTrails(), 50)
    })
    trailObserver.observe(gridRef.value)
  }
  window.addEventListener('resize', drawTrails)
})

onUnmounted(() => {
  if (mapAnimId) cancelAnimationFrame(mapAnimId)
  cleanupTrailObserver()
  window.removeEventListener('resize', drawTrails)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 40px 24px 80px;
  max-width: 900px;
  margin: 0 auto;
}

/* 山水画布背景 */
.home__map-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.9;
}

/* Hero */
.home__hero {
  position: relative;
  z-index: 1;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.home__hero-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home__hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.home__title {
  font-size: 3.5rem;
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
}

.home__title-ink {
  font-family: var(--font-mono);
  font-size: 2rem;
  color: var(--cinnabar);
  letter-spacing: 0;
}

.home__title-main {
  font-family: var(--font-display);
  letter-spacing: 0.15em;
}

.home__subtitle {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink-medium);
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.home__desc {
  font-size: 0.9rem;
  color: var(--ink-light);
  letter-spacing: 0.15em;
}

/* 关卡地图——山水路线 */
.home__map {
  margin-bottom: 48px;
}

.home__map-legend {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

.home__map-legend-item {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--ink-light);
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.06em;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot--done {
  background: var(--gold);
  box-shadow: 0 0 4px rgba(201, 168, 76, 0.4);
}

.legend-dot--open {
  background: var(--cinnabar);
  animation: glow-pulse 2s ease-in-out infinite;
}

.legend-dot--locked {
  background: var(--ink-pale);
}

/* ── 山水网格 ── */
.landscape-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto;
  gap: 0;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
}

/* 山路 Canvas 叠加层 */
.home__trail-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── 路径连接线 ── */
.cell-path {
  position: relative;
  min-height: 36px;
  pointer-events: none;
}

/* 竖直连线（已改为 Canvas 山路，此处仅保留占位） */
.path-down::before,
.path-down-left::before,
.path-down-right::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 0;
  background: transparent;
}

/* 岔路标签 */
.path-split-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 0.7rem;
  color: var(--cinnabar);
  letter-spacing: 0.2em;
  min-height: 36px;
  pointer-events: none;
}

/* 向左岔路斜线（已改为 Canvas 山路） */
.path-split-left::after {
  content: none;
}

/* 向右岔路斜线（已改为 Canvas 山路） */
.path-split-right::after {
  content: none;
}

/* ── 网格定位 ── */
.cell-top            { grid-column: 2; grid-row: 1; }
.path-down           { grid-column: 2; grid-row: 2; }
.cell-mid            { grid-column: 2; grid-row: 3; }
.path-split-left     { grid-column: 1; grid-row: 4; }
.path-split-label    { grid-column: 2; grid-row: 4; }
.path-split-right    { grid-column: 3; grid-row: 4; }
.cell-left           { grid-column: 1; grid-row: 5; }
.cell-right          { grid-column: 3; grid-row: 5; }
.path-down-left      { grid-column: 1; grid-row: 6; }
.path-down-right     { grid-column: 3; grid-row: 6; }
.cell-left-bottom    { grid-column: 1; grid-row: 7; }
.cell-right-bottom   { grid-column: 3; grid-row: 7; }

/* ── 关卡节点卡片 ── */
.landscape-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
}

.level-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.88);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  width: 100%;
  max-width: 160px;
}

.level-node--unlocked {
  border-color: var(--ink-medium);
}

.level-node--unlocked:hover {
  border-color: var(--cinnabar);
  background: var(--paper);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 0 0 3px rgba(201, 168, 76, 0.1);
  transform: translateY(-3px);
}

.level-node--completed {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.06);
  box-shadow: 0 0 14px rgba(201, 168, 76, 0.07);
}

.level-node--completed:hover {
  box-shadow: 0 0 24px rgba(201, 168, 76, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.level-node--locked {
  opacity: 0.32;
  cursor: not-allowed;
}

.level-node__icon {
  font-size: 1.6rem;
  line-height: 1;
}

.level-node__name {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-align: center;
  line-height: 1.3;
}

.level-node__status {
  margin-top: 2px;
}

.node-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  padding: 2px 10px;
  letter-spacing: 0.12em;
}

.node-badge--done {
  color: var(--gold);
  border: 1px solid var(--gold);
}

.node-badge--go {
  color: var(--cinnabar);
  border: 1px solid var(--cinnabar);
  animation: glow-pulse 2s ease-in-out infinite;
}

.node-badge--lock {
  font-size: 0.85rem;
  border: none;
}

/* ── 地名标签 ── */
.landscape-label {
  font-family: var(--font-display);
  font-size: 0.68rem;
  color: var(--ink-light);
  letter-spacing: 0.2em;
  text-align: center;
  margin-top: 6px;
}

/* ── 响应式 ── */
@media (max-width: 600px) {
  .landscape-grid {
    max-width: 100%;
  }
  .level-node {
    max-width: 120px;
    padding: 10px 6px;
  }
  .level-node__name {
    font-size: 0.72rem;
  }
  .level-node__icon {
    font-size: 1.3rem;
  }
  .home__map-legend {
    gap: 14px;
  }
  .cell-path {
    min-height: 24px;
  }
}

/* 进度 */
.home__progress {
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.6);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.home__progress:hover {
  border-color: var(--gold);
  box-shadow: 0 4px 16px rgba(201, 168, 76, 0.1);
}

.home__progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.home__progress-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
}

.home__progress-count {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--gold);
}

.home__progress-bar {
  height: 4px;
  background: var(--ink-pale);
  margin-bottom: 20px;
  border-radius: 2px;
  overflow: hidden;
}

.home__progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--gold), var(--cinnabar));
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: 2px;
}

.home__progress-hint {
  text-align: right;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--ink-light);
  margin-top: 8px;
  letter-spacing: 0.06em;
  transition: color 0.3s;
}

.home__progress:hover .home__progress-hint {
  color: var(--gold);
}

.home__reset {
  display: block;
  margin: 0 auto;
  font-size: 0.8rem;
  padding: 8px 24px;
  opacity: 0.5;
}

.home__reset:hover {
  opacity: 1;
}
</style>
