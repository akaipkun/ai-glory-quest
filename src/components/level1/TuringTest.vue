<template>
  <div class="turing">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="图灵测试 · 辨妖辨AI"
      subtitle="机器能思考吗？—— 图灵测试的前世今生"
      :principle="'艾伦·图灵在1950年发表了划时代论文《计算机器与智能》，提出了一个大胆的问题：机器能思考吗？为了避免哲学上对「思考「定义的争论，图灵设计了一个可操作的测试——让人类评判者通过文字对话与一个人类和一个机器交流，如果评判者无法可靠地区分哪个是机器，那么这台机器就通过了测试，可以被认为具有「智能「。图灵测试不关心机器是否真的「理解「——它只关心表现。这种行为主义视角至今仍是评估AI系统的重要范式。现代AI（如ChatGPT）在短对话中已能通过简化版图灵测试，但真正意义上的图灵测试——长时间、多领域、无限制对话——仍是巨大挑战。'"
      :gameMapping="'在「辨妖辨AI「游戏中，三位「仙人「各说一句话——你的任务是判断谁说的话语出自AI、谁出自真人。AI的话语通常表现出：过度结构化、缺乏真实生活细节、概率性措辞（「置信度99.97%「）、回避主观感受。而真人的话语则包含：具体的生活经验、情感波动、不完美的表达。这正是图灵测试的核心——通过语言模式洞察智能的本质。判断正确2/3即可通关。'"
      :tips="['AI语言特征：过度使用数据/概率术语，回避「我不知道「，缺乏具体时空锚点', '真人语言特征：包含具体时间地点（「昨天「、「那家店「），情感词汇丰富，有不完美语法', '现代大语言模型在短文本上已很难区分——真正的图灵测试需要多轮深度对话', '图灵测试不是智能的充分条件——它只测「看起来像人「，不测「真正理解「']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <canvas ref="bgCanvas" class="turing__bg"></canvas>
    <div class="turing__container">
      <h2 class="turing__title fade-in">辨妖辨AI</h2>
      <p class="turing__subtitle body-text fade-in delay-1">
        是人是妖，且让火眼金睛辨分明
      </p>
      <p class="turing__hint body-text fade-in delay-2">
        三位"仙人"各说了一句话——判断谁是人，谁是AI
      </p>

      <div class="turing__figures">
        <div
          v-for="(figure, i) in figures"
          :key="i"
          class="turing__figure"
          :class="{
            'turing__figure--judged': figure.judged,
            'turing__figure--correct': figure.correct === true,
            'turing__figure--wrong': figure.correct === false
          }"
        >
          <!-- 剪影 -->
          <svg class="turing__silhouette" viewBox="0 0 120 160">
            <path
              :d="silhouettePaths[i]"
              fill="currentColor"
              :opacity="figure.judged ? 0.4 : 0.8"
            />
          </svg>

          <!-- 对话气泡 -->
          <div class="turing__bubble">
            <p>{{ figure.dialogue }}</p>
          </div>

          <!-- 判断按钮 -->
          <div v-if="!figure.judged" class="turing__choices">
            <button class="ink-btn ink-btn--cinnabar" @click="judge(i, 'ai')">
              🤖 AI
            </button>
            <button class="ink-btn" @click="judge(i, 'human')">
              🧑 真人
            </button>
          </div>

          <!-- 判断结果 -->
          <div v-else class="turing__result">
            <span v-if="figure.correct" class="turing__result-correct">✅ 正确！</span>
            <span v-else class="turing__result-wrong">❌ 判断失误</span>
          </div>
        </div>
      </div>

      <!-- 结果 -->
      <div v-if="allJudged" class="turing__result-screen fade-in">
        <div v-if="score >= 2" class="turing__pass">
          <div class="turing__pass-icon ink-animate-splash">🧠</div>
          <h3 class="turing__pass-title">图灵测试 · 你已通过</h3>
          <p class="turing__pass-desc body-text">
            图灵测试由艾伦·图灵于1950年提出：<br/>
            如果一台机器能在对话中让人类无法分辨其身份，<br/>
            就可以认为这台机器具有"智能"。
          </p>
          <p class="turing__pass-score">正确 {{ score }}/3</p>
          <button class="ink-btn ink-btn--gold" @click="$emit('complete')">
            进入下一关 →
          </button>
        </div>
        <div v-else class="turing__fail">
          <p class="turing__fail-text">还需再修炼，正确 {{ score }}/3</p>
          <button class="ink-btn" @click="resetFigures">再来一次</button>
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

