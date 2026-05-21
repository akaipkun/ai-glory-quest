<template>
  <div class="dashboard">
    <div class="dash__container">
      <!-- 头部 -->
      <div class="dash__header fade-in">
        <button class="dash__back" @click="$router.push('/')">← 返回首页</button>
        <div class="dash__header-right">
          <span class="dash__user">👨‍🏫 {{ auth.currentUser?.username }}</span>
          <span class="dash__role">教师</span>
        </div>
      </div>

      <h2 class="dash__title fade-in">📋 学生管理中心</h2>
      <p class="dash__subtitle body-text fade-in delay-1">查看学生闯关进度、管理账户</p>

      <!-- 上帝模式 -->
      <div class="dash__god-mode fade-in delay-2">
        <div class="dash__god-mode-header">
          <span class="dash__god-mode-icon">👁️</span>
          <span class="dash__god-mode-label">上帝模式</span>
          <button
            class="dash__god-mode-toggle"
            :class="{ 'dash__god-mode-toggle--on': auth.godMode }"
            @click="auth.toggleGodMode()"
          >
            {{ auth.godMode ? '已开启' : '已关闭' }}
          </button>
        </div>
        <p class="dash__god-mode-desc body-text">
          开启后所有关卡解锁，可跳过关卡限制直接访问任何关卡。
          返回首页后从关卡地图进入。
        </p>
      </div>

      <!-- 学生列表 -->
      <div class="dash__section fade-in delay-2">
        <div class="dash__section-header">
          <span class="dash__section-title">学生列表</span>
          <span class="dash__section-count mono-text">{{ students.length }} 人</span>
        </div>

        <div v-if="loading" class="dash__loading body-text">加载中...</div>

        <div v-else-if="students.length === 0" class="dash__empty body-text">
          暂无注册学生
        </div>

        <div v-else class="dash__student-list">
          <div
            v-for="student in sortedStudents"
            :key="student.user.id"
            class="dash__student"
            :class="{ 'dash__student--expanded': expandedId === student.user.id }"
          >
            <!-- 学生摘要行 -->
            <div class="dash__student-row" @click="toggleExpand(student.user.id)">
              <div class="dash__student-info">
                <span class="dash__student-name">{{ student.user.username }}</span>
                <span class="dash__student-date mono-text">{{ formatDate(student.user.createdAt) }}</span>
              </div>
              <div class="dash__student-progress">
                <span class="dash__student-badge-count">{{ earnedCount(student.scores?.badges || []) }}/6 勋章</span>
                <span class="dash__student-credit mono-text">{{ calcCredits(student.scores?.badges || []) }} 学分</span>
              </div>
              <span class="dash__student-arrow">{{ expandedId === student.user.id ? '▾' : '▸' }}</span>
            </div>

            <!-- 展开详情 -->
            <transition name="ink-fade">
              <div v-if="expandedId === student.user.id" class="dash__student-detail">
                <div class="dash__detail-title">闯关详情</div>
                <div class="dash__detail-grid">
                  <div
                    v-for="level in studentLevels(student)"
                    :key="level.id"
                    class="dash__detail-level"
                    :class="{
                      'dash__detail-level--done': level.completed,
                      'dash__detail-level--locked': !level.unlocked && !level.completed
                    }"
                  >
                    <span class="dash__detail-level-icon">{{ level.icon }}</span>
                    <span class="dash__detail-level-name">{{ level.name }}</span>
                    <span class="dash__detail-level-status">
                      {{ level.completed ? '✅ ' + Math.round(level.score) + '%' : (level.unlocked ? '可挑战' : '🔒') }}
                    </span>
                  </div>
                </div>

                <div class="dash__detail-actions">
                  <button class="ink-btn" @click.stop="handleReset(student.user.id)">
                    重置进度
                  </button>
                  <button class="ink-btn ink-btn--cinnabar" @click.stop="handleDelete(student.user.id)">
                    删除账户
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const students = ref([])
const expandedId = ref(null)
const loading = ref(false)

const sortedStudents = computed(() => {
  return [...students.value].sort((a, b) => {
    const aCredits = calcCredits(a.scores?.badges || [])
    const bCredits = calcCredits(b.scores?.badges || [])
    return bCredits - aCredits
  })
})

