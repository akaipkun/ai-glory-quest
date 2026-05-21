<template>
  <div class="bestiary">
    <!-- 顶部导航 -->
    <div class="bestiary__nav">
      <button class="bestiary__back" @click="$router.push('/')">
        ← 返回地图
      </button>
      <div class="bestiary__credits">
        <span v-if="auth.isGodMode" class="bestiary__god-badge">神力预览</span>
        <span class="bestiary__credits-nb">{{ game.totalCredits }}</span>
        <span class="bestiary__credits-label">学分</span>
        <span class="bestiary__credits-divider">·</span>
        <span class="bestiary__credits-badges">{{ game.badges.length }}/6 关 · {{ game.stepBadges.length }}/{{ game.totalStepBadges }} 步</span>
      </div>
    </div>

    <!-- 标题区 -->
    <div class="bestiary__hero">
      <div class="bestiary__title-wrap">
        <h1 class="bestiary__title">影 神 册</h1>
        <p class="bestiary__subtitle">AI 神魔图鉴 · 墨韵收录</p>
      </div>
      <div class="bestiary__hero-desc body-text">
        天地万物，皆有其神。六重关卡，六位神魔。每关三步，步步留痕。<br/>
        通关者得以收录其形，识其名，知其性，悟其道。
      </div>
    </div>

    <!-- 图鉴网格 -->
    <div class="bestiary__grid">
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="folio-card"
        :class="{
          'folio-card--unlocked': entry.unlocked,
          'folio-card--locked': !entry.unlocked
        }"
      >
        <!-- 插图区 -->
        <div class="folio-card__art">
          <!-- 未解锁：迷雾剪影 -->
          <div v-if="!entry.unlocked" class="folio-card__fog">
            <div class="folio-card__fog-layer"></div>
            <div class="folio-card__fog-layer fog-2"></div>
            <div class="folio-card__fog-layer fog-3"></div>
            <div class="folio-card__silhouette">{{ entry.silhouette }}</div>
            <div class="folio-card__question">？</div>
          </div>

          <!-- 已解锁：水墨插图 + 印章 -->
          <template v-else>
            <canvas
              :ref="el => { if (el) artCanvases[i] = el }"
              class="folio-card__canvas"
            ></canvas>
            <!-- 收录印章 -->
            <div class="folio-card__seal">
              <span class="folio-card__seal-text">{{ entry.godPreview ? '预<br/>览' : '收<br/>录' }}</span>
            </div>
          </template>
        </div>

        <!-- 信息区 -->
        <div class="folio-card__info">
          <h2 class="folio-card__name">
            {{ entry.unlocked ? entry.name : '？？？' }}
          </h2>
          <p class="folio-card__lore">
            {{ entry.unlocked ? entry.lore : entry.hint }}
          </p>

          <!-- 子步骤徽章行 -->
          <div v-if="entry.unlocked" class="folio-card__steps">
            <div
              v-for="(step, si) in entry.steps"
              :key="si"
              class="folio-card__step"
              :class="{
                'folio-card__step--earned': step.earned,
                'folio-card__step--god': step.earned && entry.godPreview
              }"
            >
              <span class="folio-card__step-icon">{{ step.icon }}</span>
              <span class="folio-card__step-name">{{ step.name }}</span>
              <span v-if="step.earned" class="folio-card__step-check">✓</span>
              <span v-else class="folio-card__step-lock">—</span>
            </div>
          </div>

          <!-- 未解锁时显示步骤占位 -->
          <div v-else class="folio-card__steps folio-card__steps--muted">
            <div v-for="si in 3" :key="si" class="folio-card__step folio-card__step--hidden">
              <span class="folio-card__step-icon">◌</span>
              <span class="folio-card__step-name">？？？</span>
            </div>
          </div>

          <!-- 日期 -->
          <div v-if="entry.unlocked && entry.earnedAt && !entry.godPreview" class="folio-card__date">
            {{ formatDate(entry.earnedAt) }} 收录
          </div>
          <div v-else-if="entry.godPreview" class="folio-card__date folio-card__date--god">
            神力预览 · 尚未收录
          </div>
          <div v-else class="folio-card__date folio-card__date--muted">
            尚未收录
          </div>
        </div>

        <!-- 角落编号 -->
        <div class="folio-card__index">{{ String(i + 1).padStart(2, '0') }}</div>
      </div>
    </div>

    <!-- 隐藏成就 -->
    <div class="bestiary__mini-badges">
      <h3 class="bestiary__mini-title">🏅 隐藏成就</h3>
      <p class="bestiary__mini-hint body-text">这些成就跨越关卡，只有真正的 AI 修行者才能一一解锁</p>
      <div class="bestiary__mini-grid">
        <div
          v-for="def in miniBadgeDefs"
          :key="def.id"
          class="mini-badge"
          :class="{ 'mini-badge--earned': hasMini(def.id) }"
        >
          <span class="mini-badge__icon">{{ hasMini(def.id) ? def.icon : '❓' }}</span>
          <span class="mini-badge__name">{{ hasMini(def.id) ? def.name : '???' }}</span>
          <span v-if="!hasMini(def.id)" class="mini-badge__hint" :title="def.hint">{{ def.hint }}</span>
        </div>
      </div>
    </div>

    <!-- 知识总纲入口 -->
    <div class="bestiary__knowledge-entry" @click="$router.push('/knowledge')">
      <span class="bestiary__knowledge-icon">📜</span>
      <span class="bestiary__knowledge-text">查看 AI 知识总纲 →</span>
    </div>

    <!-- 底部跋文 -->
    <div class="bestiary__colophon body-text" v-if="collectedCount === 6 && !auth.isGodMode">
      <div class="bestiary__colophon-line"></div>
      <p>六神皆已收录，影神册大成。天地之道，尽在此中。</p>
      <div class="bestiary__colophon-line"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'

