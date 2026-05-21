<template>
  <div class="home">
    <!-- 开场墨迹动画 -->
    <div class="home__hero">
      <canvas ref="heroCanvas" class="home__hero-canvas"></canvas>
      <div class="home__hero-content">
        <h1 class="home__title ink-animate-converge">
          <span class="home__title-ink">AI</span>
          <span class="home__title-main">荣耀闯关</span>
        </h1>
        <p class="home__subtitle ink-animate-converge delay-2">
          以水墨丹青，悟人工智能
        </p>
        <p class="home__desc body-text ink-animate-converge delay-3">
          六重关卡 · 六枚勋章 · 兑换学分
        </p>
      </div>
    </div>

    <!-- 关卡地图 -->
    <div class="home__map">
      <div class="home__map-title">
        <span class="ink-seal">闯 关 地 图</span>
      </div>

      <div class="level-grid">
        <div
          v-for="(level, index) in game.levels"
          :key="level.id"
          class="level-card"
          :class="{
            'level-card--unlocked': level.unlocked,
            'level-card--completed': level.completed,
            'level-card--locked': !level.unlocked
          }"
          @click="enterLevel(level)"
        >
          <!-- 关卡间的连接线 -->
          <div v-if="index < game.levels.length - 1" class="level-card__connector">
            <div class="level-card__connector-line"
              :class="{ 'level-card__connector-line--active': level.completed }"
            ></div>
          </div>

          <div class="level-card__inner">
            <div class="level-card__icon">{{ level.icon }}</div>
            <div class="level-card__name">{{ level.name }}</div>
            <div class="level-card__status">
              <span v-if="level.completed" class="level-card__badge">已通关</span>
              <span v-else-if="level.unlocked" class="level-card__badge level-card__badge--ready">可挑战</span>
              <span v-else class="level-card__badge level-card__badge--locked">🔒</span>
            </div>
            <div v-if="level.score > 0" class="level-card__score">
              最高 {{ Math.round(level.score) }}%
            </div>
          </div>

          <!-- 水墨装饰 -->
          <div v-if="level.completed" class="level-card__seal">✅</div>
        </div>
      </div>
    </div>

    <!-- 成就进度 -->
    <div class="home__progress">
      <div class="home__progress-header">
        <span class="home__progress-label">成就进度</span>
        <span class="home__progress-count">
          {{ game.badges.length }} / 6 勋章 · {{ game.totalCredits }} 学分
        </span>
      </div>
      <div class="home__progress-bar">
        <div
          class="home__progress-fill"
          :style="{ width: (game.badges.length / 6 * 100) + '%' }"
        ></div>
      </div>
      <div class="home__badges">
        <div
          v-for="level in game.levels"
          :key="'badge-' + level.id"
          class="home__badge"
          :class="{ 'home__badge--earned': level.completed }"
        >
          <span class="home__badge-icon">{{ level.icon }}</span>
          <span class="home__badge-name">{{ level.name }}</span>
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <button class="ink-btn home__reset" @click="game.reset()" v-if="game.badges.length > 0">
      重置进度
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const game = useGameStore()
const heroCanvas = ref(null)
let heroAnimId = null

function enterLevel(level) {
  if (!level.unlocked) return
  router.push(`/level/${level.id}`)
}

function initHeroCanvas() {
  const canvas = heroCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = canvas.parentElement.offsetHeight
  }
  window.addEventListener('resize', resize)
  resize()

  // 墨水粒子
  const particles = []
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.2 - Math.random() * 0.3,
      size: 2 + Math.random() * 4,
      life: 1,
      maxLife: 1
    })
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 中心墨迹晕染
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2 + 20, 0,
      canvas.width / 2, canvas.height / 2 + 20, 150
    )
    gradient.addColorStop(0, 'rgba(26, 26, 26, 0.08)')
    gradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.04)')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 粒子
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.003
      if (p.life <= 0) {
        p.life = p.maxLife
        p.x = canvas.width / 2 + (Math.random() - 0.5) * 200
        p.y = canvas.height / 2 + 50
        p.size = 2 + Math.random() * 4
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${p.life * 0.15})`
      ctx.fill()
    }

    heroAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  initHeroCanvas()
})

onUnmounted(() => {
  if (heroAnimId) cancelAnimationFrame(heroAnimId)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 40px 24px 80px;
  max-width: 900px;
  margin: 0 auto;
}

/* Hero */
.home__hero {
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
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

/* 关卡地图 */
.home__map {
  margin-bottom: 48px;
}

.home__map-title {
  text-align: center;
  margin-bottom: 32px;
}

.level-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
}

.level-card {
  position: relative;
  width: 280px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.level-card:hover:not(.level-card--locked) {
  transform: translateX(8px);
}

.level-card__connector {
  display: flex;
  justify-content: center;
  height: 32px;
}

.level-card__connector-line {
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, var(--ink-pale), var(--ink-light));
}

.level-card__connector-line--active {
  background: var(--cinnabar);
  box-shadow: 0 0 6px rgba(194, 58, 43, 0.3);
}

.level-card__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.8);
  transition: all 0.3s ease;
  position: relative;
}

.level-card--unlocked .level-card__inner {
  border-color: var(--ink-medium);
}

.level-card--unlocked:hover .level-card__inner {
  border-color: var(--ink-black);
  background: var(--paper);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.level-card--completed .level-card__inner {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.05);
}

.level-card--locked .level-card__inner {
  opacity: 0.4;
  cursor: not-allowed;
}

.level-card__icon {
  font-size: 1.8rem;
  width: 48px;
  text-align: center;
}

.level-card__name {
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
}

.level-card__status {
  font-size: 0.75rem;
}

.level-card__badge {
  padding: 2px 10px;
  border: 1px solid var(--ink-pale);
  font-family: var(--font-body);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
}

.level-card__badge--ready {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  animation: glow-pulse 2s ease-in-out infinite;
}

.level-card__badge--locked {
  border: none;
  font-size: 1rem;
}

.level-card--completed .level-card__badge {
  border-color: var(--gold);
  color: var(--gold);
}

.level-card__score {
  position: absolute;
  top: -8px;
  right: 12px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--verdant);
  background: var(--paper);
  padding: 0 6px;
}

.level-card__seal {
  position: absolute;
  top: -12px;
  left: -12px;
  font-size: 1.5rem;
  transform: rotate(-15deg);
}

/* 进度 */
.home__progress {
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.6);
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

.home__badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.home__badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--ink-pale);
  font-size: 0.8rem;
  opacity: 0.4;
  filter: grayscale(1);
  transition: all 0.3s ease;
}

.home__badge--earned {
  opacity: 1;
  filter: none;
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
}

.home__badge-icon {
  font-size: 1rem;
}

.home__badge-name {
  font-family: var(--font-body);
  font-size: 0.7rem;
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
