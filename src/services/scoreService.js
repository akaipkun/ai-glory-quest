// 成绩服务抽象层 — localStorage 实现
// 所有方法返回 Promise，与未来 API 后端行为一致
// 切换后端时：创建 scoreService.api.js，替换此文件的 import 即可

const SCORES_PREFIX = 'ink-scores-'

function getScoresKey(userId) {
  return SCORES_PREFIX + userId
}

export const scoreService = {
  async loadScores(userId) {
    if (!userId) return { levels: null, badges: null }
    try {
      const raw = localStorage.getItem(getScoresKey(userId))
      if (!raw) return { levels: null, badges: null }
      const data = JSON.parse(raw)
      return {
        levels: data.levels || null,
        badges: data.badges || null
      }
    } catch {
      return { levels: null, badges: null }
    }
  },

  async saveScores(userId, data) {
    if (!userId) return
    try {
      localStorage.setItem(getScoresKey(userId), JSON.stringify({
        levels: data.levels,
        badges: data.badges,
        savedAt: new Date().toISOString()
      }))
    } catch {
      console.error('成绩保存失败')
    }
  }
}
