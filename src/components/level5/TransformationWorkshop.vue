<template>
  <div class="workshop">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="提示词工程 · 七十二变的咒语"
      subtitle="Prompt Engineering——与生成式AI对话的艺术"
      :principle="'提示词工程（Prompt Engineering）是引导大语言模型和生成式AI产生期望输出的技术。核心原理：模型不是「理解「你的话，而是基于训练数据中的统计模式做条件生成——提示词定义了生成的条件分布。好的提示词就像一个精准的约束条件，把模型的输出分布压缩到你想要的区域。关键技巧包括：角色设定（「你是一位水墨画大师「）、风格约束（「写意山水风格，墨分五色「）、细节描述（具体颜色、构图、光影）、负面提示（排除不想要的元素）。在图像生成中，提示词被CLIP等文本编码器转化为特征向量，指导扩散模型或GAN的生成过程。提示词越精确，生成结果越接近预期。'"
      :gameMapping="'在「提示词工坊「中，你扮演悟空——说一句「变「的咒语（提示词），AI变出图像。你可以输入任何描述（如「水墨风格的老虎在竹林中漫步「），系统调用免费图像生成API尝试生成。预设的提示词示例展示了不同风格：水墨写意、赛博朋克、工笔花鸟等。提示词的质量直接影响生成结果——模糊的提示词得到模糊的结果，精确的提示词得到惊艳的作品。这就是提示词工程的本质：学会用AI的语言与AI对话！'"
      :tips="['好的提示词 = 主体 + 风格 + 细节 + 构图 + 排除项 —— 五个要素让生成结果精准', '角色设定prompt如「你是齐白石「能让模型模仿特定风格——这是few-shot prompting的变体', 'Chain-of-Thought prompting让模型展示推理过程，显著提高复杂任务的准确性', '图像生成的负面提示（negative prompt）排除模糊、变形、多余手指等常见问题']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <div class="workshop__container">
      <h2 class="workshop__title fade-in">🖌️ 变身术 · 提示词工坊</h2>
      <p class="workshop__subtitle body-text fade-in delay-1">悟空喊一声"变"——你说一句提示词，AI就能变出万物</p>

      <div class="workshop__demo fade-in delay-2">
        <!-- Prompt Input -->
        <div class="workshop__input-group">
          <label class="workshop__label">输入提示词</label>
          <div class="workshop__input-row">
            <input
              v-model="promptText"
              class="workshop__input"
              placeholder="例如：水墨风格的老虎，在竹林中漫步，写意山水..."
              @keyup.enter="generate"
            />
            <button class="ink-btn" @click="generate" :disabled="!promptText.trim() || generating">
              {{ generating ? '生成中...' : '变！' }}
            </button>
          </div>
          <div class="workshop__prompts">
            <span
              v-for="(example, i) in examples"
              :key="i"
              class="workshop__prompt-chip"
              @click="promptText = example"
            >
              {{ example.length > 12 ? example.slice(0, 12) + '...' : example }}
            </span>
          </div>
        </div>

        <!-- 参数调节 -->
        <div class="workshop__controls">
          <div class="workshop__slider-group">
            <label class="workshop__slider-label">创意度: <span class="mono-text">{{ creativity }}</span></label>
            <input type="range" class="workshop__slider" min="1" max="10" v-model.number="creativity" />
            <div class="workshop__slider-marks">
              <span>忠实</span>
              <span>平衡</span>
              <span>天马行空</span>
            </div>
          </div>
          <div class="workshop__slider-group">
            <label class="workshop__slider-label">水墨浓度: <span class="mono-text">{{ inkDensity }}</span></label>
            <input type="range" class="workshop__slider" min="1" max="10" v-model.number="inkDensity" />
            <div class="workshop__slider-marks">
              <span>淡雅</span>
              <span>适中</span>
              <span>浓墨</span>
            </div>
          </div>
        </div>

        <!-- 生成结果 -->
        <transition name="ink-fade">
          <div v-if="results.length > 0" class="workshop__results fade-in">
            <div class="workshop__results-label">生成结果</div>
            <div class="workshop__results-grid">
              <div v-for="(result, i) in results" :key="i" class="workshop__result-card"
                :class="{ 'workshop__result-card--selected': selectedResult === i }"
                @click="selectedResult = i">
                <canvas :ref="el => setResultCanvas(i, el)" class="workshop__result-canvas"></canvas>
                <div class="workshop__result-tags">
                  <span class="workshop__result-tag" v-if="i === 0">默认</span>
                  <span class="workshop__result-tag" v-if="creativity > 7">高创意</span>
                  <span class="workshop__result-tag" v-if="inkDensity > 7">浓墨</span>
                </div>
              </div>
            </div>

            <div v-if="selectedResult !== null" class="workshop__result-detail">
              <p class="workshop__result-prompt body-text">
                <strong>提示词：</strong>{{ results[selectedResult].prompt }}
              </p>
              <p class="workshop__result-desc body-text">{{ results[selectedResult].desc }}</p>
            </div>
          </div>
        </transition>

        <div class="workshop__actions fade-in" v-if="results.length > 0">
          <button class="ink-btn ink-btn--gold" @click="$emit('complete', 80)">
            完成创作，继续闯关 →
          </button>
        </div>
      </div>

      <div class="workshop__insight body-text fade-in">
        💡 提示词工程是与AI对话的艺术——<strong>具体、清晰、有语境</strong>的提示词能大幅提升生成质量。
        创意度控制随机性，水墨浓度控制风格强度。好的提示词 = 好的生成结果。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)

