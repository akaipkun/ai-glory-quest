import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scoreService } from '../services/scoreService'

// 子步骤成就定义：每个关卡 3 步，每步一个小成就
const STEP_BADGES = {
  1: [
    { stepIndex: 0, name: '初识AI', icon: '🌱', desc: '从时间线中触摸AI的起源' },
    { stepIndex: 1, name: '图灵试炼', icon: '💬', desc: '分辨人与机器的边界' },
    { stepIndex: 2, name: '算法初探', icon: '⚙️', desc: '亲手编排逻辑之舞' }
  ],
  2: [
    { stepIndex: 0, name: '英雄训练', icon: '🏋️', desc: '以数据锤炼模型之躯' },
    { stepIndex: 1, name: '炼丹入炉', icon: '🔥', desc: '调参如炼丹，火候需精准' },
    { stepIndex: 2, name: '排位竞技', icon: '⚔️', desc: '在对抗中磨砺锋芒' }
  ],
  3: [
    { stepIndex: 0, name: '火眼识图', icon: '👁️', desc: '开启神经之眼，洞悉像素' },
    { stepIndex: 1, name: '妖兽辨识', icon: '🦅', desc: '万类之中，识得真身' },
    { stepIndex: 2, name: '对抗幻象', icon: '🎭', desc: '识破精心伪装的骗局' }
  ],
  4: [
    { stepIndex: 0, name: '英雄选角', icon: '🎯', desc: '选择最优策略，踏上征途' },
    { stepIndex: 1, name: '排位交锋', icon: '🏆', desc: '在排行榜上攀登巅峰' },
    { stepIndex: 2, name: '王者决战', icon: '👑', desc: '最终对决，加冕为王' }
  ],
  5: [
    { stepIndex: 0, name: '千形万态', icon: '🦋', desc: '见证数据的万千形态' },
    { stepIndex: 1, name: '风格幻化', icon: '🎨', desc: '将一种风格化为另一种' },
    { stepIndex: 2, name: '虚实相生', icon: '🌀', desc: '从虚无中创造真实' }
  ],
  6: [
    { stepIndex: 0, name: '组队结盟', icon: '🤝', desc: '集结模型，组成战队' },
    { stepIndex: 1, name: '协同作战', icon: '⚡', desc: '多个模型齐发力' },
    { stepIndex: 2, name: '终极团战', icon: '💥', desc: '千军万马，算法的交响' }
  ]
}

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

  // --- 成就系统：关卡徽章 + 子步骤徽章 ---
  const badges = ref([])        // 关卡通关徽章 [{ levelId, name, icon, earnedAt }]
  const stepBadges = ref([])    // 子步骤徽章 [{ levelId, stepIndex, name, icon, desc, earnedAt }]

  // 当前用户ID（由 authStore 设置）
  let _userId = null
  // godMode 持久化标记
  let _godModeUnlocked = false

  const totalCredits = computed(() => {
    const creditMap = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 }
    let credits = 0
    // 关卡通关学分
    badges.value.forEach(b => {
      credits += creditMap[b.levelId] || 0
    })
    // 子步骤学分（每步 0.5，凑整）
    credits += stepBadges.value.length * 0.5
    if (badges.value.length === 6) credits += 3 // 集齐奖励
    return Math.floor(credits)
  })

  const totalStepBadges = computed(() => {
    // 总共 6 关 × 3 步 = 18 个子步骤成就
    return Object.values(STEP_BADGES).reduce((sum, steps) => sum + steps.length, 0)
  })

  const allCompleted = computed(() => levels.value.every(l => l.completed))

  // 获取某个关卡的子步骤成就
  function getStepBadgesForLevel(levelId) {
    return stepBadges.value.filter(b => b.levelId === levelId)
  }

  // 获取所有可用子步骤成就定义
  function getStepBadgeDefs(levelId) {
    return STEP_BADGES[levelId] || []
  }

  // --- 数据持久化 ---
  async function loadUserData(userId) {
    _userId = userId
    if (!userId) return

    const data = await scoreService.loadScores(userId)
    if (data.levels) {
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
    if (data.stepBadges) {
      stepBadges.value = data.stepBadges
    }
    if (data.godModeUnlocked) {
      _godModeUnlocked = data.godModeUnlocked
    }
    // 如果之前 godMode 解锁过，恢复解锁状态
    if (_godModeUnlocked) {
      forceUnlockAll()
    }
  }

  async function saveUserData() {
    if (!_userId) return
    const data = {
      levels: JSON.parse(JSON.stringify(levels.value)),
      badges: JSON.parse(JSON.stringify(badges.value)),
      stepBadges: JSON.parse(JSON.stringify(stepBadges.value)),
      godModeUnlocked: _godModeUnlocked
    }
    await scoreService.saveScores(_userId, data)
  }

  // --- 操作方法 ---
  function completeLevel(levelId, score) {
    const level = levels.value.find(l => l.id === levelId)
    if (!level) return

    level.completed = true
    level.score = Math.max(level.score, score)

    // 添加关卡通关成就
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

    saveUserData()
  }

  // 子步骤成就
  function earnStepBadge(levelId, stepIndex) {
    // 检查是否已获得
    if (stepBadges.value.find(b => b.levelId === levelId && b.stepIndex === stepIndex)) {
      return false
    }
    const defs = STEP_BADGES[levelId]
    if (!defs) return false
    const def = defs.find(d => d.stepIndex === stepIndex)
    if (!def) return false

    stepBadges.value.push({
      levelId,
      stepIndex,
      name: def.name,
      icon: def.icon,
      desc: def.desc,
      earnedAt: new Date().toISOString()
    })
    saveUserData()
    return true
  }

  // 检查某步是否已获得成就
  function hasStepBadge(levelId, stepIndex) {
    return stepBadges.value.some(b => b.levelId === levelId && b.stepIndex === stepIndex)
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
    _godModeUnlocked = true
    levels.value.forEach(l => {
      l.unlocked = true
    })
    saveUserData()
  }

  // 恢复默认锁定状态
  function restoreLockState() {
    _godModeUnlocked = false
    for (let i = levels.value.length - 1; i >= 0; i--) {
      if (i === 0) {
        levels.value[i].unlocked = true
      } else {
        levels.value[i].unlocked = levels.value[i - 1].completed
      }
    }
    saveUserData()
  }

  function isGodModeUnlocked() {
    return _godModeUnlocked
  }

  function reset() {
    levels.value.forEach((l, i) => {
      l.completed = false
      l.unlocked = i === 0
      l.score = 0
    })
    badges.value = []
    stepBadges.value = []
    _godModeUnlocked = false
    currentLevel.value = 1
    _userId = null
  }

  return {
    currentLevel,
    levels,
    badges,
    stepBadges,
    totalCredits,
    totalStepBadges,
    allCompleted,
    loadUserData,
    saveUserData,
    completeLevel,
    earnStepBadge,
    hasStepBadge,
    getStepBadgesForLevel,
    getStepBadgeDefs,
    unlockLevel,
    getLevel,
    forceUnlockAll,
    restoreLockState,
    isGodModeUnlocked,
    reset
  }
})
