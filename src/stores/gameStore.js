import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scoreService } from '../services/scoreService'

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

  // 当前用户ID（由 authStore 设置）
  let _userId = null

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

  // --- 数据持久化 ---
  async function loadUserData(userId) {
    _userId = userId
    if (!userId) return

    const data = await scoreService.loadScores(userId)
    if (data.levels) {
      // 恢复关卡状态
      data.levels.forEach((saved, i) => {
        if (levels.value[i]) {
          levels.value[i].unlocked = saved.unlocked
          levels.value[i].completed = saved.completed
          levels.value[i].score = saved.score
        }
      })
    }
    if (data.badges) {
      badges.value = data.badges
    }
  }

  async function saveUserData() {
    if (!_userId) return
    // 深拷贝避免引用问题
    const data = {
      levels: JSON.parse(JSON.stringify(levels.value)),
      badges: JSON.parse(JSON.stringify(badges.value))
    }
    await scoreService.saveScores(_userId, data)
  }

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

    // 自动保存
    saveUserData()
  }

  function unlockLevel(levelId) {
    const level = levels.value.find(l => l.id === levelId)
    if (level) level.unlocked = true
  }

  function getLevel(levelId) {
    return levels.value.find(l => l.id === levelId)
  }

  // 教师上帝模式：解锁所有关卡
  function forceUnlockAll() {
    levels.value.forEach(l => {
      l.unlocked = true
    })
  }

  // 恢复默认锁定状态（退出上帝模式时）
  function restoreLockState() {
    // 按顺序重新计算锁定状态
    for (let i = levels.value.length - 1; i >= 0; i--) {
      if (i === 0) {
        levels.value[i].unlocked = true
      } else {
        levels.value[i].unlocked = levels.value[i - 1].completed
      }
    }
  }

  function reset() {
    levels.value.forEach((l, i) => {
      l.completed = false
      l.unlocked = i === 0
      l.score = 0
    })
    badges.value = []
    currentLevel.value = 1
    _userId = null
  }

  return {
    currentLevel,
    levels,
    badges,
    totalCredits,
    allCompleted,
    loadUserData,
    saveUserData,
    completeLevel,
    unlockLevel,
    getLevel,
    forceUnlockAll,
    restoreLockState,
    reset
  }
})
