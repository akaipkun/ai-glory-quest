<template>
  <div class="identifier">
    <div class="id__container">
      <h2 class="id__title fade-in">🎭 辨妖 · 找出不同类</h2>
      <p class="id__subtitle body-text fade-in delay-1">每轮展示几张图片，选出与其他不同类的一张</p>

      <div class="id__round fade-in delay-2">
        <span class="id__round-label mono-text">第 {{ round }} / {{ totalRounds }} 轮</span>
        <span class="id__difficulty">难度: {{ difficulties[Math.min(Math.floor((round - 1) / 3), 3)] }}</span>
      </div>

      <div class="id__cards fade-in delay-2">
        <div v-for="(card, i) in currentCards" :key="i" class="id__card"
          :class="{ 'id__card--selected': selected === i, 'id__card--correct': feedback && card.isTarget && selected === i, 'id__card--wrong': feedback && !card.isTarget && selected === i }"
          @click="pickCard(i)" :disabled="feedback">
          <span class="id__card-emoji">{{ card.emoji }}</span>
          <span class="id__card-label">{{ card.label }}</span>
          <div v-if="feedback && card.isTarget" class="id__card-mark">✅ 目标</div>
        </div>
      </div>

      <transition name="ink-fade">
        <div v-if="feedback" class="id__feedback fade-in">
          <div v-if="correct" class="id__correct">
            <span>✅ 正确！</span>
            <p class="body-text">{{ feedbackMsg }}</p>
          </div>
          <div v-else class="id__wrong">
            <span>❌ 正确答案是 "{{ currentCards.find(c => c.isTarget)?.label }}"</span>
            <p class="body-text">{{ feedbackMsg }}</p>
          </div>
        </div>
      </transition>

      <div class="id__actions fade-in" v-if="feedback">
        <button v-if="round < totalRounds" class="ink-btn" @click="nextRound">下一轮</button>
        <button v-else class="ink-btn ink-btn--gold" @click="finish">完成挑战 →</button>
      </div>

      <div class="id__score fade-in">
        <span class="mono-text">正确: {{ correctCount }}/{{ totalRounds }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
const emit = defineEmits(['complete'])
const difficulties = ['简单', '中等', '较难', '挑战']

const allRounds = [
  { cards: [{ emoji: '🐯', label: '老虎' }, { emoji: '🐯', label: '老虎' }, { emoji: '🌳', label: '树林' }] },
  { cards: [{ emoji: '🐵', label: '猴子' }, { emoji: '🐵', label: '猴子' }, { emoji: '🐟', label: '鱼' }] },
  { cards: [{ emoji: '🌸', label: '花' }, { emoji: '🌲', label: '树' }, { emoji: '🌸', label: '花' }] },
  { cards: [{ emoji: '🐕', label: '狗' }, { emoji: '🐈', label: '猫' }, { emoji: '🐕', label: '狗' }, { emoji: '🐕', label: '狗' }] },
  { cards: [{ emoji: '🦅', label: '鹰' }, { emoji: '🐦', label: '麻雀' }, { emoji: '🦅', label: '鹰' }, { emoji: '🦅', label: '鹰' }] },
  { cards: [{ emoji: '🌺', label: '芙蓉' }, { emoji: '🌺', label: '芙蓉' }, { emoji: '🌻', label: '向日葵' }, { emoji: '🌺', label: '芙蓉' }] },
  { cards: [{ emoji: '🎨', label: '水墨画' }, { emoji: '🎨', label: '水墨画' }, { emoji: '📸', label: '照片' }, { emoji: '🎨', label: '水墨画' }] },
  { cards: [{ emoji: '🖋️', label: '书法' }, { emoji: '🖋️', label: '书法' }, { emoji: '🎨', label: '油画' }, { emoji: '🖋️', label: '书法' }, { emoji: '🖋️', label: '书法' }] },
  { cards: [{ emoji: '🏠', label: '中式建筑' }, { emoji: '🏛️', label: '西式建筑' }, { emoji: '🏠', label: '中式建筑' }, { emoji: '🏠', label: '中式建筑' }] },
  { cards: [{ emoji: '🦋', label: '蝴蝶' }, { emoji: '🦋', label: '蝴蝶' }, { emoji: '🐝', label: '蜜蜂' }, { emoji: '🦋', label: '蝴蝶' }, { emoji: '🐞', label: '瓢虫' }] }
]

const round = ref(1)
const selected = ref(null)
const feedback = ref(false)
const correct = ref(false)
const correctCount = ref(0)
const totalRounds = allRounds.length

const currentCards = computed(() => {
  const cards = allRounds[round.value - 1].cards.map((c, i) => ({
    ...c, isTarget: i === findTargetIndex(round.value - 1)
  }))
  return shuffle([...cards])
})

function findTargetIndex(roundIdx) {
  const groups = {}
  allRounds[roundIdx].cards.forEach((c, i) => {
    if (!groups[c.emoji]) groups[c.emoji] = []
    groups[c.emoji].push(i)
  })
  for (const key in groups) {
    if (groups[key].length === 1) return groups[key][0]
  }
  return 0
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const feedbackMsg = computed(() => {
  const msgs = [
    '神经网络通过提取特征来区分不同类别 —— 就像你找出了不一样的那一个',
    '分类是AI最基础的能力之一，从垃圾邮件过滤到医学影像诊断都在使用',
    '越相似的类别越难区分 —— 这就是为什么AI需要大量训练数据'
  ]
  return msgs[Math.floor(Math.random() * msgs.length)]
})

function pickCard(index) {
  if (feedback.value) return
  selected.value = index
  feedback.value = true
  correct.value = currentCards.value[index].isTarget
  if (correct.value) correctCount.value++
}

function nextRound() {
  round.value++
  selected.value = null
  feedback.value = false
}

function finish() {
  emit('complete', Math.round((correctCount.value / totalRounds) * 100))
}
</script>

<style scoped>
.identifier { min-height: 80vh; padding: 40px 24px; }
.id__container { max-width: 700px; margin: 0 auto; text-align: center; }
.id__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; }
.id__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 24px; }
.id__round { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.85rem; }
.id__round-label { color: var(--ink-light); }
.id__difficulty { color: var(--cinnabar); font-family: var(--font-body); }
.id__cards { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
.id__card { width: 120px; padding: 20px 12px; border: 2px solid var(--ink-pale); cursor: pointer; transition: all 0.3s ease; text-align: center; background: rgba(245,240,232,0.5); position: relative; }
.id__card:hover { border-color: var(--ink-medium); transform: translateY(-4px); }
.id__card--selected { border-color: var(--cinnabar); }
.id__card--correct { border-color: var(--verdant); background: rgba(74,124,111,0.08); }
.id__card--wrong { border-color: var(--cinnabar); background: rgba(194,58,43,0.06); }
.id__card-emoji { font-size: 2.5rem; display: block; margin-bottom: 8px; }
.id__card-label { font-family: var(--font-body); font-size: 0.8rem; }
.id__card-mark { position: absolute; top: -10px; right: -10px; font-size: 1.2rem; }
.id__feedback { margin-bottom: 20px; padding: 16px; border: 1px solid var(--ink-pale); font-family: var(--font-display); font-size: 1rem; }
.id__correct { color: var(--verdant); }
.id__correct .body-text { color: var(--ink-medium); font-size: 0.8rem; margin-top: 8px; }
.id__wrong { color: var(--cinnabar); }
.id__wrong .body-text { color: var(--ink-medium); font-size: 0.8rem; margin-top: 8px; }
.id__score { margin-top: 16px; }
.id__score .mono-text { font-size: 0.9rem; color: var(--ink-light); }
.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.4s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
