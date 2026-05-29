export function ensureHomeIndustryTables(db) {
  db.run(`CREATE TABLE IF NOT EXISTS cd_module (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS cd_node (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    parent_id INTEGER,
    title TEXT NOT NULL,
    node_type TEXT NOT NULL DEFAULT 'branch',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_node_module ON cd_node(module_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_node_parent ON cd_node(parent_id)`)

  db.run(`CREATE TABLE IF NOT EXISTS cd_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL UNIQUE,
    content_type TEXT NOT NULL DEFAULT 'info',
    summary TEXT,
    link_url TEXT,
    link_label TEXT,
    link_target TEXT DEFAULT '_blank',
    body TEXT,
    department TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS cd_content_field (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`)

  db.run(`CREATE INDEX IF NOT EXISTS idx_cd_field_content ON cd_content_field(content_id)`)
}
