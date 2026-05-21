<template>
  <div class="timeline">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="AI千年史 · 水墨卷轴"
      subtitle="从图灵到GPT——人工智能的进化之路"
      :principle="'人工智能的发展经历了三次浪潮：第一次（1950s-1970s）以符号主义和逻辑推理为主，诞生了专家系统；第二次（1980s-1990s）连接主义兴起，神经网络开始崭露头角；第三次（2010s至今）深度学习爆发——大数据+GPU算力+更好的算法让AI在图像识别、自然语言处理等领域超越人类。每一次浪潮都伴随着技术突破和期望泡沫，但AI始终在曲折中前进。'"
      :gameMapping="'卷轴上的每个墨点代表AI史上的里程碑事件。从1950年图灵提出「机器能思考吗「，到2023年大语言模型改变世界——这70多年的历史，Python和机器学习框架让每个人都能参与AI开发。拖动卷轴，穿越时空，触摸每一个改变历史的瞬间。'"
      :tips="['AI并非一夜之间诞生——它经历了70多年的积累和三次浪潮的洗礼', '数据、算法、算力是AI发展的三大驱动力——三者缺一不可', '每个里程碑都建立在无数前人工作的基础之上——科学是累积的', '点击卡片中的「📖 了解更多「可以查看Wikipedia原文']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <canvas ref="canvasRef" class="timeline__canvas"></canvas>
    <div class="timeline__container">
      <!-- 卷轴标题 -->
      <div class="timeline__header fade-in">
        <h2 class="timeline__title">AI 千年 · 水墨卷轴</h2>
        <p class="timeline__hint body-text">拖动卷轴浏览 AI 发展历程 · 点击墨点展开详情</p>
      </div>

      <!-- 卷轴区域 -->
      <div class="timeline__scroll scroll-container" ref="scrollRef">
        <div
          class="timeline__track"
          :style="{ transform: `translateX(${scrollOffset}px)` }"
        >
          <div
            v-for="(event, i) in events"
            :key="i"
            class="timeline__event"
            :class="{ 'timeline__event--active': activeEvent === i }"
            :style="{ left: event.x + 'px' }"
          >
            <!-- 墨点节点 -->
            <div
              class="timeline__dot"
              @click="selectEvent(i)"
            >
              <div class="timeline__dot-inner"></div>
            </div>

            <!-- 年份标签 -->
            <div class="timeline__year mono-text">{{ event.year }}</div>

            <!-- 详情卡 -->
            <transition name="ink-rise">
              <div v-if="activeEvent === i" class="timeline__card">
                <div class="timeline__card-icon">{{ event.icon }}</div>
                <h3 class="timeline__card-title">{{ event.title }}</h3>
                <p class="timeline__card-desc body-text">{{ event.description }}</p>
                <a v-if="event.wiki" :href="event.wiki" target="_blank" class="timeline__card-wiki">📖 了解更多 →</a>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 连线的墨迹 -->
      <canvas ref="lineCanvas" class="timeline__lines"></canvas>

      <!-- 完成按钮 -->
      <transition name="ink-fade">
        <div v-if="activeEvent !== null" class="timeline__actions fade-in">
          <button class="ink-btn" @click="$emit('complete')">
            完成探索，进入下一关
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const canvasRef = ref(null)
const lineCanvas = ref(null)
const scrollRef = ref(null)
const scrollOffset = ref(0)
const activeEvent = ref(null)
let isDragging = false
let startX = 0
let lastScrollX = 0
let animId = null

const events = [
  { year: '1950', icon: '🧠', title: '图灵测试', x: 80,
    description: '艾伦·图灵提出"机器能思考吗？"，开创人工智能先河。图灵测试至今仍是衡量AI的重要标准。',
    wiki: 'https://en.wikipedia.org/wiki/Turing_test' },
  { year: '1956', icon: '🏛️', title: '达特茅斯会议', x: 260,
    description: '麦卡锡、明斯基等科学家首次提出"人工智能"术语，AI作为独立学科正式诞生。',
    wiki: 'https://en.wikipedia.org/wiki/Dartmouth_workshop' },
  { year: '1997', icon: '♟️', title: '深蓝击败卡斯帕罗夫', x: 440,
    description: 'IBM的深蓝计算机击败国际象棋世界冠军，AI在特定领域首次超越人类顶级水平。',
    wiki: 'https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer)' },
  { year: '2012', icon: '🧠', title: 'AlexNet深度学习革命', x: 620,
    description: 'AlexNet在ImageNet竞赛中大幅领先，深度学习时代到来，计算机视觉取得突破性进展。',
    wiki: 'https://en.wikipedia.org/wiki/AlexNet' },
  { year: '2023', icon: '🤖', title: '大语言模型时代', x: 800,
    description: 'GPT-4、Claude等大语言模型展现出惊人的对话、推理和创作能力，生成式AI引爆全球。',
    wiki: 'https://en.wikipedia.org/wiki/Large_language_model' },
  { year: 'NOW', icon: '🎮', title: '你的闯关开始', x: 980,
    description: '站在AI浪潮之巅，从今天开始，掌握这门改变世界的力量。点击下方按钮，继续你的闯关之旅！',
    wiki: null }
]

