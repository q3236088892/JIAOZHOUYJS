import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getAll, getById, insert, update, remove } from './db.js'
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

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const COLS = ['id', 'title', 'content', 'eventType', 'status', 'createTime', 'updateTime']
  const toObject = (row) => Object.fromEntries(COLS.map((k, i) => [k, row[i]]))

  app.get('/api/events', (req, res) => {
    const rows = getAll()
    res.json({ code: 200, data: rows.map(toObject), msg: 'success' })
  })

  app.get('/api/events/:id', (req, res) => {
    const row = getById(Number(req.params.id))
    if (!row) return res.status(404).json({ code: 404, msg: 'not found' })
    res.json({ code: 200, data: toObject(row), msg: 'success' })
  })

  app.post('/api/events', (req, res) => {
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

  app.put('/api/events/:id', (req, res) => {
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

  app.delete('/api/events/:id', (req, res) => {
    remove(Number(req.params.id))
    res.json({ code: 200, msg: 'success' })
  })

  app.post('/api/system/oss/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ code: 400, msg: 'no file' })
    res.json({ code: 200, data: { url: `/uploads/${req.file.filename}`, filename: req.file.originalname }, msg: 'success' })
  })

  app.use('/api/historic/public', historicPublicRoutes)
  app.use('/api/admin/historic', historicAdminRoutes)
  app.use('/api/cd/public', homePublicRoutes)
  app.use('/api/admin/cd', homeAdminRoutes)

  app.use('/uploads', express.static(uploadsDir))
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(500).json({ code: 500, msg: err?.message || 'internal server error' })
  })

  return app
}

const app = createApp()
export default app
