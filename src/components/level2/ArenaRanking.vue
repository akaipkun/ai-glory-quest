<template>
  <div class="arena">
    <div class="arena__container">
      <h2 class="arena__title fade-in">峡谷排位赛</h2>
      <p class="arena__subtitle body-text fade-in delay-1">
        将你的模型送上擂台，与其他英雄一较高下
      </p>

      <!-- 擂台 -->
      <div class="arena__battle fade-in delay-2">
        <div class="arena__fighter arena__fighter--player">
          <div class="arena__fighter-icon">{{ playerHero }}</div>
          <div class="arena__fighter-name">你的模型</div>
          <div class="arena__fighter-accuracy mono-text">
            {{ playerAccuracy.toFixed(1) }}%
          </div>
        </div>

        <div class="arena__vs">
          <span class="arena__vs-text">VS</span>
          <div class="arena__vs-line"></div>
        </div>

        <div class="arena__fighter arena__fighter--opponent">
          <div class="arena__fighter-icon">{{ opponentHero }}</div>
          <div class="arena__fighter-name">{{ opponentName }}</div>
          <div class="arena__fighter-accuracy mono-text">
            {{ opponentAccuracy.toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- 战斗按钮 -->
      <div class="arena__actions fade-in delay-3">
        <button
          class="ink-btn"
          @click="startBattle"
          :disabled="isBattling"
        >
          {{ isBattling ? '⚔️ 对决中...' : '发起挑战' }}
        </button>
        <button
          class="ink-btn"
          @click="nextOpponent"
          :disabled="isBattling"
        >
          换一个对手
        </button>
      </div>

      <!-- 战斗结果 -->
      <transition name="ink-fade">
        <div v-if="battleResult !== null" class="arena__battle-result">
          <div v-if="battleResult === 'win'" class="arena__win">
            <span class="ink-animate-splash">🏆</span>
            <span>胜利！你的模型更强！</span>
          </div>
          <div v-else class="arena__lose">
            <span>💪 还需修炼，差距 {{ (opponentAccuracy - playerAccuracy).toFixed(1) }}%</span>
          </div>
        </div>
      </transition>

      <!-- 排行榜 -->
      <div class="arena__ranking fade-in delay-3">
        <h3 class="arena__ranking-title">🏮 英雄排行榜</h3>
        <div class="arena__ranking-list">
          <div
            v-for="(entry, i) in rankings"
            :key="i"
            class="arena__rank"
            :class="{
              'arena__rank--player': entry.isPlayer,
              'arena__rank--top3': i < 3
            }"
          >
            <span class="arena__rank-num mono-text">
              {{ getRankBadge(i) }}
            </span>
            <span class="arena__rank-icon">{{ entry.icon }}</span>
            <span class="arena__rank-name">{{ entry.name }}</span>
            <span class="arena__rank-tier">{{ entry.tier }}</span>
            <span class="arena__rank-accuracy mono-text">{{ entry.accuracy.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 通关 -->
      <div v-if="playerRank <= 5" class="arena__complete fade-in">
        <div class="arena__complete-icon ink-animate-splash">👑</div>
        <p class="arena__complete-text">排位前五！通关条件达成</p>
        <button class="ink-btn ink-btn--gold" @click="$emit('complete', Math.round(playerAccuracy))">
          完成闯关 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['complete'])

const playerAccuracy = ref(70)
const playerHero = ref('🗡️')
const isBattling = ref(false)
const battleResult = ref(null)
const wonBattles = ref(0)

const opponents = [
  { name: '韩信', icon: '⚔️', baseAccuracy: 80 },
  { name: '诸葛亮', icon: '🔮', baseAccuracy: 85 },
  { name: '貂蝉', icon: '🌸', baseAccuracy: 82 },
  { name: '吕布', icon: '🗡️', baseAccuracy: 90 },
  { name: '赵云', icon: '🐉', baseAccuracy: 88 },
  { name: '花木兰', icon: '⚔️', baseAccuracy: 86 }
]

const currentOpponent = ref(0)

const opponentName = computed(() => opponents[currentOpponent.value].name)
const opponentHero = computed(() => opponents[currentOpponent.value].icon)
const opponentAccuracy = computed(() => {
  // 根据玩家准确率动态调整对手
  const base = opponents[currentOpponent.value].baseAccuracy
  return base + (Math.random() - 0.5) * 6
})

// 排行榜数据
const rankings = computed(() => {
  const list = [
    { name: '最强王者', icon: '👑', tier: '最强王者', accuracy: 97, isPlayer: false },
    { name: '至尊星曜', icon: '🌟', tier: '至尊星曜', accuracy: 94, isPlayer: false },
    ...opponents.map((o, i) => ({
      name: o.name,
      icon: o.icon,
      tier: getTier(o.baseAccuracy),
      accuracy: o.baseAccuracy,
      isPlayer: false
    })),
    { name: '你的模型', icon: playerHero.value, tier: getTier(playerAccuracy.value), accuracy: playerAccuracy.value, isPlayer: true }
  ]

  list.sort((a, b) => b.accuracy - a.accuracy)
  return list.slice(0, 10)
})

const playerRank = computed(() => {
  const idx = rankings.value.findIndex(r => r.isPlayer)
  return idx + 1
})

function getTier(accuracy) {
  if (accuracy >= 95) return '最强王者'
  if (accuracy >= 90) return '至尊星曜'
  if (accuracy >= 85) return '永恒钻石'
  if (accuracy >= 80) return '尊贵铂金'
  if (accuracy >= 70) return '荣耀黄金'
  return '倔强青铜'
}

function getRankBadge(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

function startBattle() {
  if (isBattling.value) return
  isBattling.value = true
  battleResult.value = null

  setTimeout(() => {
    const win = playerAccuracy.value > opponentAccuracy.value
    battleResult.value = win ? 'win' : 'lose'
    if (win) wonBattles.value++
    isBattling.value = false
  }, 1500)
}

function nextOpponent() {
  currentOpponent.value = (currentOpponent.value + 1) % opponents.length
  battleResult.value = null
}

// 接收外部设置准确率
function setAccuracy(val) {
  playerAccuracy.value = val
}

defineExpose({ setAccuracy })
</script>

<style scoped>
.arena {
  min-height: 80vh;
  padding: 40px 24px;
}

.arena__container {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
}

.arena__title {
  font-size: 2rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
}

.arena__subtitle {
  font-size: 0.9rem;
  color: var(--ink-medium);
  margin-bottom: 40px;
}

/* 擂台 */
.arena__battle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.arena__fighter {
  padding: 24px 32px;
  border: 1px solid var(--ink-pale);
  min-width: 160px;
  background: rgba(245, 240, 232, 0.6);
}

.arena__fighter--player {
  border-color: var(--verdant);
  background: rgba(74, 124, 111, 0.04);
}

.arena__fighter--opponent {
  border-color: var(--cinnabar);
  background: rgba(194, 58, 43, 0.04);
}

.arena__fighter-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.arena__fighter-name {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.arena__fighter-accuracy {
  font-size: 1.2rem;
  color: var(--cinnabar);
}

.arena__vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.arena__vs-text {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink-light);
  letter-spacing: 0.2em;
}

.arena__vs-line {
  width: 1px;
  height: 30px;
  background: var(--ink-pale);
}

.arena__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.arena__actions .ink-btn {
  font-size: 0.85rem;
  padding: 10px 24px;
}

.arena__actions .ink-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 战斗结果 */
.arena__battle-result {
  margin-bottom: 32px;
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
}

.arena__win span:first-child {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.arena__win {
  color: var(--verdant);
}

.arena__lose {
  color: var(--ink-medium);
}

/* 排行榜 */
.arena__ranking {
  border: 1px solid var(--ink-pale);
  padding: 24px;
  background: rgba(245, 240, 232, 0.6);
}

.arena__ranking-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 0.2em;
  margin-bottom: 20px;
  text-align: center;
}

.arena__ranking-list {
  display: flex;
  flex-direction: column;
}

.arena__rank {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(192, 192, 192, 0.3);
  font-size: 0.85rem;
  transition: background 0.3s ease;
}

.arena__rank:last-child {
  border-bottom: none;
}

.arena__rank--player {
  background: rgba(74, 124, 111, 0.08);
  border-left: 3px solid var(--verdant);
}

.arena__rank--top3 {
  font-weight: 600;
}

.arena__rank-num {
  width: 30px;
  font-size: 0.9rem;
}

.arena__rank-icon {
  width: 24px;
  text-align: center;
}

.arena__rank-name {
  flex: 1;
  text-align: left;
  font-family: var(--font-body);
}

.arena__rank-tier {
  font-size: 0.75rem;
  color: var(--ink-light);
  width: 80px;
  text-align: center;
}

.arena__rank-accuracy {
  width: 60px;
  text-align: right;
  color: var(--ink-medium);
  font-size: 0.8rem;
}

.arena__rank--player .arena__rank-accuracy {
  color: var(--verdant);
  font-weight: 600;
}

/* 通关 */
.arena__complete {
  margin-top: 32px;
  padding: 24px;
}

.arena__complete-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.arena__complete-text {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--verdant);
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

/* 过渡 */
.ink-fade-enter-active,
.ink-fade-leave-active {
  transition: opacity 0.4s ease;
}
.ink-fade-enter-from,
.ink-fade-leave-to {
  opacity: 0;
}
</style>