function selectEvent(i) {
  activeEvent.value = activeEvent.value === i ? null : i
}

function initLines() {
  const canvas = lineCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    if (!scrollRef.value) return
    canvas.width = scrollRef.value.offsetWidth
    canvas.height = scrollRef.value.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制连接线（毛笔风格）
    ctx.beginPath()
    ctx.moveTo(40, canvas.height * 0.45)
    ctx.lineTo(canvas.width - 40, canvas.height * 0.45)
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)'
    ctx.lineWidth = 2
    ctx.stroke()

    animId = requestAnimationFrame(draw)
  }
  draw()
}

function initDrag() {
  const el = scrollRef.value
  if (!el) return

  el.addEventListener('mousedown', (e) => {
    isDragging = true
    startX = e.clientX
    lastScrollX = scrollOffset.value
    el.style.cursor = 'grabbing'
  })

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    const dx = e.clientX - startX
    scrollOffset.value = Math.min(0, Math.max(-(events.length * 200 - el.offsetWidth), lastScrollX + dx))
  })

  window.addEventListener('mouseup', () => {
    isDragging = false
    if (el) el.style.cursor = 'grab'
  })

  // 触摸支持
  el.addEventListener('touchstart', (e) => {
    isDragging = true
    startX = e.touches[0].clientX
    lastScrollX = scrollOffset.value
  })

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return
    const dx = e.touches[0].clientX - startX
    scrollOffset.value = Math.min(0, Math.max(-(events.length * 200 - el.offsetWidth), lastScrollX + dx))
  })

  window.addEventListener('touchend', () => {
    isDragging = false
  })
}

onMounted(() => {
  setTimeout(() => {
    initLines()
    initDrag()
  }, 100)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<style scoped>
.timeline {
  min-height: 80vh;
  position: relative;
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.timeline__canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.timeline__header {
  text-align: center;
  margin-bottom: 48px;
}

.timeline__title {
  font-size: 2rem;
  letter-spacing: 0.2em;
  margin-bottom: 8px;
}

.timeline__hint {
  font-size: 0.8rem;
  color: var(--ink-light);
}

/* 卷轴 */
.timeline__scroll {
  height: 420px;
  overflow: hidden;
  cursor: grab;
  position: relative;
  padding: 20px 0;
  margin: 0 auto;
  max-width: 900px;
}

.timeline__track {
  position: relative;
  height: 100%;
  transition: transform 0.1s ease-out;
  padding: 0 20px;
  min-width: 1200px;
}

.timeline__event {
  position: absolute;
  top: 40px;
  width: 160px;
  text-align: center;
}

.timeline__dot {
  width: 32px;
  height: 32px;
  margin: 0 auto 8px;
  border-radius: 50%;
  border: 2px solid var(--ink-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  background: var(--paper);
}

.timeline__dot::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--ink-medium);
  opacity: 0.3;
  transition: all 0.4s ease;
}

.timeline__dot:hover {
  transform: scale(1.2);
  border-color: var(--ink-black);
}

.timeline__event--active .timeline__dot {
  border-color: var(--cinnabar);
  transform: scale(1.3);
  box-shadow: 0 0 20px rgba(194, 58, 43, 0.3);
}

.timeline__event--active .timeline__dot::before {
  background: var(--cinnabar);
  opacity: 0.6;
  transform: scale(1.2);
}

.timeline__year {
  font-size: 0.75rem;
  color: var(--ink-light);
  margin-bottom: 8px;
}

.timeline__card {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  padding: 16px;
  background: var(--paper);
  border: 1px solid var(--ink-pale);
  text-align: left;
  z-index: 10;
}

.timeline__card-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.timeline__card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.timeline__card-desc {
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--ink-medium);
}

.timeline__card-wiki {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.72rem;
  color: var(--cinnabar);
  text-decoration: none;
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border: 1px solid var(--ink-pale);
  transition: all 0.3s ease;
}

.timeline__card-wiki:hover {
  border-color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.04);
  color: var(--ink-black);
}

/* 连接线 */
.timeline__lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 动作按钮 */
.timeline__actions {
  text-align: center;
  margin-top: 40px;
}

/* 过渡 */
.ink-rise-enter-active {
  animation: ink-converge 0.5s ease forwards;
}
.ink-rise-leave-active {
  animation: ink-converge 0.3s ease reverse forwards;
}

.ink-fade-enter-active,
.ink-fade-leave-active {
  transition: opacity 0.4s ease;
}
.ink-fade-enter-from,
.ink-fade-leave-to {
  opacity: 0;
}
</style>