const game = useGameStore()
const auth = useAuthStore()

const artCanvases = {}

// 图鉴条目
const entries = computed(() => {
  return game.levels.map((level) => {
    const badge = game.badges.find(b => b.levelId === level.id)
    const def = entryDefs[level.id] || entryDefs[1]
    const stepDefs = game.getStepBadgeDefs(level.id)
    const earnedSteps = game.getStepBadgesForLevel(level.id)

    // godMode 下所有关卡视为已解锁
    const isUnlocked = auth.isGodMode || !!badge

    return {
      id: level.id,
      name: level.name,
      unlocked: isUnlocked,
      godPreview: auth.isGodMode && !badge,
      earnedAt: badge?.earnedAt || null,
      lore: def.lore,
      hint: def.hint,
      silhouette: def.silhouette,
      draw: def.draw,
      steps: stepDefs.map(sd => {
        const earned = earnedSteps.some(es => es.stepIndex === sd.stepIndex)
        return {
          name: sd.name,
          icon: sd.icon,
          earned: auth.isGodMode ? true : earned
        }
      })
    }
  })
})

const collectedCount = computed(() => game.badges.length)

// 隐藏成就列表
const miniBadgeDefs = computed(() => game.getMiniBadgeDefs())
function hasMini(id) { return game.hasMiniBadge(id) }