async function loadStudents() {
  loading.value = true
  try {
    students.value = await auth.getAllStudents()
  } catch (e) {
    console.error('加载学生列表失败:', e)
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function earnedCount(badges) {
  return badges.length
}

function calcCredits(badges) {
  const creditMap = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2 }
  let credits = 0
  badges.forEach(b => { credits += creditMap[b.levelId] || 0 })
  if (badges.length === 6) credits += 3
  return credits
}

function studentLevels(student) {
  const defaultLevels = [
    { id: 1, name: '灵石出世', icon: '🪨' },
    { id: 2, name: '峡谷修炼', icon: '🔰' },
    { id: 3, name: '火眼金睛', icon: '🔥' },
    { id: 4, name: '王者排位', icon: '👑' },
    { id: 5, name: '七十二变', icon: '🪶' },
    { id: 6, name: '团战时刻', icon: '💥' }
  ]

  return defaultLevels.map(dl => {
    const saved = student.scores?.levels?.find(l => l.id === dl.id)
    return {
      ...dl,
      completed: saved?.completed || false,
      unlocked: saved?.unlocked || (dl.id === 1),
      score: saved?.score || 0
    }
  })
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function handleReset(studentId) {
  if (!confirm('确认重置该学生的所有闯关进度？')) return
  await auth.resetStudent(studentId)
  await loadStudents()
  expandedId.value = null
}

async function handleDelete(studentId) {
  if (!confirm('确认删除该学生账户？此操作不可撤销。')) return
  await auth.deleteStudent(studentId)
  await loadStudents()
  expandedId.value = null
}

onMounted(loadStudents)
</script>

<style scoped>
.dashboard { min-height: 100vh; padding: 24px; background: var(--paper); }
.dash__container { max-width: 700px; margin: 0 auto; }

.dash__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.dash__back { background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--ink-medium); cursor: pointer; padding: 4px 8px; }
.dash__back:hover { color: var(--ink-black); }
.dash__header-right { display: flex; align-items: center; gap: 12px; }
.dash__user { font-family: var(--font-display); font-size: 0.9rem; }
.dash__role { padding: 2px 10px; border: 1px solid var(--gold); font-size: 0.7rem; color: var(--gold); font-family: var(--font-body); }

.dash__title { font-size: 2rem; letter-spacing: 0.2em; margin-bottom: 8px; text-align: center; }
.dash__subtitle { font-size: 0.85rem; color: var(--ink-medium); margin-bottom: 32px; text-align: center; }

.dash__god-mode { padding: 16px 20px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); margin-bottom: 32px; }
.dash__god-mode-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.dash__god-mode-icon { font-size: 1.5rem; }
.dash__god-mode-label { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.1em; }
.dash__god-mode-toggle { margin-left: auto; padding: 4px 16px; border: 1px solid var(--ink-pale); background: transparent; font-family: var(--font-body); font-size: 0.8rem; color: var(--ink-medium); cursor: pointer; transition: all 0.3s ease; }
.dash__god-mode-toggle--on { border-color: var(--cinnabar); color: var(--cinnabar); background: rgba(194,58,43,0.04); }
.dash__god-mode-desc { font-size: 0.78rem; color: var(--ink-light); }

.dash__section { margin-bottom: 40px; }
.dash__section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.dash__section-title { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: 0.15em; }
.dash__section-count { font-size: 0.8rem; color: var(--ink-light); }

.dash__loading, .dash__empty { text-align: center; padding: 40px; color: var(--ink-light); }

.dash__student-list { display: flex; flex-direction: column; gap: 0; }
.dash__student { border: 1px solid var(--ink-pale); border-bottom: none; }
.dash__student:last-child { border-bottom: 1px solid var(--ink-pale); }
.dash__student--expanded { background: rgba(245,240,232,0.5); }

.dash__student-row { display: flex; align-items: center; gap: 16px; padding: 14px 16px; cursor: pointer; transition: background 0.2s ease; }
.dash__student-row:hover { background: rgba(26,26,26,0.02); }
.dash__student-info { flex: 1; }
.dash__student-name { font-family: var(--font-display); font-size: 0.95rem; letter-spacing: 0.05em; display: block; }
.dash__student-date { font-size: 0.65rem; color: var(--ink-light); }
.dash__student-progress { display: flex; gap: 16px; align-items: center; }
.dash__student-badge-count { font-size: 0.8rem; color: var(--gold); }
.dash__student-credit { font-size: 0.75rem; color: var(--ink-medium); }
.dash__student-arrow { font-size: 0.8rem; color: var(--ink-light); }

.dash__student-detail { padding: 16px 20px; border-top: 1px solid var(--ink-pale); background: rgba(245,240,232,0.3); }
.dash__detail-title { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; margin-bottom: 12px; color: var(--ink-medium); }
.dash__detail-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.dash__detail-level { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border: 1px solid rgba(26,26,26,0.04); }
.dash__detail-level--done { border-color: var(--gold); background: rgba(201,168,76,0.04); }
.dash__detail-level--locked { opacity: 0.35; }
.dash__detail-level-icon { font-size: 1rem; width: 28px; text-align: center; }
.dash__detail-level-name { flex: 1; font-size: 0.8rem; }
.dash__detail-level-status { font-size: 0.75rem; color: var(--ink-light); }

.dash__detail-actions { display: flex; gap: 12px; }
.dash__detail-actions .ink-btn { font-size: 0.75rem; padding: 6px 16px; }

.ink-fade-enter-active, .ink-fade-leave-active { transition: opacity 0.3s ease; }
.ink-fade-enter-from, .ink-fade-leave-to { opacity: 0; }
</style>
