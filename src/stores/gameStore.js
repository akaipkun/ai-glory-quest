import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // --- 关卡进度 ---
  const currentLevel = ref(1)
  const levels = ref([
    { id: 1, name: '灵石出世', icon: '🪨', unlocked: true, completed: false, score: 0 },
    { id: 2, name: '峡谷修炼', icon: '🔰', unlocked: false, completed: false, score: 0 },
    { id: 3, name: '火眼金睛', icon: '🔥', unlocked: false, completed: false, score: 0 },
    { id: 4, name: '王者排位', icon: '👑', unlocked: false, completed: false, score: 0 },
    { id: 5, name: '七十二变', icon: '🪶', unlocked: false, completed: false, score: 0 },
    { id: 6, name: '团战时刻', icon: '💥', unlocked: false, completed: false, score: 0 }
  ])

  // --- 成就系统 ---
  const badges = ref([])

  const totalCredits = computed(() => {
    const creditMap = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 }
    let credits = 0
    badges.value.forEach(b => {
      credits += creditMap[b.levelId] || 0
    })
    if (badges.value.length === 6) credits += 3 // 集齐奖励
    return credits
  })

  const allCompleted = computed(() => levels.value.every(l => l.completed))

  // --- 操作方法 ---
  function completeLevel(levelId, score) {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return

    level.completed = true
    level.score = Math.max(level.score, score)

    // 添加成就
    if (!badges.value.find(b => b.levelId === levelId)) {
      badges.value.push({
        levelId,
        name: level.name,
        icon: level.icon,
        earnedAt: new Date().toISOString()
      })
    }

    // 解锁下一关
    const nextLevel = levels.value.find(l => l.id === levelId + 1)
    if (nextLevel) {
      nextLevel.unlocked = true
    }
  }

  function unlockLevel(levelId) {
    const level = levels.value.find(l => l.id === levelId)
    if (level) level.unlocked = true
  }

  function getLevel(levelId) {
    return levels.value.find(l => l.id === levelId)
  }

  function reset() {
    levels.value.forEach((l, i) => {
      l.completed = false
      l.unlocked = i === 0
      l.score = 0
    })
    badges.value = []
    currentLevel.value = 1
  }

  return {
    currentLevel,
    levels,
    badges,
    totalCredits,
    allCompleted,
    completeLevel,
    unlockLevel,
    getLevel,
    reset
  }
})
