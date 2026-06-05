import XLSX from 'xlsx'
import { querySql, runSql } from '../../db.js'
import { findNodeByPath, createNode, upsertContent } from './repository.js'

/**
 * Import Excel data into modules.
 * If moduleId is provided, imports all sheets into that module.
 * If moduleId is null, auto-maps sheets to modules by name matching.
 * Supports sheets with 3-5 column levels of hierarchy.
 * Content type is auto-detected from cell text patterns.
 */
export function importFromBuffer(moduleId, buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })

  // If no moduleId, try to auto-map sheets to modules
  const moduleMap = moduleId ? null : buildModuleMap()

  let created = 0
  let skipped = 0
  let sheetsProcessed = 0
  const details = []

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (data.length < 3) continue // need header + at least 1 data row

    // Determine target module for this sheet
    let targetModuleId = moduleId
    if (!targetModuleId && moduleMap) {
      targetModuleId = matchSheetToModule(sheetName, moduleMap)
    }
    if (!targetModuleId) continue

    const result = importSheet(targetModuleId, sheetName, data)
    created += result.created
    skipped += result.skipped
    sheetsProcessed++
    details.push({ sheet: sheetName, module: targetModuleId, ...result })
  }

  return { created, skipped, sheetsProcessed, details }
}

function buildModuleMap() {
  const modules = querySql('SELECT id, code, title FROM cd_module WHERE is_active=1')
  const map = {}
  for (const m of modules) {
    map[m.id] = m
    map[m.code] = m.id
    map[m.title] = m.id
  }
  return map
}

/**
 * Match a sheet name to the best module.
 * Matches by partial title inclusion.
 */
function matchSheetToModule(sheetName, moduleMap) {
  // Direct title match
  if (moduleMap[sheetName]) return moduleMap[sheetName]

  // Partial match
  for (const key of Object.keys(moduleMap)) {
    if (typeof moduleMap[key] !== 'number') continue
    const moduleEntry = moduleMap[moduleMap[key]]
    if (!moduleEntry) continue
    if (sheetName.includes(moduleEntry.title) || moduleEntry.title.includes(sheetName)) {
      return moduleMap[key]
    }
  }

  // Keyword matching for common patterns
  const sheet = sheetName.toLowerCase()
  if (sheet.includes('增值') || sheet.includes('value')) return findModuleIdByCode(moduleMap, 'value_added')
  if (sheet.includes('产业') || sheet.includes('chain')) return findModuleIdByCode(moduleMap, 'industry_chain')
  if (sheet.includes('利企') || sheet.includes('配套') || sheet.includes('enterprise')) return findModuleIdByCode(moduleMap, 'enterprise_support')

  return null
}

function findModuleIdByCode(moduleMap, code) {
  return moduleMap[code] || null
}

function importSheet(moduleId, sheetName, data) {
  let created = 0
  let skipped = 0
  const importOptions = {
    removeProvideDepartment: shouldRemoveProvideDepartment(moduleId)
  }

  // Detect column structure from header row (row 1, 0-indexed)
  const headerRow = data[1]
  const colMap = detectColumns(headerRow)

  // Track current path (fill-forward for empty cells)
  const currentPath = []

  for (let i = 2; i < data.length; i++) {
    const row = data[i]
    if (!row || row.every((c) => String(c).trim() === '')) continue

    // Extract hierarchy values with fill-forward
    const levels = []
    for (let lv = 0; lv < colMap.levelCount; lv++) {
      const val = String(row[colMap.levelCols[lv]] ?? '').trim()
      if (val) {
        currentPath[lv] = val
        // Truncate path when a new value appears at this level
        currentPath.length = lv + 1
      }
      levels.push(currentPath[lv] || '')
    }

    // Skip if no meaningful data
    if (levels.every((v) => !v)) continue

    // Determine actual leaf depth: find the last non-empty level in this row
    // (some rows have content at 4th level, others at 5th)
    let actualLeafDepth = levels.length - 1
    for (let lv = levels.length - 1; lv >= 0; lv--) {
      const rawVal = String(row[colMap.levelCols[lv]] ?? '').trim()
      if (rawVal) {
        actualLeafDepth = lv
        break
      }
    }

    // Build tree nodes for each level up to actual leaf depth
    let parentId = null
    for (let lv = 0; lv <= actualLeafDepth; lv++) {
      if (!levels[lv]) continue

      const isLeaf = lv === actualLeafDepth
      const existing = findNodeByPath(moduleId, parentId, levels[lv])

      if (existing) {
        parentId = existing.id
        if (isLeaf) {
          skipped++
        }
      } else {
        const nodeId = createNode({
          module_id: moduleId,
          parent_id: parentId,
          title: levels[lv],
          node_type: isLeaf ? 'leaf' : 'branch',
          sort_order: i
        })
        parentId = nodeId
        created++

        // Create content for leaf nodes
        if (isLeaf) {
          createLeafContent(nodeId, row, colMap, actualLeafDepth, importOptions)
        }
      }
    }
  }

  return { created, skipped }
}

function shouldRemoveProvideDepartment(moduleId) {
  const module = querySql('SELECT code, title FROM cd_module WHERE id=? LIMIT 1', [moduleId])[0]
  return module?.code === 'enterprise_support' || String(module?.title || '').includes('利企配套')
}

