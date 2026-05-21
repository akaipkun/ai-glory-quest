<template>
  <div class="battle-5v5">
    <!-- AI 原理浮窗 -->
    <AiPrincipleTip
      :show="showPrincipleTip"
      title="多智能体协作 · 团战的艺术"
      subtitle="强化学习与多智能体系统中的策略优化"
      :principle="'多智能体系统（Multi-Agent System）研究多个AI智能体如何在共享环境中协作或竞争。与单智能体不同，多智能体环境是非平稳的——每个智能体的策略变化都会改变其他智能体的环境。这带来了独特的挑战：信用分配（团队成功归功于谁）、通信（智能体间如何交换信息）、协调（如何避免冲突达成统一目标）。强化学习中的Multi-Agent RL（MARL）通过集中训练+分散执行（CTDE）等范式处理这些问题。5v5团战是MARL的经典场景——需要平衡个体战力（进攻倾向）、团队配合（协作程度）和战术选择（技能优先级）。AlphaStar（星际争霸AI）和OpenAI Five（Dota 2 AI）都是多智能体强化学习的里程碑成就。'"
      :gameMapping="'在5v5团战中，你的5人小队将与系统AI队伍展开对决。三个策略参数对应MARL的核心优化维度：进攻倾向（个体奖励权重 vs 团队奖励权重）、协作程度（信息共享度——高协作意味着智能体共享更多状态信息）、技能优先级（探索 vs 利用——优先使用已知技能还是尝试新战术）。每场对战的胜负取决于双方的策略组合——调整参数找到最优策略，在5局中赢得至少3局即可通关。战斗中的图标互相攻击、生命条变化、击中特效——都是对MARL训练过程的视觉化呈现。'"
      :tips="['多智能体系统的核心挑战：非平稳环境——其他智能体也在学习，你的最优策略可能是动态变化的', '集中训练+分散执行（CTDE）是MARL最常用的范式：训练时能看到全局信息，执行时只靠本地观测', '团队协作的数学本质是联合动作空间——5个智能体各有N种动作，组合起来是N^5的复杂度', 'OpenAI Five在Dota 2中击败世界冠军，展示了MARL在复杂策略游戏中的潜力']"
      vizType="network"
      @close="showPrincipleTip = false"
    />
    <div class="b5__container">
      <h2 class="b5__title fade-in">⚔️ 巅峰对决 · 5v5团战模拟</h2>
      <p class="b5__subtitle body-text fade-in delay-1">最终决战——你训练的团队 vs 系统AI队伍</p>

      <div class="b5__demo fade-in delay-2">
        <!-- Battlefield -->
        <div class="b5__battlefield">
          <canvas ref="battleCanvas" class="b5__canvas"></canvas>
        </div>

        <!-- Strategy Controls -->
        <div class="b5__controls" v-if="!battleInProgress && !battleDone">
          <div class="b5__param-group">
            <label class="b5__param-label">进攻倾向: <span class="mono-text">{{ aggression }}</span></label>
            <input type="range" class="b5__slider" min="1" max="10" v-model.number="aggression" />
            <div class="b5__param-marks"><span>防守</span><span>均衡</span><span>激进</span></div>
          </div>
          <div class="b5__param-group">
            <label class="b5__param-label">协作程度: <span class="mono-text">{{ cooperation }}</span></label>
            <input type="range" class="b5__slider" min="1" max="10" v-model.number="cooperation" />
            <div class="b5__param-marks"><span>个人秀</span><span>均衡</span><span>团队</span></div>
          </div>
          <div class="b5__param-group">
            <label class="b5__param-label">技能优先级: <span class="mono-text">{{ skillPriority }}</span></label>
            <input type="range" class="b5__slider" min="0" max="2" step="1" v-model.number="skillPriority" />
            <div class="b5__param-marks"><span>普攻</span><span>均衡</span><span>技能</span></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="b5__actions" v-if="!battleInProgress && !battleDone">
          <button class="ink-btn ink-btn--gold" @click="startBattle">
            ⚔️ 开始团战（第 {{ wins + losses + 1 }} 局）
          </button>
        </div>

        <!-- Battle Progress -->
        <transition name="ink-fade">
          <div v-if="battleInProgress" class="b5__progress fade-in">
            <div class="b5__progress-bar">
              <div class="b5__progress-fill" :style="{ width: battleProgress + '%' }"></div>
            </div>
            <span class="mono-text">{{ battleStatus }}</span>
          </div>
        </transition>

        <!-- Battle Result -->
        <transition name="ink-fade">
          <div v-if="battleDone" class="b5__result fade-in">
            <div class="b5__result-title" :class="lastWin ? 'b5__result-title--win' : 'b5__result-title--lose'">
              {{ lastWin ? '🎉 胜利！' : '😤 败北！' }}
            </div>
            <div class="b5__result-stats">
              <div class="b5__result-stat">
                <span class="b5__result-stat-label">总战绩</span>
                <span class="b5__result-stat-value">{{ wins }}胜 {{ losses }}负</span>
              </div>
              <div class="b5__result-stat">
                <span class="b5__result-stat-label">胜率</span>
                <span class="b5__result-stat-value">{{ Math.round((wins / (wins + losses)) * 100) }}%</span>
              </div>
              <div class="b5__result-stat">
                <span class="b5__result-stat-label">回合数</span>
                <span class="b5__result-stat-value">{{ lastDuration }} 回合</span>
              </div>
            </div>

            <div class="b5__result-actions">
              <button v-if="wins + losses < 5" class="ink-btn" @click="resetBattle">
                下一局
              </button>
              <button v-if="wins + losses >= 5" class="ink-btn ink-btn--gold" @click="finish">
                {{ wins >= 3 ? '🎉 通关完成 →' : '接受结果' }}
              </button>
              <button v-if="battleDone" class="ink-btn" @click="resetAll">
                重新开始
              </button>
            </div>

            <div v-if="wins + losses >= 5" class="b5__result-summary">
              <div v-if="wins >= 3" class="b5__result-pass">
                ✅ 5局中赢得 {{ wins }} 局——你的团队技高一筹！
              </div>
              <div v-else class="b5__result-fail">
                ❌ 5局中只赢得 {{ wins }} 局——调整策略后再试
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div class="b5__insight body-text fade-in">
        💡 5v5团战是多智能体协作的终极考验。<strong>进攻与防守的平衡</strong>、<strong>个人能力与团队配合</strong>、
        <strong>技能释放时机</strong>——这些在强化学习中都是需要优化的策略参数。
        顶尖的AI团队能在毫秒级做出最优决策。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AiPrincipleTip from '../ink/AiPrincipleTip.vue'

