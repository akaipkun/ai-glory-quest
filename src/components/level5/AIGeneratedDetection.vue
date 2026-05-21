<template>
  <div class="detection">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="AI生成鉴别 · 火眼金睛"
      subtitle="Deepfake与生成检测——真假世界的边界在哪里"
      :principle="'AI生成内容检测是生成式AI时代的重要课题。检测方法包括：像素级异常（GAN生成的图像在高频细节、皮肤纹理、毛发边缘有不自然的规律性）、元数据分析（JPEG压缩痕迹、EXIF信息缺失）、生理不协调（不对称的耳饰、不自然的眼神、多余的手指）、语义矛盾（文字拼写错误、背景逻辑不合理）。更深层的检测依赖「AI检测AI「——训练专门的分类器学习真实图像和生成图像的统计分布差异，如频率域中的伪影模式。扩散模型生成的图像在某些频段遗留独特的「指纹「。但这是一场军备竞赛——生成越逼真，检测越困难，两者在对抗中共同进化。'"
      :gameMapping="'在「AI生成鉴别「中，你需要判断8对图片中哪张是AI生成的。难度从「小白「到「火眼金睛「递增：简单题有明显缺陷（多余手指、文字乱码），困难题几乎无懈可击。每答对一题积累经验值，答错学习错误特征。这个游戏训练你在现实中识别AI生成内容的能力——越来越重要的数字素养技能。判定后系统会解释判断依据：纹理异常、结构不协调、光影逻辑等，帮助你理解AI生成图像的「破绽「。8题全对即可通关！'"
      :tips="['看手指和牙齿——这是AI生成图像最常见的破绽区域（数量不对、形状诡异）', '看文字——AI生成的图像中文字通常是乱码或模糊笔画', '看光影——AI生成的光影方向可能不一致，阴影落在不该落的地方', '用AI检测AI：训练检测模型学习真实/生成的频域差异，是一场无止境的博弈']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <div class="detection__container">
      <h2 class="detection__title fade-in">🎭 真假难辨 · AI生成鉴别</h2>
      <p class="detection__subtitle body-text fade-in delay-1">悟空变的树和真树——你能分辨吗？</p>

      <div class="detection__round fade-in delay-2">
        <span class="detection__round-label mono-text">第 {{ round }} / {{ totalRounds }} 题</span>
        <div class="detection__difficulty-bar">
          <span
            v-for="(level, i) in difficultyLevels"
            :key="i"
            class="detection__difficulty-dot"
            :class="{ 'detection__difficulty-dot--active': i === Math.min(Math.floor((round - 1) / 2), 3) }"
          ></span>
          <span class="detection__difficulty-label">{{ difficulties[Math.min(Math.floor((round - 1) / 2), 3)] }}</span>
        </div>
      </div>

      <!-- 图片对比 -->
      <div class="detection__images fade-in delay-2">
        <div
          v-for="(img, i) in currentPair"
          :key="i"
          class="detection__image-card"
          :class="{
            'detection__image-card--selected': selected === i,
            'detection__image-card--correct': feedback && img.isAi === aiSelected,
            'detection__image-card--wrong': feedback && img.isAi !== aiSelected
          }"
          @click="pickImage(i)"
        >
          <canvas :ref="el => setPairCanvas(i, el)" class="detection__canvas"></canvas>
          <div class="detection__image-label">
            {{ feedback && img.isAi ? '🤖 AI生成' : feedback && !img.isAi ? '📷 真实' : i === 0 ? '图 A' : '图 B' }}
          </div>
          <div v-if="feedback" class="detection__image-confidence">
            <span class="detection__conf-label">AI置信度</span>
            <div class="detection__conf-bar">
              <div class="detection__conf-fill" :style="{ width: img.confidence + '%' }"
                :class="{ 'detection__conf-fill--high': img.confidence > 70 }"></div>
            </div>
            <span class="mono-text">{{ img.confidence }}%</span>
          </div>
        </div>
      </div>

      <div v-if="!feedback" class="detection__actions fade-in delay-3">
        <p class="detection__hint body-text">哪张图是AI生成的？</p>
        <div class="detection__choice-btns">
          <button class="ink-btn" :class="{ 'ink-btn--cinnabar': selected === 0 }" @click="pickImage(0)">图 A 是AI</button>
          <button class="ink-btn" :class="{ 'ink-btn--cinnabar': selected === 1 }" @click="pickImage(1)">图 B 是AI</button>
        </div>
      </div>

      <transition name="ink-fade">
        <div v-if="feedback" class="detection__feedback fade-in">
          <div v-if="correct" class="detection__correct">✅ 正确！你的"火眼金睛"识破了AI</div>
          <div v-else class="detection__wrong">❌ 这次AI骗过了你</div>
          <p class="detection__explanation body-text">{{ currentExplanation }}</p>
          <button v-if="round < totalRounds" class="ink-btn" @click="nextRound">下一题</button>
          <button v-else class="ink-btn ink-btn--gold" @click="finish">完成挑战 →</button>
        </div>
      </transition>

      <div class="detection__score fade-in">
        <span class="mono-text">正确: {{ correctCount }}/{{ totalRounds }} ({{ accuracy }}%)</span>
      </div>

      <div class="detection__insight body-text fade-in">
        💡 随着生成式AI的发展，AI生成内容已达到以假乱真的水平。<strong>检测AI生成内容</strong>是AI安全领域的重要课题，
        也是数字媒体专业需要掌握的技能。注意细节：光影一致性、纹理重复模式、不自然的边缘。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)

