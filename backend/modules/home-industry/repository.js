import { querySql, runSql } from '../../db.js'

// ── Module CRUD ──

export function getModules() {
  return querySql('SELECT * FROM cd_module WHERE is_active=1 ORDER BY sort_order,id')
}

export function getModuleById(id) {
  return querySql('SELECT * FROM cd_module WHERE id=? LIMIT 1', [id])[0] ?? null
}

export function getModuleByCode(code) {
  return querySql('SELECT * FROM cd_module WHERE code=? AND is_active=1 LIMIT 1', [code])[0] ?? null
}

export function createModule(data) {
  const keys = Object.keys(data)
  const placeholders = keys.map(() => '?').join(',')
  runSql(`INSERT INTO cd_module (${keys.join(',')}) VALUES (${placeholders})`, keys.map((k) => data[k]))
}

export function updateModule(id, data) {
  const keys = Object.keys(data)
  if (keys.length === 0) return
  const setClause = keys.map((k) => `${k}=?`).join(',')
  runSql(`UPDATE cd_module SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`, [...keys.map((k) => data[k]), id])
}

export function deleteModule(id) {
  // cascade: delete all nodes in this module (and their contents)
  const nodes = querySql('SELECT id FROM cd_node WHERE module_id=?', [id])
  for (const node of nodes) {
    deleteNodeContent(node.id)
  }
  runSql('DELETE FROM cd_node WHERE module_id=?', [id])
  runSql('DELETE FROM cd_module WHERE id=?', [id])
}

// ── Tree Queries ──

export function getTree(moduleId) {
  const rows = querySql(`
    SELECT n.*, c.content_type, c.summary, c.department, c.remark,
           c.link_url, c.link_label, c.link_target, c.body,
           c.attachment_url, c.attachment_name
    FROM cd_node n
    LEFT JOIN cd_content c ON c.node_id = n.id
    WHERE n.module_id = ? AND n.is_active = 1
    ORDER BY n.sort_order, n.id
  `, [moduleId])

  return buildTree(rows)
}