const emit = defineEmits(['complete'])

const showPrincipleTip = ref(true)
const battleCanvas = ref(null)
const aggression = ref(5)
const cooperation = ref(5)
const skillPriority = ref(1)
const battleInProgress = ref(false)
const battleDone = ref(false)
const battleProgress = ref(0)
const battleStatus = ref('')
const lastWin = ref(false)
const lastDuration = ref(0)
const wins = ref(0)
const losses = ref(0)
let animId = null
let battleTimer = null

// Team state for rendering
const playerTeam = ref([])
const enemyTeam = ref([])

// Battle visual effects
const projectiles = ref([])
const hitEffects = ref([])
const attackCooldowns = ref([])

const heroes = [
  { emoji: '🛡️', name: '坦克', hp: 100, attackIcon: '🛡️' },
  { emoji: '🗡️', name: '刺客', hp: 70, attackIcon: '⚔️' },
  { emoji: '🔮', name: '法师', hp: 60, attackIcon: '💥' },
  { emoji: '🏹', name: '射手', hp: 65, attackIcon: '🏹' },
  { emoji: '💚', name: '辅助', hp: 80, attackIcon: '✨' }
]

const enemyHeroes = [
  { emoji: '👹', name: 'Boss坦', hp: 110, attackIcon: '👊' },
  { emoji: '👺', name: 'Boss刺', hp: 75, attackIcon: '🔪' },
  { emoji: '👿', name: 'Boss法', hp: 65, attackIcon: '🔥' },
  { emoji: '💀', name: 'Boss射', hp: 70, attackIcon: '💀' },
  { emoji: '👻', name: 'Boss辅', hp: 85, attackIcon: '🌫️' }
]