// 各关卡的图文设定（不变）
const entryDefs = {
  1: {
    lore: '天地初开，花果山顶一灵石，受天真地秀、日精月华，内育仙胞。人工智能，亦是从人类千年智慧中孕育而生。',
    hint: '云雾深处，似有灵光闪动。传闻山巅有石，待有缘人一探。',
    silhouette: '🪨',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.55
      const glow = ctx.createRadialGradient(cx, cy, w * 0.05, cx, cy, w * 0.42)
      glow.addColorStop(0, 'rgba(201,168,76,0.2)')
      glow.addColorStop(0.5, 'rgba(201,168,76,0.06)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h)
      ctx.beginPath()
      ctx.ellipse(cx, cy, w * 0.25, h * 0.28, 0, 0, Math.PI * 2)
      const sg = ctx.createLinearGradient(cx - w * 0.2, cy - h * 0.2, cx + w * 0.2, cy + h * 0.2)
      sg.addColorStop(0, '#3A3A3A'); sg.addColorStop(0.4, '#1A1A1A'); sg.addColorStop(0.7, '#6A6A6A'); sg.addColorStop(1, '#9A9A9A')
      ctx.fillStyle = sg; ctx.fill()
      ctx.strokeStyle = 'rgba(201,168,76,0.4)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx - w * 0.08, cy - h * 0.15); ctx.quadraticCurveTo(cx + w * 0.05, cy + h * 0.02, cx - w * 0.04, cy + h * 0.18); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + w * 0.1, cy - h * 0.1); ctx.quadraticCurveTo(cx + w * 0.02, cy - h * 0.05, cx + w * 0.08, cy + h * 0.15); ctx.stroke()
    }
  },
  2: {
    lore: '灵石既出，须经峡谷修炼。每日吸收数据之灵气，锤炼算法之筋骨。千锤百炼，方成大器。',
    hint: '峡谷幽深，似闻训练之声。不知何物在此潜修。',
    silhouette: '🔰',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.55
      ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w * 0.08, h * 0.6, w * 0.3, h * 0.2); ctx.quadraticCurveTo(w * 0.35, h * 0.35, w * 0.4, h * 0.55); ctx.lineTo(w * 0.4, h); ctx.closePath(); ctx.fillStyle = '#1A1A1A'; ctx.fill()
      ctx.beginPath(); ctx.moveTo(w, h); ctx.quadraticCurveTo(w * 0.85, h * 0.55, w * 0.7, h * 0.15); ctx.quadraticCurveTo(w * 0.62, h * 0.3, w * 0.58, h * 0.55); ctx.lineTo(w * 0.58, h); ctx.closePath(); ctx.fillStyle = '#2A2A2A'; ctx.fill()
      const glow = ctx.createRadialGradient(cx, cy - h * 0.1, w * 0.02, cx, cy, w * 0.3)
      glow.addColorStop(0, 'rgba(74,124,111,0.3)'); glow.addColorStop(0.5, 'rgba(74,124,111,0.1)'); glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow; ctx.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.6)
    }
  },
  3: {
    lore: '修炼有成，开得火眼金睛。能辨万物之形，识众生之相。世间万象，皆难逃此目。',
    hint: '深渊之中，似有一双眼睛，灼灼发光。它在注视着什么？',
    silhouette: '🔥',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.5
      ctx.beginPath(); ctx.ellipse(cx - w * 0.18, cy, w * 0.16, h * 0.1, -0.1, 0, Math.PI * 2); ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx + w * 0.18, cy, w * 0.16, h * 0.1, 0.1, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - w * 0.18, cy, w * 0.05, 0, Math.PI * 2); ctx.fillStyle = '#C23A2B'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx + w * 0.18, cy, w * 0.05, 0, Math.PI * 2); ctx.fillStyle = '#C23A2B'; ctx.fill()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2; const rx = cx + Math.cos(a) * w * 0.25; const ry = cy + Math.sin(a) * h * 0.15
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + 8, ry - 18, rx, ry - 30); ctx.fillStyle = 'rgba(194,58,43,0.25)'; ctx.fill()
      }
    }
  },
  4: {
    lore: '神功初成，踏入王者排位。与天下强者争锋，排名次第。胜者加冕，败者再修。',
    hint: '虚空之中，似有一顶王冠悬浮。谁将登顶称王？',
    silhouette: '👑',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.45
      ctx.beginPath(); ctx.moveTo(cx - w * 0.28, cy + h * 0.1); ctx.lineTo(cx + w * 0.28, cy + h * 0.1); ctx.lineTo(cx + w * 0.22, cy - h * 0.05)
      ctx.lineTo(cx + w * 0.18, cy - h * 0.2); ctx.lineTo(cx + w * 0.08, cy - h * 0.05)
      ctx.lineTo(cx, cy - h * 0.32); ctx.lineTo(cx - w * 0.08, cy - h * 0.05)
      ctx.lineTo(cx - w * 0.18, cy - h * 0.2); ctx.lineTo(cx - w * 0.22, cy - h * 0.05); ctx.closePath()
      ctx.fillStyle = '#C9A84C'; ctx.fill(); ctx.strokeStyle = '#8B7A3A'; ctx.lineWidth = 1.5; ctx.stroke()
      ;[-0.18, -0.06, 0.06, 0.18].forEach(gx => { ctx.beginPath(); ctx.arc(cx + gx * w, cy + h * 0.12, 4, 0, Math.PI * 2); ctx.fillStyle = '#C23A2B'; ctx.fill() })
    }
  },
  5: {
    lore: '王者既出，神通广大。七十二般变化，随心所欲。万类之形，皆可拟之。万物之态，皆可生之。',
    hint: '镜中倒影万千，虚实难辨。何为本相，何为幻形？',
    silhouette: '🪶',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.5
      const shapes = [
        { x: cx - w * 0.15, y: cy - h * 0.05, a: -0.3, c: '#1A1A1A' }, { x: cx + w * 0.05, y: cy - h * 0.12, a: 0.2, c: '#2A2A2A' },
        { x: cx - w * 0.05, y: cy - h * 0.18, a: -0.1, c: '#1A1A1A' }, { x: cx + w * 0.15, y: cy - h * 0.02, a: 0.3, c: '#3A3A3A' },
        { x: cx - w * 0.18, y: cy + h * 0.08, a: -0.4, c: '#2A2A2A' }
      ]
      shapes.forEach(s => { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.beginPath(); ctx.ellipse(0, 0, w * 0.08, h * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = s.c; ctx.fill(); ctx.fillStyle = 'rgba(201,168,76,0.15)'; ctx.fill(); ctx.restore() })
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.06, 0, Math.PI * 2); ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([])
    }
  },
  6: {
    lore: '诸神集结，团战时刻。或为盟友，或为对手。千军万马中，算法的交响如雷贯耳。集大成者，方成不朽。',
    hint: '远处战鼓擂动，千军呼啸。最终之战，尚待勇者。',
    silhouette: '💥',
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.5
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2; const len = w * (0.25 + (i % 3) * 0.05)
        const ex = cx + Math.cos(a) * len; const ey = cy + Math.sin(a) * len
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey)
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(194,58,43,0.4)' : 'rgba(201,168,76,0.35)'; ctx.lineWidth = i === 0 ? 3 : 1.5; ctx.stroke()
      }
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.12); cg.addColorStop(0, '#C23A2B'); cg.addColorStop(0.5, '#C9A84C'); cg.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.12, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill()
    }
  }
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  const m = d.getMonth() + 1
  const moonNames = ['', '孟春', '仲春', '季春', '孟夏', '仲夏', '季夏', '孟秋', '仲秋', '季秋', '孟冬', '仲冬', '季冬']
  return `${d.getFullYear()}年 ${moonNames[m] || ''}`
}

