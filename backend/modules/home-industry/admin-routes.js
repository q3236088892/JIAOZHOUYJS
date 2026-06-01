import { Router } from 'express'
import multer from 'multer'
import {
  getModules, getModuleById, createModule, updateModule, deleteModule,
  getTree, getNodeById, getNodeWithContent, getChildren,
  createNode, updateNode, deleteNodeCascade, moveNode,
  upsertContent, createContentField, updateContentField, deleteContentField,
  getModuleStats
} from './repository.js'
import { importFromBuffer } from './import.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

function asNumberId(id) {
  const parsed = Number(id)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

// ── Modules ──

router.get('/modules', (req, res) => {
  const data = getModules()
  res.json({ code: 200, data, msg: 'success' })
})

router.post('/modules', (req, res) => {
  const { code, title, icon_url, sort_order } = req.body || {}
  if (!code || !String(code).trim()) return res.status(400).json({ code: 400, msg: 'code is required' })
  if (!title || !String(title).trim()) return res.status(400).json({ code: 400, msg: 'title is required' })

  createModule({
    code: String(code).trim(),
    title: String(title).trim(),
    icon_url: icon_url || null,
    home_banner_url: req.body.home_banner_url || null,
    detail_banner_url: req.body.detail_banner_url || null,
    sort_order: sort_order == null ? 0 : Number(sort_order) || 0
  })
  res.json({ code: 200, data: getModules(), msg: 'success' })
})

router.put('/modules/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  if (!getModuleById(id)) return res.status(404).json({ code: 404, msg: 'not found' })

  const data = {}
  if (req.body.code != null) data.code = String(req.body.code).trim()
  if (req.body.title != null) data.title = String(req.body.title).trim()
  if (req.body.icon_url != null) data.icon_url = req.body.icon_url
  if (req.body.home_banner_url != null) data.home_banner_url = req.body.home_banner_url
  if (req.body.detail_banner_url != null) data.detail_banner_url = req.body.detail_banner_url
  if (req.body.sort_order != null) data.sort_order = Number(req.body.sort_order) || 0
  if (req.body.is_active != null) data.is_active = Number(req.body.is_active) ? 1 : 0

  updateModule(id, data)
  res.json({ code: 200, data: getModules(), msg: 'success' })
})

router.delete('/modules/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  if (!getModuleById(id)) return res.status(404).json({ code: 404, msg: 'not found' })

  deleteModule(id)
  res.json({ code: 200, msg: 'success' })
})

// ── Tree ──

router.get('/modules/:moduleId/tree', (req, res) => {
  const moduleId = asNumberId(req.params.moduleId)
  if (!moduleId) return res.status(400).json({ code: 400, msg: 'invalid module id' })

  const tree = getTree(moduleId)
  const stats = getModuleStats(moduleId)
  res.json({ code: 200, data: { tree, stats }, msg: 'success' })
})

// ── Nodes ──

router.get('/nodes/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })

  const data = getNodeWithContent(id)
  if (!data) return res.status(404).json({ code: 404, msg: 'not found' })
  res.json({ code: 200, data, msg: 'success' })
})

router.post('/nodes', (req, res) => {
  const { module_id, parent_id, title, node_type, sort_order } = req.body || {}

  const mid = asNumberId(module_id)
  if (!mid) return res.status(400).json({ code: 400, msg: 'module_id is required' })
  if (!getModuleById(mid)) return res.status(400).json({ code: 400, msg: 'module not found' })

  const trimmedTitle = String(title ?? '').trim()
  if (!trimmedTitle) return res.status(400).json({ code: 400, msg: 'title is required' })

  if (parent_id != null) {
    const pid = asNumberId(parent_id)
    if (!pid) return res.status(400).json({ code: 400, msg: 'invalid parent_id' })
    const parent = getNodeById(pid)
    if (!parent) return res.status(400).json({ code: 400, msg: 'parent node not found' })
  }

  const nid = createNode({
    module_id: mid,
    parent_id: parent_id != null ? asNumberId(parent_id) : null,
    title: trimmedTitle,
    node_type: node_type === 'leaf' ? 'leaf' : 'branch',
    sort_order: sort_order == null ? 0 : Number(sort_order) || 0
  })

  res.json({ code: 200, data: { id: nid }, msg: 'success' })
})

