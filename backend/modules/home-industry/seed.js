export function ensureHomeIndustrySeed(db) {
  const count = db.exec("SELECT COUNT(*) AS cnt FROM cd_module")[0]?.values?.[0]?.[0] ?? 0
  if (count > 0) return

  db.run("INSERT INTO cd_module (code, title, sort_order) VALUES ('value_added', '首页展示', 1)")
  db.run("INSERT INTO cd_module (code, title, sort_order) VALUES ('industry_chain', '产业链服务', 2)")
  db.run("INSERT INTO cd_module (code, title, sort_order) VALUES ('enterprise_support', '利企配套服务', 3)")
}