// 绘制 Canvas 插图
function drawAllArt() {
  requestAnimationFrame(() => {
    entries.value.forEach((entry, i) => {
      if (!entry.unlocked) return
      const canvas = artCanvases[i]
      if (!canvas) return
      const rect = canvas.parentElement.getBoundingClientRect()
      if (rect.width === 0) return
      canvas.width = rect.width * (window.devicePixelRatio || 1)
      canvas.height = rect.height * (window.devicePixelRatio || 1)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
      entryDefs[entry.id]?.draw(ctx, rect.width, rect.height)
    })
  })
}

onMounted(() => {
  drawAllArt()
  window.addEventListener('resize', drawAllArt)
})

onUnmounted(() => {
  window.removeEventListener('resize', drawAllArt)
})

// godMode 变化时重绘
watch(() => auth.isGodMode, () => {
  nextTick(drawAllArt)
})
</script>

<style scoped>
.bestiary {
  min-height: 100vh;
  padding: 32px 24px 80px;
  max-width: 1060px;
  margin: 0 auto;
  position: relative;
}
.bestiary::before {
  content: ''; position: fixed; inset: 0; z-index: -1;
  background: url('/images/bestiary-bg.png') center/cover;
  opacity: 0.04; pointer-events: none;
}

.bestiary__nav {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;
}

.bestiary__back {
  background: none; border: none; font-family: var(--font-body); font-size: 0.9rem;
  color: var(--ink-medium); cursor: pointer; padding: 6px 0; transition: color 0.3s; letter-spacing: 0.08em;
}
.bestiary__back:hover { color: var(--ink-black); }

.bestiary__credits { display: flex; align-items: center; gap: 8px; }