function detectColumns(headerRow) {
  const headers = headerRow.map((h) => String(h).trim())

  // Find hierarchy columns (一级/二级/三级/四级/五级)
  const levelCols = []
  for (let i = 0; i < headers.length; i++) {
    if (/^一级/.test(headers[i]) || /^二级/.test(headers[i]) ||
        /^三级/.test(headers[i]) || /^四级/.test(headers[i]) || /^五级/.test(headers[i])) {
      levelCols.push(i)
    }
  }

  // Sort by level number
  levelCols.sort((a, b) => a - b)

  // Find metadata columns
  const deptCol = headers.findIndex((h) => /部门|单位/.test(h))
  const remarkCol = headers.findIndex((h) => /备注/.test(h))

  return {
    levelCols,
    levelCount: levelCols.length || 4, // default 4 levels
    deptCol: deptCol >= 0 ? deptCol : -1,
    remarkCol: remarkCol >= 0 ? remarkCol : -1
  }
}

function createLeafContent(nodeId, row, colMap, leafDepth, options = {}) {
  const leafCol = colMap.levelCols[leafDepth] ?? colMap.levelCols[colMap.levelCols.length - 1]
  const contentText = normalizeImportedContentText(String(row[leafCol] ?? '').trim(), options)
  const department = colMap.deptCol >= 0 ? String(row[colMap.deptCol] ?? '').trim() : ''
  const remark = colMap.remarkCol >= 0 ? String(row[colMap.remarkCol] ?? '').trim() : ''

  if (!contentText && !department && !remark) return

  const detected = detectContentType(contentText, options)

  if (detected.type === 'link') {
    upsertContent(nodeId, {
      content_type: 'link',
      summary: detected.label,
      link_url: detected.url,
      link_label: detected.label,
      link_target: '_blank',
      department: department || null,
      remark: remark || null
    })
  } else if (detected.type === 'info') {
    upsertContent(nodeId, {
      content_type: 'info',
      summary: detected.fields[0]?.field_value || null,
      department: department || null,
      remark: remark || null
    }, detected.fields)
  } else {
    upsertContent(nodeId, {
      content_type: 'richtext',
      body: contentText,
      department: department || null,
      remark: remark || null
    })
  }
}

/**
 * Detect content type from cell text.
 * - "跳xxx平台" + "网址：..." → link
 * - "服务内容：xxx\n服务地点：xxx" → info with parsed fields
 * - Otherwise → richtext
 */
export function normalizeImportedContentText(text, options = {}) {
  const value = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!value || !options.removeProvideDepartment) return value

  const nextLabelRe = /^(服务内容|服务地点|服务地点\/窗口|办公时间|咨询电话|我要咨询|我要申报|线上申报)[：:]/
  const lines = value.split('\n')
  const kept = []
  let skipping = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^提供部门[：:]/.test(trimmed)) {
      skipping = true
      continue
    }
    if (skipping && nextLabelRe.test(trimmed)) {
      skipping = false
    }
    if (!skipping) kept.push(line)
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeLinkLabel(text, url, rawLabel = '') {
  if (String(text || '').includes('山东政务服务中介超市')) {
    return '点击访问山东政务服务中介超市'
  }
  return rawLabel.trim() || url
}

export function detectContentType(text, options = {}) {
  const normalizedText = normalizeImportedContentText(text, options)
  if (!normalizedText) return { type: 'richtext' }

  // Link pattern: "跳" + description + "网址：URL"
  const linkMatch = normalizedText.match(/跳[“"]?(.*?)[”"]?\s*(?:网站)?网址[：:]\s*(https?:\/\/[^\s）)]+)/)
  if (linkMatch) {
    const url = linkMatch[2].trim()
    return {
      type: 'link',
      label: normalizeLinkLabel(normalizedText, url, linkMatch[1]),
      url
    }
  }

  // Plain URL pattern
  const urlMatch = normalizedText.match(/^(https?:\/\/\S+)$/)
  if (urlMatch) {
    return {
      type: 'link',
      label: normalizedText,
      url: urlMatch[1]
    }
  }

  const embeddedUrlMatch = normalizedText.match(/https?:\/\/[^\s）)]+/)
  if (embeddedUrlMatch) {
    const url = embeddedUrlMatch[0]
    return {
      type: 'link',
      label: normalizeLinkLabel(normalizedText, url),
      url
    }
  }

  // Structured info pattern: "服务内容：xxx\n服务地点：xxx\n..."
  const infoPatterns = [
    { key: 'service_content', label: '服务内容' },
    { key: 'location', label: '服务地点' },
    { key: 'location', label: '服务地点/窗口' },
    { key: 'department', label: '提供部门' },
    { key: 'work_hours', label: '办公时间' },
    { key: 'phone', label: '咨询电话' },
    { key: 'apply', label: '我要咨询' },
    { key: 'apply', label: '我要申报' }
  ]

  const fields = []
  for (const pattern of infoPatterns) {
    const regex = new RegExp(`${pattern.label}[：:]([^\\n]+)`)
    const m = normalizedText.match(regex)
    if (m) {
      fields.push({
        field_key: pattern.key,
        field_label: pattern.label,
        field_value: m[1].trim()
      })
    }
  }

  if (fields.length >= 2) {
    return { type: 'info', fields }
  }

  return { type: 'richtext' }
}
