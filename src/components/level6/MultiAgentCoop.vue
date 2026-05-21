<template>
  <div class="multi-agent">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="多智能体协作 · 1+1>2的奥秘"
      subtitle="通信、分工与奖励共享——团队智慧的涌现"
      :principle="'多智能体强化学习（MARL）中，协作效率取决于三个关键因素：通信频率（智能体间信息交换的密度——太少导致各自为战，太多导致信息过载）、分工策略（专精vs全能——每个智能体聚焦特定子任务还是都能做所有事）、奖励共享（个体奖励vs团队奖励——共享奖励促进合作但可能产生「搭便车「，个体奖励激励个人表现但可能导致竞争）。理想的协作产生「涌现行为「——简单的个体规则组合后，团队展现出超越个体的复杂智能。这类似于蚁群算法——每只蚂蚁行为简单，但蚁群能找到最优路径。在深度学习中，Mixture of Experts（MoE）也是一种分工策略——不同的「专家「网络处理不同类型的输入。'"
      :gameMapping="'在「团战演练「中，你需要调整三个协作参数来优化五人团队的表现。五个英雄各自有不同特长（坦克、刺客、法师、射手、辅助），通信频率决定他们共享多少战场信息——高通信帮助团队协调但消耗计算资源。分工策略选择让英雄各司其职还是灵活应对。奖励共享比例决定个体利益与团队利益的平衡。调整参数后训练团队，系统会评估团队综合表现。这个环节让你直观体验多智能体系统中的协作权衡。'"
      :tips="['通信的代价：多智能体通信本身消耗带宽和计算资源——这是MARL中的通信效率问题', 'CTDE范式：集中训练（训练时共享全局信息）+ 分散执行（执行时只用本地观测）', '涌现行为：简单个体的局部交互可能产生复杂的全局模式——这是多智能体系统最迷人的特性', '奖励设计是MARL中最难的问题之一——错误的奖励函数会导致意想不到的次优行为']"
      vizType="network"
      @close="showPrincipleTip = false"
    />
    <div class="ma__container">
      <h2 class="ma__title fade-in">🤝 团战演练 · 多智能体协作</h2>
      <p class="ma__subtitle body-text fade-in delay-1">五个英雄组队——各司其职、互相配合才能赢</p>

      <div class="ma__demo fade-in delay-2">
        <!-- Team Visualization -->
        <div class="ma__team">
          <canvas ref="teamCanvas" class="ma__team-canvas"></canvas>
        </div>

        <!-- Communication lines legend -->
        <div class="ma__legend">
          <span class="ma__legend-item">
            <span class="ma__legend-line" style="background: var(--cinnabar);"></span> 通信频繁
          </span>
          <span class="ma__legend-item">
            <span class="ma__legend-line" style="background: var(--ink-light);"></span> 通信较少
          </span>
        </div>

        <!-- Collaboration Parameters -->
        <div class="ma__params">
          <div class="ma__param-group">
            <label class="ma__param-label">通信频率: <span class="mono-text">{{ commFreq }}</span></label>
            <input type="range" class="ma__slider" min="1" max="10" v-model.number="commFreq" />
            <div class="ma__param-marks">
              <span>独立作战</span>
              <span>频繁沟通</span>
            </div>
          </div>
          <div class="ma__param-group">
            <label class="ma__param-label">分工策略: <span class="mono-text">{{ strategies[divisionStrategy] }}</span></label>
            <input type="range" class="ma__slider" min="0" max="2" step="1" v-model.number="divisionStrategy" />
            <div class="ma__param-marks">
              <span>均衡</span>
              <span>专精</span>
              <span>灵活</span>
            </div>
          </div>
          <div class="ma__param-group">
            <label class="ma__param-label">奖励共享: <span class="mono-text">{{ rewardShare }}%</span></label>
            <input type="range" class="ma__slider" min="0" max="100" v-model.number="rewardShare" />
            <div class="ma__param-marks">
              <span>个人主义</span>
              <span>完全共享</span>
            </div>
          </div>
        </div>

        <button class="ink-btn" @click="simulate" :disabled="simulating">
          {{ simulating ? '演练中...' : '开始团战演练' }}
        </button>

        <!-- Results -->
        <transition name="ink-fade">
          <div v-if="result" class="ma__result fade-in">
            <div class="ma__result-header" :class="{ 'ma__result-header--good': result.score >= 80 }">
              团队协作评分: <span class="ma__result-score">{{ result.score }}</span>
            </div>
            <div class="ma__result-stats">
              <div class="ma__result-stat" v-for="(agent, i) in result.agents" :key="i">
                <span class="ma__result-agent-emoji">{{ agent.emoji }}</span>
                <span class="ma__result-agent-name">{{ agent.name }}</span>
                <div class="ma__result-agent-bar">
                  <div class="ma__result-agent-fill" :style="{ width: agent.efficiency + '%' }"
                    :class="{ 'ma__result-agent-fill--high': agent.efficiency > 70 }"></div>
                </div>
                <span class="mono-text">{{ agent.efficiency }}%</span>
              </div>
            </div>
            <div class="ma__result-desc body-text">{{ result.desc }}</div>
            <button class="ink-btn ink-btn--gold" @click="$emit('complete', result.score)">
              完成演练 →
            </button>
          </div>
        </transition>
      </div>

      <div class="ma__insight body-text fade-in">
        💡 多智能体协作的核心在于<strong>通信与分工</strong>的平衡。通信频率决定信息共享程度，
        分工策略影响团队效率，奖励共享机制则决定了智能体是"利己"还是"利他"。
        最优的团队往往在独立与协作之间找到最佳平衡点。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)

