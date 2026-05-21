<template>
  <div class="adversarial">
    <div class="adv__container">
      <h2 class="adv__title fade-in">🎭 真假美猴王 · 对抗样本</h2>
      <p class="adv__subtitle body-text fade-in delay-1">微小改变就能让AI"看错"——这暴露了AI视觉的什么局限？</p>

      <div class="adv__demo fade-in delay-2">
        <!-- 实验选择 -->
        <div class="adv__experiments">
          <div v-for="(exp, i) in experiments" :key="i" class="adv__exp-tab"
            :class="{ 'adv__exp-tab--active': activeExp === i }" @click="activeExp = i">
            {{ exp.name }}
          </div>
        </div>

        <!-- 对抗样本演示 -->
        <div class="adv__visual">
          <div class="adv__original">
            <div class="adv__label">原图</div>
            <div class="adv__emoji">{{ experiments[activeExp].original }}</div>
            <div class="adv__pred mono-text">{{ experiments[activeExp].originalLabel }}: {{ (100 - noiseLevel).toFixed(0) }}%</div>
          </div>

          <div class="adv__plus">+</div>

          <div class="adv__noise">
            <div class="adv__label">对抗噪声 ×{{ noiseMultiplier.toFixed(1) }}</div>
            <canvas ref="noiseCanvas" class="adv__noise-canvas"></canvas>
          </div>

          <div class="adv__equals">=</div>

          <div class="adv__result">
            <div class="adv__label">AI 看到</div>
            <div class="adv__emoji">{{ currentPrediction.emoji }}</div>
            <div class="adv__pred mono-text">{{ currentPrediction.label }}: {{ currentPrediction.prob }}%</div>
          </div>
        </div>

        <!-- 噪声强度滑块 -->
        <div class="adv__slider-group">
          <label class="adv__slider-label">噪声强度</label>
          <input type="range" class="adv__slider" min="0" max="100" v-model.number="noiseLevel" />
          <div class="adv__slider-marks">
            <span>无噪声</span>
            <span>微弱</span>
            <span>明显</span>
            <span>强烈</span>
          </div>
        </div>

        <div class="adv__insight body-text">
          💡 滑块向右拖动增加对抗噪声。注意：<strong>人眼看不出变化，但AI的预测完全变了</strong>。
          这揭示了深度学习模型的局限性 —— 它们对微小扰动非常敏感。
        </div>
      </div>

      <div class="adv__actions fade-in">
        <button class="ink-btn ink-btn--gold" @click="$emit('complete', 85)">完成实验，通关 →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['complete'])
const noiseCanvas = ref(null)
let animId = null

const experiments = [
  { name: '熊猫→长臂猿', original: '🐼', originalLabel: '熊猫', attackEmoji: '🦍', attackLabel: '长臂猿', noiseColor: '#1A1A1A' },
  { name: '猫→狗', original: '🐱', originalLabel: '猫', attackEmoji: '🐕', attackLabel: '狗', noiseColor: '#3A3A3A' },
  { name: '山峰→人脸', original: '⛰️', originalLabel: '山峰', attackEmoji: '👤', attackLabel: '人脸', noiseColor: '#6A6A6A' }
]

const activeExp = ref(0)
const noiseLevel = ref(0)

const noiseMultiplier = computed(() => noiseLevel.value / 20)

const currentPrediction = computed(() => {
  const exp = experiments[activeExp.value]
  if (noiseLevel.value < 25) {
    return { emoji: exp.original, label: exp.originalLabel, prob: (95 - noiseLevel.value * 0.5).toFixed(0) }
  } else if (noiseLevel.value < 60) {
    return { emoji: '❓', label: '不确定', prob: (50 + (noiseLevel.value - 25) * 0.5).toFixed(0) }
  } else {
    const prob = Math.min(95, (noiseLevel.value - 55) * 2).toFixed(0)
    return { emoji: exp.attackEmoji, label: exp.attackLabel, prob }
  }
})

function drawNoise() {
  const canvas = noiseCanvas.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height

  ctx.clearRect(0, 0, w, h)
  const intensity = noiseLevel.value / 100

  for (let i = 0; i < 200 * intensity; i++) {
    const x = Math.random() * w, y = Math.random() * h
    const size = 1 + Math.random() * 3 * intensity
    ctx.fillStyle = `rgba(26, 26, 26, ${Math.random() * intensity * 0.6})`
    ctx.fillRect(x, y, size, size)
  }
}

watch(noiseLevel, () => drawNoise())
watch(activeExp, () => drawNoise())

onMounted(() => {
  if (noiseCanvas.value) {
    noiseCanvas.value.width = 80
    noiseCanvas.value.height = 80
    drawNoise()
  }
})
</script>

<style scoped>
.adversarial { min-height: 80vh; padding: 40px 24px; }
.adv__container { max-width: 700px; margin: 0 auto; text-align: center; }
.adv__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.adv__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }
.adv__experiments { display: flex; gap: 8px; justify-content: center; margin-bottom: 24px; }
.adv__exp-tab { padding: 8px 16px; border: 1px solid var(--ink-pale); cursor: pointer; font-family: var(--font-body); font-size: 0.8rem; transition: all 0.3s ease; }
.adv__exp-tab:hover { border-color: var(--ink-medium); }
.adv__exp-tab--active { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.04); }
.adv__visual { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; padding: 24px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); }
.adv__original, .adv__result { text-align: center; }
.adv__noise { text-align: center; }
.adv__label { font-family: var(--font-body); font-size: 0.75rem; color: var(--ink-light); margin-bottom: 8px; }
.adv__emoji { font-size: 3rem; display: block; margin-bottom: 8px; }
.adv__pred { font-size: 0.78rem; color: var(--ink-medium); }
.adv__noise-canvas { width: 80px; height: 80px; border: 1px solid var(--ink-pale); background: var(--paper); }
.adv__plus, .adv__equals { font-family: var(--font-display); font-size: 1.5rem; color: var(--ink-light); }
.adv__slider-group { margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto; }
.adv__slider-label { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; display: block; margin-bottom: 8px; }
.adv__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.adv__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.adv__slider-marks { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--ink-light); margin-top: 4px; }
.adv__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; margin-bottom: 20px; }
.adv__insight strong { color: var(--cinnabar); }
</style>