function startBattle() {
  battleInProgress.value = true
  battleDone.value = false
  battleProgress.value = 0

  // Initialize team state
  playerTeam.value = heroes.map(h => ({ ...h, currentHp: h.hp, maxHp: h.hp, attacking: false, hitFlash: 0 }))
  enemyTeam.value = enemyHeroes.map(h => ({ ...h, currentHp: h.hp, maxHp: h.hp, attacking: false, hitFlash: 0 }))
  projectiles.value = []
  hitEffects.value = []
  attackCooldowns.value = []

  let progress = 0
  let duration = 0
  let tick = 0

  battleTimer = setInterval(() => {
    tick++
    progress += 5 + Math.random() * 10
    duration++

    if (progress >= 100) {
      clearInterval(battleTimer)
      battleTimer = null
      battleProgress.value = 100
      finishBattle(duration)
      return
    }

    battleProgress.value = Math.min(progress, 100)

    // Spawn attack projectiles every few ticks
    if (tick % 2 === 0) {
      spawnPlayerAttack()
    }
    if (tick % 3 === 0) {
      spawnEnemyAttack()
    }

    // Update projectiles: move them, apply damage on arrival
    projectiles.value = projectiles.value.filter(p => {
      p.progress += p.speed
      if (p.progress >= 1) {
        // Hit! Apply damage and create hit effect
        const target = p.isPlayerAttack ? enemyTeam.value[p.targetIdx] : playerTeam.value[p.targetIdx]
        if (target && target.currentHp > 0) {
          target.currentHp = Math.max(0, target.currentHp - p.damage)
          target.hitFlash = 8
          hitEffects.value.push({
            x: p.isPlayerAttack ? 0.65 : 0.35,
            y: p.targetIdx,
            life: 15,
            icon: p.attackIcon
          })
        }
        return false
      }
      return true
    })

    // Decay hit flashes
    playerTeam.value.forEach(p => { if (p.hitFlash > 0) p.hitFlash-- })
    enemyTeam.value.forEach(e => { if (e.hitFlash > 0) e.hitFlash-- })

    // Decay hit effects
    hitEffects.value = hitEffects.value.filter(e => { e.life--; return e.life > 0 })

    // Check if one side is wiped out
    const pAlive = playerTeam.value.filter(p => p.currentHp > 0).length
    const eAlive = enemyTeam.value.filter(e => e.currentHp > 0).length

    if (pAlive === 0 || eAlive === 0) {
      clearInterval(battleTimer)
      battleTimer = null
      battleProgress.value = 100
      finishBattle(duration)
      return
    }

    // Update status
    const statuses = [
      `⚔️ 激战中... 己方 ${pAlive}人 / 敌方 ${eAlive}人`,
      `💥 技能交锋！己方 ${pAlive}人存活`,
      `🔥 团战白热化！双方激烈对抗`,
      `⚡ 己方 ${pAlive} vs 敌方 ${eAlive}`
    ]
    battleStatus.value = statuses[duration % statuses.length]

    // Draw battle
    drawBattlefield()
  }, 200)
}

function spawnPlayerAttack() {
  const aliveAttackers = playerTeam.value.map((p, i) => ({ hero: p, idx: i })).filter(a => a.hero.currentHp > 0)
  const aliveDefenders = enemyTeam.value.map((e, i) => ({ hero: e, idx: i })).filter(d => d.hero.currentHp > 0)

  if (aliveAttackers.length === 0 || aliveDefenders.length === 0) return

  const attacker = aliveAttackers[Math.floor(Math.random() * aliveAttackers.length)]
  const defender = aliveDefenders[Math.floor(Math.random() * aliveDefenders.length)]

  // Mark attacker as attacking
  attacker.hero.attacking = true
  setTimeout(() => { attacker.hero.attacking = false }, 300)

  const baseDmg = 5
  const aggBonus = (aggression.value - 5) * 2
  const coopBonus = cooperation.value > 6 ? 4 : 0
  const damage = baseDmg + aggBonus + coopBonus + Math.floor(Math.random() * 5)

  projectiles.value.push({
    isPlayerAttack: true,
    sourceIdx: attacker.idx,
    targetIdx: defender.idx,
    progress: 0,
    speed: 0.06 + Math.random() * 0.04,
    damage,
    attackIcon: attacker.hero.attackIcon
  })
}

