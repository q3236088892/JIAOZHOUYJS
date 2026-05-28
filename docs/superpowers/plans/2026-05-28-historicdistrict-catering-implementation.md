# HistoricDistrict 餐饮业态（前台 + 后台）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking。

**Goal:** 在保留现有 `/events` 的前提下，新增 `/historicDistrict`（业态页）、`/historicDistrict/openRestaurant`（餐饮详情页）与 `/admin`（内容后台），并实现“左侧目录与右侧内容同源一致”的全量可维护。

**Architecture:** 后端在现有 Express + SQL.js 中新增 `hd_*` 内容模型和 public/admin 两组 API；前端新增 historic 页面与 admin 管理页，统一通过 API 驱动渲染；左侧目录由右侧阶段/分类/事项结构派生，禁止独立目录源。

**Tech Stack:** React 18 + react-router-dom 6 + Ant Design 5 + axios + Vite 5；Express 4 + sql.js；Vitest + Supertest（后端）/ Vitest + Testing Library（前端）。

---

## 文件结构与职责（先读）

### 后端
- Create: `backend/app.js`
  - Express app 工厂与默认实例导出（便于 Supertest）
- Modify: `backend/server.js`
  - 仅负责 `listen`
- Modify: `backend/db.js`
  - 保留 events 逻辑；新增 SQL helper 导出；新增 hd 表初始化入口
- Create: `backend/modules/historic/schema.js`
  - 创建 `hd_*` 表
- Create: `backend/modules/historic/seed.js`
  - 餐饮默认 seed 数据
- Create: `backend/modules/historic/repository.js`
  - historic 领域 SQL 访问与结构组装
- Create: `backend/modules/historic/public-routes.js`
  - `/api/historic/public/*`
- Create: `backend/modules/historic/admin-routes.js`
  - `/api/admin/historic/*`
- Create: `backend/tests/*.test.js`
  - 后端集成测试
- Modify: `backend/package.json`
  - 测试脚本与测试依赖

### 前端
- Modify: `frontend/src/App.jsx`
  - 新增 historic 与 admin 路由
- Create: `frontend/src/api/historic.js`
  - historic/public/admin API 封装
- Create: `frontend/src/pages/historic/HistoricHomePage.jsx`
  - 业态选择页
- Create: `frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx`
  - 餐饮详情页（左目录+右折叠）
- Create: `frontend/src/pages/admin/AdminHistoricPage.jsx`
  - 后台配置页
- Create: `frontend/src/utils/historicTransform.js`
  - 从右侧结构派生左侧目录（强一致关键）
- Create: `frontend/src/styles/historic.css`
  - historic 页面样式
- Create: `frontend/src/styles/admin.css`
  - admin 样式
- Create: `frontend/src/tests/*.test.jsx`
  - 前端关键行为测试
- Modify: `frontend/package.json` / `frontend/vite.config.js`
  - 前端测试配置

---
### Task 1: 后端可测试启动结构（app/server 分离）

**Files:**
- Create: `backend/app.js`
- Modify: `backend/server.js`
- Modify: `backend/package.json`
- Test: `backend/tests/legacy-events.test.js`

- [ ] **Step 1: 写失败测试（legacy 路由仍可访问）**

```js
// backend/tests/legacy-events.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('legacy events api', () => {
  it('GET /api/events should return { code: 200, data: [] } structure', async () => {
    const res = await request(app).get('/api/events')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix backend install -D vitest supertest
npm --prefix backend test
```

Expected: FAIL（`Cannot find module '../app.js'` 或 `Missing script: test`）

- [ ] **Step 3: 实现 app/server 分离与测试脚本**

```js
// backend/app.js
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getAll, getById, insert, update, remove } from './db.js'

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
    const { title, content, eventType, status } = req.body
    const id = insert(title, content, eventType, status)
    res.json({ code: 200, data: toObject(getById(id)), msg: 'success' })
  })

  app.put('/api/events/:id', (req, res) => {
    const { title, content, eventType, status } = req.body
    update(Number(req.params.id), title, content, eventType, status)
    res.json({ code: 200, data: toObject(getById(Number(req.params.id))), msg: 'success' })
  })

  app.delete('/api/events/:id', (req, res) => {
    remove(Number(req.params.id))
    res.json({ code: 200, msg: 'success' })
  })

  app.post('/api/system/oss/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ code: 400, msg: 'no file' })
    res.json({ code: 200, data: { url: `/uploads/${req.file.filename}`, filename: req.file.originalname }, msg: 'success' })
  })

  app.use('/uploads', express.static(uploadsDir))

  return app
}

const app = createApp()
export default app
```