const teamCanvas = ref(null)
const commFreq = ref(5)
const divisionStrategy = ref(0)
const rewardShare = ref(50)
const simulating = ref(false)
const result = ref(null)
let animId = null

const strategies = ['均衡分工', '专精分工', '灵活分工']

const agents = [
  { emoji: '🛡️', name: '坦克', role: '前排抗伤' },
  { emoji: '🗡️', name: '刺客', role: '爆发输出' },
  { emoji: '🔮', name: '法师', role: '范围伤害' },
  { emoji: '🏹', name: '射手', role: '持续输出' },
  { emoji: '💚', name: '辅助', role: '治疗增益' }
]

function simulate() {
  simulating.value = true

  setTimeout(() => {
    const baseScore = 50 +
      commFreq.value * 3 +
      (divisionStrategy.value === 1 ? 15 : 5) +
      (rewardShare.value > 30 && rewardShare.value < 80 ? 15 : 0)

    const agentScores = agents.map((a, i) => {
      let eff = 50 + Math.random() * 30
      eff += commFreq.value > 6 ? 5 : 0
      eff += Math.abs(i - 2) < 2 && divisionStrategy.value === 1 ? 10 : 0
      return Math.round(Math.min(98, eff))
    })

    const finalScore = Math.round(agentScores.reduce((a, b) => a + b, 0) / agentScores.length)

    const descs = [
      '团队协作良好！各司其职，配合默契。通信频率适中，既不过度沟通也不各自为战。',
      '分工明确带来了高效的团队协作。专精策略让每个智能体在自己的领域发挥最大价值。',
      '灵活的分工策略适应性强，奖励共享机制促使团队目标一致，整体表现优秀。'
    ]

    result.value = {
      score: finalScore,
      agents: agents.map((a, i) => ({
        ...a,
        efficiency: agentScores[i]
      })),
      desc: descs[Math.floor(Math.random() * descs.length)]
    }

    simulating.value = false
  }, 2000)
}