function spawnEnemyAttack() {
  const aliveAttackers = enemyTeam.value.map((e, i) => ({ hero: e, idx: i })).filter(a => a.hero.currentHp > 0)
  const aliveDefenders = playerTeam.value.map((p, i) => ({ hero: p, idx: i })).filter(d => d.hero.currentHp > 0)

  if (aliveAttackers.length === 0 || aliveDefenders.length === 0) return

  const attacker = aliveAttackers[Math.floor(Math.random() * aliveAttackers.length)]
  const defender = aliveDefenders[Math.floor(Math.random() * aliveDefenders.length)]

  attacker.hero.attacking = true
  setTimeout(() => { attacker.hero.attacking = false }, 300)

  const baseDmg = 7
  const diff = (aggression.value + cooperation.value + skillPriority.value * 3) / 3
  const enemyStrength = 6 + (10 - diff) * 0.3
  const damage = Math.floor(baseDmg + enemyStrength + Math.random() * 5)

  projectiles.value.push({
    isPlayerAttack: false,
    sourceIdx: attacker.idx,
    targetIdx: defender.idx,
    progress: 0,
    speed: 0.05 + Math.random() * 0.03,
    damage,
    attackIcon: attacker.hero.attackIcon
  })
}

function finishBattle(duration) {
  const pAlive = playerTeam.value.filter(p => p.currentHp > 0).length
  const eAlive = enemyTeam.value.filter(e => e.currentHp > 0).length

  const playerTotalHp = playerTeam.value.reduce((s, p) => s + p.currentHp, 0)
  const enemyTotalHp = enemyTeam.value.reduce((s, e) => s + e.currentHp, 0)

  const playerScore = pAlive * 20 + playerTotalHp
  const enemyScore = eAlive * 20 + enemyTotalHp

  lastWin.value = playerScore > enemyScore
  lastDuration.value = duration

  if (lastWin.value) wins.value++
  else losses.value++

  battleInProgress.value = false
  battleDone.value = true
  projectiles.value = []
  hitEffects.value = []
  drawBattlefield()

  // Restart idle animation loop
  function animate() {
    drawBattlefield()
    if (!battleInProgress.value) {
      animId = requestAnimationFrame(animate)
    }
  }
  animate()
}

function resetBattle() {
  battleDone.value = false
  battleProgress.value = 0
}

function resetAll() {
  wins.value = 0
  losses.value = 0
  battleDone.value = false
  battleProgress.value = 0
}

function finish() {
  const score = Math.round((wins.value / (wins.value + losses.value)) * 100)
  emit('complete', score)
}

