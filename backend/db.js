import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { ensureHistoricTables } from './modules/historic/schema.js'
import { ensureHistoricSeed } from './modules/historic/seed.js'
import { ensureHomeIndustryTables } from './modules/home-industry/schema.js'
import { ensureHomeIndustrySeed } from './modules/home-industry/seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data', 'events.db')
const dataDir = path.join(__dirname, 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const SQL = await initSqlJs()

let db
if (fs.existsSync(dbPath)) {
  const buffer = fs.readFileSync(dbPath)
  db = new SQL.Database(buffer)
} else {
  db = new SQL.Database()
}

function saveDb() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function getScalar(sql, params = [], field = 'value') {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let value = null
  if (stmt.step()) {
    const row = stmt.getAsObject()
    value = row[field]
  }
  stmt.free()
  return value
}

function initEventsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      eventType TEXT DEFAULT 'one-stop-service',
      status TEXT DEFAULT 'pending',
      createTime TEXT DEFAULT (datetime('now', 'localtime')),
      updateTime TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  const count = Number(getScalar('SELECT COUNT(*) AS value FROM events') || 0)
  if (count > 0) return

  const events = [
    ['One Task One Visit', 'Integrate multiple service procedures into one entry', 'one-stop-service', 'pending'],
    ['Project Construction Approval', 'Streamline project approval process and reduce processing time', 'project-service', 'processing'],
    ['Business Setup in One Window', 'Complete business setup with license, stamp and invoice in one flow', 'one-stop-service', 'completed'],
    ['Instant Social Security Card', 'Issue social security card on site', 'citizen-service', 'pending'],
    ['Real Estate Registration Fast Track', 'Compress registration processing to within three working days', 'project-service', 'processing']
  ]

  const stmt = db.prepare('INSERT INTO events (title, content, eventType, status) VALUES (?, ?, ?, ?)')
  for (const row of events) {
    stmt.run(row)
  }
  stmt.free()
}

export function runSql(sql, params = []) {
  db.run(sql, params)
  saveDb()
}

export function querySql(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

initEventsTable()
ensureHistoricTables(db)
ensureHistoricSeed(db)
ensureHomeIndustryTables(db)
ensureHomeIndustrySeed(db)
saveDb()

export function getAll() {
  return db.exec('SELECT * FROM events ORDER BY createTime DESC')[0]?.values || []
}

export function getById(id) {
  const stmt = db.prepare('SELECT * FROM events WHERE id = ? LIMIT 1')
  stmt.bind([id])
  const row = stmt.step() ? stmt.get() : null
  stmt.free()
  return row
}

export function insert(title, content, eventType, status) {
  db.run('INSERT INTO events (title, content, eventType, status) VALUES (?, ?, ?, ?)', [
    title,
    content || '',
    eventType || 'one-stop-service',
    status || 'pending'
  ])
  saveDb()
  const rows = db.exec('SELECT id FROM events ORDER BY id DESC LIMIT 1')
  return rows[0]?.values?.[0]?.[0] ?? null
}

export function update(id, title, content, eventType, status) {
  db.run(
    `UPDATE events
     SET title = ?, content = ?, eventType = ?, status = ?,
         updateTime = datetime('now', 'localtime')
     WHERE id = ?`,
    [title, content, eventType, status, id]
  )
  saveDb()
}

export function remove(id) {
  db.run('DELETE FROM events WHERE id = ?', [id])
  saveDb()
}

export { saveDb }
export default db