router.put('/nodes/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  if (!getNodeById(id)) return res.status(404).json({ code: 404, msg: 'not found' })

  const data = {}
  if (req.body.title != null) data.title = String(req.body.title).trim()
  if (req.body.node_type != null) data.node_type = req.body.node_type === 'leaf' ? 'leaf' : 'branch'
  if (req.body.sort_order != null) data.sort_order = Number(req.body.sort_order) || 0
  if (req.body.is_active != null) data.is_active = Number(req.body.is_active) ? 1 : 0
  if (req.body.parent_id !== undefined) {
    data.parent_id = req.body.parent_id == null ? null : asNumberId(req.body.parent_id)
  }

  updateNode(id, data)
  res.json({ code: 200, msg: 'success' })
})

router.delete('/nodes/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  if (!getNodeById(id)) return res.status(404).json({ code: 404, msg: 'not found' })

  deleteNodeCascade(id)
  res.json({ code: 200, msg: 'success' })
})

router.put('/nodes/:id/move', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  if (!getNodeById(id)) return res.status(404).json({ code: 404, msg: 'not found' })

  const newParentId = req.body.new_parent_id == null ? null : asNumberId(req.body.new_parent_id)
  const newSortOrder = req.body.new_sort_order == null ? 0 : Number(req.body.new_sort_order) || 0

  try {
    moveNode(id, newParentId, newSortOrder)
  } catch (e) {
    return res.status(400).json({ code: 400, msg: e.message })
  }
  res.json({ code: 200, msg: 'success' })
})

// ── Content ──

router.put('/contents/:nodeId', (req, res) => {
  const nodeId = asNumberId(req.params.nodeId)
  if (!nodeId) return res.status(400).json({ code: 400, msg: 'invalid node id' })

  const { content_type, summary, link_url, link_label, link_target, body, department, remark, fields } = req.body || {}

  const contentData = {}
  if (content_type != null) contentData.content_type = content_type
  if (summary != null) contentData.summary = summary
  if (link_url != null) contentData.link_url = link_url
  if (link_label != null) contentData.link_label = link_label
  if (link_target != null) contentData.link_target = link_target
  if (body != null) contentData.body = body
  if (department != null) contentData.department = department
  if (remark != null) contentData.remark = remark

  upsertContent(nodeId, contentData, fields || [])
  const data = getNodeWithContent(nodeId)
  res.json({ code: 200, data, msg: 'success' })
})

router.post('/content-fields', (req, res) => {
  const { content_id, field_key, field_label, field_value, sort_order } = req.body || {}
  if (!content_id || !field_key || !field_label || !field_value) {
    return res.status(400).json({ code: 400, msg: 'content_id, field_key, field_label, field_value are required' })
  }
  createContentField({
    content_id: Number(content_id),
    field_key: String(field_key).trim(),
    field_label: String(field_label).trim(),
    field_value: String(field_value),
    sort_order: sort_order == null ? 0 : Number(sort_order) || 0
  })
  res.json({ code: 200, msg: 'success' })
})

router.put('/content-fields/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })

  const data = {}
  if (req.body.field_key != null) data.field_key = String(req.body.field_key).trim()
  if (req.body.field_label != null) data.field_label = String(req.body.field_label).trim()
  if (req.body.field_value != null) data.field_value = String(req.body.field_value)
  if (req.body.sort_order != null) data.sort_order = Number(req.body.sort_order) || 0

  updateContentField(id, data)
  res.json({ code: 200, msg: 'success' })
})

router.delete('/content-fields/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })
  deleteContentField(id)
  res.json({ code: 200, msg: 'success' })
})

// ── Excel Import ──

router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, msg: 'no file uploaded' })

  // module_id is optional - if not provided, auto-map sheets to modules by name
  const moduleId = req.body.module_id ? asNumberId(req.body.module_id) : null
  if (moduleId && !getModuleById(moduleId)) return res.status(400).json({ code: 400, msg: 'module not found' })

  try {
    const result = importFromBuffer(moduleId, req.file.buffer)
    res.json({ code: 200, data: result, msg: 'success' })
  } catch (e) {
    res.status(500).json({ code: 500, msg: `import failed: ${e.message}` })
  }
})

export default router
