// 认证状态管理 store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'
import { useGameStore } from './gameStore'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null) // { id, username, role }
  const godMode = ref(false)    // 教师上帝模式
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!currentUser.value)
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  const isGodMode = computed(() => isTeacher.value && godMode.value)

  // 初始化：尝试恢复会话
  async function init() {
    loading.value = true
    error.value = null
    try {
      const result = await authService.getCurrentUser()
      if (result) {
        currentUser.value = result.user
        // 加载用户成绩到 gameStore
        const gameStore = useGameStore()
        await gameStore.loadUserData(result.user.id)
        // 恢复 godMode 状态
        if (gameStore.isGodModeUnlocked()) {
          godMode.value = true
        }
      }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function register(username, password) {
    loading.value = true
    error.value = null
    try {
      const result = await authService.register(username, password)
      currentUser.value = result.user
      // 新用户初始化空成绩
      const gameStore = useGameStore()
      gameStore.reset()
      await gameStore.saveUserData()
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(username, password) {
    loading.value = true
    error.value = null
    try {
      const result = await authService.login(username, password)
      currentUser.value = result.user
      // 加载该用户的已有成绩
      const gameStore = useGameStore()
      await gameStore.loadUserData(result.user.id)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await authService.logout()
    currentUser.value = null
    godMode.value = false
    // 重置 gameStore 到默认状态
    const gameStore = useGameStore()
    gameStore.reset()
  }

  function toggleGodMode() {
    if (!isTeacher.value) return
    godMode.value = !godMode.value
    if (godMode.value) {
      // 开启上帝模式：解锁所有关卡
      const gameStore = useGameStore()
      gameStore.forceUnlockAll()
    } else {
      // 关闭上帝模式：恢复正常锁定状态
      const gameStore = useGameStore()
      gameStore.restoreLockState()
    }
  }

  // 教师：获取所有学生
  async function getAllStudents() {
    if (!isTeacher.value) throw new Error('无权访问')
    return await authService.getAllStudents()
  }

  // 教师：查看学生成绩
  async function getStudentScores(studentId) {
    if (!isTeacher.value) throw new Error('无权访问')
    return await authService.getStudentScores(studentId)
  }

  // 教师：重置学生进度
  async function resetStudent(studentId) {
    if (!isTeacher.value) throw new Error('无权访问')
    await authService.resetStudent(studentId)
  }

  // 教师：删除学生
  async function deleteStudent(studentId) {
    if (!isTeacher.value) throw new Error('无权访问')
    await authService.deleteStudent(studentId)
  }

  return {
    currentUser,
    godMode,
    loading,
    error,
    isAuthenticated,
    isTeacher,
    isGodMode,
    init,
    register,
    login,
    logout,
    toggleGodMode,
    getAllStudents,
    getStudentScores,
    resetStudent,
    deleteStudent
  }
})