function drawBattlefield() {
  const canvas = battleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const w = canvas.parentElement.offsetWidth || 600
  canvas.width = w * dpr
  canvas.height = 320 * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = '320px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, w, 320)
  ctx.fillStyle = 'var(--paper)'
  ctx.fillRect(0, 0, w, 320)

  // Header area
  ctx.font = '10px "Noto Serif SC"'
  ctx.fillStyle = 'var(--ink-light)'
  ctx.textAlign = 'center'

  // Battlefield center divider with glow
  const lineX = w / 2
  ctx.beginPath()
  ctx.moveTo(lineX, 28)
  ctx.lineTo(lineX, 310)
  ctx.strokeStyle = battleInProgress.value
    ? 'rgba(194, 58, 43, 0.18)'
    : 'rgba(194, 58, 43, 0.06)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 12])
  ctx.stroke()
  ctx.setLineDash([])

  // Center battle glow during combat
  if (battleInProgress.value) {
    const glow = ctx.createRadialGradient(lineX, 170, 0, lineX, 170, 120)
    glow.addColorStop(0, 'rgba(194, 58, 43, 0.04)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(lineX - 120, 50, 240, 240)
  }

  // Labels
  ctx.font = '11px "Noto Serif SC"'
  ctx.fillStyle = 'var(--ink-medium)'
  ctx.fillText('你的队伍', w * 0.22, 14)
  ctx.fillText('系统AI', w * 0.78, 14)

  const team = playerTeam.value.length > 0 ? playerTeam.value : heroes
  const eTeam = enemyTeam.value.length > 0 ? enemyTeam.value : enemyHeroes

  // Draw player team (left side)
  team.forEach((hero, i) => {
    const baseX = w * 0.18
    const y = 44 + i * 53
    const alive = hero.currentHp === undefined || hero.currentHp > 0

    // Hero base glow when attacking
    if (hero.attacking) {
      const aGlow = ctx.createRadialGradient(baseX, y, 0, baseX, y, 28)
      aGlow.addColorStop(0, 'rgba(201, 168, 76, 0.3)')
      aGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = aGlow
      ctx.beginPath()
      ctx.arc(baseX, y, 28, 0, Math.PI * 2)
      ctx.fill()
    }

    // Hit flash effect
    if (hero.hitFlash > 0) {
      ctx.fillStyle = `rgba(194, 58, 43, ${hero.hitFlash * 0.05})`
      ctx.beginPath()
      ctx.arc(baseX, y, 24, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!alive) ctx.globalAlpha = 0.25

    // Hero emoji
    ctx.font = '26px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(hero.emoji, baseX, y)

    // HP bar
    if (hero.currentHp !== undefined) {
      const hpW = 44
      const hpX = baseX - hpW / 2
      const hpY = y + 16
      ctx.fillStyle = 'rgba(26, 26, 26, 0.08)'
      ctx.fillRect(hpX, hpY, hpW, 5)
      const hpPct = hero.currentHp / hero.maxHp
      const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0)
      if (hpPct > 0.5) {
        hpGrad.addColorStop(0, 'var(--verdant)')
        hpGrad.addColorStop(1, '#5a9e8a')
      } else if (hpPct > 0.2) {
        hpGrad.addColorStop(0, 'var(--gold)')
        hpGrad.addColorStop(1, '#d4b85a')
      } else {
        hpGrad.addColorStop(0, 'var(--cinnabar)')
        hpGrad.addColorStop(1, '#d45a4a')
      }
      ctx.fillStyle = hpGrad
      ctx.fillRect(hpX, hpY, hpW * Math.max(0, hpPct), 5)

      // HP text
      ctx.font = '7px "JetBrains Mono"'
      ctx.fillStyle = 'var(--ink-light)'
      ctx.fillText(Math.round(hero.currentHp), baseX, y + 24)
    }

    // Death marker
    if (!alive) {
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'var(--cinnabar)'
      ctx.fillText('💀', baseX, y - 10)
    }

    ctx.globalAlpha = 1
  })

  // Draw enemy team (right side)
  eTeam.forEach((hero, i) => {
    const baseX = w * 0.82
    const y = 44 + i * 53
    const alive = hero.currentHp === undefined || hero.currentHp > 0

    if (hero.attacking) {
      const aGlow = ctx.createRadialGradient(baseX, y, 0, baseX, y, 28)
      aGlow.addColorStop(0, 'rgba(194, 58, 43, 0.3)')
      aGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = aGlow
      ctx.beginPath()
      ctx.arc(baseX, y, 28, 0, Math.PI * 2)
      ctx.fill()
    }

    if (hero.hitFlash > 0) {
      ctx.fillStyle = `rgba(74, 124, 111, ${hero.hitFlash * 0.05})`
      ctx.beginPath()
      ctx.arc(baseX, y, 24, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!alive) ctx.globalAlpha = 0.25

    ctx.font = '26px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(hero.emoji, baseX, y)

    if (hero.currentHp !== undefined) {
      const hpW = 44
      const hpX = baseX - hpW / 2
      const hpY = y + 16
      ctx.fillStyle = 'rgba(26, 26, 26, 0.08)'
      ctx.fillRect(hpX, hpY, hpW, 5)
      const hpPct = hero.currentHp / hero.maxHp
      const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0)
      if (hpPct > 0.5) {
        hpGrad.addColorStop(0, '#8b3a3a')
        hpGrad.addColorStop(1, 'var(--cinnabar)')
      } else if (hpPct > 0.2) {
        hpGrad.addColorStop(0, 'var(--cinnabar)')
        hpGrad.addColorStop(1, '#d45a4a')
      } else {
        hpGrad.addColorStop(0, '#a03030')
        hpGrad.addColorStop(1, '#c03030')
      }
      ctx.fillStyle = hpGrad
      ctx.fillRect(hpX, hpY, hpW * Math.max(0, hpPct), 5)

      ctx.font = '7px "JetBrains Mono"'
      ctx.fillStyle = 'var(--ink-light)'
      ctx.fillText(Math.round(hero.currentHp), baseX, y + 24)
    }

    if (!alive) {
      ctx.font = '14px sans-serif'
      ctx.fillStyle = 'var(--verdant)'
      ctx.fillText('💀', baseX, y - 10)
    }

    ctx.globalAlpha = 1
  })

  // Draw projectiles
  projectiles.value.forEach(p => {
    const srcTeam = p.isPlayerAttack ? team : eTeam
    const tgtTeam = p.isPlayerAttack ? eTeam : team
    const srcX = p.isPlayerAttack ? w * 0.18 : w * 0.82
    const tgtX = p.isPlayerAttack ? w * 0.82 : w * 0.18
    const srcY = 44 + p.sourceIdx * 53
    const tgtY = 44 + p.targetIdx * 53

    const px = srcX + (tgtX - srcX) * p.progress
    const py = srcY + (tgtY - srcY) * p.progress

    // Projectile trail
    const trailLen = 0.08
    const trailStart = Math.max(0, p.progress - trailLen)
    const trailX = srcX + (tgtX - srcX) * trailStart
    const trailY = srcY + (tgtY - srcY) * trailStart

    ctx.beginPath()
    ctx.moveTo(trailX, trailY)
    ctx.lineTo(px, py)
    ctx.strokeStyle = p.isPlayerAttack
      ? 'rgba(201, 168, 76, 0.5)'
      : 'rgba(194, 58, 43, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Projectile icon
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.attackIcon, px, py)
  })

  // Draw hit effects
  hitEffects.value.forEach(e => {
    const x = w * e.x
    const y = 44 + e.y * 53
    const alpha = e.life / 15

    // Expanding ring
    ctx.beginPath()
    ctx.arc(x, y, (15 - e.life) * 2.5, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(201, 168, 76, ${alpha * 0.6})`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Hit icon
    ctx.font = `${12 + (15 - e.life)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = alpha
    ctx.fillText(e.icon, x, y)
    ctx.globalAlpha = 1
  })

  // Battle particle effects in center
  if (battleInProgress.value) {
    const time = Date.now() * 0.001
    for (let i = 0; i < 8; i++) {
      const px = w * (0.4 + Math.sin(time * 2 + i * 0.8) * 0.1)
      const py = 60 + ((i * 37 + time * 50) % 220)
      ctx.beginPath()
      ctx.arc(px, py, 1.5 + Math.sin(time * 3 + i) * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = i % 2 === 0
        ? `rgba(201, 168, 76, ${0.15 + Math.sin(time + i) * 0.08})`
        : `rgba(194, 58, 43, ${0.12 + Math.cos(time + i) * 0.06})`
      ctx.fill()
    }
  }
}

onMounted(() => {
  function animate() {
    drawBattlefield()
    if (!battleInProgress.value) {
      animId = requestAnimationFrame(animate)
    }
  }
  animId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (battleTimer) clearInterval(battleTimer)
})
</script>

<style scoped>
.battle-5v5 { min-height: 80vh; padding: 40px 24px; }
.b5__container { max-width: 700px; margin: 0 auto; text-align: center; }
.b5__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.b5__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; }

.b5__demo { padding: 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 20px; }

.b5__battlefield { margin-bottom: 16px; }
.b5__canvas { display: block; width: 100%; height: 320px; }

.b5__controls { margin-bottom: 16px; }
.b5__param-group { margin-bottom: 12px; }
.b5__param-label { font-family: var(--font-body); font-size: 0.82rem; display: block; margin-bottom: 4px; }
.b5__param-label .mono-text { color: var(--cinnabar); }
.b5__slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: var(--ink-pale); border-radius: 2px; outline: none; }
.b5__slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--cinnabar); cursor: pointer; border: 2px solid var(--paper); }
.b5__param-marks { display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--ink-light); margin-top: 2px; }

