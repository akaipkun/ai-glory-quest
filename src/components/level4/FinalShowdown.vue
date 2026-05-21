<template>
  <div class="final-showdown">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="模型对决 · 泛化即王道"
      subtitle="偏差-方差权衡与模型综合评估"
      :principle="'在深度学习中，模型的真正实力不在于训练集上的表现，而在于对未见过的数据（测试集）的泛化能力。偏差（Bias）反映模型的学习能力——偏差高意味着欠拟合，模型太简单学不到规律。方差（Variance）反映模型对训练数据噪声的敏感度——方差高意味着过拟合，模型死记硬背而非理解。最优的模型在偏差和方差之间取得平衡——这就是著名的偏差-方差权衡。综合评分 = 准确率 × 泛化能力 × 推理速度的加权，反映了模型的实战能力。'"
      :gameMapping="'在巅峰对决中，你的模型将与Boss模型一较高下。HP条代表模型在对抗中的表现——你的综合评分越高，能抵消的Boss伤害越多。预测胜率基于评分差：评分每高1分，胜率约高1.5%。即使评分稍低也可能逆袭（泛化的随机性），但高评分让胜利更有保障。优化水平 > 88分即可封王——这是在准确率、泛化和效率之间的精妙平衡。'"
      :tips="['过拟合信号：训练准确率很高但验证准确率低 → 加正则化或Dropout', '欠拟合信号：训练和验证准确率都低 → 增加模型复杂度或训练轮次', '集成学习（多个模型投票）可以显著降低方差，是竞赛中的常用技巧', '模型部署时要考虑推理速度——参数量大的模型虽然准确但可能太慢']"
      vizType="default"
      @close="showPrincipleTip = false"
    />

    <div class="final__container">
      <h2 class="final__title fade-in">⚔️ 巅峰对决 · 最强王者决赛</h2>
      <p class="final__subtitle body-text fade-in delay-1">你的模型 vs 系统Boss模型——谁才是真正的王者？</p>

      <!-- 对战面板 -->
      <div class="final__arena fade-in delay-2">
        <!-- 你的模型 -->
        <div class="final__side">
          <div class="final__side-header">
            <span class="final__side-emoji">{{ playerHero.emoji }}</span>
            <span class="final__side-name">{{ playerHero.name }}</span>
          </div>
          <div class="final__side-stats">
            <div class="final__stat">
              <span class="final__stat-label">综合评分</span>
              <span class="final__stat-value mono-text">{{ playerScore }}</span>
            </div>
            <div class="final__stat">
              <span class="final__stat-label">段位</span>
              <span class="final__stat-value" style="font-size:1rem">{{ playerTier }}</span>
            </div>
          </div>
          <div class="final__hp-bar">
            <div class="final__hp-fill" :style="{ width: playerHp + '%' }" :class="{ 'final__hp-fill--low': playerHp < 30 }"></div>
            <span class="final__hp-text mono-text">{{ Math.round(playerHp) }}%</span>
          </div>
        </div>

        <div class="final__vs">
          <span class="final__vs-text">VS</span>
          <div class="final__vs-line"></div>
        </div>

        <!-- Boss模型 -->
        <div class="final__side">
          <div class="final__side-header">
            <span class="final__side-emoji">{{ boss.emoji }}</span>
            <span class="final__side-name">{{ boss.name }}</span>
          </div>
          <div class="final__side-stats">
            <div class="final__stat">
              <span class="final__stat-label">综合评分</span>
              <span class="final__stat-value mono-text">{{ boss.score }}</span>
            </div>
            <div class="final__stat">
              <span class="final__stat-label">段位</span>
              <span class="final__stat-value" style="font-size:1rem">{{ boss.tier }}</span>
            </div>
          </div>
          <div class="final__hp-bar">
            <div class="final__hp-fill final__hp-fill--boss" :style="{ width: bossHp + '%' }" :class="{ 'final__hp-fill--low': bossHp < 30 }"></div>
            <span class="final__hp-text mono-text">{{ Math.round(bossHp) }}%</span>
          </div>
        </div>
      </div>

      <!-- 速度线 (战斗特效) -->
      <canvas ref="battleCanvas" class="final__battle-canvas"></canvas>

      <!-- 胜率预测 -->
      <div class="final__prediction fade-in delay-3">
        <span class="final__prediction-label body-text">AI预测你的胜率</span>
        <div class="final__prediction-bar">
          <div class="final__prediction-fill" :style="{ width: winRate + '%' }"></div>
        </div>
        <span class="final__prediction-value mono-text">{{ winRate }}%</span>
      </div>

      <!-- 操作 -->
      <div class="final__actions fade-in delay-3" v-if="!battleInProgress && !battleDone">
        <button
          class="ink-btn ink-btn--gold"
          @click="startBattle"
          :disabled="playerScore < 60"
        >
          {{ playerScore >= 60 ? '⚔️ 发起挑战' : '评分不足，无法挑战' }}
        </button>
        <p v-if="playerScore < 60" class="final__hint body-text">综合评分需要达到60以上才能挑战Boss</p>
      </div>

      <!-- 战斗过程 -->
      <transition name="ink-fade">
        <div v-if="battleInProgress" class="final__battle-log fade-in">
          <div v-for="(msg, i) in battleLog" :key="i" class="final__log-entry">
            <span class="final__log-text">{{ msg }}</span>
          </div>
        </div>
      </transition>

      <!-- 战斗结果 -->
      <transition name="ink-fade">
        <div v-if="battleDone" class="final__result fade-in">
          <div v-if="playerWon" class="final__victory">
            <div class="final__result-seal ink-animate-splash">
              <span class="final__result-seal-icon">👑</span>
              <span class="final__result-seal-text">最强王者</span>
            </div>
            <p class="final__result-title">🎉 恭喜！你击败了Boss模型！</p>
            <p class="final__result-desc body-text">你的模型经过层层优化，终于登顶最强王者！深度学习调优之道，你已经掌握。</p>
            <div v-if="playerScore >= 88" class="final__bonus">
              <span class="final__bonus-badge">🏆 至尊成就</span>
              <span class="final__bonus-text">评分 88+：真正的AI调优师！</span>
            </div>
          </div>
          <div v-else class="final__defeat">
            <div class="final__result-seal ink-animate-splash" style="border-color: var(--ink-medium);">
              <span class="final__result-seal-icon">💪</span>
              <span class="final__result-seal-text" style="color: var(--ink-dark);">再接再厉</span>
            </div>
            <p class="final__result-title">😤 惜败！Boss模型略胜一筹</p>
            <p class="final__result-desc body-text">回顾排位赛中的参数选择，尝试更好的优化组合后再来挑战。</p>
          </div>
          <div class="final__result-actions">
            <button v-if="!playerWon" class="ink-btn" @click="resetBattle">重新挑战</button>
            <button v-if="playerWon" class="ink-btn ink-btn--gold" @click="finish">
              完成通关 →
            </button>
            <button v-if="!playerWon && !canRetry" class="ink-btn" @click="$emit('complete', playerScore)">
              接受结果，结束闯关
            </button>
          </div>
        </div>
      </transition>

      <div class="final__insight body-text fade-in">
        💡 模型优化是永无止境的旅程。<strong>综合评分</strong>代表模型整体性能：准确率、速度、泛化能力的加权。
        达到88分即可获得"最强王者"段位——但真正的优化大师永不止步。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const props = defineProps({
  score: { type: Number, default: 60 }
})

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const playerScore = ref(props.score)
const battleCanvas = ref(null)
const playerHp = ref(100)
const bossHp = ref(100)
const battleInProgress = ref(false)
const battleDone = ref(false)
const playerWon = ref(false)
const canRetry = ref(true)
const battleLog = ref([])
let battleAnimId = null