.bestiary__god-badge {
  font-family: var(--font-display); font-size: 0.7rem; color: var(--gold);
  border: 1px solid var(--gold); padding: 2px 10px; letter-spacing: 0.1em;
  animation: glow-pulse 2s ease-in-out infinite;
}

.bestiary__credits-nb { font-family: var(--font-display); font-size: 1.8rem; color: var(--gold); line-height: 1; }
.bestiary__credits-label { font-family: var(--font-body); font-size: 0.8rem; color: var(--ink-medium); }
.bestiary__credits-divider { color: var(--ink-pale); font-size: 0.8rem; }
.bestiary__credits-badges { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-light); }

.bestiary__hero { text-align: center; margin-bottom: 56px; }
.bestiary__title-wrap { display: inline-block; position: relative; margin-bottom: 20px; }
.bestiary__title {
  font-family: var(--font-display); font-size: 3.2rem; color: var(--ink-black);
  letter-spacing: 0.5em; font-weight: 400; position: relative;
}
.bestiary__title::before, .bestiary__title::after {
  content: ''; position: absolute; top: 50%; width: 60px; height: 1px; background: var(--ink-pale);
}
.bestiary__title::before { right: calc(100% + 20px); }
.bestiary__title::after { left: calc(100% + 20px); }
.bestiary__subtitle { font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-light); letter-spacing: 0.15em; margin-top: 8px; }
.bestiary__hero-desc { font-size: 0.85rem; color: var(--ink-medium); line-height: 2; letter-spacing: 0.06em; max-width: 540px; margin: 0 auto; }

.bestiary__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 860px) { .bestiary__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 580px) { .bestiary__grid { grid-template-columns: 1fr; } }

.folio-card {
  position: relative; border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.85); transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex; flex-direction: column;
  transform-style: preserve-3d;
}
.folio-card--unlocked { border-color: var(--ink-medium); cursor: default; }
.folio-card--unlocked:hover {
  border-color: var(--gold);
  box-shadow: 0 16px 40px rgba(201, 168, 76, 0.14), 0 6px 16px rgba(0,0,0,0.08);
  transform: perspective(800px) rotateY(-2deg) rotateX(2deg) translateY(-4px);
}
.folio-card--locked { opacity: 0.7; }

.folio-card__art {
  position: relative; height: 180px; overflow: hidden;
  background: linear-gradient(to bottom, rgba(245,240,232,0.5), rgba(237,228,213,0.3) 60%, rgba(245,240,232,0.6));
}
.folio-card__canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* 迷雾 */
.folio-card__fog { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.folio-card__fog-layer {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 40%, rgba(26,26,26,0.12), transparent 60%),
              radial-gradient(ellipse at 60% 50%, rgba(26,26,26,0.08), transparent 50%),
              radial-gradient(ellipse at 45% 60%, rgba(26,26,26,0.06), transparent 40%);
}
.folio-card__fog-layer.fog-2 { background: repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(26,26,26,0.03) 20px, rgba(26,26,26,0.03) 21px); animation: fog-drift 8s linear infinite; }
.folio-card__fog-layer.fog-3 { background: radial-gradient(ellipse at 50% 80%, rgba(26,26,26,0.1), transparent 70%); animation: fog-drift 12s linear infinite reverse; }
@keyframes fog-drift { 0% { transform: translateX(0); } 50% { transform: translateX(10px); } 100% { transform: translateX(0); } }
.folio-card__silhouette { position: relative; z-index: 1; font-size: 3rem; opacity: 0.25; filter: blur(4px); }
.folio-card__question { position: absolute; bottom: 16px; right: 20px; z-index: 1; font-family: var(--font-display); font-size: 2.5rem; color: var(--ink-pale); opacity: 0.5; }

/* 印章 */
.folio-card__seal {
  position: absolute; bottom: 10px; right: 12px; width: 48px; height: 48px;
  border: 2px solid var(--cinnabar); display: flex; align-items: center; justify-content: center;
  transform: rotate(-12deg); background: rgba(245, 240, 232, 0.6); z-index: 2;
}
.folio-card__seal::after { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(194,58,43,0.35); }
.folio-card__seal-text { font-family: var(--font-display); font-size: 0.85rem; color: var(--cinnabar); line-height: 1.2; text-align: center; }

