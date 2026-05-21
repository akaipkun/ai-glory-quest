<template>
  <canvas ref="trailCanvas" class="ink-cursor-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const trailCanvas = ref(null)
let ctx = null
let mouseX = -100, mouseY = -100
let prevX = -100, prevY = -100
let particles = []
let animId = null

const MAX_PARTICLES = 40
const TRAIL_LIFETIME = 0.6 // seconds

function createParticle(x, y) {
  return {
    x, y,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8 - 0.3,
    life: TRAIL_LIFETIME + Math.random() * 0.3,
    maxLife: TRAIL_LIFETIME + Math.random() * 0.3,
    size: 1 + Math.random() * 2.5,
  }
}

function onMouseMove(e) {
  prevX = mouseX
  prevY = mouseY
  mouseX = e.clientX
  mouseY = e.clientY

  // Add particles between prev and current position
  const dx = mouseX - prevX
  const dy = mouseY - prevY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > 0 && prevX > -50) {
    const steps = Math.min(Math.ceil(dist / 6), 8)
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      particles.push(createParticle(prevX + dx * t, prevY + dy * t))
    }
  } else {
    particles.push(createParticle(mouseX, mouseY))
  }

  // Cap particles
  while (particles.length > MAX_PARTICLES) {
    particles.shift()
  }
}

function onMouseLeave() {
  mouseX = -100
  mouseY = -100
  prevX = -100
  prevY = -100
}

function resize() {
  const canvas = trailCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function animate() {
  if (!ctx) return
  const canvas = trailCanvas.value
  if (!canvas) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw fading particles (ink drops)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= 0.016
    p.x += p.vx
    p.y += p.vy

    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }

    const progress = p.life / p.maxLife
    // Fade out with a slight ink-wash feel
    const alpha = progress * progress * 0.35
    const size = p.size * (0.4 + progress * 0.6)

    // Ink drop — slight randomness for organic feel
    ctx.beginPath()
    ctx.arc(p.x + Math.sin(p.life * 8 + i) * 0.3, p.y + Math.cos(p.life * 7 + i) * 0.3, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`
    ctx.fill()
  }

  // Draw current cursor position — a small ink brush tip
  if (mouseX > -50 && mouseY > -50) {
    // Outer glow
    const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 10)
    grad.addColorStop(0, 'rgba(194, 58, 43, 0.25)')
    grad.addColorStop(0.6, 'rgba(194, 58, 43, 0.05)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2)
    ctx.fill()

    // Core dot
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(26, 26, 26, 0.7)'
    ctx.fill()

    // Small ring
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(194, 58, 43, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  animId = requestAnimationFrame(animate)
}

onMounted(() => {
  const canvas = trailCanvas.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseleave', onMouseLeave)
  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.ink-cursor-canvas {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}
</style>