const heroes = [
  { emoji: '🗡️', name: '赵云·卷积将军' },
  { emoji: '🧠', name: '诸葛亮·时序军师' },
  { emoji: '👑', name: '武则天·全能女帝' }
]

const boss = { emoji: '🐉', name: 'Boss·混沌巨兽', score: 92, tier: '👑 最强王者' }

const playerHero = computed(() => {
  const idx = Math.min(Math.floor((playerScore.value - 60) / 10), 2)
  return heroes[Math.max(0, idx)]
})

const playerTier = computed(() => {
  if (playerScore.value >= 88) return '👑 最强王者'
  if (playerScore.value >= 78) return '🌟 至尊星曜'
  if (playerScore.value >= 65) return '💎 永恒钻石'
  if (playerScore.value >= 50) return '🥇 尊贵铂金'
  if (playerScore.value >= 30) return '🥈 荣耀黄金'
  return '🥉 倔强青铜'
})

const winRate = computed(() => {
  const diff = playerScore.value - boss.score
  const rate = 50 + diff * 1.5
  return Math.max(5, Math.min(95, Math.round(rate)))
})

function startBattle() {
  battleInProgress.value = true
  battleLog.value = []
  playerHp.value = 100
  bossHp.value = 100

  const logEntries = [
    '⚔️ 战斗开始！你的模型与Boss模型展开对决...',
    '📊 第一轮：特征提取对抗...',
    '🔥 第二轮：参数优化博弈...',
    '💫 第三轮：泛化能力比拼...',
    '⚡ 最终轮：综合性能冲刺...'
  ]

  let i = 0
  const logTimer = setInterval(() => {
    if (i < logEntries.length) {
      battleLog.value.push(logEntries[i])

      // Simulate HP changes
      const playerDmg = 8 + Math.random() * 15
      const bossDmg = 10 + Math.random() * 18
      const playerBlock = playerScore.value / 100
      const bossBlock = boss.score / 100

      playerHp.value = Math.max(0, playerHp.value - bossDmg * (1 - playerBlock * 0.3))
      bossHp.value = Math.max(0, bossHp.value - playerDmg * bossBlock * 0.7)

      i++
    } else {
      clearInterval(logTimer)
      // Determine winner
      const playerFinal = playerHp.value
      const bossFinal = bossHp.value

      // Player wins if they have more HP or score is high enough
      if (playerFinal > bossFinal || playerScore.value >= 85) {
        playerWon.value = true
        battleLog.value.push('🎉 你的模型凭借更优的参数配置获得了胜利！')
      } else {
        playerWon.value = false
        battleLog.value.push('😤 Boss模型经验更丰富，你的模型惜败。')
        canRetry.value = playerScore.value >= 65
      }

      battleDone.value = true
      battleInProgress.value = false
      drawBattleEffect()
    }
  }, 800)
}