/* 信息区 */
.folio-card__info { padding: 14px 16px 18px; flex: 1; display: flex; flex-direction: column; }
.folio-card__name { font-family: var(--font-display); font-size: 1.15rem; color: var(--ink-black); letter-spacing: 0.12em; margin-bottom: 6px; font-weight: 400; }
.folio-card--locked .folio-card__name { color: var(--ink-light); }
.folio-card__lore { font-family: var(--font-body); font-size: 0.75rem; color: var(--ink-medium); line-height: 1.7; letter-spacing: 0.04em; flex: 1; }
.folio-card--locked .folio-card__lore { color: var(--ink-pale); font-style: italic; }

/* 子步骤徽章行 */
.folio-card__steps { display: flex; gap: 4px; margin: 8px 0; }
.folio-card__steps--muted { opacity: 0.35; }
.folio-card__step {
  flex: 1; display: flex; align-items: center; gap: 3px; padding: 4px 5px;
  border: 1px solid var(--ink-pale); font-size: 0.65rem; transition: all 0.3s ease;
}
.folio-card__step--earned { border-color: var(--gold); background: rgba(201,168,76,0.06); }
.folio-card__step--god { border-color: var(--gold); border-style: dashed; }
.folio-card__step--hidden { opacity: 0.5; }
.folio-card__step-icon { font-size: 0.75rem; flex-shrink: 0; }
.folio-card__step-name { font-family: var(--font-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.folio-card__step-check { color: var(--gold); font-weight: 700; flex-shrink: 0; }
.folio-card__step-lock { color: var(--ink-pale); flex-shrink: 0; }

.folio-card__date { font-family: var(--font-mono); font-size: 0.68rem; color: var(--gold); margin-top: 8px; letter-spacing: 0.06em; }
.folio-card__date--muted { color: var(--ink-pale); }
.folio-card__date--god { color: var(--cinnabar); font-style: italic; }

.folio-card__index { position: absolute; top: 6px; left: 8px; font-family: var(--font-mono); font-size: 0.6rem; color: var(--ink-pale); }

/* 跋文 */
.bestiary__colophon {
  text-align: center; margin-top: 64px; padding: 24px 0; color: var(--gold);
  font-size: 1rem; letter-spacing: 0.1em; display: flex; align-items: center; justify-content: center; gap: 24px;
}
.bestiary__colophon-line { width: 80px; height: 1px; background: var(--gold); opacity: 0.3; }

/* 隐藏成就 */
.bestiary__mini-badges {
  margin-top: 48px; padding: 28px 24px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.4);
  text-align: center;
}
.bestiary__mini-title { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.12em; margin-bottom: 6px; }
.bestiary__mini-hint { font-size: 0.75rem; color: var(--ink-light); margin-bottom: 20px; letter-spacing: 0.04em; }

.bestiary__mini-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
@media (max-width: 700px) { .bestiary__mini-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 440px) { .bestiary__mini-grid { grid-template-columns: repeat(2, 1fr); } }

.mini-badge {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 6px; border: 1px solid var(--ink-pale);
  transition: all 0.3s ease;
}
.mini-badge--earned { border-color: var(--gold); background: rgba(201,168,76,0.06); }
.mini-badge__icon { font-size: 1.4rem; }
.mini-badge__name { font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.06em; }
.mini-badge__hint {
  font-family: var(--font-body); font-size: 0.6rem; color: var(--ink-pale);
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 知识总纲入口 */
.bestiary__knowledge-entry {
  margin-top: 32px; padding: 20px; text-align: center;
  border: 1px solid var(--ink-pale); cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  background: rgba(245,240,232,0.4);
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.bestiary__knowledge-entry:hover { border-color: var(--gold); box-shadow: 0 4px 16px rgba(201,168,76,0.1); }
.bestiary__knowledge-icon { font-size: 1.5rem; }
.bestiary__knowledge-text { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; color: var(--ink-medium); transition: color 0.3s; }
.bestiary__knowledge-entry:hover .bestiary__knowledge-text { color: var(--gold); }
</style>
