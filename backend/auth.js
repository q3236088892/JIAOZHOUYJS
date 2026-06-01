import { createHash, randomBytes } from 'crypto'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

function generateToken() {
  return randomBytes(32).toString('hex')
}

// In-memory user store (default: admin / admin123)
const ADMIN_USERS = new Map([
  ['admin', { passwordHash: hashPassword('admin123'), role: 'admin' }]
])

// In-memory token store
const TOKENS = new Map()

export function login(username, password) {
  const user = ADMIN_USERS.get(username)
  if (!user) return { ok: false, msg: '用户名或密码错误' }
  if (user.passwordHash !== hashPassword(password)) return { ok: false, msg: '用户名或密码错误' }

  const token = generateToken()
  TOKENS.set(token, { username, expiresAt: Date.now() + TOKEN_EXPIRY_MS })
  return { ok: true, token, username }
}

export function verifyToken(token) {
  const record = TOKENS.get(token)
  if (!record) return null
  if (Date.now() > record.expiresAt) {
    TOKENS.delete(token)
    return null
  }
  return { username: record.username }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未登录' })
  }

  const token = authHeader.slice(7)
  const user = verifyToken(token)
  if (!user) {
    return res.status(401).json({ code: 401, msg: '登录已过期' })
  }

  req.user = user
  next()
}
