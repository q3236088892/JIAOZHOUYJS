import { Router } from 'express'
import {
  getModules, getModuleByCode,
  getTree, getNodeWithContent, getModuleStats
} from './repository.js'

const router = Router()

router.get('/modules', (req, res) => {
  const data = getModules()
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/modules/:code/tree', (req, res) => {
  const module_ = getModuleByCode(req.params.code)
  if (!module_) return res.status(404).json({ code: 404, msg: 'module not found' })

  const tree = getTree(module_.id)
  const stats = getModuleStats(module_.id)
  res.json({ code: 200, data: { module: module_, tree, stats }, msg: 'success' })
})

router.get('/nodes/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ code: 400, msg: 'invalid id' })

  const data = getNodeWithContent(id)
  if (!data) return res.status(404).json({ code: 404, msg: 'not found' })
  res.json({ code: 200, data, msg: 'success' })
})

export default router