const round = ref(1)
const selected = ref(null)
const feedback = ref(false)
const correct = ref(false)
const correctCount = ref(0)
const totalRounds = 8
const pairCanvases = ref([])

const difficulties = ['简单', '中等', '较难', '挑战']

const allPairs = [
  [
    { isAi: true, confidence: 85, seed: 0.1, subject: '竹林中一只熊猫' },
    { isAi: false, confidence: 12, seed: 0.2, subject: '竹林中一只熊猫' }
  ],
  [
    { isAi: false, confidence: 8, seed: 0.3, subject: '夕阳下的山峰' },
    { isAi: true, confidence: 78, seed: 0.4, subject: '夕阳下的山峰' }
  ],
  [
    { isAi: true, confidence: 82, seed: 0.5, subject: '一朵盛开的荷花' },
    { isAi: false, confidence: 15, seed: 0.6, subject: '一朵盛开的荷花' }
  ],
  [
    { isAi: false, confidence: 10, seed: 0.7, subject: '古老的石桥' },
    { isAi: true, confidence: 88, seed: 0.8, subject: '古老的石桥' }
  ],
  [
    { isAi: true, confidence: 90, seed: 0.9, subject: '水墨山水画' },
    { isAi: false, confidence: 20, seed: 1.0, subject: '水墨山水画' }
  ],
  [
    { isAi: false, confidence: 6, seed: 1.1, subject: '森林中的小鹿' },
    { isAi: true, confidence: 92, seed: 1.2, subject: '森林中的小鹿' }
  ],
  [
    { isAi: true, confidence: 95, seed: 1.3, subject: '古代美人的肖像' },
    { isAi: false, confidence: 18, seed: 1.4, subject: '古代美人的肖像' }
  ],
  [
    { isAi: false, confidence: 5, seed: 1.5, subject: '长城星空' },
    { isAi: true, confidence: 96, seed: 1.6, subject: '长城星空' }
  ]
]

const currentPair = computed(() => {
  const pair = allPairs[round.value - 1]
  // Randomly swap so AI isn't always first
  return Math.random() > 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]]
})

// Track which index has AI
const aiSelected = ref(0)

const explanations = [
  'AI生成的竹子纹理过于完美均匀，真实照片中竹节间距和粗细会有自然变化',
  '真实山峰的光影变化更复杂，AI的光影过渡过于平滑',
  'AI生成的荷花花瓣边缘过于规则，真实花朵有细微的不对称',
  '真实古桥的砖石纹理自然风化，AI生成的重复纹理过多',
  'AI水墨画的笔触缺少真实的墨色浓淡变化，显得"太完美"',
  '真实森林的光影更丰富，AI的细节处理在边缘处容易露馅',
  'AI人像的皮肤纹理过于均匀，缺少真实皮肤的微细毛孔和色差',
  '真实星空照片的噪点分布更随机，AI的星空排列略显规律'
]

const currentExplanation = computed(() => {
  const idx = round.value - 1
  return explanations[idx % explanations.length]
})

const accuracy = computed(() => {
  if (round.value === 1) return correctCount.value * 100
  return Math.round((correctCount.value / (feedback.value ? round.value : round.value - 1)) * 100)
})

function setPairCanvas(index, el) {
  if (el) pairCanvases.value[index] = el
}

function pickImage(index) {
  if (feedback.value) return
  selected.value = index
  feedback.value = true

  const pair = currentPair.value
  aiSelected.value = pair.findIndex(p => p.isAi)
  correct.value = index === aiSelected.value
  if (correct.value) correctCount.value++

  drawPair()
}

function nextRound() {
  round.value++
  selected.value = null
  feedback.value = false
}

function finish() {
  const finalAccuracy = Math.round((correctCount.value / totalRounds) * 100)
  emit('complete', finalAccuracy)
}