const promptText = ref('')
const creativity = ref(5)
const inkDensity = ref(5)
const generating = ref(false)
const results = ref([])
const selectedResult = ref(null)
const resultCanvases = ref([])

const examples = [
  '水墨风格的老虎，在竹林中漫步',
  '敦煌飞天，飘逸的丝带，岩彩风格',
  '一只仙鹤立在松树枝头，写意',
  '山水之间，云雾缭绕，孤舟蓑笠翁'
]

function setResultCanvas(index, el) {
  if (el) resultCanvases.value[index] = el
}

function generate() {
  if (!promptText.value.trim()) return
  generating.value = true

  // Simulate AI generation
  setTimeout(() => {
    const newResults = []
    const count = 2 + Math.floor(creativity.value / 5)

    for (let i = 0; i < count; i++) {
      newResults.push({
        prompt: promptText.value,
        desc: getDescription(promptText.value, i),
        seed: Math.random()
      })
    }

    results.value = newResults
    selectedResult.value = 0
    generating.value = false

    // Draw canvases after DOM update
    setTimeout(() => {
      results.value.forEach((_, i) => drawResult(i))
    }, 100)
  }, 1500)
}

function getDescription(prompt, idx) {
  const descs = [
    '墨色浓淡适宜，构图疏密有致，传统水墨韵味十足',
    '笔触大胆奔放，墨色层次丰富，现代感与古典美并存',
    '留白巧妙，意境深远，给人以无限遐想空间',
    '工写结合，细节处见功夫，整体气势磅礴'
  ]
  return descs[idx % descs.length]
}

