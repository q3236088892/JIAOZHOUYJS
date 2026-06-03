import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'data', 'events.db')

if (!fs.existsSync(dbPath)) {
  console.error(`db file not found: ${dbPath}`)
  process.exit(1)
}

const SQL = await initSqlJs()
const buffer = fs.readFileSync(dbPath)
const db = new SQL.Database(buffer)

const runs = []

function runSql(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const changed = db.getRowsModified()
  stmt.step()
  stmt.free()
  runs.push(sql)
  return changed
}

function tableInfo(table) {
  const stmt = db.prepare(`PRAGMA table_info(${table})`)
  const cols = []
  while (stmt.step()) cols.push(stmt.getAsObject())
  stmt.free()
  return cols
}

const cols = tableInfo('cd_content')
const hasAttachmentUrl = cols.some(c => c.name === 'attachment_url')
const hasAttachmentName = cols.some(c => c.name === 'attachment_name')

if (!hasAttachmentUrl) {
  runSql('ALTER TABLE cd_content ADD COLUMN attachment_url TEXT')
  console.log('+ added column cd_content.attachment_url')
}
if (!hasAttachmentName) {
  runSql('ALTER TABLE cd_content ADD COLUMN attachment_name TEXT')
  console.log('+ added column cd_content.attachment_name')
}

const seeds = [
  {
    node_id: 1203,
    title: '代理记账服务公司清单',
    attachment_url: '/uploads/代理记账服务公司清单.xlsx',
    attachment_name: '代理记账服务公司清单.xlsx',
    body: '胶州市相关代理记账服务公司清单详见下方附件。'
  },
  {
    node_id: 1206,
    title: '人力资源服务公司清单',
    attachment_url: '/uploads/人力资源服务公司清单.xlsx',
    attachment_name: '人力资源服务公司清单.xlsx',
    body: '胶州市相关人力资源服务公司清单详见下方附件。'
  },
  {
    node_id: 1209,
    title: '施工企业清单',
    attachment_url: '/uploads/施工企业清单.xlsx',
    attachment_name: '施工企业清单.xlsx',
    body: '胶州市相关施工企业清单详见下方附件。'
  }
]

for (const s of seeds) {
  const cdRows = db.exec(`SELECT id FROM cd_content WHERE node_id = ${s.node_id}`)[0]?.values ?? []
  if (cdRows.length === 0) {
    console.warn(`! no cd_content for node_id=${s.node_id}, skipping`)
    continue
  }
  const contentId = cdRows[0][0]
  runSql(
    `UPDATE cd_content
        SET attachment_url = ?,
            attachment_name = ?,
            body = ?,
            updated_at = datetime('now','localtime')
      WHERE id = ?`,
    [s.attachment_url, s.attachment_name, s.body, contentId]
  )
  runSql(
    `UPDATE cd_node
        SET title = ?,
            updated_at = datetime('now','localtime')
      WHERE id = ?`,
    [s.title, s.node_id]
  )
  console.log(`+ node=${s.node_id} content=${contentId} -> ${s.attachment_name}`)
}

const data = db.export()
fs.writeFileSync(dbPath, Buffer.from(data))
console.log(`\n✓ db saved to ${dbPath}`)
console.log('  next: pm2 restart jiaozhou-backend')
