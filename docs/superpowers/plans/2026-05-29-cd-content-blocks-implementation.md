# CD Content Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `/admin/cd` so leaf nodes can maintain ordered mixed content blocks while old `link/info/richtext` content keeps rendering almost unchanged.

**Architecture:** Add normalized block tables beside the existing `cd_content` model, return blocks inside leaf `content`, and keep legacy fields as fallback. The admin editor normalizes old content into editable blocks and saves blocks through the existing content endpoint. The public renderer prefers blocks when present and otherwise uses the current legacy rendering path.

**Tech Stack:** Express 4 + sql.js + Vitest/Supertest; React 18 + Vite + Ant Design 5 + Testing Library; `dompurify` for browser-side rich text cleanup.

---

## File Structure

### Backend

- Modify: `backend/modules/home-industry/schema.js` — add `cd_content_block` and `cd_content_block_field`.
- Create: `backend/modules/home-industry/content-blocks.js` — block type constants, URL validation, basic HTML sanitizing, request normalization.
- Modify: `backend/modules/home-industry/repository.js` — load, save, and delete content blocks.
- Modify: `backend/modules/home-industry/admin-routes.js` — reject blocks on branch nodes and pass blocks to repository.
- Create: `backend/tests/home-industry-content-blocks.test.js` — backend contract tests.

### Frontend

- Modify: `frontend/package.json`, `frontend/package-lock.json` — add `dompurify`.
- Create: `frontend/src/utils/contentBlocks.js` — legacy-to-block normalization, sanitizing, serialization, summaries.
- Create: `frontend/src/pages/home-industry/ContentBlocksRenderer.jsx` — public block rendering.
- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx` — prefer blocks, keep legacy fallback.
- Modify: `frontend/src/api/homeIndustry.js` — send one payload from `updateAdminCdContent`.
- Modify: `frontend/src/pages/admin/ContentEditor.jsx` — leaf-only block editor.
- Create: `frontend/src/pages/admin/content-blocks/ContentBlockEditor.jsx`
- Create: `frontend/src/pages/admin/content-blocks/BlockList.jsx`
- Create: `frontend/src/pages/admin/content-blocks/BlockPropertyPanel.jsx`
- Create: `frontend/src/pages/admin/content-blocks/LightRichTextEditor.jsx`
- Modify: `frontend/src/styles/historic.css`, `frontend/src/styles/admin.css`
- Create tests:
  - `frontend/src/tests/content-blocks-utils.test.js`
  - `frontend/src/tests/home-industry-content-blocks.test.jsx`
  - `frontend/src/tests/admin-cd-content-block-editor.test.jsx`

---

### Task 1: Backend Content Block Contract Tests

**Files:**
- Create: `backend/tests/home-industry-content-blocks.test.js`

- [ ] **Step 1: Write the failing backend tests**

Create `backend/tests/home-industry-content-blocks.test.js`:

```js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { querySql } from '../db.js'