function buildTree(rows) {
  const map = {}
  const roots = []
  for (const row of rows) {
    map[row.id] = { ...row, children: [] }
  }
  for (const row of rows) {
    const node = map[row.id]
    if (row.parent_id && map[row.parent_id]) {
      map[row.parent_id].children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export function getNodeById(id) {
  return querySql('SELECT * FROM cd_node WHERE id=? LIMIT 1', [id])[0] ?? null
}

export function getNodeWithContent(id) {
  const node = getNodeById(id)
  if (!node) return null

  const content = querySql('SELECT * FROM cd_content WHERE node_id=? LIMIT 1', [id])[0] ?? null
  if (content) {
    content.fields = querySql(
      'SELECT * FROM cd_content_field WHERE content_id=? ORDER BY sort_order,id',
      [content.id]
    )
  }

  return { ...node, content }
}

export function getChildren(parentId) {
  return querySql('SELECT * FROM cd_node WHERE parent_id=? AND is_active=1 ORDER BY sort_order,id', [parentId])
}

// ── Node CRUD ──

export function createNode(data) {
  const keys = Object.keys(data)
  const placeholders = keys.map(() => '?').join(',')
  runSql(`INSERT INTO cd_node (${keys.join(',')}) VALUES (${placeholders})`, keys.map((k) => data[k]))
  const row = querySql('SELECT id FROM cd_node ORDER BY id DESC LIMIT 1')[0]
  return row?.id
}

export function updateNode(id, data) {
  const keys = Object.keys(data)
  if (keys.length === 0) return
  const setClause = keys.map((k) => `${k}=?`).join(',')
  runSql(`UPDATE cd_node SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`, [...keys.map((k) => data[k]), id])
}

export function deleteNodeCascade(id) {
  const descendants = getDescendantIds(id)
  const allIds = [id, ...descendants]

  for (const nodeId of allIds) {
    deleteNodeContent(nodeId)
  }

  for (const nodeId of allIds) {
    runSql('DELETE FROM cd_node WHERE id=?', [nodeId])
  }
}

function getDescendantIds(parentId) {
  const children = querySql('SELECT id FROM cd_node WHERE parent_id=?', [parentId])
  let ids = []
  for (const child of children) {
    ids.push(child.id)
    ids = ids.concat(getDescendantIds(child.id))
  }
  return ids
}

function deleteNodeContent(nodeId) {
  const contents = querySql('SELECT id FROM cd_content WHERE node_id=?', [nodeId])
  for (const content of contents) {
    runSql('DELETE FROM cd_content_field WHERE content_id=?', [content.id])
  }
  runSql('DELETE FROM cd_content WHERE node_id=?', [nodeId])
}

export function moveNode(id, newParentId, newSortOrder) {
  if (newParentId && isDescendantOf(newParentId, id)) {
    throw new Error('cannot move node to its own descendant')
  }
  runSql('UPDATE cd_node SET parent_id=?, sort_order=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?',
    [newParentId, newSortOrder ?? 0, id])
}

function isDescendantOf(targetId, ancestorId) {
  let current = getNodeById(targetId)
  while (current && current.parent_id) {
    if (current.parent_id === ancestorId) return true
    current = getNodeById(current.parent_id)
  }
  return false
}

// ── Content CRUD ──

export function upsertContent(nodeId, contentData, fields = []) {
  const existing = querySql('SELECT id FROM cd_content WHERE node_id=? LIMIT 1', [nodeId])[0]

  if (existing) {
    const keys = Object.keys(contentData)
    if (keys.length > 0) {
      const setClause = keys.map((k) => `${k}=?`).join(',')
      runSql(`UPDATE cd_content SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`,
        [...keys.map((k) => contentData[k]), existing.id])
    }
    // replace fields
    runSql('DELETE FROM cd_content_field WHERE content_id=?', [existing.id])
    for (let i = 0; i < fields.length; i++) {
      runSql('INSERT INTO cd_content_field (content_id, field_key, field_label, field_value, sort_order) VALUES (?,?,?,?,?)',
        [existing.id, fields[i].field_key, fields[i].field_label, fields[i].field_value, i])
    }
  } else {
    const keys = Object.keys(contentData)
    const placeholders = keys.map(() => '?').join(',')
    runSql(`INSERT INTO cd_content (node_id, ${keys.join(',')}) VALUES (?,${placeholders})`,
      [nodeId, ...keys.map((k) => contentData[k])])
    const content = querySql('SELECT id FROM cd_content WHERE node_id=? LIMIT 1', [nodeId])[0]
    if (content) {
      for (let i = 0; i < fields.length; i++) {
        runSql('INSERT INTO cd_content_field (content_id, field_key, field_label, field_value, sort_order) VALUES (?,?,?,?,?)',
          [content.id, fields[i].field_key, fields[i].field_label, fields[i].field_value, i])
      }
    }
  }
}

export function createContentField(data) {
  const keys = Object.keys(data)
  const placeholders = keys.map(() => '?').join(',')
  runSql(`INSERT INTO cd_content_field (${keys.join(',')}) VALUES (${placeholders})`, keys.map((k) => data[k]))
}

export function updateContentField(id, data) {
  const keys = Object.keys(data)
  if (keys.length === 0) return
  const setClause = keys.map((k) => `${k}=?`).join(',')
  runSql(`UPDATE cd_content_field SET ${setClause} WHERE id=?`, [...keys.map((k) => data[k]), id])
}

export function deleteContentField(id) {
  runSql('DELETE FROM cd_content_field WHERE id=?', [id])
}

// ── Find existing node by path (for import dedup) ──

export function findNodeByPath(moduleId, parentId, title) {
  if (parentId) {
    return querySql(
      'SELECT id FROM cd_node WHERE module_id=? AND parent_id=? AND title=? AND is_active=1 LIMIT 1',
      [moduleId, parentId, title]
    )[0] ?? null
  }
  return querySql(
    'SELECT id FROM cd_node WHERE module_id=? AND parent_id IS NULL AND title=? AND is_active=1 LIMIT 1',
    [moduleId, title]
  )[0] ?? null
}

// ── Stats ──

export function getModuleStats(moduleId) {
  const nodeCount = querySql('SELECT COUNT(*) AS cnt FROM cd_node WHERE module_id=? AND is_active=1', [moduleId])[0]?.cnt ?? 0
  const leafCount = querySql('SELECT COUNT(*) AS cnt FROM cd_node WHERE module_id=? AND node_type=\'leaf\' AND is_active=1', [moduleId])[0]?.cnt ?? 0
  return { nodeCount, leafCount }
}

// ── Site-wide settings ──

export function getSetting(key) {
  const row = querySql('SELECT value FROM cd_setting WHERE key=? LIMIT 1', [key])[0]
  return row?.value ?? null
}

export function getAllSettings() {
  const rows = querySql('SELECT key, value FROM cd_setting')
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
}

export function setSetting(key, value) {
  runSql(
    `INSERT INTO cd_setting (key, value, updated_at)
     VALUES (?, ?, datetime('now','localtime'))
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now','localtime')`,
    [key, value]
  )
}
