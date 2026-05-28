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
