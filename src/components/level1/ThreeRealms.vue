<template>
  <div class="realms">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="AI 三界 · 三种智能范式"
      subtitle="符号主义、连接主义、行为主义——AI的三条修行之路"
      :principle="'人工智能的发展史上有三种主导范式。符号主义（Symbolicism）认为智能来源于符号操作和逻辑推理——知识用规则和符号表示，推理就是搜索。连接主义（Connectionism）认为智能来源于大量简单单元（神经元）的并行连接——知识分布存储在连接权重中，学习就是调整这些权重。行为主义（Behaviorism/强化学习）认为智能来源于与环境的交互——通过试错和奖励信号学习最优行为策略，不关心内部表示。现代AI（如大语言模型）实际上融合了这三种范式：连接主义的神经网络架构、符号主义的语言符号处理、以及行为主义的RLHF（人类反馈强化学习）对齐训练。'"
      :gameMapping="'在「AI三界「游戏中，你需要将8个AI概念卡片拖入正确的山峰。符号之山（锐利棱角，代表逻辑的精确）收纳专家系统、知识图谱、决策树——这些依赖显式规则和符号推理的技术。连接之山（圆润弧线，代表神经的柔韧）收纳深度学习、CNN、GPT——这些基于神经网络的连接主义技术。行为之山（层叠阶梯，代表试错的阶梯）收纳AlphaGo、自动驾驶——这些依赖强化学习和环境交互的技术。只有理解了三种范式的核心区别，才能正确归类。'"
      :tips="['符号主义 = 逻辑 + 规则 + 搜索（如专家系统）—— 像数学证明一样精确', '连接主义 = 神经元 + 权重 + 反向传播（如CNN/GPT）—— 像大脑一样学习', '行为主义 = 动作 + 奖励 + 试错（如AlphaGo）—— 像婴儿学走路一样探索', '现代AI系统往往是三种范式的混合体——GPT既用神经网络也处理符号也做RLHF']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <canvas ref="bgCanvas" class="realms__bg"></canvas>
    <div class="realms__container">
      <h2 class="realms__title fade-in">AI 三界</h2>
      <p class="realms__subtitle body-text fade-in delay-1">
        将概念拖入正确的"三界"之中
      </p>

      <!-- 三座山 -->
      <div class="realms__mountains">
        <div
          v-for="(mountain, i) in mountains"
          :key="i"
          class="realms__mountain"
          :class="{
            'realms__mountain--hover': dragOverMountain === i,
            'realms__mountain--full': mountain.items.length > 0
          }"
          @dragover.prevent="dragOverMountain = i"
          @dragleave="dragOverMountain = null"
          @drop="onDrop(i)"
        >
          <div class="realms__mountain-shape">
            <svg viewBox="0 0 200 160" class="realms__mountain-svg" :style="{ color: mountain.svgColor }">
              <path :d="mountainPaths[i]" fill="currentColor" />
            </svg>
          </div>
          <div class="realms__mountain-name">{{ mountain.name }}</div>
          <div class="realms__mountain-desc body-text">{{ mountain.desc }}</div>
          <div class="realms__mountain-items">
            <span
              v-for="item in mountain.items"
              :key="item"
              class="realms__mountain-tag"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <!-- 待分类卡片 -->
      <div class="realms__cards-section fade-in delay-2">
        <p class="realms__cards-hint body-text">👇 拖动卡片到对应的山峰</p>
        <div class="realms__cards">
          <div
            v-for="(card, i) in unplacedCards"
            :key="card.name"
            class="realms__card"
            :class="{ 'realms__card--dragging': draggingCard === i }"
            draggable="true"
            @dragstart="startDrag(i, $event)"
            @dragend="endDrag"
          >
            <span class="realms__card-name">{{ card.name }}</span>
          </div>
        </div>
        <p v-if="unplacedCards.length === 0" class="realms__done-hint">
          ✅ 全部归类完毕
        </p>
      </div>

      <!-- 结果 -->
      <div v-if="unplacedCards.length === 0" class="realms__result fade-in">
        <div v-if="correctCount === totalCards" class="realms__pass">
          <div class="realms__pass-icon ink-animate-splash">🌄</div>
          <h3 class="realms__pass-title">三界归一 · 全部正确！</h3>
          <p class="realms__pass-desc body-text">
            你已掌握 AI 三大流派的核心区别
          </p>
          <button class="ink-btn ink-btn--gold" @click="$emit('complete', score)">
            完成闯关 →
          </button>
        </div>
        <div v-else class="realms__retry">
          <p class="realms__retry-text">
            正确 {{ correctCount }}/{{ totalCards }}，还需继续修炼
          </p>
          <button class="ink-btn" @click="resetCards">重新来过</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const bgCanvas = ref(null)
let animId = null

const mountainPaths = [
  // 符号之山 — 锐利棱角，代表逻辑的精确与刚硬
  'M100,5 L152,38 L170,85 L200,160 L0,160 L30,85 L48,38 Z',
  // 连接之山 — 圆润弧线，代表神经网络的柔韧与平滑
  'M100,5 C152,5 182,42 196,105 L200,160 L0,160 L4,105 C18,42 48,5 100,5 Z',
  // 行为之山 — 层叠阶梯，代表试错学习的逐步攀登
  'M100,0 L120,26 L115,46 L148,56 L142,82 L178,96 L168,128 L200,142 L200,160 L0,160 L0,142 L32,128 L22,96 L58,82 L52,56 L85,46 L80,26 Z'
]