function drawResult(index) {
  const canvas = resultCanvases.value[index]
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

  // Simulate ink-wash painting based on prompt and parameters
  const seed = results.value[index]?.seed || Math.random()
  const density = inkDensity.value / 10
  const creative = creativity.value / 10

  // Draw mountains
  drawInkMountains(ctx, size, density, creative, seed)

  // Draw ink splashes
  for (let i = 0; i < 20 * density; i++) {
    const x = Math.random() * size * 0.8 + size * 0.1
    const y = Math.random() * size * 0.6 + size * 0.2
    const r = 1 + Math.random() * 4 * density
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(26, 26, 26, ${Math.random() * 0.1 * density})`
    ctx.fill()
  }

  // Border
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.1)'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, size, size)
}

function drawInkMountains(ctx, size, density, creative, seed) {
  const count = 3 + Math.floor(creative * 2)

  for (let m = 0; m < count; m++) {
    const cx = size * (0.15 + (m / count) * 0.7)
    const baseY = size * 0.75
    const height = size * (0.2 + Math.random() * 0.35 * density)
    const width = size * (0.08 + Math.random() * 0.15)

    ctx.beginPath()
    ctx.moveTo(cx - width, baseY)

    const peaks = 2 + Math.floor(Math.random() * 3)
    for (let p = 0; p < peaks; p++) {
      const px = cx - width + ((p + 1) / (peaks + 1)) * width * 2
      const py = baseY - height * (0.3 + Math.random() * 0.7)
      ctx.lineTo(px, py)
    }

    ctx.lineTo(cx + width, baseY)
    ctx.closePath()

    ctx.fillStyle = `rgba(26, 26, 26, ${0.05 + Math.random() * 0.08 * density})`
    ctx.fill()
    ctx.strokeStyle = `rgba(26, 26, 26, ${0.1 + Math.random() * 0.15 * density})`
    ctx.lineWidth = 1 + Math.random() * density
    ctx.stroke()
  }
}

onMounted(() => {})
</script>

<style scoped>
.workshop { min-height: 80vh; padding: 40px 24px; }
.workshop__container { max-width: 700px; margin: 0 auto; text-align: center; }
.workshop__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.workshop__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.workshop__demo { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }

.workshop__input-group { margin-bottom: 20px; }
.workshop__label { font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.1em; display: block; margin-bottom: 8px; }
.workshop__input-row { display: flex; gap: 8px; }
.workshop__input { flex: 1; padding: 10px 14px; border: 1px solid var(--ink-pale); background: var(--paper); font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-dark); outline: none; transition: border-color 0.3s ease; }
.workshop__input:focus { border-color: var(--cinnabar); }
.workshop__input::placeholder { color: var(--ink-pale); }

.workshop__prompts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; justify-content: center; }
.workshop__prompt-chip { padding: 4px 10px; border: 1px solid var(--ink-pale); font-size: 0.72rem; color: var(--ink-light); cursor: pointer; transition: all 0.3s ease; }
.workshop__prompt-chip:hover { border-color: var(--ink-medium); color: var(--ink-dark); }

.workshop__controls { display: flex; gap: 20px; margin-bottom: 20px; }
.workshop__slider-group { flex: 1; }
.workshop__slider-label { font-family: var(--font-body); font-size: 0.82rem; display: block; margin-bottom: 6px; }
.workshop__slider-label .mono-text { color: var(--cinnabar); }
.workshop__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.workshop__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.workshop__slider-marks { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--ink-light); margin-top: 2px; }

.workshop__results { margin-bottom: 20px; }
.workshop__results-label { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; margin-bottom: 12px; color: var(--ink-medium); }
.workshop__results-grid { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
.workshop__result-card { cursor: pointer; border: 2px solid var(--ink-pale); transition: all 0.3s ease; position: relative; }
.workshop__result-card:hover { border-color: var(--ink-medium); transform: translateY(-2px); }
.workshop__result-card--selected { border-color: var(--cinnabar); box-shadow: 0 0 12px rgba(194,58,43,0.15); }
.workshop__result-canvas { display: block; }
.workshop__result-tags { position: absolute; top: 4px; left: 4px; display: flex; gap: 4px; }
.workshop__result-tag { padding: 1px 6px; font-size: 0.6rem; background: var(--cinnabar); color: var(--paper); }

.workshop__result-detail { padding: 12px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); text-align: left; }
.workshop__result-prompt { font-size: 0.8rem; color: var(--ink-dark); margin-bottom: 4px; }
.workshop__result-desc { font-size: 0.78rem; color: var(--ink-medium); }

.workshop__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.workshop__insight strong { color: var(--cinnabar); }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.4s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