.b5__actions { margin-bottom: 16px; }

.b5__progress { margin-bottom: 16px; }
.b5__progress-bar { height: 6px; background: rgba(26,26,26,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.b5__progress-fill { height: 100%; background: var(--cinnabar); border-radius: 3px; transition: width 0.3s ease; }
.b5__progress .mono-text { font-size: 0.75rem; color: var(--ink-light); }

.b5__result { margin-bottom: 16px; }
.b5__result-title { font-family: var(--font-display); font-size: 1.5rem; letter-spacing: 0.1em; margin-bottom: 12px; }
.b5__result-title--win { color: var(--verdant); }
.b5__result-title--lose { color: var(--cinnabar); }

.b5__result-stats { display: flex; gap: 20px; justify-content: center; margin-bottom: 16px; }
.b5__result-stat { text-align: center; }
.b5__result-stat-label { display: block; font-size: 0.65rem; color: var(--ink-light); }
.b5__result-stat-value { font-family: var(--font-display); font-size: 1.1rem; color: var(--ink-dark); }

.b5__result-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 12px; }
.b5__result-summary { font-size: 0.85rem; }
.b5__result-pass { color: var(--verdant); }
.b5__result-fail { color: var(--cinnabar); }

.b5__insight { font-size: 0.8rem; color: var(--ink-medium); line-height: 1.8; padding: 16px; border-left: 3px solid var(--gold); background: rgba(201,168,76,0.04); text-align: left; }
.b5__insight strong { color: var(--cinnabar); }
</style>
