<template>
  <canvas ref="canvasRef" class="ink-bg-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
let particles = []

class InkParticle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = 1 + Math.random() * 3
    this.speedX = (Math.random() - 0.5) * 0.3
    this.speedY = (Math.random() - 0.5) * 0.3
    this.opacity = 0.02 + Math.random() * 0.06
    this.life = 0.5 + Math.random() * 2
    this.maxLife = this.life
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    this.life -= 0.005
    this.opacity *= 0.998
  }

  draw(ctx) {
    if (this.life <= 0) return
    const alpha = this.opacity * Math.min(1, this.life / this.maxLife * 2)
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
    ctx.fill()
  }
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  window.addEventListener('resize', resize)
  resize()

  // 初始粒子
  for (let i = 0; i < 30; i++) {
    particles.push(new InkParticle(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    ))
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制淡墨山水背景
    drawLandscape(ctx, canvas.width, canvas.height)

    // 更新和绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update()
      particles[i].draw(ctx)
      if (particles[i].life <= 0) {
        particles.splice(i, 1)
      }
    }

    // 补充粒子
    while (particles.length < 25) {
      particles.push(new InkParticle(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ))
    }

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

function drawLandscape(ctx, w, h) {
  // 淡墨远山
  ctx.save()
  ctx.globalAlpha = 0.04

  // 左山
  ctx.beginPath()
  ctx.moveTo(0, h * 0.7)
  ctx.quadraticCurveTo(w * 0.1, h * 0.3, w * 0.2, h * 0.65)
  ctx.quadraticCurveTo(w * 0.3, h * 0.4, w * 0.4, h * 0.7)
  ctx.lineTo(w * 0.4, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fillStyle = '#1A1A1A'
  ctx.fill()

  // 右山
  ctx.beginPath()
  ctx.moveTo(w, h * 0.65)
  ctx.quadraticCurveTo(w * 0.85, h * 0.25, w * 0.7, h * 0.6)
  ctx.quadraticCurveTo(w * 0.6, h * 0.35, w * 0.5, h * 0.65)
  ctx.lineTo(w * 0.5, h)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = '#1A1A1A'
  ctx.fill()

  // 祥云
  drawCloud(ctx, w * 0.15, h * 0.35, 0.03)
  drawCloud(ctx, w * 0.75, h * 0.3, 0.02)
  drawCloud(ctx, w * 0.5, h * 0.2, 0.025)

  ctx.restore()
}

function drawCloud(ctx, x, y, opacity) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.arc(x, y, 30, 0, Math.PI * 2)
  ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2)
  ctx.arc(x + 50, y, 30, 0, Math.PI * 2)
  ctx.arc(x + 25, y + 5, 20, 0, Math.PI * 2)
  ctx.fillStyle = '#1A1A1A'
  ctx.fill()
  ctx.restore()
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.ink-bg-canvas {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
</style>
