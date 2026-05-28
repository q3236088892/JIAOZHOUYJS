function scalar(db, sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const row = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return row
}

function insertAndGetId(db, sql, params = []) {
  db.run(sql, params)
  const row = scalar(db, 'SELECT last_insert_rowid() AS id')
  return Number(row?.id || 0)
}

function ensureOpenRestaurantDetailSeed(db, industryId) {
  const existing = scalar(db, 'SELECT COUNT(*) AS cnt FROM hd_stage WHERE industry_id = ?', [industryId])
  if (Number(existing?.cnt || 0) > 0) return

  const prepareStageId = insertAndGetId(
    db,
    "INSERT INTO hd_stage (industry_id, stage_key, stage_title, sort_order) VALUES (?, 'prepare', '\u7b79\u5907\u5f00\u529e\u9636\u6bb5', 1)",
    [industryId]
  )

  const developStageId = insertAndGetId(
    db,
    "INSERT INTO hd_stage (industry_id, stage_key, stage_title, sort_order) VALUES (?, 'develop', '\u7ecf\u8425\u53d1\u5c55\u9636\u6bb5', 2)",
    [industryId]
  )

  const supportStageId = insertAndGetId(
    db,
    "INSERT INTO hd_stage (industry_id, stage_key, stage_title, sort_order) VALUES (?, 'support', '\u9000\u51fa\u8f6c\u578b\u9636\u6bb5', 3)",
    [industryId]
  )

  const basicCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'basic_service', '\u57fa\u672c\u653f\u52a1\u670d\u52a1', 1)",
    [prepareStageId]
  )

  const oneStopCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'one_stop_service', '\u201c\u4e00\u4ef6\u4e8b\u201d\u670d\u52a1', 2)",
    [prepareStageId]
  )

  const deriveCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'derive_service', '\u884d\u751f\u670d\u52a1', 3)",
    [prepareStageId]
  )

  const valueCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'value_service', '\u589e\u503c\u670d\u52a1', 1)",
    [developStageId]
  )

  const policyCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'policy_service', '\u884d\u751f\u670d\u52a1', 2)",
    [developStageId]
  )

  const quitCategoryId = insertAndGetId(
    db,
    "INSERT INTO hd_stage_category (stage_id, category_key, category_title, sort_order) VALUES (?, 'quit_service', '\u201c\u4e00\u4ef6\u4e8b\u201d\u670d\u52a1', 1)",
    [supportStageId]
  )

  const topic1Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'company_register', 'guide-basic-1', '\u4f01\u4e1a\u5f00\u529e', '\u7ecf\u8425\u4e3b\u4f53\u8bbe\u7acb\u767b\u8bb0\u662f\u6307\u81ea\u7136\u4eba\u3001\u6cd5\u4eba\u6216\u5176\u4ed6\u7ec4\u7ec7\u4e3a\u53d6\u5f97\u5408\u6cd5\u7ecf\u8425\u8d44\u683c\uff0c\u4f9d\u6cd5\u5411\u767b\u8bb0\u673a\u5173\u63d0\u4ea4\u7533\u8bf7\u6750\u6599\uff0c\u7ecf\u5ba1\u6838\u5408\u683c\u540e\u9886\u53d6\u8425\u4e1a\u6267\u7167\u3002', 'links', 1, 1
    )`,
    [basicCategoryId]
  )

  const topic2Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'open_restaurant_onestop', 'guide-onestop-1', '\u5f00\u529e\u9910\u996e\u5e97\u201c\u4e00\u4ef6\u4e8b\u201d', '\u96c6\u6210\u529e\u7406\u8425\u4e1a\u6267\u7167\u3001\u884c\u4e1a\u51c6\u8425\u7b49\u4e8b\u9879\uff0c\u4e00\u6b21\u7533\u8bf7\u3001\u5e76\u8054\u529e\u7406\u3002', 'links', 0, 1
    )`,
    [oneStopCategoryId]
  )

  const topic3Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'forbidden_area_consult', 'guide-derivative-1', '\u9910\u996e\u4e1a\u7981\u8bbe\u533a\u57df\u54a8\u8be2', '\u4e3a\u5e02\u5357\u533a\u5386\u53f2\u57ce\u533a\u5e02\u573a\u4e3b\u4f53\u63d0\u4f9b\u9910\u996e\u4e1a\u7981\u8bbe\u533a\u57df\u67e5\u8be2\u670d\u52a1\u3002', 'info', 0, 1
    )`,
    [deriveCategoryId]
  )

  const topic4Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'employment_support', 'guide-value-1', '\u62db\u8058\u7528\u5de5\u670d\u52a1', '\u63d0\u4f9b\u62db\u8058\u53d1\u5e03\u3001\u5c97\u4f4d\u5339\u914d\u3001\u653f\u7b56\u54a8\u8be2\u7b49\u516c\u5171\u5c31\u4e1a\u670d\u52a1\u3002', 'links', 0, 1
    )`,
    [valueCategoryId]
  )

  const topic5Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'law_enforcement_policy', 'guide-derivative-6', '\u5e02\u573a\u76d1\u7ba1\u6267\u6cd5\u76f8\u5173\u653f\u7b56\u54a8\u8be2', '\u63d0\u4f9b\u9910\u996e\u7ecf\u8425\u76f8\u5173\u6267\u6cd5\u89c4\u8303\u3001\u4fe1\u7528\u4fee\u590d\u7b49\u653f\u7b56\u54a8\u8be2\u670d\u52a1\u3002', 'links', 0, 1
    )`,
    [policyCategoryId]
  )

  const topic6Id = insertAndGetId(
    db,
    `INSERT INTO hd_topic (
      category_id, topic_key, anchor_key, title, description, content_mode, default_expanded, sort_order
    ) VALUES (
      ?, 'enterprise_cancel', 'guide-onestop-5', '\u4f01\u4e1a\u6ce8\u9500\u767b\u8bb0\u201c\u4e00\u4ef6\u4e8b\u201d', '\u5c06\u6ce8\u9500\u767b\u8bb0\u3001\u7a0e\u52a1\u6ce8\u9500\u7b49\u4e8b\u9879\u96c6\u6210\u529e\u7406\uff0c\u63d0\u5347\u9000\u51fa\u4fbf\u5229\u5ea6\u3002', 'links', 0, 1
    )`,
    [quitCategoryId]
  )

  db.run(
    "INSERT INTO hd_topic_link (topic_id, label, url, sort_order) VALUES (?, '\u4f01\u4e1a\u5f00\u529e\u4e00\u7a97\u901a', 'http://zccx.qingdao.gov.cn/', 1)",
    [topic1Id]
  )
  db.run(
    "INSERT INTO hd_topic_link (topic_id, label, url, sort_order) VALUES (?, '\u5f00\u529e\u9910\u996e\u5e97\u201c\u4e00\u4ef6\u4e8b\u201d\u5728\u7ebf\u529e\u7406', 'http://spdt.qingdao.gov.cn/onethings/instruction/02?uuid=285b09ca0a6c4ecaa7a50ba12dd1df9d&fn=30', 1)",
    [topic2Id]
  )
  db.run(
    "INSERT INTO hd_topic_link (topic_id, label, url, sort_order) VALUES (?, '\u62db\u8058\u7528\u5de5\u670d\u52a1\u5165\u53e3', 'https://hrss.qingdao.gov.cn/', 1)",
    [topic4Id]
  )
  db.run(
    "INSERT INTO hd_topic_link (topic_id, label, url, sort_order) VALUES (?, '\u5e02\u573a\u76d1\u7ba1\u653f\u7b56\u670d\u52a1', 'http://amr.qingdao.gov.cn/', 1)",
    [topic5Id]
  )
  db.run(
    "INSERT INTO hd_topic_link (topic_id, label, url, sort_order) VALUES (?, '\u4f01\u4e1a\u6ce8\u9500\u767b\u8bb0\u201c\u4e00\u4ef6\u4e8b\u201d\u5728\u7ebf\u529e\u7406', 'http://spdt.qingdao.gov.cn/onethings/instruction/02?uuid=50fbf0185f57015d9f26c4e539a56&fn=30', 1)",
    [topic6Id]
  )

  db.run(
    "INSERT INTO hd_topic_info_field (topic_id, field_label, field_value, sort_order) VALUES (?, '\u54a8\u8be2\u7535\u8bdd', '0532-66200486', 1)",
    [topic3Id]
  )
  db.run(
    "INSERT INTO hd_topic_info_field (topic_id, field_label, field_value, sort_order) VALUES (?, '\u54a8\u8be2\u65f6\u95f4', '\u5de5\u4f5c\u65e5 9:00-11:30\uff0c13:30-17:30', 2)",
    [topic3Id]
  )
  db.run(
    "INSERT INTO hd_topic_info_field (topic_id, field_label, field_value, sort_order) VALUES (?, '\u670d\u52a1\u5730\u70b9', '\u5e02\u5357\u533a\u798f\u5dde\u5357\u8def17\u53f7\u300127\u53f7\u9752\u5c9b\u5e02\u653f\u52a1\u670d\u52a1\u4e2d\u5fc34\u697c\u5e02\u5357\u4e13\u4e1a\u670d\u52a1\u533a', 3)",
    [topic3Id]
  )
}

export function ensureHistoricSeed(db) {
  const pageCount = Number(scalar(db, 'SELECT COUNT(*) AS cnt FROM hd_page')?.cnt || 0)
  if (pageCount > 0) return

  db.run(
    "INSERT INTO hd_page (page_key, title, hero_title) VALUES ('historic_home', '\u5386\u53f2\u57ce\u533a\u4e00\u7c7b\u4e8b', '\u5e02\u5357\u533a\u5386\u53f2\u57ce\u533a\u6587\u65c5\u4ea7\u4e1a\u670d\u52a1\u201c\u4e00\u7c7b\u4e8b\u201d')"
  )
  db.run(
    "INSERT INTO hd_page (page_key, title, hero_title) VALUES ('open_restaurant', '\u6211\u60f3\u5f00\u9910\u996e\u5e97', '\u5e02\u5357\u533a\u5386\u53f2\u57ce\u533a\u6587\u65c5\u4ea7\u4e1a\u670d\u52a1\u201c\u4e00\u7c7b\u4e8b\u201d')"
  )

  db.run("INSERT INTO hd_nav_item (title, link_type, link_target, open_mode, sort_order) VALUES ('\u9996\u9875', 'internal', '/historicDistrict', '_self', 1)")
  db.run("INSERT INTO hd_nav_item (title, link_type, link_target, open_mode, sort_order) VALUES ('\u5386\u53f2\u57ce\u533a\u7b80\u4ecb', 'external', 'http://qdsxzspfwj.qingdao.gov.cn/', '_blank', 2)")
  db.run("INSERT INTO hd_nav_item (title, link_type, link_target, open_mode, sort_order) VALUES ('\u62db\u5546\u5165\u9a7b', 'external', 'http://zccx.qingdao.gov.cn/', '_blank', 3)")
  db.run("INSERT INTO hd_nav_item (title, link_type, link_target, open_mode, sort_order) VALUES ('\u6587\u65c5\u8d44\u8baf', 'external', 'http://culture.qingdao.gov.cn/', '_blank', 4)")

  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('openRestaurant','\u6211\u60f3\u5f00\u9910\u996e\u5e97','/historicDistrict/openRestaurant',1)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('hotel_accommodation','\u6211\u60f3\u4ece\u4e8b\u5bbe\u9986\u4f4f\u5bbf\u884c\u4e1a','/historicDistrict/hotel_accommodation',2)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('cultural_and_creative_industries','\u6211\u60f3\u5f00\u6587\u521b\u8d2d\u7269\u5546\u5e97','/historicDistrict/cultural_and_creative_industries',3)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('entertainment','\u6211\u60f3\u4ece\u4e8b\u5a31\u4e50\u884c\u4e1a','/historicDistrict/entertainment',4)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('travel_study','\u6211\u60f3\u5f00\u529e\u65c5\u884c\u793e','/historicDistrict/travel_study',5)")
  db.run("INSERT INTO hd_industry (slug, name, route_path, sort_order) VALUES ('organize_performance','\u6211\u60f3\u7ec4\u7ec7\u8425\u4e1a\u6027\u6f14\u51fa','/historicDistrict/organize_performance',6)")

  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('\u653f\u7b56\u670d\u52a1','external','http://zccx.qingdao.gov.cn/',1)")
  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('\u6cd5\u5f8b\u670d\u52a1','internal','/historicDistrict/law',2)")
  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('\u4eba\u624d\u670d\u52a1','internal','/historicDistrict/talents',3)")
  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('\u91d1\u878d\u670d\u52a1','internal','/historicDistrict/financial',4)")
  db.run("INSERT INTO hd_home_service (name, link_type, link_target, sort_order) VALUES ('\u5e2e\u529e\u670d\u52a1','internal','/historicDistrict/assistant',5)")

  const industryRow = scalar(db, "SELECT id FROM hd_industry WHERE slug='openRestaurant' LIMIT 1")
  if (industryRow?.id != null) {
    ensureOpenRestaurantDetailSeed(db, Number(industryRow.id))
  }
}
