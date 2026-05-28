import { querySql, runSql } from '../../db.js'

export function getHistoricHomeData() {
  const page = querySql("SELECT * FROM hd_page WHERE page_key='historic_home' LIMIT 1")[0] ?? null
  const navItems = querySql('SELECT * FROM hd_nav_item WHERE is_active=1 ORDER BY sort_order,id')
  const industries = querySql('SELECT * FROM hd_industry WHERE is_active=1 ORDER BY sort_order,id')
  const homeServices = querySql('SELECT * FROM hd_home_service WHERE is_active=1 ORDER BY sort_order,id')

  return {
    page,
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

    return {
      ...stage,
      categories
    }
  })

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

  return {
    industry,
    stages,
    leftMenu
  }
}

const SAFE_TABLES = new Set([
  'hd_page',
  'hd_nav_item',
  'hd_industry',
  'hd_home_service',
  'hd_stage',
  'hd_stage_category',
  'hd_topic',
  'hd_topic_link',
  'hd_topic_info_field'
])

function assertSafeTable(table) {
  if (!SAFE_TABLES.has(table)) {
    throw new Error('invalid table')
  }
}

export function updateRecord(table, id, payload) {
  assertSafeTable(table)

  const keys = Object.keys(payload)
  if (keys.length === 0) return

  const setClause = keys.map((k) => `${k}=?`).join(',')
  runSql(`UPDATE ${table} SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`, [...keys.map((k) => payload[k]), id])
}

export function createRecord(table, payload) {
  assertSafeTable(table)

  const keys = Object.keys(payload)
  if (keys.length === 0) {
    throw new Error('payload required')
  }

  const placeholders = keys.map(() => '?').join(',')
  runSql(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, keys.map((k) => payload[k]))
}

export function deleteRecord(table, id) {
  assertSafeTable(table)
  runSql(`DELETE FROM ${table} WHERE id=?`, [id])
}

export function listRecords(table, whereSql = '', params = []) {
  assertSafeTable(table)
  const sql = `SELECT * FROM ${table} ${whereSql}`.trim()
  return querySql(sql, params)
}

export function getPageByKey(pageKey) {
  return querySql('SELECT * FROM hd_page WHERE page_key=? LIMIT 1', [pageKey])[0] ?? null
}
