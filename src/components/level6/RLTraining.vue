<template>
  <div class="rl-training">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="强化学习 · 从试错中学会决策"
      subtitle="Q-Learning、探索与利用——单智能体的修炼之道"
      :principle="'强化学习（Reinforcement Learning）是机器学习的第三范式——智能体通过与环境交互、接收奖励或惩罚信号来学习最优策略。核心要素包括：状态（State，智能体所处的环境情况）、动作（Action，智能体可以采取的行为）、奖励（Reward，环境对动作的即时反馈）、策略（Policy，从状态到动作的映射）。Q-Learning是最经典的强化学习算法——通过维护Q表（状态-动作价值表）并使用Bellman方程迭代更新Q值，最终学到最优策略。核心权衡：探索（Exploration，尝试新动作以获得更多信息）vs 利用（Exploitation，选择已知最优动作以获得最大奖励）。ε-greedy策略以概率ε随机探索，以概率1-ε选择最优动作——这是平衡探索与利用的经典方法。'"
      :gameMapping="'在「新手训练营「中，英雄（智能体）需要在5×5网格世界中从起点(S)出发，避开陷阱(X)，找到宝藏(T)。每一步对应RL的一个决策周期：英雄根据当前位置（状态）选择一个方向移动（动作），踩到空地获得小额负奖励（-1，鼓励快速到达），踩到陷阱获得大额负奖励（-10），到达宝藏获得大额正奖励（+20）。Q-Learning通过试错学习每个格子的最优移动方向——训练轮数越多，英雄越熟悉环境，到达宝藏越快。右侧的Q值热力图展示每个格子的价值评估：绿色=高价值路径，红色=危险区域（陷阱）。这就是RL的核心——从试错中学习最优策略！'"
      :tips="['Q-Learning是off-policy算法——学习最优策略，但可以用随机策略收集经验', '探索率ε通常从0.9逐渐衰减到0.05——早期多探索，后期多利用', '深度强化学习（DQN）用神经网络替代Q表——可以处理连续状态空间（如图像输入）', 'AlphaGo是强化学习的巅峰应用——结合了深度神经网络+蒙特卡洛树搜索+自我对弈']"
      vizType="default"
      @close="showPrincipleTip = false"
    />
    <div class="rl__container">
      <h2 class="rl__title fade-in">🏋️ 新手训练营 · 单智能体强化学习</h2>
      <p class="rl__subtitle body-text fade-in delay-1">新英雄进入训练营——从试错中学会找到宝藏</p>

      <div class="rl__demo fade-in delay-2">
        <div class="rl__grid-area">
          <!-- Grid World -->
          <div class="rl__grid">
            <div v-for="(row, ri) in grid" :key="ri" class="rl__grid-row">
              <div
                v-for="(cell, ci) in row"
                :key="ci"
                class="rl__grid-cell"
                :class="{
                  'rl__grid-cell--start': cell === 'S',
                  'rl__grid-cell--treasure': cell === 'T',
                  'rl__grid-cell--trap': cell === 'X',
                  'rl__grid-cell--agent': agentPos[0] === ri && agentPos[1] === ci,
                  'rl__grid-cell--visited': visitedCells.has(ri + ',' + ci) && !(agentPos[0] === ri && agentPos[1] === ci)
                }"
              >
                <span v-if="cell === 'S'" class="rl__cell-icon">🏁</span>
                <span v-else-if="cell === 'T'" class="rl__cell-icon">💎</span>
                <span v-else-if="cell === 'X'" class="rl__cell-icon">💀</span>
                <span v-else-if="agentPos[0] === ri && agentPos[1] === ci" class="rl__cell-icon">🦸</span>
              </div>
            </div>
          </div>

          <!-- 奖励函数设计 -->
          <div class="rl__reward-design">
            <h3 class="rl__reward-title">设计奖励函数</h3>
            <div class="rl__reward-sliders">
              <div class="rl__reward-group">
                <label class="rl__reward-label">到达宝藏: <span class="mono-text">+{{ rewardTreasure }}</span></label>
                <input type="range" class="rl__slider" min="1" max="20" v-model.number="rewardTreasure" />
              </div>
              <div class="rl__reward-group">
                <label class="rl__reward-label">掉入陷阱: <span class="mono-text">{{ rewardTrap }}</span></label>
                <input type="range" class="rl__slider" min="-20" max="0" v-model.number="rewardTrap" />
              </div>
              <div class="rl__reward-group">
                <label class="rl__reward-label">每步代价: <span class="mono-text">{{ rewardStep }}</span></label>
                <input type="range" class="rl__slider" min="-5" max="0" step="0.1" v-model.number="rewardStep" />
              </div>
            </div>
          </div>
        </div>

        <!-- 训练控制 -->
        <div class="rl__controls">
          <button class="ink-btn" @click="startTraining" :disabled="training">
            {{ training ? '训练中...' : '开始训练' }}
          </button>
          <button class="ink-btn" @click="resetTraining" :disabled="training">重置</button>
          <div class="rl__speed-control">
            <label>速度</label>
            <input type="range" min="1" max="5" v-model.number="speed" />
          </div>
        </div>

        <!-- 训练状态 -->
        <div class="rl__status">
          <div class="rl__status-item">
            <span class="rl__status-label">训练轮数</span>
            <span class="mono-text">{{ episodes }}</span>
          </div>
          <div class="rl__status-item">
            <span class="rl__status-label">成功找到宝藏</span>
            <span class="mono-text">{{ successCount }} 次</span>
          </div>
          <div class="rl__status-item">
            <span class="rl__status-label">成功率</span>
            <span class="mono-text">{{ episodes > 0 ? Math.round((successCount / episodes) * 100) : 0 }}%</span>
          </div>
        </div>

        <!-- Q值热力图 -->
        <div class="rl__heatmap" v-if="episodes > 0">
          <div class="rl__heatmap-label">Q值热力图（越亮 = 越有价值）</div>
          <canvas ref="heatmapCanvas" class="rl__heatmap-canvas"></canvas>
        </div>

        <div class="rl__actions fade-in" v-if="episodes >= 50 && successCount >= 30">
          <button class="ink-btn ink-btn--gold" @click="$emit('complete', 85)">
            训练完成，继续闯关 →
          </button>
        </div>
      </div>

      <div class="rl__insight body-text fade-in">
        💡 强化学习中，智能体通过<strong>试错</strong>学习最优策略。奖励函数设计是核心——
        宝藏给正奖励，陷阱给负奖励，每步微小代价促使智能体走最短路径。
        这就是AlphaGo、自动驾驶等AI技术的底层原理。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const heatmapCanvas = ref(null)