const silhouettePaths = [
  // 仙人甲 - 长袍文人
  'M60,10 C65,10 70,15 70,25 L70,45 C75,50 78,55 78,60 L80,65 L80,70 L75,72 L70,70 L65,80 L60,85 L55,80 L50,70 L45,72 L40,70 L40,65 L42,60 C42,55 45,50 50,45 L50,25 C50,15 55,10 60,10 Z',
  // 仙人乙 - 武士
  'M60,10 C68,10 72,18 72,28 L72,45 C78,50 82,56 82,62 L80,68 L70,68 L65,78 L60,85 L55,78 L50,68 L40,68 L38,62 C38,56 42,50 48,45 L48,28 C48,18 52,10 60,10 Z',
  // 仙人丙 - 僧人
  'M60,5 C68,5 74,12 74,22 L74,42 C80,48 84,55 84,62 L80,68 L72,66 L66,76 L60,82 L54,76 L48,66 L40,68 L36,62 C36,55 40,48 46,42 L46,22 C46,12 52,5 60,5 Z'
]

const figures = ref([
  {
    dialogue: '"混沌未开，万物浑沦。道生一，一生二，二生三，三生万物。"',
    isAI: false,
    judged: false,
    correct: null
  },
  {
    dialogue: '"昨天晚上我去吃了火锅，那家的毛肚特别新鲜，辣得我满头大汗。"',
    isAI: false,
    judged: false,
    correct: null
  },
  {
    dialogue: '"根据概率分布，我认为最优解是选择第37个选项，置信度99.97%。"',
    isAI: true,
    judged: false,
    correct: null
  }
])

const allJudged = computed(() => figures.value.every(f => f.judged))

const score = computed(() => figures.value.filter(f => f.correct).length)

function judge(index, guess) {
  const figure = figures.value[index]
  figure.judged = true
  figure.correct = (guess === 'ai') === figure.isAI
}

function resetFigures() {
  figures.value.forEach(f => {
    f.judged = false
    f.correct = null
  })
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

  // 竹林粒子
  const bamboo = []
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * canvas.width
    bamboo.push({
      x, y: canvas.height,
      height: 200 + Math.random() * 300,
      width: 3 + Math.random() * 4,
      sway: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.3
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const time = Date.now() * 0.001

    // 画竹
    for (const b of bamboo) {
      const sway = Math.sin(time * b.speed + b.sway) * 3
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.quadraticCurveTo(
        b.x + sway, b.y - b.height * 0.5,
        b.x + sway * 0.5, b.y - b.height
      )
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.06)'
      ctx.lineWidth = b.width
      ctx.lineCap = 'round'
      ctx.stroke()
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
.turing {
  min-height: 80vh;
  position: relative;
  padding: 40px 24px;
}

.turing__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.turing__container {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.turing__title {
  font-size: 2rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.turing__subtitle {
  font-size: 0.9rem;
  color: var(--ink-medium);
  letter-spacing: 0.2em;
  margin-bottom: 4px;
}

.turing__hint {
  font-size: 0.8rem;
  color: var(--ink-light);
  margin-bottom: 40px;
}

/* 人物 */
.turing__figures {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.turing__figure {
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
  border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.6);
  transition: all 0.4s ease;
  position: relative;
}

.turing__figure--correct {
  border-color: var(--verdant);
  background: rgba(74, 124, 111, 0.05);
}

.turing__figure--wrong {
  border-color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.05);
}

.turing__silhouette {
  width: 80px;
  height: 110px;
  color: var(--ink-medium);
  transition: color 0.4s ease;
}

.turing__figure--correct .turing__silhouette {
  color: var(--verdant);
}

.turing__figure--wrong .turing__silhouette {
  color: var(--cinnabar);
}

.turing__bubble {
  padding: 12px;
  border: 1px solid var(--ink-pale);
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--ink-medium);
  text-align: left;
  min-height: 80px;
  position: relative;
  background: rgba(245, 240, 232, 0.8);
}

.turing__bubble::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--ink-pale);
}

.turing__choices {
  display: flex;
  gap: 8px;
}

.turing__choices .ink-btn {
  font-size: 0.8rem;
  padding: 8px 16px;
}

.turing__result {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.turing__result-correct {
  color: var(--verdant);
}

.turing__result-wrong {
  color: var(--cinnabar);
}

/* 结果屏 */
.turing__result-screen {
  margin-top: 48px;
  padding: 32px;
  border: 1px solid var(--ink-pale);
}

.turing__pass-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.turing__pass-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.15em;
  margin-bottom: 12px;
  color: var(--verdant);
}

.turing__pass-desc {
  font-size: 0.85rem;
  color: var(--ink-medium);
  line-height: 1.8;
  margin-bottom: 16px;
}

.turing__pass-score {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--gold);
  margin-bottom: 20px;
}

.turing__fail-text {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink-medium);
  margin-bottom: 16px;
}

.turing__fail .ink-btn {
  font-size: 0.85rem;
}
</style>
