// 认证服务抽象层 — localStorage 实现
// 所有方法返回 Promise，与未来 API 后端行为一致
// 切换后端时：创建 authService.api.js，替换此文件的 import 即可

const USERS_KEY = 'ink-users'
const SESSION_KEY = 'ink-session'

// 简单的密码哈希（Web Crypto API SHA-256）
async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateId() {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// 确保预置教师账户存在（异步，统一用 SHA-256）
async function ensureTeacherAccount() {
  const users = getUsers()
  const teacherIdx = users.findIndex(u => u.role === 'teacher')

  if (teacherIdx >= 0) {
    // 已有教师账户：验证哈希方法是否一致（修复旧版 btoa bug）
    const teacher = users[teacherIdx]
    const testHash = await hashPassword('admin123', teacher.salt)
    if (teacher.passwordHash !== testHash) {
      // 旧版 btoa 哈希不匹配 → 用 SHA-256 重建
      teacher.passwordHash = testHash
      saveUsers(users)
    }
    return users
  }

  // 首次创建教师账户
  const salt = generateSalt()
  const passwordHash = await hashPassword('admin123', salt)
  users.push({
    id: 'u_teacher_001',
    username: 'teacher',
    passwordHash,
    salt,
    role: 'teacher',
    createdAt: new Date().toISOString()
  })
  saveUsers(users)
  return users
}

export const authService = {
  async register(username, password) {
    // 验证输入
    if (!username || username.length < 2) {
      throw new Error('用户名至少2个字符')
    }
    if (!password || password.length < 4) {
      throw new Error('密码至少4个字符')
    }

    const users = await ensureTeacherAccount()

    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      throw new Error('用户名已存在')
    }

    // 创建用户
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)
    const user = {
      id: generateId(),
      username,
      passwordHash,
      salt,
      role: 'student',
      createdAt: new Date().toISOString()
    }

    users.push(user)
    saveUsers(users)

    // 自动登录
    const session = { userId: user.id, username: user.username, role: user.role, loginAt: new Date().toISOString() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return { user: { id: user.id, username: user.username, role: user.role }, token: 'local_' + user.id }
  },

  async login(username, password) {
    const users = await ensureTeacherAccount()
    const user = users.find(u => u.username === username)

    if (!user) {
      throw new Error('用户名不存在')
    }

    const passwordHash = await hashPassword(password, user.salt)
    if (passwordHash !== user.passwordHash) {
      throw new Error('密码错误')
    }

    const session = { userId: user.id, username: user.username, role: user.role, loginAt: new Date().toISOString() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return { user: { id: user.id, username: user.username, role: user.role }, token: 'local_' + user.id }
  },

  async logout() {
    localStorage.removeItem(SESSION_KEY)
  },

  async getCurrentUser() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY))
      if (!session) return null

      const users = getUsers()
      const user = users.find(u => u.id === session.userId)
      if (!user) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }

      return { user: { id: user.id, username: user.username, role: user.role } }
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  // --- 教师专用方法 ---
  async getAllStudents() {
    const current = await this.getCurrentUser()
    if (!current || current.user.role !== 'teacher') {
      throw new Error('无权访问')
    }

    const users = getUsers().filter(u => u.role === 'student')
    return users.map(u => {
      const scores = loadScores(u.id)
      return {
        user: { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt },
        scores
      }
    })
  },

  async getStudentScores(studentId) {
    const current = await this.getCurrentUser()
    if (!current || current.user.role !== 'teacher') {
      throw new Error('无权访问')
    }
    return loadScores(studentId)
  },

  async resetStudent(studentId) {
    const current = await this.getCurrentUser()
    if (!current || current.user.role !== 'teacher') {
      throw new Error('无权访问')
    }
    localStorage.removeItem('ink-scores-' + studentId)
  },

  async deleteStudent(studentId) {
    const current = await this.getCurrentUser()
    if (!current || current.user.role !== 'teacher') {
      throw new Error('无权访问')
    }
    const users = getUsers().filter(u => u.id !== studentId)
    saveUsers(users)
    localStorage.removeItem('ink-scores-' + studentId)
  }
}

// 内部辅助：加载用户成绩
function loadScores(userId) {
  try {
    const raw = localStorage.getItem('ink-scores-' + userId)
    if (!raw) return { levels: null, badges: null }
    return JSON.parse(raw)
  } catch { return { levels: null, badges: null } }
}