function drawTeam() {
  const canvas = teamCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement.offsetWidth || 600
  canvas.width = w * dpr
  canvas.height = 250 * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = '250px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, 250)
  ctx.fillStyle = 'var(--paper)'
  ctx.fillRect(0, 0, w, 250)

  const positions = agents.map((_, i) => {
    const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2
    const r = 80
    return {
      x: w / 2 + Math.cos(angle) * r,
      y: 125 + Math.sin(angle) * r
    }
  })

  // Draw communication lines
  const commIntensity = commFreq.value / 10
  positions.forEach((p1, i) => {
    positions.forEach((p2, j) => {
      if (i >= j) return
      const alpha = commIntensity * (0.05 + Math.random() * 0.15)

      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.strokeStyle = `rgba(194, 58, 43, ${alpha})`
      ctx.lineWidth = commIntensity * 3
      ctx.stroke()
    })
  })

  // Draw agents
  agents.forEach((agent, i) => {
    const pos = positions[i]
    const pulse = Math.sin(Date.now() / 1000 + i) * 3

    // Glow
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25 + pulse)
    grad.addColorStop(0, 'rgba(194, 58, 43, 0.08)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 25 + pulse, 0, Math.PI * 2)
    ctx.fill()

    // Circle
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(245, 240, 232, 0.9)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Emoji
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(agent.emoji, pos.x, pos.y)

    // Name
    ctx.font = '10px "Noto Serif SC"'
    ctx.fillStyle = 'var(--ink-medium)'
    ctx.textBaseline = 'top'
    ctx.fillText(agent.name, pos.x, pos.y + 24)
  })

  // Center label
  ctx.font = '11px "Noto Serif SC"'
  ctx.fillStyle = 'var(--ink-light)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('团战协作网络', w / 2, 125 - 105)

  animId = requestAnimationFrame(drawTeam)
}

watch([commFreq, divisionStrategy, rewardShare], () => {
  // Redraw will happen in animation loop
})

onMounted(() => { animId = requestAnimationFrame(drawTeam) })
onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>

<style scoped>
.multi-agent { min-height: 80vh; padding: 40px 24px; }
.ma__container { max-width: 700px; margin: 0 auto; text-align: center; }
.ma__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.ma__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.ma__demo { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }

.ma__team { margin-bottom: 12px; }
.ma__team-canvas { display: block; width: 100%; height: 250px; }

.ma__legend { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; }
.ma__legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--ink-light); }
.ma__legend-line { width: 20px; height: 3px; border-radius: 2px; }

.ma__params { margin-bottom: 20px; }
.ma__param-group { margin-bottom: 14px; }
.ma__param-label { font-family: var(--font-body); font-size: 0.82rem; display: block; margin-bottom: 4px; }
.ma__param-label .mono-text { color: var(--cinnabar); }
.ma__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.ma__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.ma__param-marks { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--ink-light); margin-top: 2px; }

.ma__result { margin-top: 20px; padding: 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); }
.ma__result-header { font-family: var(--font-display); font-size: 1.2rem; letter-spacing: 0.1em; margin-bottom: 16px; }
.ma__result-header--good { color: var(--verdant); }
.ma__result-score { font-family: var(--font-mono); }

.ma__result-stats { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.ma__result-stat { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--ink-pale); }
.ma__result-agent-emoji { font-size: 1.2rem; }
.ma__result-agent-name { font-size: 0.75rem; width: 40px; text-align: left; }
.ma__result-agent-bar { flex: 1; height: 6px; background: rgba(26,26,26,0.06); border-radius: 3px; overflow: hidden; }
.ma__result-agent-fill { height: 100%; background: var(--ink-light); border-radius: 3px; transition: width 0.5s ease; }
.ma__result-agent-fill--high { background: var(--verdant); }
.ma__result-stat .mono-text { font-size: 0.7rem; color: var(--ink-light); width: 30px; text-align: right; }

.ma__result-desc { font-size: 0.8rem; color: var(--ink-medium); margin-bottom: 12px; }

.ma__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.ma__insight strong { color: var(--cinnabar); }
</style>
