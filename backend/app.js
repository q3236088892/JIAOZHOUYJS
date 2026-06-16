import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getAll, getById, insert, update, remove } from './db.js'
import { login, verifyToken, authMiddleware } from './auth.js'
import historicPublicRoutes from './modules/historic/public-routes.js'
import historicAdminRoutes from './modules/historic/admin-routes.js'
import homePublicRoutes from './modules/home-industry/public-routes.js'
import homeAdminRoutes from './modules/home-industry/admin-routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
})
const upload = multer({ storage })

export function createApp(basePath = (process.env.BASE_PATH || '')) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const router = express.Router()
  const BASE = basePath.replace(/\/$/, '')
  const uploadPrefix = BASE ? `${BASE}/uploads` : '/uploads'

  const COLS = ['id', 'title', 'content', 'eventType', 'status', 'createTime', 'updateTime']
  const toObject = (row) => Object.fromEntries(COLS.map((k, i) => [k, row[i]]))

  router.get('/api/events', (req, res) => {
    const rows = getAll()
    res.json({ code: 200, data: rows.map(toObject), msg: 'success' })
  })

  router.get('/api/events/:id', (req, res) => {
    const row = getById(Number(req.params.id))
    if (!row) return res.status(404).json({ code: 404, msg: 'not found' })
    res.json({ code: 200, data: toObject(row), msg: 'success' })
  })

  router.post('/api/events', (req, res) => {
    const { title, content, eventType, status } = req.body || {}
    const normalizedTitle = title == null ? '' : String(title).trim()
    if (!normalizedTitle) {
      return res.status(400).json({ code: 400, msg: 'title is required' })
    }

    const id = insert(normalizedTitle, content, eventType, status)
    const created = getById(id)
    if (!created) {
      return res.status(500).json({ code: 500, msg: 'create failed' })
    }

    res.json({ code: 200, data: toObject(created), msg: 'success' })
  })

  router.put('/api/events/:id', (req, res) => {
    const id = Number(req.params.id)
    const existing = getById(id)
    if (!existing) {
      return res.status(404).json({ code: 404, msg: 'not found' })
    }

    const oldData = toObject(existing)
    const { title, content, eventType, status } = req.body || {}

    const nextTitle = title === undefined ? oldData.title : String(title ?? '').trim()
    if (!nextTitle) {
      return res.status(400).json({ code: 400, msg: 'title is required' })
    }

    const nextContent = content === undefined ? oldData.content : content
    const nextEventType = eventType === undefined ? oldData.eventType : eventType
    const nextStatus = status === undefined ? oldData.status : status

    update(id, nextTitle, nextContent, nextEventType, nextStatus)

    const updated = getById(id)
    if (!updated) {
      return res.status(500).json({ code: 500, msg: 'update failed' })
    }
    res.json({ code: 200, data: toObject(updated), msg: 'success' })
  })

  router.delete('/api/events/:id', (req, res) => {
    remove(Number(req.params.id))
    res.json({ code: 200, msg: 'success' })
  })

  router.post('/api/system/oss/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ code: 400, msg: 'no file' })
    res.json({ code: 200, data: { url: `${uploadPrefix}/${req.file.filename}`, filename: req.file.originalname }, msg: 'success' })
  })

  // Auth routes
  router.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ code: 400, msg: '请输入用户名和密码' })
    const result = login(username, password)
    if (!result.ok) return res.status(401).json({ code: 401, msg: result.msg })
    res.json({ code: 200, data: { token: result.token, username: result.username }, msg: 'success' })
  })

  router.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ code: 200, data: { username: req.user.username }, msg: 'success' })
  })

  // Public routes
  router.use('/api/historic/public', historicPublicRoutes)
  router.use('/api/cd/public', homePublicRoutes)

  // Admin routes (protected)
  router.use('/api/admin/historic', authMiddleware, historicAdminRoutes)
  router.use('/api/admin/cd', authMiddleware, homeAdminRoutes)

  router.use('/uploads', express.static(uploadsDir))

  const distDir = path.join(__dirname, '..', 'frontend', 'dist')
  if (fs.existsSync(distDir)) {
    router.use(express.static(distDir))
    router.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(BASE || '/', router)

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(500).json({ code: 500, msg: err?.message || 'internal server error' })
  })

  return app
}

const app = createApp()
export default app
