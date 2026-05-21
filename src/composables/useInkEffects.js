import { ref, onUnmounted } from 'vue'

/**
 * 水墨特效组合式函数
 * 提供 Canvas 基础的墨迹渲染能力
 */
export function useInkEffects() {
  let animationId = null
  const particles = ref([])

  /**
   * 在 Canvas 上渲染一个墨迹晕染效果
   */
  function renderInkBleed(ctx, x, y, radius = 80, color = '#1A1A1A', opacity = 0.3) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.3, color)
    gradient.addColorStop(0.6, hexToRgba(color, 0.3))
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.globalAlpha = opacity
    ctx.fill()
    ctx.globalAlpha = 1
  }

  /**
   * 创建墨迹粒子飞溅效果
   */
  function createInkSplash(cx, cy, count = 30, color = '#1A1A1A') {
    const newParticles = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 120
      const size = 2 + Math.random() * 6
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        color,
        originX: cx,
        originY: cy
      })
    }
    particles.value = [...particles.value, ...newParticles]
    return newParticles
  }

  /**
   * 动画循环更新粒子
   */
  function animateParticles(ctx, width, height, customParticles = null) {
    const activeParticles = customParticles || particles.value

    function tick() {
      ctx.clearRect(0, 0, width, height)

      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i]
        p.x += p.vx * 0.016
        p.y += p.vy * 0.016
        p.vy += 60 * 0.016 // 轻微重力
        p.life -= p.decay
        p.size *= 0.998

        if (p.life <= 0 || p.size < 0.5) {
          activeParticles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(p.color, p.life * 0.8)
        ctx.fill()
      }

      animationId = requestAnimationFrame(tick)
    }

    tick()
    return activeParticles
  }

  /**
   * 绘制手写风格曲线
   */
  function drawBrushCurve(ctx, points, color = '#1A1A1A', width = 3, jitter = 1.5) {
    if (points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2
      const yc = (points[i].y + points[i + 1].y) / 2
      ctx.quadraticCurveTo(
        points[i].x + (Math.random() - 0.5) * jitter,
        points[i].y + (Math.random() - 0.5) * jitter,
        xc, yc
      )
    }

    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  /**
   * 绘制印章
   */
  function drawSeal(ctx, x, y, text, size = 80) {
    ctx.save()

    // 印章边框
    ctx.strokeStyle = '#C23A2B'
    ctx.lineWidth = 3
    ctx.strokeRect(x - size/2, y - size/2, size, size)

    // 内边框
    ctx.strokeStyle = 'rgba(194, 58, 43, 0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(x - size/2 + 5, y - size/2 + 5, size - 10, size - 10)

    // 印章文字
    ctx.fillStyle = '#C23A2B'
    ctx.font = `${size * 0.2}px "ZCOOL QingKe HuangYou"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)

    // 随机噪点模拟印章纹理
    for (let i = 0; i < 100; i++) {
      const nx = x + (Math.random() - 0.5) * size
      const ny = y + (Math.random() - 0.5) * size
      ctx.fillStyle = `rgba(194, 58, 43, ${Math.random() * 0.15})`
      ctx.fillRect(nx, ny, 1, 1)
    }

    ctx.restore()
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  onUnmounted(() => {
    stopAnimation()
  })

  return {
    particles,
    renderInkBleed,
    createInkSplash,
    animateParticles,
    drawBrushCurve,
    drawSeal,
    stopAnimation,
    hexToRgba
  }
}