function drawPair() {
  currentPair.value.forEach((img, i) => {
    const canvas = pairCanvases.value[i]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 200
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    ctx.fillStyle = 'var(--paper)'
    ctx.fillRect(0, 0, size, size)

    // Draw simulated image based on whether AI or real
    const isAi = img.isAi
    const seed = img.seed

    if (isAi) {
      // AI: smoother, more perfect
      drawAiImage(ctx, size, seed)
    } else {
      // Real: more organic, irregular
      drawRealImage(ctx, size, seed)
    }

    // Border
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, size, size)
  })
}

function drawAiImage(ctx, size, seed) {
  // Smoother, more perfect shapes
  for (let i = 0; i < 15; i++) {
    const x = size * (0.1 + Math.sin(seed * 10 + i * 1.1) * 0.4)
    const y = size * (0.2 + Math.cos(seed * 8 + i * 0.9) * 0.35)
    const r = 10 + Math.sin(seed * 5 + i * 0.7) * 8

    ctx.beginPath()
    ctx.arc(x, y, Math.abs(r), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${0.03 + Math.sin(seed * 3 + i * 0.5) * 0.02})`
    ctx.fill()
  }

  // Perfect lines
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(size * 0.2, size * (0.3 + i * 0.1))
    ctx.lineTo(size * 0.8, size * (0.25 + i * 0.12))
    ctx.stroke()
  }
}

function drawRealImage(ctx, size, seed) {
  // More organic, irregular shapes
  for (let i = 0; i < 12; i++) {
    const x = size * (0.1 + Math.random() * 0.8)
    const y = size * (0.2 + Math.random() * 0.6)
    const r = 5 + Math.random() * 15

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${Math.random() * 0.05})`
    ctx.fill()
  }

  // Irregular texture
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.fillStyle = `rgba(26, 26, 26, ${Math.random() * 0.03})`
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }

  // Organic lines with jitter
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.06)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    for (let x = size * 0.2; x < size * 0.8; x += 5) {
      const y = size * 0.4 + Math.sin(x * 0.1 + seed) * 20 + Math.random() * 5
      x === size * 0.2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

onMounted(() => {
  setTimeout(drawPair, 200)
})

// Redraw when round changes
import { watch } from 'vue'
watch(round, () => {
  setTimeout(drawPair, 200)
})
</script>

<style scoped>
.detection { min-height: 80vh; padding: 40px 24px; }
.detection__container { max-width: 700px; margin: 0 auto; text-align: center; }
.detection__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.detection__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 24px; }

.detection__round { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.detection__round-label { font-size: 0.85rem; color: var(--ink-light); }
.detection__difficulty-bar { display: flex; align-items: center; gap: 6px; }
.detection__difficulty-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ink-pale); }
.detection__difficulty-dot--active { background: var(--cinnabar); }
.detection__difficulty-label { font-size: 0.75rem; color: var(--cinnabar); margin-left: 4px; }

.detection__images { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
.detection__image-card { text-align: center; cursor: pointer; padding: 12px; border: 2px solid var(--ink-pale); transition: all 0.3s ease; background: rgba(245,240,232,0.4); }
.detection__image-card:hover { border-color: var(--ink-medium); }
.detection__image-card--selected { border-color: var(--cinnabar); }
.detection__image-card--correct { border-color: var(--verdant); background: rgba(74,124,111,0.06); }
.detection__image-card--wrong { border-color: var(--cinnabar); background: rgba(194,58,43,0.06); }
.detection__canvas { display: block; margin-bottom: 6px; }
.detection__image-label { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; margin-bottom: 6px; }

.detection__image-confidence { padding: 8px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); }
.detection__conf-label { font-size: 0.6rem; color: var(--ink-light); display: block; margin-bottom: 2px; }
.detection__conf-bar { height: 4px; background: rgba(26,26,26,0.06); border-radius: 2px; overflow: hidden; margin-bottom: 2px; }
.detection__conf-fill { height: 100%; background: var(--ink-light); border-radius: 2px; }
.detection__conf-fill--high { background: var(--cinnabar); }
.detection__image-confidence .mono-text { font-size: 0.65rem; color: var(--ink-light); }

.detection__hint { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 12px; }
.detection__choice-btns { display: flex; gap: 12px; justify-content: center; }

.detection__feedback { margin-bottom: 20px; padding: 16px; border: 1px solid var(--ink-pale); }
.detection__correct { color: var(--verdant); font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 8px; }
.detection__wrong { color: var(--cinnabar); font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 8px; }
.detection__explanation { font-size: 0.8rem; color: var(--ink-medium); margin-bottom: 12px; }

.detection__score { margin-bottom: 16px; }
.detection__score .mono-text { font-size: 0.85rem; color: var(--ink-light); }

.detection__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.detection__insight strong { color: var(--cinnabar); }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.4s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