function resetBattle() {
  battleDone.value = false
  battleInProgress.value = false
  playerHp.value = 100
  bossHp.value = 100
  battleLog.value = []
}

function finish() {
  emit('complete', playerScore.value)
}

function drawBattleEffect() {
  const canvas = battleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement.offsetWidth || 600
  canvas.width = w * dpr
  canvas.height = 60 * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = '60px'
  ctx.scale(dpr, dpr)

  let t = 0
  function animate() {
    ctx.clearRect(0, 0, w, 60)
    t += 0.03

    for (let i = 0; i < 8; i++) {
      const x = (w / 8) * i + Math.sin(t + i) * 20
      const y = 30 + Math.cos(t * 0.7 + i * 1.2) * 15
      ctx.beginPath()
      ctx.arc(x, y, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2)
      ctx.fillStyle = playerWon.value
        ? `rgba(74, 124, 111, ${0.3 + Math.sin(t + i) * 0.15})`
        : `rgba(194, 58, 43, ${0.3 + Math.sin(t + i) * 0.15})`
      ctx.fill()
    }

    battleAnimId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {})
onUnmounted(() => { if (battleAnimId) cancelAnimationFrame(battleAnimId) })
</script>

<style scoped>
.final-showdown { min-height: 80vh; padding: 40px 24px; position: relative; }
.final__container { max-width: 700px; margin: 0 auto; text-align: center; }
.final__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.final__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 24px; }

