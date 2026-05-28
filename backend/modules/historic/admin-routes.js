import { Router } from 'express'
import {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getPageByKey
} from './repository.js'

const router = Router()

function asNumberId(id) {
  const parsed = Number(id)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function validateLinkType(value) {
  return ['internal', 'external'].includes(value)
}

function validateOpenMode(value) {
  return ['_self', '_blank'].includes(value)
}

function validateNavPayload(payload, isCreate) {
  const title = String(payload.title ?? '').trim()
  const linkType = String(payload.link_type ?? '').trim()
  const linkTarget = String(payload.link_target ?? '').trim()
  const openModeRaw = payload.open_mode == null ? '' : String(payload.open_mode).trim()
  const openMode = openModeRaw || '_self'

  if (!title) {
    return { ok: false, msg: 'title is required' }
  }
  if (!validateLinkType(linkType)) {
    return { ok: false, msg: 'link_type must be internal or external' }
  }
  if (!linkTarget) {
    return { ok: false, msg: 'link_target is required' }
  }
  if (!validateOpenMode(openMode)) {
    return { ok: false, msg: 'open_mode must be _self or _blank' }
  }

  return {
    ok: true,
    data: {
      title,
      link_type: linkType,
      link_target: linkTarget,
      open_mode: openMode,
      icon_url: payload.icon_url == null ? null : String(payload.icon_url),
      sort_order: payload.sort_order == null ? 0 : Number(payload.sort_order) || 0,
      is_active: payload.is_active == null ? 1 : Number(payload.is_active) ? 1 : 0,
      ...(isCreate ? {} : {})
    }
  }
}

router.get('/pages/:pageKey', (req, res) => {
  const row = getPageByKey(req.params.pageKey)
  if (!row) return res.status(404).json({ code: 404, msg: 'page not found' })
  res.json({ code: 200, data: row, msg: 'success' })
})

router.get('/nav-items', (req, res) => {
  const data = listRecords('hd_nav_item', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.post('/nav-items', (req, res) => {
  const checked = validateNavPayload(req.body || {}, true)
  if (!checked.ok) {
    return res.status(400).json({ code: 400, msg: checked.msg })
  }

  createRecord('hd_nav_item', checked.data)
  const data = listRecords('hd_nav_item', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.put('/nav-items/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })

  const exists = listRecords('hd_nav_item', 'WHERE id=? LIMIT 1', [id])[0]
  if (!exists) return res.status(404).json({ code: 404, msg: 'not found' })

  const checked = validateNavPayload(req.body || {}, false)
  if (!checked.ok) {
    return res.status(400).json({ code: 400, msg: checked.msg })
  }

  updateRecord('hd_nav_item', id, checked.data)
  const data = listRecords('hd_nav_item', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.delete('/nav-items/:id', (req, res) => {
  const id = asNumberId(req.params.id)
  if (!id) return res.status(400).json({ code: 400, msg: 'invalid id' })

  const exists = listRecords('hd_nav_item', 'WHERE id=? LIMIT 1', [id])[0]
  if (!exists) return res.status(404).json({ code: 404, msg: 'not found' })

  deleteRecord('hd_nav_item', id)
  res.json({ code: 200, msg: 'success' })
})

router.get('/industries', (req, res) => {
  const data = listRecords('hd_industry', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/home-services', (req, res) => {
  const data = listRecords('hd_home_service', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/stages', (req, res) => {
  const data = listRecords('hd_stage', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/categories', (req, res) => {
  const data = listRecords('hd_stage_category', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/topics', (req, res) => {
  const data = listRecords('hd_topic', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/topic-links', (req, res) => {
  const data = listRecords('hd_topic_link', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

router.get('/topic-info-fields', (req, res) => {
  const data = listRecords('hd_topic_info_field', 'ORDER BY sort_order,id')
  res.json({ code: 200, data, msg: 'success' })
})

export default router