async function createModule(prefix = 'blocks') {
  const marker = `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const createRes = await request(app)
    .post('/api/admin/cd/modules')
    .send({ code: marker, title: `内容块测试模块 ${marker}` })
  expect(createRes.status).toBe(200)
  const module = createRes.body.data.find((item) => item.code === marker)
  expect(module).toBeTruthy()
  return module
}

async function createNode(moduleId, overrides = {}) {
  const res = await request(app)
    .post('/api/admin/cd/nodes')
    .send({
      module_id: moduleId,
      parent_id: null,
      title: overrides.title || `测试节点 ${Date.now()}`,
      node_type: overrides.node_type || 'leaf',
      sort_order: overrides.sort_order ?? 1
    })
  expect(res.status).toBe(200)
  return res.body.data.id
}

function sampleBlocks() {
  return [
    { block_type: 'heading', title: '线上申报', sort_order: 0 },
    {
      block_type: 'richtext',
      title: '服务说明',
      content_html: '<p><strong>请先准备材料</strong></p><script>alert(1)</script>',
      content_text: '请先准备材料',
      sort_order: 1
    },
    {
      block_type: 'link',
      link_label: '我要申报',
      link_url: 'https://example.com/apply',
      link_target: '_blank',
      sort_order: 2
    },
    {
      block_type: 'fields',
      title: '咨询信息',
      sort_order: 3,
      fields: [
        { field_key: 'phone', field_label: '咨询电话', field_value: '0532-66200486', sort_order: 0 },
        { field_key: 'time', field_label: '咨询时间', field_value: '工作日9:00-17:30', sort_order: 1 }
      ]
    },
    {
      block_type: 'notice',
      title: '温馨提示',
      content_html: '<p>请以实际窗口要求为准。</p>',
      content_text: '请以实际窗口要求为准。',
      sort_order: 4
    }
  ]
}

describe('home-industry content blocks', () => {
  it('saves leaf blocks and returns them in admin node detail in sort order', async () => {
    const module = await createModule('admin_blocks')
    const leafId = await createNode(module.id, { title: '办理食品经营许可' })

    const saveRes = await request(app)
      .put(`/api/admin/cd/contents/${leafId}`)
      .send({ content_type: 'richtext', summary: '食品经营许可说明', blocks: sampleBlocks() })

    expect(saveRes.status).toBe(200)
    const blocks = saveRes.body.data.content.blocks
    expect(blocks.map((block) => block.block_type)).toEqual(['heading', 'richtext', 'link', 'fields', 'notice'])
    expect(blocks[1].content_html).not.toContain('<script>')
    expect(blocks[3].fields.map((field) => field.field_label)).toEqual(['咨询电话', '咨询时间'])

    const detailRes = await request(app).get(`/api/admin/cd/nodes/${leafId}`)
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.content.blocks.map((block) => block.block_type)).toEqual(['heading', 'richtext', 'link', 'fields', 'notice'])
  })

  it('returns blocks for leaf nodes from public module tree', async () => {
    const module = await createModule('public_blocks')
    const leafId = await createNode(module.id, { title: '餐饮业禁设区域咨询' })

    const saveRes = await request(app)
      .put(`/api/admin/cd/contents/${leafId}`)
      .send({ content_type: 'richtext', summary: '咨询说明', blocks: sampleBlocks() })
    expect(saveRes.status).toBe(200)

    const treeRes = await request(app).get(`/api/cd/public/modules/${module.code}/tree`)
    expect(treeRes.status).toBe(200)
    const leaf = treeRes.body.data.tree.find((node) => node.id === leafId)
    expect(leaf.content.blocks).toHaveLength(5)
    expect(leaf.content.blocks[2].link_label).toBe('我要申报')
  })

  it('rejects content blocks on branch nodes', async () => {
    const module = await createModule('branch_blocks')
    const branchId = await createNode(module.id, { title: '目录节点', node_type: 'branch' })

    const res = await request(app)
      .put(`/api/admin/cd/contents/${branchId}`)
      .send({ blocks: [{ block_type: 'heading', title: '不允许保存', sort_order: 0 }] })

    expect(res.status).toBe(400)
    expect(res.body.msg).toContain('内容块仅支持叶子节点')
  })

  it('rejects unsafe link urls in link blocks', async () => {
    const module = await createModule('bad_url_blocks')
    const leafId = await createNode(module.id, { title: '链接校验节点' })

    const res = await request(app)
      .put(`/api/admin/cd/contents/${leafId}`)
      .send({ blocks: [{ block_type: 'link', link_label: '危险链接', link_url: 'javascript:alert(1)', sort_order: 0 }] })

    expect(res.status).toBe(400)
    expect(res.body.msg).toContain('invalid link_url')
  })

  it('deletes content blocks and fields when deleting a leaf node', async () => {
    const module = await createModule('delete_blocks')
    const leafId = await createNode(module.id, { title: '待删除节点' })

    const saveRes = await request(app).put(`/api/admin/cd/contents/${leafId}`).send({ blocks: sampleBlocks() })
    expect(saveRes.status).toBe(200)
    expect(querySql('SELECT COUNT(*) AS cnt FROM cd_content_block WHERE node_id=?', [leafId])[0].cnt).toBeGreaterThan(0)

    const deleteRes = await request(app).delete(`/api/admin/cd/nodes/${leafId}`)
    expect(deleteRes.status).toBe(200)
    expect(querySql('SELECT COUNT(*) AS cnt FROM cd_content_block WHERE node_id=?', [leafId])[0].cnt).toBe(0)
    expect(querySql('SELECT COUNT(*) AS cnt FROM cd_content_block_field WHERE block_id NOT IN (SELECT id FROM cd_content_block)')[0].cnt).toBe(0)
  })
})
```

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```bash
cd backend
npm test -- home-industry-content-blocks.test.js
```

Expected: FAIL because the block tables and `content.blocks` API do not exist yet.

- [ ] **Step 3: Commit failing tests**

```bash
git add backend/tests/home-industry-content-blocks.test.js
git commit -m "test: add cd content block backend contract"
```

---

### Task 2: Backend Schema, Repository, and Route Implementation

**Files:**
- Modify: `backend/modules/home-industry/schema.js`
- Create: `backend/modules/home-industry/content-blocks.js`
- Modify: `backend/modules/home-industry/repository.js`
- Modify: `backend/modules/home-industry/admin-routes.js`

- [ ] **Step 1: Add schema**

In `backend/modules/home-industry/schema.js`, append inside `ensureHomeIndustryTables(db)`:

```js
  db.run(`CREATE TABLE IF NOT EXISTS cd_content_block (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    block_type TEXT NOT NULL,
    title TEXT,
    content_html TEXT,
    content_text TEXT,
    link_label TEXT,
    link_url TEXT,
    link_target TEXT DEFAULT '_blank',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS cd_content_block_field (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    field_key TEXT,
    field_label TEXT NOT NULL,
    field_value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_block_node ON cd_content_block(node_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_block_sort ON cd_content_block(node_id, sort_order, id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_block_field_block ON cd_content_block_field(block_id)`)
```

- [ ] **Step 2: Create backend block normalizer**

Create `backend/modules/home-industry/content-blocks.js`:

```js
export const CONTENT_BLOCK_TYPES = new Set(['heading', 'richtext', 'link', 'fields', 'notice'])

export function isValidContentBlockLink(url) {
  if (!url) return true
  const value = String(url).trim()
  return /^https?:\/\//i.test(value) || value.startsWith('/')
}

export function sanitizeContentBlockHtml(value) {
  if (!value) return ''
  return String(value)
    .replace(/<\/?script\b[^>]*>/gi, '')
    .replace(/<\/?iframe\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
}

export function normalizeContentBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return []
  return blocks
    .map((block, index) => {
      const blockType = String(block?.block_type || '').trim()
      if (!CONTENT_BLOCK_TYPES.has(blockType)) {
        const err = new Error(`invalid block_type: ${blockType}`)
        err.statusCode = 400
        throw err
      }
      const linkUrl = block.link_url == null ? null : String(block.link_url).trim()
      if (blockType === 'link' && !isValidContentBlockLink(linkUrl)) {
        const err = new Error('invalid link_url')
        err.statusCode = 400
        throw err
      }
      const normalized = {
        block_type: blockType,
        title: block.title == null ? null : String(block.title).trim(),
        content_html: block.content_html == null ? null : sanitizeContentBlockHtml(block.content_html),
        content_text: block.content_text == null ? null : String(block.content_text).trim(),
        link_label: block.link_label == null ? null : String(block.link_label).trim(),
        link_url: linkUrl || null,
        link_target: block.link_target === '_self' ? '_self' : '_blank',
        sort_order: Number.isFinite(Number(block.sort_order)) ? Number(block.sort_order) : index,
        fields: []
      }
      if (blockType === 'fields') {
        normalized.fields = Array.isArray(block.fields)
          ? block.fields
              .filter((field) => String(field?.field_label || '').trim() && String(field?.field_value || '').trim())
              .map((field, fieldIndex) => ({
                field_key: field.field_key == null ? `field_${fieldIndex}` : String(field.field_key).trim(),
                field_label: String(field.field_label).trim(),
                field_value: String(field.field_value).trim(),
                sort_order: Number.isFinite(Number(field.sort_order)) ? Number(field.sort_order) : fieldIndex
              }))
          : []
      }
      return normalized
    })
    .filter((block) => {
      if (block.block_type === 'heading') return Boolean(block.title)
      if (block.block_type === 'link') return Boolean(block.link_label || block.link_url)
      if (block.block_type === 'fields') return block.fields.length > 0
      return Boolean(block.content_html || block.content_text || block.title)
    })
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function deriveLegacyContentFromBlocks(blocks = []) {
  const firstLink = blocks.find((block) => block.block_type === 'link')
  const firstText = blocks.find((block) => block.content_text || block.title)
  const firstFields = blocks.find((block) => block.block_type === 'fields')
  if (firstLink) {
    return {
      content_type: 'link',
      summary: firstLink.link_label || firstLink.link_url || null,
      link_url: firstLink.link_url || null,
      link_label: firstLink.link_label || null,
      link_target: firstLink.link_target || '_blank'
    }
  }
  if (firstFields && !firstText) {
    return { content_type: 'info', summary: firstFields.title || firstFields.fields[0]?.field_value || null }
  }
  return {
    content_type: 'richtext',
    summary: firstText?.content_text || firstText?.title || null,
    body: firstText?.content_html || null
  }
}
```

- [ ] **Step 3: Extend repository**

In `backend/modules/home-industry/repository.js`, import:

```js
import { normalizeContentBlocks, deriveLegacyContentFromBlocks } from './content-blocks.js'
```

Add these helpers:

```js
function getContentBlocks(nodeId) {
  const blocks = querySql('SELECT * FROM cd_content_block WHERE node_id=? AND is_active=1 ORDER BY sort_order,id', [nodeId])
  for (const block of blocks) {
    block.fields = block.block_type === 'fields'
      ? querySql('SELECT * FROM cd_content_block_field WHERE block_id=? ORDER BY sort_order,id', [block.id])
      : []
  }
  return blocks
}

function getContentsByNodeIds(nodeIds) {
  if (!nodeIds.length) return {}
  const placeholders = nodeIds.map(() => '?').join(',')
  const contents = querySql(`SELECT * FROM cd_content WHERE node_id IN (${placeholders})`, nodeIds)
  const contentByNodeId = {}
  for (const content of contents) {
    content.fields = querySql('SELECT * FROM cd_content_field WHERE content_id=? ORDER BY sort_order,id', [content.id])
    content.blocks = getContentBlocks(content.node_id)
    contentByNodeId[content.node_id] = content
  }
  return contentByNodeId
}

function replaceContentBlocks(nodeId, blocks = []) {
  const existingBlocks = querySql('SELECT id FROM cd_content_block WHERE node_id=?', [nodeId])
  for (const block of existingBlocks) runSql('DELETE FROM cd_content_block_field WHERE block_id=?', [block.id])
  runSql('DELETE FROM cd_content_block WHERE node_id=?', [nodeId])

  const normalizedBlocks = normalizeContentBlocks(blocks)
  for (let i = 0; i < normalizedBlocks.length; i++) {
    const block = normalizedBlocks[i]
    runSql(
      `INSERT INTO cd_content_block
       (node_id, block_type, title, content_html, content_text, link_label, link_url, link_target, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [nodeId, block.block_type, block.title, block.content_html, block.content_text, block.link_label, block.link_url, block.link_target || '_blank', i]
    )
    const created = querySql('SELECT id FROM cd_content_block WHERE node_id=? ORDER BY id DESC LIMIT 1', [nodeId])[0]
    if (created && block.block_type === 'fields') {
      for (let j = 0; j < block.fields.length; j++) {
        const field = block.fields[j]
        runSql(
          'INSERT INTO cd_content_block_field (block_id, field_key, field_label, field_value, sort_order) VALUES (?,?,?,?,?)',
          [created.id, field.field_key || `field_${j}`, field.field_label, field.field_value, j]
        )
      }
    }
  }
  return normalizedBlocks
}
```

Replace `getTree(moduleId)` and `buildTree` with versions that add `content`:

```js
export function getTree(moduleId) {
  const rows = querySql('SELECT * FROM cd_node WHERE module_id = ? AND is_active = 1 ORDER BY sort_order, id', [moduleId])
  const contentsByNodeId = getContentsByNodeIds(rows.map((row) => row.id))
  return buildTree(rows, contentsByNodeId)
}

function buildTree(rows, contentsByNodeId = {}) {
  const map = {}
  const roots = []
  for (const row of rows) {
    const content = contentsByNodeId[row.id] || null
    map[row.id] = {
      ...row,
      content,
      content_type: content?.content_type ?? null,
      summary: content?.summary ?? null,
      department: content?.department ?? null,
      remark: content?.remark ?? null,
      link_url: content?.link_url ?? null,
      link_label: content?.link_label ?? null,
      link_target: content?.link_target ?? null,
      body: content?.body ?? null,
      children: []
    }
  }
  for (const row of rows) {
    const node = map[row.id]
    if (row.parent_id && map[row.parent_id]) map[row.parent_id].children.push(node)
    else roots.push(node)
  }
  return roots
}
```

In `getNodeWithContent(id)`, add `content.blocks = getContentBlocks(id)` after loading `content.fields`.

In `deleteNodeContent(nodeId)`, delete new records before deleting `cd_content`:

```js
  const blocks = querySql('SELECT id FROM cd_content_block WHERE node_id=?', [nodeId])
  for (const block of blocks) runSql('DELETE FROM cd_content_block_field WHERE block_id=?', [block.id])
  runSql('DELETE FROM cd_content_block WHERE node_id=?', [nodeId])
```

Change `upsertContent` to `export function upsertContent(nodeId, contentData, fields = [], blocks)` and merge block-derived legacy content:

```js
const blockLegacy = Array.isArray(blocks) ? deriveLegacyContentFromBlocks(normalizeContentBlocks(blocks)) : {}
const nextContentData = { ...blockLegacy, ...contentData }
```

Use `nextContentData` anywhere the function currently uses `contentData`, and call:

```js
if (Array.isArray(blocks)) replaceContentBlocks(nodeId, blocks)
```

at the end.

- [ ] **Step 4: Extend admin route validation**

In `backend/modules/home-industry/admin-routes.js`, update the `PUT /contents/:nodeId` route to load the node, reject blocks on branches, and catch normalizer errors:

```js
const node = getNodeById(nodeId)
if (!node) return res.status(404).json({ code: 404, msg: 'not found' })
const { content_type, summary, link_url, link_label, link_target, body, department, remark, fields, blocks } = req.body || {}
if (Array.isArray(blocks) && node.node_type !== 'leaf') {
  return res.status(400).json({ code: 400, msg: '内容块仅支持叶子节点' })
}
try {
  upsertContent(nodeId, contentData, fields || [], blocks)
} catch (e) {
  return res.status(e.statusCode || 500).json({ code: e.statusCode || 500, msg: e.message })
}
```

- [ ] **Step 5: Run backend verification**

```bash
cd backend
npm test -- home-industry-content-blocks.test.js
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit backend implementation**

```bash
git add backend/modules/home-industry/schema.js backend/modules/home-industry/content-blocks.js backend/modules/home-industry/repository.js backend/modules/home-industry/admin-routes.js
git commit -m "feat: add cd content block backend"
```

---

### Task 3: Frontend Helpers and Sanitizing

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json`
- Create: `frontend/src/utils/contentBlocks.js`
- Create: `frontend/src/tests/content-blocks-utils.test.js`

- [ ] **Step 1: Install DOMPurify**

```bash
cd frontend
npm install dompurify
```

Expected: `frontend/package.json` and `frontend/package-lock.json` change.

- [ ] **Step 2: Write failing helper tests**

Create `frontend/src/tests/content-blocks-utils.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { normalizeContentToBlocks, serializeBlocksForSave, sanitizeBlockHtml, summarizeBlock } from '../utils/contentBlocks'

describe('content block helpers', () => {
  it('normalizes legacy link content into summary and link blocks', () => {
    const blocks = normalizeContentToBlocks({
      content_type: 'link',
      summary: '请阅读办理说明',
      link_label: '我要申报',
      link_url: 'https://example.com/apply',
      link_target: '_blank'
    })
    expect(blocks.map((block) => block.block_type)).toEqual(['richtext', 'link'])
    expect(blocks[0].content_html).toContain('请阅读办理说明')
    expect(blocks[1].link_label).toBe('我要申报')
  })

  it('normalizes legacy info fields plus department and remark', () => {
    const blocks = normalizeContentToBlocks({
      content_type: 'info',
      fields: [{ field_label: '咨询电话', field_value: '0532-66200486' }],
      department: '行政审批服务局',
      remark: '请提前电话咨询'
    })
    const fieldsBlock = blocks.find((block) => block.block_type === 'fields')
    expect(fieldsBlock.fields.map((field) => field.field_label)).toEqual(['咨询电话', '提供部门'])
    expect(blocks.at(-1).block_type).toBe('notice')
  })

  it('sanitizes dangerous html', () => {
    const html = sanitizeBlockHtml('<p onclick="alert(1)">安全</p><script>alert(1)</script>')
    expect(html).toContain('安全')
    expect(html).not.toContain('script')
    expect(html).not.toContain('onclick')
  })

  it('serializes empty rows out of fields blocks', () => {
    const payload = serializeBlocksForSave([{ block_type: 'fields', title: '咨询信息', fields: [
      { field_label: '电话', field_value: '12345' },
      { field_label: '', field_value: '空标签' },
      { field_label: '空值', field_value: '' }
    ] }])
    expect(payload[0].fields).toEqual([{ field_key: 'field_0', field_label: '电话', field_value: '12345', sort_order: 0 }])
  })

  it('summarizes each block type for the admin list', () => {
    expect(summarizeBlock({ block_type: 'heading', title: '线上申报' })).toBe('分组标题：线上申报')
    expect(summarizeBlock({ block_type: 'link', link_label: '我要申报' })).toBe('链接：我要申报')
    expect(summarizeBlock({ block_type: 'fields', fields: [{}, {}] })).toBe('信息字段：2 项')
  })
})
```

- [ ] **Step 3: Run helper tests and verify failure**

```bash
cd frontend
npm test -- content-blocks-utils.test.js
```

Expected: FAIL because `../utils/contentBlocks` does not exist.

- [ ] **Step 4: Implement helper module**

Create `frontend/src/utils/contentBlocks.js` with these exported functions:

```js
import DOMPurify from 'dompurify'

export const CONTENT_BLOCK_TYPES = [
  { label: '分组标题', value: 'heading' },
  { label: '描述/富文本', value: 'richtext' },
  { label: '链接按钮', value: 'link' },
  { label: '信息字段', value: 'fields' },
  { label: '提示说明', value: 'notice' }
]

export function sanitizeBlockHtml(html = '') {
  return DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  })
}

function escapeHtml(text = '') {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function textToHtml(text = '') {
  return String(text).split(/\n+/).filter((line) => line.trim()).map((line) => `<p>${escapeHtml(line.trim())}</p>`).join('')
}

export function stripHtml(html = '') {
  const div = document.createElement('div')
  div.innerHTML = sanitizeBlockHtml(html)
  return div.textContent || div.innerText || ''
}

function withClientId(block, index) {
  return { client_id: block.client_id || `block_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`, sort_order: index, ...block }
}

export function createDefaultBlock(blockType) {
  const base = { block_type: blockType, title: '', content_html: '', content_text: '', fields: [] }
  if (blockType === 'heading') return { ...base, title: '新分组标题' }
  if (blockType === 'richtext') return { ...base, title: '服务说明', content_html: '<p>请输入说明内容</p>' }
  if (blockType === 'link') return { ...base, link_label: '我要申报', link_url: '', link_target: '_blank' }
  if (blockType === 'fields') return { ...base, title: '信息字段', fields: [{ field_key: 'field_0', field_label: '', field_value: '' }] }
  if (blockType === 'notice') return { ...base, title: '温馨提示', content_html: '<p>请输入提示内容</p>' }
  return { ...base, block_type: 'richtext' }
}

export function normalizeContentToBlocks(content = {}) {
  if (Array.isArray(content.blocks) && content.blocks.length > 0) {
    return content.blocks.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((block, index) => withClientId({
      ...block,
      content_html: sanitizeBlockHtml(block.content_html || ''),
      fields: Array.isArray(block.fields) ? block.fields : []
    }, index))
  }
  const blocks = []
  if (content.summary) blocks.push({ block_type: 'richtext', title: '摘要', content_html: textToHtml(content.summary), content_text: content.summary })
  if (content.content_type === 'link' && (content.link_url || content.link_label)) {
    blocks.push({ block_type: 'link', link_label: content.link_label || content.link_url, link_url: content.link_url || '', link_target: content.link_target || '_blank' })
  }
  if (content.content_type === 'richtext' && content.body) {
    blocks.push({ block_type: 'richtext', title: '正文', content_html: textToHtml(content.body), content_text: content.body })
  }
  const fields = (Array.isArray(content.fields) ? content.fields : [])
    .filter((field) => field.field_label && field.field_value)
    .map((field, index) => ({ field_key: field.field_key || `field_${index}`, field_label: field.field_label, field_value: field.field_value, sort_order: index }))
  if (content.department) fields.push({ field_key: 'department', field_label: '提供部门', field_value: content.department, sort_order: fields.length })
  if ((content.content_type === 'info' || fields.length > 0) && fields.length > 0) blocks.push({ block_type: 'fields', title: '信息字段', fields })
  if (content.remark) blocks.push({ block_type: 'notice', title: '备注', content_html: textToHtml(content.remark), content_text: content.remark })
  return blocks.map((block, index) => withClientId(block, index))
}

export function serializeBlocksForSave(blocks = []) {
  return blocks.map((block, index) => {
    const serialized = {
      block_type: block.block_type,
      title: block.title || null,
      content_html: sanitizeBlockHtml(block.content_html || ''),
      content_text: block.content_text || stripHtml(block.content_html || ''),
      link_label: block.link_label || null,
      link_url: block.link_url || null,
      link_target: block.link_target === '_self' ? '_self' : '_blank',
      sort_order: index
    }
    if (block.block_type === 'fields') {
      let fieldIndex = 0
      serialized.fields = (block.fields || []).filter((field) => String(field.field_label || '').trim() && String(field.field_value || '').trim()).map((field) => ({
        field_key: field.field_key || `field_${fieldIndex}`,
        field_label: String(field.field_label).trim(),
        field_value: String(field.field_value).trim(),
        sort_order: fieldIndex++
      }))
    }
    return serialized
  }).filter((block) => {
    if (block.block_type === 'heading') return Boolean(block.title)
    if (block.block_type === 'link') return Boolean(block.link_label || block.link_url)
    if (block.block_type === 'fields') return block.fields.length > 0
    return Boolean(block.content_html || block.content_text || block.title)
  })
}

export function deriveLegacyPayloadFromBlocks(blocks = []) {
  const serialized = serializeBlocksForSave(blocks)
  const link = serialized.find((block) => block.block_type === 'link')
  const fields = serialized.find((block) => block.block_type === 'fields')
  const text = serialized.find((block) => block.content_text || block.title)
  if (link) return { content_type: 'link', summary: link.link_label || link.link_url || null, link_label: link.link_label || null, link_url: link.link_url || null, link_target: link.link_target || '_blank' }
  if (fields && !text) return { content_type: 'info', summary: fields.title || fields.fields[0]?.field_value || null }
  return { content_type: 'richtext', summary: text?.content_text || text?.title || null, body: text?.content_text || null }
}

export function summarizeBlock(block = {}) {
  if (block.block_type === 'heading') return `分组标题：${block.title || '未命名'}`
  if (block.block_type === 'link') return `链接：${block.link_label || block.link_url || '未填写'}`
  if (block.block_type === 'fields') return `信息字段：${(block.fields || []).length} 项`
  if (block.block_type === 'notice') return `提示说明：${block.title || stripHtml(block.content_html || '').slice(0, 16) || '未填写'}`
  return `描述：${block.title || stripHtml(block.content_html || '').slice(0, 16) || '未填写'}`
}
```

- [ ] **Step 5: Run and commit**

```bash
cd frontend
npm test -- content-blocks-utils.test.js
git add frontend/package.json frontend/package-lock.json frontend/src/utils/contentBlocks.js frontend/src/tests/content-blocks-utils.test.js
git commit -m "feat: add cd content block helpers"
```

Expected: test PASS, commit succeeds.

---

### Task 4: Public Content Block Rendering

**Files:**
- Create: `frontend/src/pages/home-industry/ContentBlocksRenderer.jsx`
- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`
- Modify: `frontend/src/styles/historic.css`
- Create: `frontend/src/tests/home-industry-content-blocks.test.jsx`

- [ ] **Step 1: Write failing renderer tests**

Create `frontend/src/tests/home-industry-content-blocks.test.jsx`:

```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContentBlocksRenderer from '../pages/home-industry/ContentBlocksRenderer'

describe('ContentBlocksRenderer', () => {
  it('renders mixed content blocks in order', () => {
    render(<ContentBlocksRenderer blocks={[
      { block_type: 'heading', title: '线上申报', sort_order: 0 },
      { block_type: 'richtext', content_html: '<p><strong>准备材料</strong></p>', sort_order: 1 },
      { block_type: 'link', link_label: '我要申报', link_url: 'https://example.com/apply', link_target: '_blank', sort_order: 2 },
      { block_type: 'fields', title: '咨询信息', sort_order: 3, fields: [{ field_label: '咨询电话', field_value: '0532-66200486' }] },
      { block_type: 'notice', content_html: '<p>以窗口要求为准</p>', sort_order: 4 }
    ]} />)
    expect(screen.getByText('线上申报')).toBeInTheDocument()
    expect(screen.getByText('准备材料')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /我要申报/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByText('咨询电话')).toBeInTheDocument()
    expect(screen.getByText('0532-66200486')).toBeInTheDocument()
    expect(screen.getByText('以窗口要求为准')).toBeInTheDocument()
  })

  it('does not render unsafe rich text content', () => {
    render(<ContentBlocksRenderer blocks={[{ block_type: 'richtext', content_html: '<p>安全</p><script>alert(1)</script>' }]} />)
    expect(screen.getByText('安全')).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

```bash
cd frontend
npm test -- home-industry-content-blocks.test.jsx
```

Expected: FAIL because renderer does not exist.

- [ ] **Step 3: Create renderer**

Create `frontend/src/pages/home-industry/ContentBlocksRenderer.jsx`:

```jsx
import { sanitizeBlockHtml } from '../../utils/contentBlocks'

function SafeHtml({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeBlockHtml(html || '') }} />
}

export default function ContentBlocksRenderer({ blocks = [] }) {
  const sortedBlocks = blocks.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return (
    <div className="hd-content-blocks">
      {sortedBlocks.map((block, index) => {
        const key = block.id || block.client_id || `${block.block_type}-${index}`
        if (block.block_type === 'heading') return <h4 key={key} className="hd-content-block-heading">{block.title}</h4>
        if (block.block_type === 'richtext') return <div key={key} className="hd-topic-description hd-content-block-richtext"><SafeHtml html={block.content_html || block.content_text} /></div>
        if (block.block_type === 'link' && (block.link_url || block.link_label)) {
          return <a key={key} href={block.link_url || '#'} target={block.link_target || '_blank'} rel="noopener noreferrer" className="hd-service-link"><span className="hd-service-link__text">{block.link_label || block.link_url}</span><span className="hd-service-link__arrow">→</span></a>
        }
        if (block.block_type === 'fields' && block.fields?.length > 0) {
          return <div key={key} className="hd-topic-info hd-content-block-fields">{block.title && <div className="hd-content-block-fields-title">{block.title}</div>}{block.fields.map((field, fieldIndex) => <div key={field.id || `${key}-field-${fieldIndex}`} className="hd-topic-info-field"><span className="label">{field.field_label}</span><span className="value">{field.field_value}</span></div>)}</div>
        }
        if (block.block_type === 'notice') return <div key={key} className="hd-content-block-notice">{block.title && <div className="hd-content-block-notice-title">{block.title}</div>}<SafeHtml html={block.content_html || block.content_text} /></div>
        return null
      })}
    </div>
  )
}
```

- [ ] **Step 4: Wire renderer into `ModuleDetailPage.jsx`**

Add import:

```js
import ContentBlocksRenderer from './ContentBlocksRenderer'
```

At the top of `LeafContent({ node })`, after `const content = node.content || {}`, add:

```jsx
if (content.blocks && content.blocks.length > 0) {
  return <ContentBlocksRenderer blocks={content.blocks} />
}
```

Keep the existing legacy `link/info/richtext` rendering below this guard.

- [ ] **Step 5: Add public styles**

Append to `frontend/src/styles/historic.css`:

```css
.hd-content-blocks { display: flex; flex-direction: column; gap: 12px; }
.hd-content-block-heading { margin: 4px 0 0; color: var(--hd-primary-dark); font-size: 15px; font-weight: 700; line-height: 1.6; }
.hd-content-block-richtext { margin-bottom: 0; }
.hd-content-block-richtext div, .hd-content-block-notice div { color: #1e4668; font-size: 0.95rem; line-height: 1.8; }
.hd-content-block-richtext p, .hd-content-block-notice p { margin: 0 0 8px; }
.hd-content-block-richtext p:last-child, .hd-content-block-notice p:last-child { margin-bottom: 0; }
.hd-content-block-fields { position: relative; }
.hd-content-block-fields-title { grid-column: 1 / -1; color: var(--hd-primary-dark); font-weight: 700; margin-bottom: 2px; }
.hd-content-block-notice { background: #fff8e6; border: 1px solid #ffe2a8; border-radius: 12px; padding: 14px 18px; color: #7a4b00; }
.hd-content-block-notice-title { font-weight: 700; margin-bottom: 6px; color: #b26b00; }
```

- [ ] **Step 6: Run and commit**

```bash
cd frontend
npm test -- home-industry-content-blocks.test.jsx
npm test -- content-blocks-utils.test.js
git add frontend/src/pages/home-industry/ContentBlocksRenderer.jsx frontend/src/pages/home-industry/ModuleDetailPage.jsx frontend/src/styles/historic.css frontend/src/tests/home-industry-content-blocks.test.jsx
git commit -m "feat: render cd content blocks on public pages"
```

Expected: tests PASS, commit succeeds.

---

### Task 5: Admin Content Block Editor

**Files:**
- Modify: `frontend/src/api/homeIndustry.js`
- Modify: `frontend/src/pages/admin/ContentEditor.jsx`
- Create: `frontend/src/pages/admin/content-blocks/ContentBlockEditor.jsx`
- Create: `frontend/src/pages/admin/content-blocks/BlockList.jsx`
- Create: `frontend/src/pages/admin/content-blocks/BlockPropertyPanel.jsx`
- Create: `frontend/src/pages/admin/content-blocks/LightRichTextEditor.jsx`
- Modify: `frontend/src/styles/admin.css`
- Create: `frontend/src/tests/admin-cd-content-block-editor.test.jsx`

- [ ] **Step 1: Write failing admin editor tests**

Create `frontend/src/tests/admin-cd-content-block-editor.test.jsx`:

```jsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ContentEditor from '../pages/admin/ContentEditor'
import * as homeApi from '../api/homeIndustry'

vi.mock('../api/homeIndustry', () => ({
  updateAdminCdNode: vi.fn(() => Promise.resolve({ data: { code: 200 } })),
  updateAdminCdContent: vi.fn(() => Promise.resolve({ data: { code: 200 } }))
}))

describe('CD ContentEditor content blocks', () => {
  it('shows branch guidance instead of content block editor', () => {
    render(<ContentEditor node={{ id: 1, title: '目录', node_type: 'branch', sort_order: 0 }} />)
    expect(screen.getByText('内容块仅支持叶子节点，请在叶子节点维护具体服务内容。')).toBeInTheDocument()
    expect(screen.queryByText('添加内容块')).not.toBeInTheDocument()
  })

  it('normalizes legacy link content into editable blocks and saves blocks', async () => {
    render(<ContentEditor node={{ id: 2, title: '食品经营许可', node_type: 'leaf', sort_order: 0, content: { content_type: 'link', summary: '办理说明', link_label: '我要申报', link_url: 'https://example.com/apply', link_target: '_blank' } }} onRefresh={vi.fn()} />)
    expect(screen.getByText('描述：摘要')).toBeInTheDocument()
    expect(screen.getByText('链接：我要申报')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /保存/ }))
    await waitFor(() => expect(homeApi.updateAdminCdContent).toHaveBeenCalled())
    const payload = homeApi.updateAdminCdContent.mock.calls[0][1]
    expect(payload.blocks.map((block) => block.block_type)).toEqual(['richtext', 'link'])
    expect(payload.blocks[1].link_url).toBe('https://example.com/apply')
  })

  it('adds a notice block from the add block selector', async () => {
    render(<ContentEditor node={{ id: 3, title: '咨询服务', node_type: 'leaf', sort_order: 0, content: null }} onRefresh={vi.fn()} />)
    fireEvent.mouseDown(screen.getByLabelText('新增内容块类型'))
    fireEvent.click(await screen.findByText('提示说明'))
    fireEvent.click(screen.getByRole('button', { name: '添加内容块' }))
    expect(screen.getByText(/提示说明/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

```bash
cd frontend
npm test -- admin-cd-content-block-editor.test.jsx
```

Expected: FAIL because block editor components do not exist.

- [ ] **Step 3: Implement admin components**

Implement these files using the helper functions from Task 3:

1. `frontend/src/pages/admin/content-blocks/LightRichTextEditor.jsx`
   - Use `contentEditable`.
   - Toolbar buttons call `document.execCommand('bold')`, `insertUnorderedList`, `insertOrderedList`, `createLink`, `removeFormat`.
   - Sanitize emitted HTML with `sanitizeBlockHtml`.
2. `frontend/src/pages/admin/content-blocks/BlockList.jsx`
   - Render `summarizeBlock(block)`.
   - Provide up, down, and delete buttons.
3. `frontend/src/pages/admin/content-blocks/BlockPropertyPanel.jsx`
   - Render form controls for `heading`, `richtext`, `link`, `fields`, and `notice`.
   - Fields block supports adding/removing label/value rows.
4. `frontend/src/pages/admin/content-blocks/ContentBlockEditor.jsx`
   - Local selected index state.
   - Add block using `createDefaultBlock(type)`.
   - Move and remove blocks locally.
   - Deletion uses `Modal.confirm`.

Use these prop contracts exactly:

```js
// ContentBlockEditor
{ blocks, onChange }

// BlockList
{ blocks, selectedIndex, onSelect, onMove, onRemove }

// BlockPropertyPanel
{ block, onChange }

// LightRichTextEditor
{ value, onChange }
```

- [ ] **Step 4: Update API helper**

In `frontend/src/api/homeIndustry.js`, ensure this export is exactly:

```js
export const updateAdminCdContent = (nodeId, data) => api.put(`/admin/cd/contents/${nodeId}`, data)
```

- [ ] **Step 5: Refactor `ContentEditor.jsx`**

Add imports:

```js
import { Alert, Modal } from 'antd'
import ContentBlockEditor from './content-blocks/ContentBlockEditor'
import { deriveLegacyPayloadFromBlocks, normalizeContentToBlocks, serializeBlocksForSave } from '../../utils/contentBlocks'
```

Add state:

```js
const [blocks, setBlocks] = useState([])
const [originalNodeType, setOriginalNodeType] = useState(node?.node_type)
```

In `useEffect`, after `const content = node.content || {}`:

```js
setOriginalNodeType(node.node_type)
setBlocks(node.node_type === 'leaf' ? normalizeContentToBlocks(content) : [])
```

In `handleSave`, before updating the node:

```js
if (originalNodeType && originalNodeType !== values.node_type) {
  await new Promise((resolve, reject) => {
    Modal.confirm({
      title: '确认修改节点类型？',
      content: '节点类型变化可能影响目录结构和内容块显示，请确认后继续保存。',
      okText: '继续保存',
      cancelText: '取消',
      onOk: resolve,
      onCancel: reject
    })
  })
}
```

Replace old leaf content save logic with:

```js
if (values.node_type === 'leaf') {
  const serializedBlocks = serializeBlocksForSave(blocks)
  const legacyPayload = deriveLegacyPayloadFromBlocks(serializedBlocks)
  await updateAdminCdContent(node.id, { ...legacyPayload, blocks: serializedBlocks })
}
```

Replace old `content_type` editor JSX with:

```jsx
{getFieldValue('node_type') === 'leaf' ? (
  <>
    <Divider>内容块设置</Divider>
    <ContentBlockEditor blocks={blocks} onChange={setBlocks} />
  </>
) : (
  <Alert type="info" showIcon message="内容块仅支持叶子节点，请在叶子节点维护具体服务内容。" />
)}
```

- [ ] **Step 6: Add admin CSS**

Append to `frontend/src/styles/admin.css`:

```css
.cd-content-block-editor { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; min-height: 360px; }
.cd-content-block-editor__list, .cd-content-block-editor__panel { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; padding: 12px; }
.cd-content-block-editor__toolbar { margin-bottom: 12px; }
.cd-block-list { display: flex; flex-direction: column; gap: 8px; }
.cd-block-list-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; cursor: pointer; background: #fafafa; }
.cd-block-list-item.is-active { border-color: #1677ff; background: #eaf3ff; }
.cd-block-list-item__title { font-weight: 600; margin-bottom: 8px; color: #1f2937; }
.cd-block-field-row { display: grid; grid-template-columns: 140px minmax(180px, 1fr) 24px; width: 100%; margin-bottom: 8px; }
.light-richtext-editor { border: 1px solid #d9d9d9; border-radius: 8px; overflow: hidden; background: #fff; }
.light-richtext-toolbar { padding: 8px; border-bottom: 1px solid #f0f0f0; background: #fafafa; }
.light-richtext-editable { min-height: 140px; padding: 10px 12px; outline: none; line-height: 1.7; }
@media (max-width: 1000px) { .cd-content-block-editor { grid-template-columns: 1fr; } }
```

- [ ] **Step 7: Run and commit**

```bash
cd frontend
npm test -- admin-cd-content-block-editor.test.jsx
npm test
git add frontend/src/api/homeIndustry.js frontend/src/pages/admin/ContentEditor.jsx frontend/src/pages/admin/content-blocks frontend/src/styles/admin.css frontend/src/tests/admin-cd-content-block-editor.test.jsx
git commit -m "feat: add cd admin content block editor"
```

Expected: tests PASS, commit succeeds.

---

### Task 6: End-to-End Verification

**Files:**
- Create: `docs/superpowers/verification/2026-05-29-cd-content-blocks.md`

- [ ] **Step 1: Run full verification**

```bash
cd backend
npm test
cd ../frontend
npm test
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Manual smoke test**

Run:

```bash
cd backend
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

Check:

1. `http://localhost:3000/admin/cd` branch node shows `内容块仅支持叶子节点，请在叶子节点维护具体服务内容。`
2. A leaf node can add `分组标题`、`描述/富文本`、`链接按钮`、`信息字段`、`提示说明`.
3. Saving and refreshing keeps block order and content.
4. `http://localhost:3000/homeIndustry/<moduleCode>` renders blocks in configured order.
5. An older leaf without blocks still renders through the legacy path.

- [ ] **Step 3: Record verification evidence**

Create `docs/superpowers/verification/2026-05-29-cd-content-blocks.md`:

```markdown
# CD Content Blocks Verification

## Automated Checks

- `cd backend && npm test`: PASS
- `cd frontend && npm test`: PASS
- `cd frontend && npm run build`: PASS

## Manual Smoke Test

- `/admin/cd` branch node shows leaf-only content block guidance: PASS
- `/admin/cd` leaf node can add heading/richtext/link/fields/notice blocks: PASS
- Saved blocks persist after refresh: PASS
- `/homeIndustry/:moduleCode` renders blocks in configured order: PASS
- Legacy leaf without blocks still renders through fallback path: PASS

## Notes

No known regressions observed during verification.
```

- [ ] **Step 4: Commit verification**

```bash
git add docs/superpowers/verification/2026-05-29-cd-content-blocks.md
git commit -m "docs: verify cd content blocks"
```

---

## Plan Self-Review

### Spec coverage

- Leaf-only content blocks: Task 1 branch rejection test, Task 2 route validation, Task 5 branch guidance.
- Five block types: Task 3 helper definitions, Task 4 renderer, Task 5 admin components.
- Old content compatibility: Task 3 normalization tests, Task 4 fallback guard, Task 5 legacy normalization.
- Frontend public mixed rendering: Task 4.
- Backend persistence and public/admin API contracts: Tasks 1-2.
- Rich text safety: Task 2 backend sanitizer, Task 3 DOMPurify helper, Task 4 renderer tests.
- Verification: Task 6.

### Placeholder scan

This plan contains no `TODO`, `TBD`, or unspecified implementation steps.

### Type consistency

The plan consistently uses:

- `block_type`: `heading | richtext | link | fields | notice`
- block fields: `title`, `content_html`, `content_text`, `link_label`, `link_url`, `link_target`, `sort_order`, `fields`
- field rows: `field_key`, `field_label`, `field_value`, `sort_order`
- API payload: `PUT /api/admin/cd/contents/:nodeId` with `{ ...legacyPayload, blocks }`