const gridSize = 5
const grid = [
  ['S', '.', 'X', '.', '.'],
  ['.', '.', '.', '.', 'X'],
  ['.', 'X', '.', '.', '.'],
  ['.', '.', '.', 'X', '.'],
  ['.', '.', '.', '.', 'T']
]

const agentPos = ref([0, 0])
const visitedCells = reactive(new Set())
const training = ref(false)
const episodes = ref(0)
const successCount = ref(0)
const speed = ref(3)
const rewardTreasure = ref(10)
const rewardTrap = ref(-5)
const rewardStep = ref(-0.1)

let trainingTimer = null
let qValues = []

function initQValues() {
  qValues = []
  for (let r = 0; r < gridSize; r++) {
    qValues[r] = []
    for (let c = 0; c < gridSize; c++) {
      qValues[r][c] = { up: 0, down: 0, left: 0, right: 0 }
    }
  }
}
initQValues()

function resetAgent() {
  agentPos.value = [0, 0]
  visitedCells.clear()
}

function startTraining() {
  if (training.value) return
  training.value = true
  resetAgent()
  runEpisode()
}

function runEpisode() {
  if (!training.value) return

  let pos = [0, 0]
  const path = []
  let totalReward = 0

  for (let step = 0; step < 50; step++) {
    const [r, c] = pos

    // Epsilon-greedy action selection
    const epsilon = Math.max(0.05, 0.5 - episodes.value * 0.01)
    const actions = ['up', 'down', 'left', 'right']

    let action
    if (Math.random() < epsilon) {
      action = actions[Math.floor(Math.random() * 4)]
    } else {
      const q = qValues[r][c]
      action = actions.reduce((a, b) => q[a] > q[b] ? a : b)
    }

    // Execute action
    let [nr, nc] = pos
    if (action === 'up' && r > 0) nr--
    else if (action === 'down' && r < gridSize - 1) nr++
    else if (action === 'left' && c > 0) nc--
    else if (action === 'right' && c < gridSize - 1) nc++

    // Calculate reward
    let reward = rewardStep.value
    const cellType = grid[nr][nc]
    let done = false

    if (cellType === 'T') {
      reward += rewardTreasure.value
      done = true
      successCount.value++
    } else if (cellType === 'X') {
      reward += rewardTrap.value
      done = true
    }

    totalReward += reward

    // Q-learning update
    const lr = 0.1
    const gamma = 0.9
    const oldQ = qValues[r][c][action]
    let maxNextQ = 0
    if (!done) {
      const nq = qValues[nr][nc]
      maxNextQ = Math.max(nq.up, nq.down, nq.left, nq.right)
    }
    qValues[r][c][action] = oldQ + lr * (reward + gamma * maxNextQ - oldQ)

    path.push({ pos: [nr, nc], action })

    if (done) break
    pos = [nr, nc]
  }

  // Animate path
  episodes.value++
  animatePath(path, 0)
}

