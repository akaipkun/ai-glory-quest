import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scoreService } from '../services/scoreService'

// 隐藏成就（跨关卡小成就）定义
const MINI_BADGE_DEFS = [
  { id: 'all_wiki', name: '博览群书', icon: '📚', hint: '点击过 5+ 个 wiki 外部链接' },
  { id: 'perfect_turing', name: '火眼金睛', icon: '👁️', hint: '图灵测试 3/3 全对' },
  { id: 'perfect_detect', name: '明察秋毫', icon: '🔍', hint: 'AI 生成检测 8/8 全对' },
  { id: 'perfect_alchemy', name: '炼丹宗师', icon: '🧪', hint: '炼丹炉得分 ≥ 90' },
  { id: 'speed_demon', name: '速通达人', icon: '⚡', hint: '任一关卡 30 秒内完成' },
  { id: 'all_steps', name: '步步为营', icon: '👣', hint: '集齐全部 18 个子步骤成就' },
  { id: 'three_stars', name: '三星连珠', icon: '⭐', hint: '连续 3 关 score ≥ 85' },
  { id: 'king_of_kings', name: '最强王者', icon: '👑', hint: '王者决战 score ≥ 92' },
  { id: 'five_wins', name: '百战不殆', icon: '🏆', hint: '5v5 团战 5 局全胜' },
  { id: 'knowledge_seeker', name: '求知若渴', icon: '📖', hint: '访问 AI 知识总纲页' }
]

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

  // --- 成就系统：关卡徽章 + 子步骤徽章 + 隐藏成就 ---
  const badges = ref([])        // 关卡通关徽章 [{ levelId, name, icon, earnedAt }]
  const stepBadges = ref([])    // 子步骤徽章 [{ levelId, stepIndex, name, icon, desc, earnedAt }]
  const miniBadges = ref([])    // 隐藏成就 [{ id, name, icon, earnedAt }]

  // 当前用户ID（由 authStore 设置）
  let _userId = null
  // godMode 持久化标记
  let _godModeUnlocked = false
  let _consecutiveHigh = 0  // 连续高分计数（用于三星连珠）

  const totalCredits = computed(() => {
    const creditMap = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 }
    let credits = 0
    // 关卡通关学分
    badges.value.forEach(b => {
      credits += creditMap[b.levelId] || 0
    })
    // 子步骤学分（每步 0.5）
    credits += stepBadges.value.length * 0.5
    // 隐藏成就学分（每个 0.5）
    credits += miniBadges.value.length * 0.5
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
    if (data.miniBadges) {
      miniBadges.value = data.miniBadges
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
      miniBadges: JSON.parse(JSON.stringify(miniBadges.value)),
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

    // 三星连珠检测
    if (score >= 85) {
      _consecutiveHigh++
      if (_consecutiveHigh >= 3) {
        earnMiniBadge('three_stars')
      }
    } else {
      _consecutiveHigh = 0
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
    // 检查是否集齐全部 18 步子步骤成就
    if (stepBadges.value.length >= 18) {
      earnMiniBadge('all_steps')
    }
    saveUserData()
    return true
  }

  // 检查某步是否已获得成就
  function hasStepBadge(levelId, stepIndex) {
    return stepBadges.value.some(b => b.levelId === levelId && b.stepIndex === stepIndex)
  }

  // 隐藏成就
  function earnMiniBadge(id) {
    if (miniBadges.value.find(b => b.id === id)) return false
    const def = MINI_BADGE_DEFS.find(d => d.id === id)
    if (!def) return false
    miniBadges.value.push({
      id: def.id,
      name: def.name,
      icon: def.icon,
      earnedAt: new Date().toISOString()
    })
    saveUserData()
    return true
  }

  function hasMiniBadge(id) {
    return miniBadges.value.some(b => b.id === id)
  }

  function getMiniBadgeDef(id) {
    return MINI_BADGE_DEFS.find(d => d.id === id)
  }

  function getMiniBadgeDefs() {
    return MINI_BADGE_DEFS
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
    miniBadges.value = []
    _godModeUnlocked = false
    _consecutiveHigh = 0
    currentLevel.value = 1
    _userId = null
  }

  return {
    currentLevel,
    levels,
    badges,
    stepBadges,
    miniBadges,
    totalCredits,
    totalStepBadges,
    allCompleted,
    loadUserData,
    saveUserData,
    completeLevel,
    earnStepBadge,
    hasStepBadge,
    earnMiniBadge,
    hasMiniBadge,
    getMiniBadgeDef,
    getMiniBadgeDefs,
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