.final__arena {
  display: flex; align-items: stretch; gap: 16px;
  padding: 24px; border: 1px solid var(--ink-pale);
  background: rgba(245, 240, 232, 0.5); margin-bottom: 20px;
  position: relative;
}

.final__side { flex: 1; text-align: center; padding: 12px; }
.final__side-header { margin-bottom: 12px; }
.final__side-emoji { font-size: 2.5rem; display: block; margin-bottom: 4px; }
.final__side-name { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }

.final__side-stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 12px; }
.final__stat { text-align: center; }
.final__stat-label { display: block; font-size: 0.65rem; color: var(--ink-light); }
.final__stat-value { font-family: var(--font-display); font-size: 1.4rem; color: var(--ink-dark); }

.final__hp-bar { height: 20px; background: rgba(26,26,26,0.06); border-radius: 10px; overflow: hidden; position: relative; }
.final__hp-fill { height: 100%; background: linear-gradient(90deg, var(--verdant), #5a9e8a); border-radius: 10px; transition: width 0.5s ease; }
.final__hp-fill--boss { background: linear-gradient(90deg, var(--cinnabar), #d45a4a); }
.final__hp-fill--low { background: var(--cinnabar); }
.final__hp-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--paper); mix-blend-mode: difference; }

.final__vs { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px; }
.final__vs-text { font-family: var(--font-display); font-size: 1.5rem; color: var(--cinnabar); letter-spacing: 0.1em; }
.final__vs-line { width: 1px; flex: 1; background: var(--ink-pale); margin-top: 8px; }

.final__battle-canvas { width: 100%; height: 60px; margin-bottom: 16px; pointer-events: none; }

.final__prediction { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 12px 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); }
.final__prediction-label { font-size: 0.75rem; color: var(--ink-light); white-space: nowrap; }
.final__prediction-bar { flex: 1; height: 8px; background: rgba(26,26,26,0.06); border-radius: 4px; overflow: hidden; }
.final__prediction-fill { height: 100%; background: linear-gradient(90deg, var(--cinnabar), var(--gold)); border-radius: 4px; transition: width 0.5s ease; }
.final__prediction-value { font-size: 0.9rem; color: var(--cinnabar); }

.final__actions { margin-bottom: 20px; }
.final__hint { font-size: 0.75rem; color: var(--ink-light); margin-top: 8px; }

.final__battle-log { margin-bottom: 20px; padding: 16px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4); text-align: left; max-height: 200px; overflow-y: auto; }
.final__log-entry { padding: 4px 0; }
.final__log-text { font-size: 0.8rem; color: var(--ink-dark); font-family: var(--font-mono); }

.final__result { margin-bottom: 20px; }
.final__result-seal { display: inline-block; padding: 20px 32px; border: 3px solid var(--gold); margin-bottom: 16px; transform: rotate(-2deg); }
.final__result-seal-icon { font-size: 2.5rem; display: block; margin-bottom: 4px; }
.final__result-seal-text { font-family: var(--font-display); font-size: 1.5rem; color: var(--gold); letter-spacing: 0.2em; }

.final__result-title { font-family: var(--font-display); font-size: 1.3rem; letter-spacing: 0.1em; margin-bottom: 8px; }
.final__result-desc { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 12px; }
.final__victory .final__result-title { color: var(--verdant); }
.final__defeat .final__result-title { color: var(--cinnabar); }

.final__bonus { padding: 12px; border: 1px solid var(--gold); background: rgba(201,168,76,0.06); margin-bottom: 16px; display: flex; align-items: center; gap: 12px; justify-content: center; }
.final__bonus-badge { font-family: var(--font-display); font-size: 0.9rem; color: var(--gold); letter-spacing: 0.1em; }
.final__bonus-text { font-size: 0.8rem; color: var(--ink-medium); }

.final__result-actions { display: flex; gap: 12px; justify-content: center; }

.final__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; margin-top: 20px; }
.final__insight strong { color: var(--cinnabar); }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.4s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