const mountains = ref([
  { name: '符号之山', desc: '符号主义 · 逻辑推理', items: [], target: ['专家系统', '知识图谱', '决策树'], svgColor: '#3a5a5a' },
  { name: '连接之山', desc: '连接主义 · 神经网络', items: [], target: ['深度学习', 'CNN', 'GPT'], svgColor: '#6a4a7c' },
  { name: '行为之山', desc: '行为主义 · 强化学习', items: [], target: ['AlphaGo', '自动驾驶'], svgColor: '#8b4a3a' }
])

const allCards = ref([
  { name: '专家系统', realm: 0 },
  { name: '知识图谱', realm: 0 },
  { name: '深度学习', realm: 1 },
  { name: 'CNN', realm: 1 },
  { name: 'GPT', realm: 1 },
  { name: 'AlphaGo', realm: 2 },
  { name: '自动驾驶', realm: 2 },
  { name: '决策树', realm: 0 }
])

const placedCards = ref([])
const draggingCard = ref(null)
const dragOverMountain = ref(null)

const totalCards = computed(() => allCards.value.length)
const correctCount = computed(() => {
  let correct = 0
  for (const m of mountains.value) {
    for (const item of m.items) {
      const card = allCards.value.find(c => c.name === item)
      if (card) {
        const mountainIdx = mountains.value.indexOf(m)
        if (card.realm === mountainIdx) correct++
      }
    }
  }
  return correct
})

const score = computed(() => Math.round((correctCount.value / totalCards.value) * 100))

const unplacedCards = computed(() => {
  const placed = new Set()
  for (const m of mountains.value) {
    for (const item of m.items) placed.add(item)
  }
  return allCards.value.filter(c => !placed.has(c.name))
})

function startDrag(index, event) {
  draggingCard.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function endDrag() {
  draggingCard.value = null
  dragOverMountain.value = null
}

function onDrop(mountainIdx) {
  if (draggingCard.value === null) return
  const cards = unplacedCards.value
  if (draggingCard.value >= cards.length) return
  const cardName = cards[draggingCard.value].name
  mountains.value[mountainIdx].items.push(cardName)
  draggingCard.value = null
  dragOverMountain.value = null
}

function resetCards() {
  mountains.value.forEach(m => m.items = [])
}

function initBg() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  const clouds = []
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      size: 30 + Math.random() * 60,
      speed: 0.1 + Math.random() * 0.2
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const cloud of clouds) {
      cloud.x += cloud.speed
      if (cloud.x > canvas.width + 100) cloud.x = -100

      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(26, 26, 26, 0.03)'
      ctx.fill()
    }

    animId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  initBg()
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.realms {
  min-height: 80vh;
  position: relative;
  padding: 40px 24px;
}

.realms__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.realms__container {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.realms__title {
  font-size: 2rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.realms__subtitle {
  font-size: 0.9rem;
  color: var(--ink-medium);
  margin-bottom: 40px;
}

/* 三座山 */
.realms__mountains {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 48px;
}

.realms__mountain {
  flex: 1;
  max-width: 280px;
  padding: 24px 16px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.5);
  transition: all 0.3s ease;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.realms__mountain--hover {
  border-color: var(--ink-black);
  background: rgba(245, 240, 232, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.realms__mountain--full {
  border-color: var(--verdant);
}

.realms__mountain-svg {
  width: 80px;
  height: 64px;
  color: var(--ink-light);
  transition: color 0.3s ease;
}

.realms__mountain--full .realms__mountain-svg {
  color: var(--verdant);
}

.realms__mountain-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 0.15em;
  margin: 8px 0 4px;
}

.realms__mountain-desc {
  font-size: 0.75rem;
  color: var(--ink-light);
  margin-bottom: 12px;
}

.realms__mountain-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.realms__mountain-tag {
  padding: 4px 10px;
  border: 1px solid var(--verdant);
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--verdant);
  background: rgba(74, 124, 111, 0.06);
}

/* 卡片 */
.realms__cards-section {
  margin-bottom: 32px;
}

.realms__cards-hint {
  font-size: 0.8rem;
  color: var(--ink-light);
  margin-bottom: 16px;
}

.realms__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.realms__card {
  padding: 10px 20px;
  border: 1px solid var(--ink-medium);
  cursor: grab;
  transition: all 0.3s ease;
  font-family: var(--font-body);
  font-size: 0.85rem;
  background: var(--paper);
  user-select: none;
}

.realms__card:hover {
  border-color: var(--ink-black);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.realms__card--dragging {
  opacity: 0.4;
}

.realms__done-hint {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--verdant);
  letter-spacing: 0.1em;
}

/* 结果 */
.realms__result {
  margin-top: 32px;
  padding: 32px;
  border: 1px solid var(--ink-pale);
}

.realms__pass-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.realms__pass-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.15em;
  margin-bottom: 12px;
  color: var(--verdant);
}

.realms__pass-desc {
  color: var(--ink-medium);
  margin-bottom: 20px;
}

.realms__retry-text {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink-medium);
  margin-bottom: 16px;
}
</style>