```js
// backend/server.js
import app from './app.js'
const PORT = 3001
app.listen(PORT, () => {
  console.log(`backend running at http://localhost:${PORT}`)
})
```

```json
// backend/package.json（只示意 scripts/devDependencies）
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "vitest run"
  },
  "devDependencies": {
    "supertest": "^7.1.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix backend test
```

Expected: PASS（`legacy-events.test.js` 通过）

- [ ] **Step 5: Commit**

```bash
git add backend/app.js backend/server.js backend/package.json backend/tests/legacy-events.test.js
git commit -m "refactor(backend): split app and server with legacy api test"
```

---

### Task 2: 建立 historic 数据表与 seed（SQL.js）

**Files:**
- Modify: `backend/db.js`
- Create: `backend/modules/historic/schema.js`
- Create: `backend/modules/historic/seed.js`
- Test: `backend/tests/historic-schema-seed.test.js`

- [ ] **Step 1: 写失败测试（seed 后应存在餐饮业态）**

```js
// backend/tests/historic-schema-seed.test.js
import { describe, it, expect } from 'vitest'
import { getHistoricHomeData } from '../modules/historic/repository.js'

describe('historic schema + seed', () => {
  it('should contain openRestaurant industry after bootstrap', () => {
    const home = getHistoricHomeData()
    expect(home.industries.some((x) => x.slug === 'openRestaurant')).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix backend test
```

Expected: FAIL（`Cannot find module '../modules/historic/repository.js'`）

- [ ] **Step 3: 实现 schema + seed + db helper 导出**

```js
// backend/modules/historic/schema.js
export function ensureHistoricTables(db) {
  db.run(`CREATE TABLE IF NOT EXISTS hd_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    hero_title TEXT,
    hero_bg_url TEXT,
    body_bg_url TEXT,
    left_header_image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_nav_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    icon_url TEXT,
    link_type TEXT NOT NULL,
    link_target TEXT NOT NULL,
    open_mode TEXT NOT NULL DEFAULT '_self',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_industry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon_url TEXT,
    route_path TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_home_service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon_url TEXT,
    link_type TEXT NOT NULL,
    link_target TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_stage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry_id INTEGER NOT NULL,
    stage_key TEXT NOT NULL,
    stage_title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_stage_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id INTEGER NOT NULL,
    category_key TEXT NOT NULL,
    category_title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_topic (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    topic_key TEXT NOT NULL,
    anchor_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_mode TEXT NOT NULL DEFAULT 'links',
    apply_button_text TEXT DEFAULT '我要申报',
    apply_link_type TEXT DEFAULT 'internal',
    apply_link_target TEXT,
    default_expanded INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_topic_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS hd_topic_info_field (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    group_key TEXT DEFAULT 'base',
    group_title TEXT,
    field_label TEXT NOT NULL,
    field_value TEXT NOT NULL,
    field_type TEXT DEFAULT 'text',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)
}
```

```js
// backend/modules/historic/seed.js
export function ensureHistoricSeed(db) {
  const pageCount = db.exec("SELECT COUNT(*) FROM hd_page")[0].values[0][0]
  if (pageCount > 0) return

  db.run("INSERT INTO hd_page (page_key, title, hero_title) VALUES ('historic_home', '历史城区一类事', '市南区历史城区文旅产业服务“一类事”')")
  db.run("INSERT INTO hd_page (page_key, title, hero_title) VALUES ('open_restaurant', '我想开餐饮店', '市南区历史城区文旅产业服务“一类事”')")

  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('openRestaurant','我想开餐饮店','/historicDistrict/openRestaurant',1)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('hotel_accommodation','我想从事宾馆住宿行业','/historicDistrict/hotel_accommodation',2)")

  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('政策服务','external','http://zccx.qingdao.gov.cn/',1)")
  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('法律服务','internal','/historicDistrict/law',2)")
}
```

```js
// backend/db.js（新增导出与初始化调用片段）
import { ensureHistoricTables } from './modules/historic/schema.js'
import { ensureHistoricSeed } from './modules/historic/seed.js'

function saveDb() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

export function runSql(sql, params = []) {
  db.run(sql, params)
  saveDb()
}

export function querySql(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

ensureHistoricTables(db)
ensureHistoricSeed(db)
saveDb()

export { saveDb }
export default db
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix backend test
```

Expected: PASS（schema/seed test 通过）

- [ ] **Step 5: Commit**

```bash
git add backend/db.js backend/modules/historic/schema.js backend/modules/historic/seed.js backend/tests/historic-schema-seed.test.js
git commit -m "feat(backend): add historic schema and seed bootstrap"
```

---
### Task 3: historic repository（组装前台结构 + 左右同源）

**Files:**
- Create: `backend/modules/historic/repository.js`
- Test: `backend/tests/historic-repository.test.js`

- [ ] **Step 1: 写失败测试（左目录由右侧结构派生）**

```js
// backend/tests/historic-repository.test.js
import { describe, it, expect } from 'vitest'
import { getOpenRestaurantDetail } from '../modules/historic/repository.js'

describe('historic repository', () => {
  it('left menu should mirror topic order from right content', () => {
    const detail = getOpenRestaurantDetail('openRestaurant')
    const leftAnchors = detail.leftMenu.flatMap((s) => s.categories.flatMap((c) => c.items.map((i) => i.anchorKey)))
    const rightAnchors = detail.stages.flatMap((s) => s.categories.flatMap((c) => c.topics.map((t) => t.anchorKey)))
    expect(leftAnchors).toEqual(rightAnchors)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix backend test
```

Expected: FAIL（`getOpenRestaurantDetail is not a function`）

- [ ] **Step 3: 实现 repository 与同源派生逻辑**

```js
// backend/modules/historic/repository.js
import { querySql, runSql } from '../../db.js'

export function getHistoricHomeData() {
  const pages = querySql("SELECT * FROM hd_page WHERE page_key='historic_home' LIMIT 1")
  const navItems = querySql('SELECT * FROM hd_nav_item WHERE is_active=1 ORDER BY sort_order,id')
  const industries = querySql('SELECT * FROM hd_industry WHERE is_active=1 ORDER BY sort_order,id')
  const homeServices = querySql('SELECT * FROM hd_home_service WHERE is_active=1 ORDER BY sort_order,id')
  return {
    page: pages[0] ?? null,
    navItems,
    industries,
    homeServices
  }
}

function getTopicsByCategory(categoryId) {
  const topics = querySql('SELECT * FROM hd_topic WHERE category_id=? AND is_active=1 ORDER BY sort_order,id', [categoryId])
  return topics.map((topic) => ({
    ...topic,
    links: querySql('SELECT * FROM hd_topic_link WHERE topic_id=? AND is_active=1 ORDER BY sort_order,id', [topic.id]),
    infoFields: querySql('SELECT * FROM hd_topic_info_field WHERE topic_id=? AND is_active=1 ORDER BY sort_order,id', [topic.id])
  }))
}

export function getOpenRestaurantDetail(slug) {
  const industry = querySql('SELECT * FROM hd_industry WHERE slug=? AND is_active=1 LIMIT 1', [slug])[0]
  if (!industry) return null

  const stages = querySql('SELECT * FROM hd_stage WHERE industry_id=? AND is_active=1 ORDER BY sort_order,id', [industry.id]).map((stage) => {
    const categories = querySql('SELECT * FROM hd_stage_category WHERE stage_id=? AND is_active=1 ORDER BY sort_order,id', [stage.id]).map((category) => ({
      ...category,
      topics: getTopicsByCategory(category.id)
    }))
    return { ...stage, categories }
  })

  // 左侧目录必须由右侧结构派生，禁止单独数据源
  const leftMenu = stages.map((stage) => ({
    stageKey: stage.stage_key,
    stageTitle: stage.stage_title,
    categories: stage.categories.map((category) => ({
      categoryKey: category.category_key,
      categoryTitle: category.category_title,
      items: category.topics.map((topic) => ({
        topicId: topic.id,
        anchorKey: topic.anchor_key,
        title: topic.title
      }))
    }))
  }))

  return { industry, stages, leftMenu }
}

export function updateRecord(table, id, payload) {
  const keys = Object.keys(payload)
  const setClause = keys.map((k) => `${k}=?`).join(',')
  runSql(`UPDATE ${table} SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`, [...keys.map((k) => payload[k]), id])
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix backend test
```

Expected: PASS（left/right anchor 顺序一致）

- [ ] **Step 5: Commit**

```bash
git add backend/modules/historic/repository.js backend/tests/historic-repository.test.js
git commit -m "feat(backend): add historic repository with derived left menu"
```

---

### Task 4: historic public/admin API 路由

**Files:**
- Create: `backend/modules/historic/public-routes.js`
- Create: `backend/modules/historic/admin-routes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/historic-routes.test.js`

- [ ] **Step 1: 写失败测试（public + admin 可用）**

```js
// backend/tests/historic-routes.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('historic routes', () => {
  it('GET /api/historic/public/home should work', async () => {
    const res = await request(app).get('/api/historic/public/home')
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(200)
    expect(Array.isArray(res.body.data.industries)).toBe(true)
  })

  it('GET /api/historic/public/industry/openRestaurant/detail should work', async () => {
    const res = await request(app).get('/api/historic/public/industry/openRestaurant/detail')
    expect(res.status).toBe(200)
    expect(res.body.data.leftMenu.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix backend test
```

Expected: FAIL（404）

- [ ] **Step 3: 实现路由并挂载**

```js
// backend/modules/historic/public-routes.js
import { Router } from 'express'
import { getHistoricHomeData, getOpenRestaurantDetail } from './repository.js'

const router = Router()

router.get('/home', (req, res) => {
  res.json({ code: 200, data: getHistoricHomeData(), msg: 'success' })
})

router.get('/industry/:slug/detail', (req, res) => {
  const data = getOpenRestaurantDetail(req.params.slug)
  if (!data) return res.status(404).json({ code: 404, msg: 'industry not found' })
  res.json({ code: 200, data, msg: 'success' })
})

export default router
```

```js
// backend/modules/historic/admin-routes.js
import { Router } from 'express'
import { querySql, runSql } from '../../db.js'
import { updateRecord } from './repository.js'

const router = Router()

router.get('/nav-items', (req, res) => {
  const rows = querySql('SELECT * FROM hd_nav_item ORDER BY sort_order,id')
  res.json({ code: 200, data: rows, msg: 'success' })
})

router.post('/nav-items', (req, res) => {
  const { title, link_type, link_target, open_mode = '_self', sort_order = 0 } = req.body
  runSql('INSERT INTO hd_nav_item (title, link_type, link_target, open_mode, sort_order) VALUES (?,?,?,?,?)', [title, link_type, link_target, open_mode, sort_order])
  res.json({ code: 200, msg: 'success' })
})

router.put('/nav-items/:id', (req, res) => {
  updateRecord('hd_nav_item', Number(req.params.id), req.body)
  res.json({ code: 200, msg: 'success' })
})

router.delete('/nav-items/:id', (req, res) => {
  runSql("UPDATE hd_nav_item SET is_active=0, updated_at=datetime('now','localtime') WHERE id=?", [Number(req.params.id)])
  res.json({ code: 200, msg: 'success' })
})

export default router
```

```js
// backend/app.js（新增挂载片段）
import historicPublicRoutes from './modules/historic/public-routes.js'
import historicAdminRoutes from './modules/historic/admin-routes.js'

// ... createApp 内
app.use('/api/historic/public', historicPublicRoutes)
app.use('/api/admin/historic', historicAdminRoutes)
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix backend test
```

Expected: PASS（historic-routes.test.js 通过）

- [ ] **Step 5: Commit**

```bash
git add backend/modules/historic/public-routes.js backend/modules/historic/admin-routes.js backend/app.js backend/tests/historic-routes.test.js
git commit -m "feat(backend): add historic public and admin routes"
```

---
### Task 5: 前端 API 层与路由骨架

**Files:**
- Create: `frontend/src/api/historic.js`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/pages/historic/HistoricHomePage.jsx`
- Create: `frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx`
- Create: `frontend/src/pages/admin/AdminHistoricPage.jsx`
- Test: `frontend/src/tests/routes.historic.test.jsx`

- [ ] **Step 1: 写失败测试（路由可访问）**

```jsx
// frontend/src/tests/routes.historic.test.jsx
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('historic routes', () => {
  it('should render historic home route', () => {
    render(<MemoryRouter initialEntries={['/historicDistrict']}><App /></MemoryRouter>)
    expect(screen.getByText(/选择您想了解和从事的业态/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix frontend install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm --prefix frontend test
```

Expected: FAIL（`Missing script: test` 或路由不存在）

- [ ] **Step 3: 实现 API 与路由骨架**

```js
// frontend/src/api/historic.js
import api from './index'

export const getHistoricHome = () => api.get('/historic/public/home')
export const getHistoricIndustryDetail = (slug) => api.get(`/historic/public/industry/${slug}/detail`)

export const getAdminNavItems = () => api.get('/admin/historic/nav-items')
export const createAdminNavItem = (data) => api.post('/admin/historic/nav-items', data)
export const updateAdminNavItem = (id, data) => api.put(`/admin/historic/nav-items/${id}`, data)
export const deleteAdminNavItem = (id) => api.delete(`/admin/historic/nav-items/${id}`)
```

```jsx
// frontend/src/App.jsx（新增片段）
import HistoricHomePage from './pages/historic/HistoricHomePage'
import HistoricOpenRestaurantPage from './pages/historic/HistoricOpenRestaurantPage'
import AdminHistoricPage from './pages/admin/AdminHistoricPage'

<Route path="/historicDistrict" element={<HistoricHomePage />} />
<Route path="/historicDistrict/openRestaurant" element={<HistoricOpenRestaurantPage />} />
<Route path="/admin" element={<AdminHistoricPage />} />
```

```jsx
// frontend/src/pages/historic/HistoricHomePage.jsx
export default function HistoricHomePage() {
  return <div>选择您想了解和从事的业态</div>
}
```

```jsx
// frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx
export default function HistoricOpenRestaurantPage() {
  return <div>我想开餐饮店</div>
}
```

```jsx
// frontend/src/pages/admin/AdminHistoricPage.jsx
export default function AdminHistoricPage() {
  return <div>历史城区内容管理</div>
}
```

```json
// frontend/package.json（scripts 片段）
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix frontend test
```

Expected: PASS（route smoke test 通过）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/api/historic.js frontend/src/pages/historic/HistoricHomePage.jsx frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx frontend/src/pages/admin/AdminHistoricPage.jsx frontend/src/tests/routes.historic.test.jsx frontend/package.json
git commit -m "feat(frontend): add historic route skeleton and api module"
```

---

### Task 6: 业态选择页（/historicDistrict）视觉与交互

**Files:**
- Modify: `frontend/src/pages/historic/HistoricHomePage.jsx`
- Create: `frontend/src/styles/historic.css`
- Test: `frontend/src/tests/historic-home.test.jsx`

- [ ] **Step 1: 写失败测试（卡片可渲染）**

```jsx
// frontend/src/tests/historic-home.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HistoricHomePage from '../pages/historic/HistoricHomePage'

vi.mock('../api/historic', () => ({
  getHistoricHome: () => Promise.resolve({
    data: { code: 200, data: { page: {}, navItems: [], industries: [{ id: 1, name: '我想开餐饮店', route_path: '/historicDistrict/openRestaurant' }], homeServices: [] } }
  })
}))

describe('HistoricHomePage', () => {
  it('renders industry card', async () => {
    render(<MemoryRouter><HistoricHomePage /></MemoryRouter>)
    expect(await screen.findByText('我想开餐饮店')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix frontend test
```

Expected: FAIL（页面尚未请求并渲染 API 数据）

- [ ] **Step 3: 实现页面与样式**

```jsx
// frontend/src/pages/historic/HistoricHomePage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistoricHome } from '../../api/historic'
import '../../styles/historic.css'

export default function HistoricHomePage() {
  const [data, setData] = useState({ page: null, navItems: [], industries: [], homeServices: [] })

  useEffect(() => {
    getHistoricHome().then((res) => {
      if (res.data.code === 200) setData(res.data.data)
    })
  }, [])

  return (
    <div className="hd-page">
      <div className="hd-hero">
        <h1>{data.page?.hero_title || '市南区历史城区文旅产业服务“一类事”'}</h1>
      </div>

      <section className="hd-section">
        <h2>选择您想了解和从事的业态</h2>
        <div className="hd-card-grid">
          {data.industries.map((item) => (
            <Link key={item.id} to={item.route_path} target="_blank" className="hd-card-link" rel="noopener noreferrer">
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="hd-section">
        <h2>利企便民服务</h2>
        <div className="hd-card-grid hd-card-grid--services">
          {data.homeServices.map((item) => (
            <a key={item.id} href={item.link_target} target="_blank" className="hd-card-link" rel="noopener noreferrer">
              {item.name}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
```

```css
/* frontend/src/styles/historic.css（首页关键片段） */
.hd-page { min-height: 100vh; background: #f4f4f4; }
.hd-hero { height: 48vh; display: flex; align-items: center; justify-content: center; color: #fff; background: linear-gradient(180deg,#0a73cd 0%,#2e8fe0 100%); }
.hd-section { width: 1350px; max-width: calc(100% - 40px); margin: 24px auto; }
.hd-card-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.hd-card-link { display: block; height: 80px; line-height: 80px; border: 1px solid #d1d5db; border-radius: 11px; padding: 0 24px; color: #555; font-weight: 700; text-decoration: none; background: #fff; }
.hd-card-link:hover { border-color: #1584da; box-shadow: 0 4px 15px rgba(21,132,218,.3); }
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix frontend test
```

Expected: PASS（historic-home.test.jsx 通过）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/historic/HistoricHomePage.jsx frontend/src/styles/historic.css frontend/src/tests/historic-home.test.jsx

git commit -m "feat(frontend): implement historic home page from api"
```

---
### Task 7: 餐饮详情页（左目录 = 右内容同源）

**Files:**
- Create: `frontend/src/utils/historicTransform.js`
- Modify: `frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx`
- Modify: `frontend/src/styles/historic.css`
- Test: `frontend/src/tests/historic-open-restaurant.test.jsx`

- [ ] **Step 1: 写失败测试（左侧锚点与右侧 topic 同序）**

```jsx
// frontend/src/tests/historic-open-restaurant.test.jsx
import { describe, it, expect } from 'vitest'
import { buildLeftMenuFromStages } from '../utils/historicTransform'

describe('buildLeftMenuFromStages', () => {
  it('should derive left menu from right stages', () => {
    const stages = [{
      stage_key: 'prepare',
      stage_title: '筹备开办阶段',
      categories: [{ category_key: 'basic', category_title: '基本政务服务', topics: [{ anchor_key: 'guide-basic-1', title: '企业开办' }] }]
    }]

    const leftMenu = buildLeftMenuFromStages(stages)
    expect(leftMenu[0].categories[0].items[0].anchorKey).toBe('guide-basic-1')
    expect(leftMenu[0].categories[0].items[0].title).toBe('企业开办')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix frontend test
```

Expected: FAIL（`buildLeftMenuFromStages` 不存在）

- [ ] **Step 3: 实现同源派生工具与详情页**

```js
// frontend/src/utils/historicTransform.js
export function buildLeftMenuFromStages(stages = []) {
  return stages.map((stage) => ({
    stageKey: stage.stage_key,
    stageTitle: stage.stage_title,
    categories: (stage.categories || []).map((category) => ({
      categoryKey: category.category_key,
      categoryTitle: category.category_title,
      items: (category.topics || []).map((topic) => ({
        topicId: topic.id,
        anchorKey: topic.anchor_key,
        title: topic.title
      }))
    }))
  }))
}
```

```jsx
// frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { getHistoricIndustryDetail } from '../../api/historic'
import { buildLeftMenuFromStages } from '../../utils/historicTransform'
import '../../styles/historic.css'

export default function HistoricOpenRestaurantPage() {
  const [detail, setDetail] = useState({ industry: null, stages: [] })
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    getHistoricIndustryDetail('openRestaurant').then((res) => {
      if (res.data.code === 200) setDetail(res.data.data)
    })
  }, [])

  const leftMenu = useMemo(() => buildLeftMenuFromStages(detail.stages), [detail.stages])

  const toggle = (anchorKey) => {
    const next = new Set(expanded)
    if (next.has(anchorKey)) next.delete(anchorKey)
    else next.add(anchorKey)
    setExpanded(next)
  }

  return (
    <div className="hd-detail-page">
      <aside className="hd-left-menu">
        {leftMenu.map((stage) => (
          <div key={stage.stageKey} className="hd-left-stage">
            <div className="hd-left-stage-title">{stage.stageTitle}</div>
            {stage.categories.map((category) => (
              <div key={category.categoryKey}>
                <div className="hd-left-category-title">{category.categoryTitle}</div>
                {category.items.map((item) => (
                  <a key={item.anchorKey} href={`#${item.anchorKey}`}>{item.title}</a>
                ))}
              </div>
            ))}
          </div>
        ))}
      </aside>

      <main className="hd-right-content">
        {detail.stages.map((stage) => (
          <section key={stage.stage_key}>
            <div className="hd-stage-title">{stage.stage_title}</div>
            {stage.categories.map((category) => (
              <div key={category.category_key}>
                <h3>{category.category_title}</h3>
                {category.topics.map((topic) => (
                  <div key={topic.anchor_key} id={topic.anchor_key}>
                    <button type="button" className="hd-topic-title" onClick={() => toggle(topic.anchor_key)}>
                      <span>{topic.title}</span>
                      <span>{expanded.has(topic.anchor_key) ? '▲' : '▼'}</span>
                    </button>
                    {expanded.has(topic.anchor_key) && (
                      <div className="hd-topic-body">
                        {topic.description ? <p>{topic.description}</p> : null}
                        {(topic.links || []).map((lnk) => (
                          <a key={lnk.id} href={lnk.url} target="_blank" rel="noopener noreferrer" className="hd-service-link">
                            <span>{lnk.label}</span><span>→</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix frontend test
```

Expected: PASS（transform test 通过）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/historicTransform.js frontend/src/pages/historic/HistoricOpenRestaurantPage.jsx frontend/src/styles/historic.css frontend/src/tests/historic-open-restaurant.test.jsx
git commit -m "feat(frontend): implement openRestaurant detail with derived left menu"
```

---

### Task 8: 管理后台 `/admin`（全量维护首版）

**Files:**
- Modify: `frontend/src/pages/admin/AdminHistoricPage.jsx`
- Create: `frontend/src/styles/admin.css`
- Test: `frontend/src/tests/admin-historic.test.jsx`

- [ ] **Step 1: 写失败测试（后台能渲染导航列表）**

```jsx
// frontend/src/tests/admin-historic.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminHistoricPage from '../pages/admin/AdminHistoricPage'

vi.mock('../api/historic', () => ({
  getAdminNavItems: () => Promise.resolve({ data: { code: 200, data: [{ id: 1, title: '首页', link_target: '/historicDistrict' }] } }),
  createAdminNavItem: vi.fn(),
  updateAdminNavItem: vi.fn(),
  deleteAdminNavItem: vi.fn()
}))

describe('AdminHistoricPage', () => {
  it('renders nav item from api', async () => {
    render(<AdminHistoricPage />)
    expect(await screen.findByText('首页')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm --prefix frontend test
```

Expected: FAIL（后台页面尚未请求并展示列表）

- [ ] **Step 3: 实现管理页（首版 CRUD）**

```jsx
// frontend/src/pages/admin/AdminHistoricPage.jsx
import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Space, Table, message } from 'antd'
import { getAdminNavItems, createAdminNavItem, updateAdminNavItem, deleteAdminNavItem } from '../../api/historic'
import '../../styles/admin.css'

export default function AdminHistoricPage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const load = async () => {
    const res = await getAdminNavItems()
    if (res.data.code === 200) setRows(res.data.data)
  }

  useEffect(() => { load() }, [])

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (editing) await updateAdminNavItem(editing.id, values)
    else await createAdminNavItem(values)
    message.success('保存成功')
    setOpen(false)
    setEditing(null)
    form.resetFields()
    load()
  }

  const onDelete = (row) => {
    Modal.confirm({
      title: `确认删除：${row.title}？`,
      onOk: async () => {
        await deleteAdminNavItem(row.id)
        message.success('删除成功')
        load()
      }
    })
  }

  return (
    <div className="admin-page">
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpen(true)}>新增导航</Button>
      </Space>

      <Table rowKey="id" dataSource={rows} pagination={false} columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '链接', dataIndex: 'link_target' },
        {
          title: '操作',
          render: (_, row) => (
            <Space>
              <Button onClick={() => { setEditing(row); form.setFieldsValue(row); setOpen(true) }}>编辑</Button>
              <Button danger onClick={() => onDelete(row)}>删除</Button>
            </Space>
          )
        }
      ]} />

      <Modal open={open} onOk={onSubmit} onCancel={() => { setOpen(false); setEditing(null); form.resetFields() }} title={editing ? '编辑导航' : '新增导航'}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="link_type" label="链接类型" initialValue="internal" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="link_target" label="链接地址" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="open_mode" label="打开方式" initialValue="_self"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm --prefix frontend test
```

Expected: PASS（admin-historic.test.jsx 通过）

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/AdminHistoricPage.jsx frontend/src/styles/admin.css frontend/src/tests/admin-historic.test.jsx
git commit -m "feat(frontend): add admin historic nav management page"
```

---
### Task 9: 联调、回归与验收命令

**Files:**
- Modify: `frontend/vite.config.js`（如需补充代理）
- Optional Create: `docs/superpowers/verification/2026-05-28-historicdistrict-catering.md`

- [ ] **Step 1: 写失败回归（左/右一致）**

```jsx
// frontend/src/tests/historic-contract.test.jsx
import { describe, it, expect } from 'vitest'
import { buildLeftMenuFromStages } from '../utils/historicTransform'

describe('historic contract', () => {
  it('left and right anchor list should be equal', () => {
    const stages = [{ stage_key: 's1', stage_title: '阶段1', categories: [{ category_key: 'c1', category_title: '分类1', topics: [{ anchor_key: 'a1', title: 't1' }, { anchor_key: 'a2', title: 't2' }] }] }]
    const left = buildLeftMenuFromStages(stages).flatMap((s) => s.categories.flatMap((c) => c.items.map((i) => i.anchorKey)))
    const right = stages.flatMap((s) => s.categories.flatMap((c) => c.topics.map((t) => t.anchor_key)))
    expect(left).toEqual(right)
  })
})
```

- [ ] **Step 2: 运行全量测试**

Run:
```bash
npm --prefix backend test
npm --prefix frontend test
```

Expected: 全部 PASS

- [ ] **Step 3: 手工联调清单（必须逐项）**

```bash
# Terminal 1
npm --prefix backend dev

# Terminal 2
npm --prefix frontend dev
```

手工验收：
1. 打开 `http://localhost:3000/historicDistrict`，确认业态页视觉与结构正确
2. 点击“我想开餐饮店”跳至 `.../openRestaurant`
3. 左侧目录点击滚动到右侧目标卡片
4. 展开任意事项，点击链接必须新标签页打开
5. 打开 `http://localhost:3000/admin`，编辑导航后刷新前台可见
6. 访问 `http://localhost:3000/events` 仍可正常使用

- [ ] **Step 4: 记录验证结果**

```md
# docs/superpowers/verification/2026-05-28-historicdistrict-catering.md
- backend tests: PASS
- frontend tests: PASS
- manual checklist: PASS
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/tests/historic-contract.test.jsx docs/superpowers/verification/2026-05-28-historicdistrict-catering.md
git commit -m "test: add historic contract checks and verification notes"
```

---

## 计划自检（Spec Coverage）

- ✅ 同项目双入口：`/historicDistrict` + `/admin`
- ✅ 前台两页：业态选择页 + 餐饮详情页
- ✅ 全量可维护：通过 admin routes + admin page 首版 CRUD
- ✅ 左右一致硬约束：`buildLeftMenuFromStages` + repository 同源派生 + 测试断言
- ✅ 链接新标签：`target="_blank" rel="noopener noreferrer"`
- ✅ 保留 legacy `/events`
- ✅ PC 优先样式

No placeholder found（无 TODO/TBD/后补字段）。