function animatePath(path, index) {
  if (index >= path.length || !training.value) {
    // Schedule next episode
    const delay = Math.max(50, 300 - speed.value * 50)
    trainingTimer = setTimeout(() => {
      resetAgent()
      runEpisode()
    }, delay)
    return
  }

  const step = path[index]
  agentPos.value = step.pos
  visitedCells.add(step.pos[0] + ',' + step.pos[1])

  // Update heatmap periodically
  if (index % 3 === 0) drawHeatmap()

  const delay = Math.max(30, 200 - speed.value * 35)
  trainingTimer = setTimeout(() => animatePath(path, index + 1), delay)
}

function resetTraining() {
  training.value = false
  if (trainingTimer) clearTimeout(trainingTimer)
  episodes.value = 0
  successCount.value = 0
  initQValues()
  resetAgent()
  drawHeatmap()
}

function drawHeatmap() {
  const canvas = heatmapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cellSize = 50
  canvas.width = gridSize * cellSize
  canvas.height = gridSize * cellSize

  let maxQ = 0.01
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const q = qValues[r][c]
      const max = Math.max(q.up, q.down, q.left, q.right)
      if (max > maxQ) maxQ = max
    }
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const q = qValues[r][c]
      const max = Math.max(q.up, q.down, q.left, q.right)
      const intensity = max / maxQ

      ctx.fillStyle = `rgba(194, 58, 43, ${intensity * 0.4})`
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)

      ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)'
      ctx.lineWidth = 1
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize)

      ctx.fillStyle = 'var(--ink-light)'
      ctx.font = '10px "JetBrains Mono"'
      ctx.textAlign = 'center'
      ctx.fillText(max.toFixed(1), c * cellSize + cellSize / 2, r * cellSize + cellSize / 2 + 3)
    }
  }
}

onMounted(() => { drawHeatmap() })
onUnmounted(() => { if (trainingTimer) clearTimeout(trainingTimer) })
</script>

<style scoped>
.rl-training { min-height: 80vh; padding: 40px 24px; }
.rl__container { max-width: 700px; margin: 0 auto; text-align: center; }
.rl__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.rl__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.rl__demo { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }

.rl__grid-area { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center; }

.rl__grid { display: inline-flex; flex-direction: column; border: 2px solid var(--ink-pale); background: var(--paper); }
.rl__grid-row { display: flex; }
.rl__grid-cell { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(26,26,26,0.06); transition: all 0.2s ease; }
.rl__grid-cell--start { background: rgba(74,124,111,0.08); }
.rl__grid-cell--treasure { background: rgba(201,168,76,0.12); }
.rl__grid-cell--trap { background: rgba(194,58,43,0.08); }
.rl__grid-cell--agent { background: rgba(194,58,43,0.15); animation: glow-pulse 1s ease-in-out infinite; }
.rl__grid-cell--visited { background: rgba(26,26,26,0.03); }
.rl__cell-icon { font-size: 1.3rem; }

.rl__reward-design { flex: 1; min-width: 200px; text-align: left; }
.rl__reward-title { font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.1em; margin-bottom: 12px; }
.rl__reward-group { margin-bottom: 10px; }
.rl__reward-label { font-size: 0.78rem; display: block; margin-bottom: 4px; }
.rl__reward-label .mono-text { color: var(--cinnabar); }
.rl__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.rl__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }

.rl__controls { display: flex; gap: 12px; align-items: center; justify-content: center; margin-bottom: 16px; }
.rl__speed-control { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--ink-light); }
.rl__speed-control input { width: 80px; }

.rl__status { display: flex; gap: 24px; justify-content: center; margin-bottom: 16px; }
.rl__status-item { text-align: center; }
.rl__status-label { display: block; font-size: 0.65rem; color: var(--ink-light); }
.rl__status-item .mono-text { font-size: 0.95rem; color: var(--ink-dark); }

.rl__heatmap { margin-bottom: 16px; }
.rl__heatmap-label { font-size: 0.78rem; color: var(--ink-light); margin-bottom: 8px; }
.rl__heatmap-canvas { margin: 0 auto; display: block; }

.rl__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.rl__insight strong { color: var(--cinnabar); }
</style>
