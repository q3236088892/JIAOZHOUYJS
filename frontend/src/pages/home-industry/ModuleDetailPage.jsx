import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { getCdModuleTree } from '../../api/homeIndustry'
import HomeIndustryTopNav from '../../components/home-industry/HomeIndustryTopNav'
import { HOME_INDUSTRY_TITLE } from '../../constants/homeIndustry'
import { filterTreeByTopNavSection } from '../../utils/homeIndustryNavigation'
import '../../styles/historic.css'

const STAGE_VARIANTS = ['hd-stage-section--alt1', 'hd-stage-section--alt2', 'hd-stage-section--alt3', 'hd-stage-section--alt4']
const STAGE_EMOJIS = ['📝', '📋', '📂', '📑', '🗂️', '📄', '📌', '📎', '🗐', '📒']
const SPECIAL_SECTION_KEYS = new Set(['industry-intro', 'investment-promo'])

const INDUSTRY_INTRO_ASSET_BASE = '/home-industry/industry-intro'
const INDUSTRY_INTRO_STATIC_SECTIONS = [
  {
    id: 'overview',
    title: '\u4ea7\u4e1a\u7b80\u4ecb',
    images: [
      { src: `${INDUSTRY_INTRO_ASSET_BASE}/industry-intro-01.webp`, alt: '\u4ea7\u4e1a\u7b80\u4ecb\u5c55\u677f1' },
      { src: `${INDUSTRY_INTRO_ASSET_BASE}/industry-intro-02.webp`, alt: '\u4ea7\u4e1a\u7b80\u4ecb\u5c55\u677f2' }
    ]
  },
  {
    id: 'shanghe-smart-home',
    title: '\u4e0a\u5408\u667a\u80fd\u5bb6\u5c45\u4ea7\u4e1a',
    images: [
      { src: `${INDUSTRY_INTRO_ASSET_BASE}/shanghe-smart-home.webp`, alt: '\u4e0a\u5408\u667a\u80fd\u5bb6\u5c45\u4ea7\u4e1a\u60c5\u51b5\u4ecb\u7ecd' }
    ]
  },
  {
    id: 'yuanshi-muyu-home',
    title: '\u6e90\u6c0f\u6728\u8bed\u5bb6\u5177\u4ea7\u4e1a',
    images: [
      { src: `${INDUSTRY_INTRO_ASSET_BASE}/yuanshi-muyu-home.webp`, alt: '\u6e90\u6c0f\u6728\u8bed\u5bb6\u5177\u4ea7\u4e1a\u60c5\u51b5\u4ecb\u7ecd' }
    ]
  }
]

const INVESTMENT_PROMO_ASSET_BASE = '/home-industry/investment-promo'
const INVESTMENT_PROMO_STATIC_SECTIONS = [
  {
    id: 'video',
    type: 'video',
    title: '\u5ba3\u4f20\u89c6\u9891',
    src: `${INVESTMENT_PROMO_ASSET_BASE}/promo-video.mp4`
  },
  {
    id: 'supply-chain',
    type: 'image',
    title: '\u5b8c\u5584\u4f9b\u5e94\u94fe',
    images: [
      { src: `${INVESTMENT_PROMO_ASSET_BASE}/supply-chain.webp`, alt: '\u5b8c\u5584\u4f9b\u5e94\u94fe\u5c55\u677f' }
    ]
  },
  {
    id: 'strong-chain',
    type: 'image',
    title: '\u505a\u5f3a\u4ea7\u4e1a\u94fe',
    images: [
      { src: `${INVESTMENT_PROMO_ASSET_BASE}/strong-chain.webp`, alt: '\u505a\u5f3a\u4ea7\u4e1a\u94fe\u5c55\u677f' }
    ]
  }
]

const FIELD_BRANCH_TITLES = new Set([
  '服务类型',
  '服务内容',
  '服务地点/窗口',
  '服务地点窗口',
  '提供部门',
  '办公时间',
  '咨询时间',
  '咨询电话',
  '线上申报',
  '我要咨询',
  '我要申报',
  '我要办理'
])

const ACTION_FIELD_TITLES = new Set(['线上申报', '我要咨询', '我要申报', '我要办理'])
const WIDE_FIELD_TITLES = new Set(['服务内容', '服务地点/窗口', '服务地点窗口'])
const FIELD_BRANCH_SERVICE_CATEGORY_TITLES = new Set([
  '税务政策咨询、常见税务风险防范培训',
  '工业技术改造等政策咨询',
  '企业经营合规指导',
  '跨境电商法律法规解读',
  '家居类职业经理人、仓储运维等高端人才引进服务',
  '电商直播、售后、行政等青年人才引进服务',
  '家居行业线上消费节点（双11、618等）临时用工需求服务',
  '人才安置、子女入学、医疗卫生等保障性服务',
  '推动校企合作定向委培家居行业技能人才',
  '上市辅导、普惠金融政策咨询服务',
  '供应链金融服务（订单贷、仓单质押、智享家居贷等特色化产业投融资业务）',
  '重大项目“金牌团队”服务',
  '营商企服“金牌团队”服务',
  '线上销售综合服务基地选品服务',
  '跨境贸易综合服务',
  '中欧班列提供特色化进出口货运服务',
  '跨境信用互认'
].map(normalizeFieldTitle))

function normalizeFieldTitle(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[：:]+$/, '')
}

function isFieldBranchNode(node) {
  return node?.node_type === 'branch' && FIELD_BRANCH_TITLES.has(normalizeFieldTitle(node.title))
}

function isFieldBranchServiceCategory(category) {
  return category?.node_type === 'branch' && FIELD_BRANCH_SERVICE_CATEGORY_TITLES.has(normalizeFieldTitle(category.title))
}

function getFieldBranchNodes(category) {
  if (!isFieldBranchServiceCategory(category)) return []
  const branchChildren = (category.children || []).filter((child) => child.node_type === 'branch')
  if (branchChildren.length < 3) return []
  if (!branchChildren.every(isFieldBranchNode)) return []
  return branchChildren
}

/**
 * Build left menu structure from tree data.
 * Level1 = stage header, Level2 = category, Level3 = branch menu items only (no leaves)
 */
function buildLeftMenu(tree) {
  if (!tree || tree.length === 0) return []
  return tree.filter(n => n.node_type === 'branch').map((level1) => ({
    stageKey: `stage-${level1.id}`,
    stageTitle: level1.title,
    categories: (level1.children || []).filter(n => n.node_type === 'branch').map((level2) => ({
      categoryKey: `cat-${level2.id}`,
      categoryTitle: level2.title,
      items: getFieldBranchNodes(level2).length > 0
        ? []
        : (level2.children || []).filter(n => n.node_type === 'branch').map((child) => ({
          anchorKey: `node-${child.id}`,
          title: child.title,
          nodeId: child.id
        }))
    }))
  }))
}

function normalizeNodeContent(content = {}) {
  const fields = content.fields || []
  // Don't override 'blocks' type
  if (content.content_type === 'blocks') return { ...content, fields }
  if (content.body && !content.link_url && content.content_type !== 'link' && fields.length === 0) {
    return { ...content, content_type: 'richtext', fields }
  }
  return { ...content, fields }
}

function getNodeContent(node) {
  const content = node.content || {
    content_type: node.content_type,
    summary: node.summary,
    department: node.department,
    remark: node.remark,
    link_url: node.link_url,
    link_label: node.link_label,
    link_target: node.link_target,
    body: node.body,
    attachment_url: node.attachment_url,
    attachment_name: node.attachment_name,
    fields: node.fields || []
  }

  return normalizeNodeContent(content)
}

function getContentFields(content) {
  return (content.fields || [])
    .map((field) => ({
      label: field.field_label || field.label,
      value: field.field_value || field.value
    }))
    .filter((field) => field.label && field.value)
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, '')
}

function isBodyOnlyLeaf(node, content) {
  if (content.content_type === 'blocks') return false
  return Boolean(
    content.body &&
    !node.description &&
    !content.link_url &&
    (!content.fields || content.fields.length === 0) &&
    normalizeText(node.title) === normalizeText(content.body)
  )
}

function collectLeafNodes(node) {
  if (!node) return []
  if (node.node_type === 'leaf') return [node]
  return (node.children || []).flatMap((child) => collectLeafNodes(child))
}

function getFieldBranchItem(fieldNode) {
  const label = fieldNode.title
  const leaves = collectLeafNodes(fieldNode)
  const values = []
  let linkUrl = ''
  let linkLabel = ''
  let linkTarget = '_blank'

  for (const leaf of leaves) {
    const content = getNodeContent(leaf)
    if (content.link_url && !linkUrl) {
      linkUrl = content.link_url
      linkLabel = content.link_label || leaf.title || label
      linkTarget = content.link_target || '_blank'
    }
    const value = content.body || content.summary || content.link_label || leaf.title
    if (value) values.push(String(value))
  }

  return {
    key: `field-${fieldNode.id}`,
    label,
    normalizedLabel: normalizeFieldTitle(label),
    value: values.join('\n'),
    linkUrl,
    linkLabel,
    linkTarget
  }
}

function FieldBranchServiceCard({ category }) {
  const items = getFieldBranchNodes(category).map(getFieldBranchItem)
  const infoItems = items.filter((item) => !ACTION_FIELD_TITLES.has(item.normalizedLabel))
  const actionItems = items.filter((item) => ACTION_FIELD_TITLES.has(item.normalizedLabel))

  return (
    <article className="hd-topic-card hd-service-detail-card hd-field-service-card">
      <div className="hd-field-service-grid">
        {infoItems.map((item) => (
          <div
            key={item.key}
            className={`hd-field-service-item${WIDE_FIELD_TITLES.has(item.normalizedLabel) ? ' hd-field-service-item--wide' : ''}`}
          >
            <div className="hd-field-service-label">{item.label}</div>
            <div className="hd-field-service-value">{item.value}</div>
          </div>
        ))}
      </div>
      {actionItems.length > 0 && (
        <div className="hd-field-service-actions">
          {actionItems.map((item) => (
            item.linkUrl ? (
              <a
                key={item.key}
                href={item.linkUrl}
                target={item.linkTarget}
                rel="noopener noreferrer"
                className="hd-field-service-action"
              >
                {item.linkLabel || item.label}
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <span key={item.key} className="hd-field-service-action hd-field-service-action--static">
                {item.label}
                <span aria-hidden="true">→</span>
              </span>
            )
          ))}
        </div>
      )}
    </article>
  )
}

/**
 * Render blocks content from JSON body
 */
function BlocksContent({ body }) {
  let blocks = []
  try {
    blocks = JSON.parse(body)
    if (!Array.isArray(blocks)) return <p style={{ whiteSpace: 'pre-wrap' }}>{body}</p>
    // Fix double-encoded blocks: single text block whose content is a JSON string of actual blocks
    if (blocks.length === 1 && blocks[0].type === 'text' && typeof blocks[0].content === 'string') {
      try {
        const inner = JSON.parse(blocks[0].content)
        if (Array.isArray(inner) && inner.length > 0 && inner[0].type) {
          blocks = inner
        }
      } catch {}
    }
  } catch {
    return <p style={{ whiteSpace: 'pre-wrap' }}>{body}</p>
  }

  return (
    <div className="hd-blocks-content">
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return (
            <p key={block.id || i} style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {block.content}
            </p>
          )
        }
        if (block.type === 'image' && block.url) {
          return (
            <figure key={block.id || i} style={{ margin: '0 0 12px' }}>
              <img src={block.url} alt={block.caption || ''} style={{ maxWidth: '100%', borderRadius: 4 }} />
              {block.caption && (
                <figcaption style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }}>
                  {block.caption}
                </figcaption>
              )}
            </figure>
          )
        }
        if (block.type === 'video' && block.url) {
          const isBili = block.url.includes('bilibili.com')
          const src = isBili ? block.url.replace('/video/', '/player/bn/').split('?')[0] : block.url
          return (
            <div key={block.id || i} style={{ marginBottom: 12 }}>
              <iframe
                src={src}
                style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 4 }}
                allowFullScreen
              />
            </div>
          )
        }
        if (block.type === 'info' && block.fields) {
          return (
            <div key={block.id || i} className="hd-topic-info" style={{ marginBottom: 12 }}>
              {block.fields.filter(f => f.label && f.value).map((f, j) => (
                <div key={j} className="hd-topic-info-field">
                  <span className="label">{f.label}</span>
                  <span className="value">{f.value}</span>
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

/**
 * Render leaf node content: link / info fields / richtext
 */
function LeafContent({ node }) {
  const content = getNodeContent(node)

  return (
    <>
      {node.description && (
        <div className="hd-topic-description">
          <p>{node.description}</p>
        </div>
      )}

      {content.content_type === 'link' && content.link_url && (
        <a
          href={content.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hd-service-link"
        >
          <span className="hd-service-link__text">{content.link_label || content.link_url}</span>
          <span className="hd-service-link__arrow">→</span>
        </a>
      )}

      {content.content_type === 'info' && content.summary && (
        <div className="hd-topic-description">
          <p style={{ textIndent: 0, whiteSpace: 'pre-wrap' }}>{content.summary}</p>
        </div>
      )}

      {content.content_type === 'info' && getContentFields(content).length > 0 && (
        <div className="hd-topic-info">
          {getContentFields(content).map((f, i) => (
            <div key={i} className="hd-topic-info-field">
              <span className="label">{f.label}</span>
              <span className="value">{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {content.content_type === 'richtext' && content.body && (
        <div className="hd-topic-description">
          <p style={{ textIndent: 0, whiteSpace: 'pre-wrap' }}>{content.body}</p>
        </div>
      )}

      {content.content_type === 'blocks' && content.body && (
        <BlocksContent body={content.body} />
      )}

      {content.department && (
        <div className="hd-topic-info" style={{ marginTop: 12 }}>
          <div className="hd-topic-info-field">
            <span className="label">提供部门</span>
            <span className="value">{content.department}</span>
          </div>
        </div>
      )}

      {content.attachment_url && (
        <div style={{ marginTop: 16 }}>
          <a
            href={content.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            download={content.attachment_name || ''}
            className="hd-attachment-link"
          >
            <span className="hd-attachment-link__icon" aria-hidden="true">📎</span>
            <span className="hd-attachment-link__text">
              下载附件：{content.attachment_name || content.attachment_url.split('/').pop()}
            </span>
            <span className="hd-attachment-link__arrow">⬇</span>
          </a>
        </div>
      )}
    </>
  )
}

/**
 * Render a node as a topic card.
 * Leaf: directly show content (no expand/collapse).
 * Branch: expandable accordion to show children.
 */
function TopicCard({ node, emoji, expanded, onToggle }) {
  const isOpen = expanded.has(`node-${node.id}`)

  // Leaf node: show title + content directly (hide body if empty)
  if (node.node_type === 'leaf') {
    const content = getNodeContent(node)
    const isLink = content.content_type === 'link' && content.link_url
    const bodyOnly = isBodyOnlyLeaf(node, content)
    const hasBody = node.description || content.link_url || content.body || (content.fields && content.fields.length > 0) || content.department

    if (isLink) {
      return (
        <article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card hd-service-detail-card--link">
          <a
            href={content.link_url}
            target={content.link_target || '_blank'}
            rel="noopener noreferrer"
            className="hd-topic-title hd-topic-title--link"
          >
            <span className="hd-topic-title__text">
              <span className="hd-topic-title__icon" aria-hidden="true">{emoji}</span>
              <span className="hd-topic-title__name">{content.link_label || node.title}</span>
            </span>
            <span className="hd-topic-title__arrow">↗</span>
          </a>
        </article>
      )
    }

    if (bodyOnly) {
      return (
        <article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card">
          <div className="hd-topic-body hd-topic-body--standalone">
            <LeafContent node={node} />
          </div>
        </article>
      )
    }

    return (
      <article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card">
        <div className="hd-topic-title" style={{ cursor: 'default' }}>
          <span className="hd-topic-title__text">
            <span className="hd-topic-title__icon" aria-hidden="true">{emoji}</span>
            <span className="hd-topic-title__name">{node.title}</span>
          </span>
        </div>
        {hasBody && (
          <div className="hd-topic-body">
            <LeafContent node={node} />
          </div>
        )}
      </article>
    )
  }

  // Branch node: expandable to show children
  return (
    <article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card">
      <button
        type="button"
        className="hd-topic-title"
        onClick={() => onToggle(`node-${node.id}`)}
      >
        <span className="hd-topic-title__text">
          <span className="hd-topic-title__icon" aria-hidden="true">{emoji}</span>
          <span className="hd-topic-title__name">{node.title}</span>
        </span>
        <span className={`hd-topic-title__arrow${isOpen ? ' is-open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="hd-topic-body">
          {(node.children || []).map((child, idx) => (
            <TopicCard
              key={child.id}
              node={child}
              emoji={STAGE_EMOJIS[idx % STAGE_EMOJIS.length]}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </article>
  )
}

/**
 * Render the right side content: Stage sections → Category blocks → Topic cards
 */
function RightContent({ tree, expanded, onToggle, moduleInfo }) {
  const isIndustryChain = moduleInfo?.code === 'industry_chain'
  return (
    <div className={`hd-right-content${isIndustryChain ? ' hd-right-content--chain' : ''}`}>
      {tree.filter(n => n.node_type === 'branch').map((level1, stageIdx) => (
        <section
          key={level1.id}
          className={`hd-stage-section ${STAGE_VARIANTS[stageIdx % STAGE_VARIANTS.length]}`}
          id={`stage-${level1.id}`}
        >
          <div className="hd-stage-title">{level1.title}</div>

          {(level1.children || []).filter(n => n.node_type === 'branch').map((level2) => (
            <div key={level2.id} className="hd-category-block" id={`cat-${level2.id}`}>
              <h3>{level2.title}</h3>

              {getFieldBranchNodes(level2).length > 0 ? (
                <FieldBranchServiceCard category={level2} />
              ) : (
                (level2.children || []).map((child, idx) => (
                  <TopicCard
                    key={child.id}
                    node={child}
                    emoji={STAGE_EMOJIS[idx % STAGE_EMOJIS.length]}
                    expanded={expanded}
                    onToggle={onToggle}
                  />
                ))
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}


function getSpecialRoot(tree) {
  const first = tree?.[0]
  if (!first) return null
  const children = first.children || []
  if (children.length === 1) return children[0]
  return first
}

function shouldUseParentTitleForOnlyChild(root, child) {
  if (!root || !child || child.node_type !== 'leaf') return false
  const content = getNodeContent(child)
  return isBodyOnlyLeaf(child, content) || normalizeText(child.title).length > 30
}

function getSpecialSections(root) {
  if (!root) return []
  const children = root.children || []
  if (children.length === 0) {
    return [{ id: root.id, title: root.title, node: root }]
  }
  if (children.length === 1 && shouldUseParentTitleForOnlyChild(root, children[0])) {
    return [{ id: children[0].id, title: root.title, node: children[0] }]
  }
  return children.map((child) => ({ id: child.id, title: child.title, node: child }))
}

function SpecialNodeContent({ node }) {
  if (node.node_type === 'leaf') {
    return (
      <div className="hd-special-node-body">
        <LeafContent node={node} />
      </div>
    )
  }

  return (
    <div className="hd-special-node-children">
      {(node.children || []).map((child) => (
        <div key={child.id} className="hd-special-subsection">
          <h3>{child.title}</h3>
          <SpecialNodeContent node={child} />
        </div>
      ))}
    </div>
  )
}


function IndustryIntroSpecialContent({ activeAnchor, onJumpAnchor }) {
  return (
    <div className="hd-special-section-layout hd-special-section-layout--industry-intro">
      <aside className="hd-special-anchor-menu">
        <div className="hd-special-anchor-menu__inner">
          <div className="hd-special-anchor-cover">
            <img
              src={`${INDUSTRY_INTRO_ASSET_BASE}/industry-intro-cover.webp`}
              alt="\u4ea7\u4e1a\u7b80\u4ecb"
              loading="lazy"
            />
            <div className="hd-special-anchor-cover__overlay">
              <span>{'\u4ea7\u4e1a\u7b80\u4ecb'}</span>
            </div>
          </div>
          {INDUSTRY_INTRO_STATIC_SECTIONS.map((section, index) => {
            const anchorKey = `industry-intro-${section.id}`
            const isActive = activeAnchor === anchorKey || (!activeAnchor && index === 0)
            return (
              <a
                key={anchorKey}
                href={`#${anchorKey}`}
                className={`hd-special-anchor-item${isActive ? ' is-active' : ''}`}
                onClick={(event) => onJumpAnchor(event, anchorKey)}
              >
                <span className="hd-left-item-dot" />
                <span>{section.title}</span>
              </a>
            )
          })}
        </div>
      </aside>

      <main className="hd-special-content hd-special-content--poster">
        <header className="hd-special-header">
          <span className="hd-special-header__eyebrow">{'\u4e13\u9898\u5c55\u793a'}</span>
          <h2>{'\u4ea7\u4e1a\u7b80\u4ecb'}</h2>
        </header>
        {INDUSTRY_INTRO_STATIC_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`industry-intro-${section.id}`}
            className="hd-special-content-section hd-special-poster-section"
          >
            <h2>{section.title}</h2>
            <div className="hd-special-poster-list">
              {section.images.map((image) => (
                <img
                  key={image.src}
                  className="hd-special-poster-image"
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function InvestmentPromoSpecialContent({ activeAnchor, onJumpAnchor }) {
  return (
    <div className="hd-special-section-layout hd-special-section-layout--industry-intro hd-special-section-layout--investment-promo">
      <aside className="hd-special-anchor-menu">
        <div className="hd-special-anchor-menu__inner">
          <div className="hd-special-anchor-cover hd-special-anchor-cover--promo">
            <div className="hd-special-anchor-cover__overlay">
              <span>{'\u62db\u5546\u5ba3\u4f20'}</span>
            </div>
          </div>
          {INVESTMENT_PROMO_STATIC_SECTIONS.map((section, index) => {
            const anchorKey = `investment-promo-${section.id}`
            const isActive = activeAnchor === anchorKey || (!activeAnchor && index === 0)
            return (
              <a
                key={anchorKey}
                href={`#${anchorKey}`}
                className={`hd-special-anchor-item${isActive ? ' is-active' : ''}`}
                onClick={(event) => onJumpAnchor(event, anchorKey)}
              >
                <span className="hd-left-item-dot" />
                <span>{section.title}</span>
              </a>
            )
          })}
        </div>
      </aside>

      <main className="hd-special-content hd-special-content--poster hd-special-content--investment-promo">
        <header className="hd-special-header">
          <span className="hd-special-header__eyebrow">{'\u4e13\u9898\u5c55\u793a'}</span>
          <h2>{'\u62db\u5546\u5ba3\u4f20'}</h2>
        </header>
        {INVESTMENT_PROMO_STATIC_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`investment-promo-${section.id}`}
            className={`hd-special-content-section hd-special-poster-section${section.type === 'video' ? ' hd-special-video-section' : ''}`}
          >
            <h2>{section.title}</h2>
            {section.type === 'video' ? (
              <div className="hd-special-promo-video-wrap">
                <video
                  className="hd-special-promo-video"
                  src={section.src}
                  autoPlay
                  controls
                  muted
                  playsInline
                  preload="metadata"
                >
                  {'\u60a8\u7684\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u89c6\u9891\u64ad\u653e'}
                </video>
              </div>
            ) : (
              <div className="hd-special-poster-list">
                {section.images.map((image) => (
                  <img
                    key={image.src}
                    className="hd-special-poster-image"
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  )
}

function SpecialSectionContent({ tree, activeAnchor, onJumpAnchor, sectionKey }) {
  if (sectionKey === 'industry-intro') {
    return <IndustryIntroSpecialContent activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} />
  }
  if (sectionKey === 'investment-promo') {
    return <InvestmentPromoSpecialContent activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} />
  }

  const root = getSpecialRoot(tree)
  const sections = getSpecialSections(root)
  const showAnchorMenuTitle = !(sections.length === 1 && sections[0]?.title === root?.title)

  if (!root) return null

  return (
    <div className="hd-special-section-layout">
      <aside className="hd-special-anchor-menu">
        <div className="hd-special-anchor-menu__inner">
          {showAnchorMenuTitle && <div className="hd-special-anchor-menu__title">{root.title}</div>}
          {sections.map((section) => {
            const anchorKey = `special-node-${section.id}`
            return (
              <a
                key={anchorKey}
                href={`#${anchorKey}`}
                className={`hd-special-anchor-item${activeAnchor === anchorKey ? ' is-active' : ''}`}
                onClick={(event) => onJumpAnchor(event, anchorKey)}
              >
                <span className="hd-left-item-dot" />
                <span>{section.title}</span>
              </a>
            )
          })}
        </div>
      </aside>

      <main className="hd-special-content">
        <header className="hd-special-header">
          <span className="hd-special-header__eyebrow">{'\u4e13\u9898\u5c55\u793a'}</span>
          <h2>{root.title}</h2>
        </header>
        {sections.map((section) => (
          <section key={section.id} id={`special-node-${section.id}`} className="hd-special-content-section">
            <h2>{section.title}</h2>
            <SpecialNodeContent node={section.node} />
          </section>
        ))}
      </main>
    </div>
  )
}

export default function ModuleDetailPage() {
  const { moduleCode } = useParams()
  const location = useLocation()
  const [moduleInfo, setModuleInfo] = useState(null)
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [activeAnchor, setActiveAnchor] = useState('')
  const [menuCollapsed, setMenuCollapsed] = useState(new Set())
  const observerRef = useRef(null)
  const programmaticScrollUntil = useRef(0)

  const sectionKey = useMemo(() => new URLSearchParams(location.search).get('section'), [location.search])
  const visibleTree = useMemo(
    () => filterTreeByTopNavSection(tree, moduleCode, sectionKey),
    [tree, moduleCode, sectionKey]
  )
  const leftMenu = useMemo(() => buildLeftMenu(visibleTree), [visibleTree])
  const isSpecialSection = moduleCode === 'value_added' && SPECIAL_SECTION_KEYS.has(sectionKey)

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  useEffect(() => {
    setLoading(true)
    setExpanded(new Set())
    setActiveAnchor('')

    getCdModuleTree(moduleCode)
      .then((res) => {
        if (res.data.code === 200) {
          const { module: mod, tree: t } = res.data.data
          setModuleInfo(mod)
          setTree(t)

          // Auto-expand first topic and set active anchor
          const menu = buildLeftMenu(t)
          let firstAnchor = ''
          for (const stage of menu) {
            for (const cat of stage.categories) {
              if (cat.items.length > 0 && !firstAnchor) {
                firstAnchor = cat.items[0].anchorKey
              }
            }
          }
          if (firstAnchor) {
            setActiveAnchor(firstAnchor)
            setExpanded(new Set([firstAnchor]))
          }
          // Default: first stage expanded, others collapsed
          const collapsed = new Set()
          menu.forEach((s, i) => {
            if (i > 0) collapsed.add(s.stageKey)
            s.categories.forEach((c, j) => {
              if (j > 0) collapsed.add(c.categoryKey)
            })
          })
          setMenuCollapsed(collapsed)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

  }, [moduleCode])

  useEffect(() => {
    let firstAnchor = ''
    const menu = buildLeftMenu(visibleTree)
    for (const stage of menu) {
      for (const cat of stage.categories) {
        if (cat.items.length > 0 && !firstAnchor) {
          firstAnchor = cat.items[0].anchorKey
        }
      }
    }
    setActiveAnchor(firstAnchor)
    setExpanded(firstAnchor ? new Set([firstAnchor]) : new Set())
    setMenuCollapsed(new Set())
  }, [visibleTree])

  // Intersection observer for active menu highlighting
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const anchors = []
    for (const stage of leftMenu) {
      for (const category of stage.categories) {
        for (const item of category.items) {
          anchors.push(item.anchorKey)
        }
      }
    }
    if (!anchors.length) return
    if (typeof IntersectionObserver === 'undefined') return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticScrollUntil.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveAnchor(visible[0].target.id)
      },
      { rootMargin: '-90px 0px -55% 0px', threshold: [0, 0.1, 0.5, 1] }
    )

    for (const a of anchors) {
      const el = document.getElementById(a)
      if (el) observerRef.current.observe(el)
    }
    return () => observerRef.current && observerRef.current.disconnect()
  }, [leftMenu])

  const toggle = (anchorKey) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(anchorKey)) next.delete(anchorKey)
      else next.add(anchorKey)
      return next
    })
  }

  const toggleMenu = (key) => {
    setMenuCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onJumpAnchor = (event, anchorKey) => {
    event.preventDefault()
    setActiveAnchor(anchorKey)
    setExpanded((prev) => {
      if (prev.has(anchorKey)) return prev
      const next = new Set(prev)
      next.add(anchorKey)
      return next
    })
    requestAnimationFrame(() => {
      const element = document.getElementById(anchorKey)
      if (!element) return
      programmaticScrollUntil.current = Date.now() + 700
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  if (loading) {
    return (
      <div className="hd-detail-page hd-detail-page--banner-pending" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const detailBannerUrl = moduleInfo?.detail_banner_url
  const pageStyle = detailBannerUrl
    ? { backgroundImage: `url(${detailBannerUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top center', backgroundSize: '100% 300px', backgroundColor: '#f7fbff' }
    : undefined

  return (
    <div className="hd-detail-page" style={pageStyle}>
      <HomeIndustryTopNav moduleCode={moduleCode} sectionKey={sectionKey} />

      <div className="hd-detail-hero">
        <h1>{HOME_INDUSTRY_TITLE}</h1>
      </div>

      <div className={isSpecialSection ? 'hd-detail-content hd-detail-content--special' : 'hd-detail-content'}>
        {isSpecialSection ? (
          <SpecialSectionContent tree={visibleTree} activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} sectionKey={sectionKey} />
        ) : (
          <>
            <aside className="hd-left-menu">
              <div className="hd-left-menu__inner">
                {leftMenu.map((stage) => {
                  const stageCollapsed = menuCollapsed.has(stage.stageKey)
                  return (
                    <div key={stage.stageKey} className="hd-left-stage">
                      <a
                        href={`#${stage.stageKey}`}
                        className={`hd-left-stage-title${stageCollapsed ? ' is-collapsed' : ''}`}
                        onClick={(e) => { e.preventDefault(); toggleMenu(stage.stageKey); onJumpAnchor(e, stage.stageKey) }}
                      >
                        <span className="hd-left-arrow">{stageCollapsed ? '\u25b8' : '\u25be'}</span>
                        <span>{stage.stageTitle}</span>
                      </a>
                      {!stageCollapsed && stage.categories.map((category) => {
                        const catCollapsed = menuCollapsed.has(category.categoryKey)
                        return (
                          <div key={category.categoryKey} className="hd-left-category">
                            <a
                              href={`#${category.categoryKey}`}
                              className={`hd-left-category-title${catCollapsed ? ' is-collapsed' : ''}`}
                              onClick={(e) => { toggleMenu(category.categoryKey); onJumpAnchor(e, category.categoryKey) }}
                            >
                              <span className="hd-left-arrow hd-left-arrow--sm">{catCollapsed ? '\u25b8' : '\u25be'}</span>
                              <span>{category.categoryTitle}</span>
                            </a>
                            {!catCollapsed && category.items.map((item) => (
                              <a
                                key={item.anchorKey}
                                href={`#${item.anchorKey}`}
                                className={`hd-left-item${activeAnchor === item.anchorKey ? ' is-active' : ''}`}
                                onClick={(event) => onJumpAnchor(event, item.anchorKey)}
                              >
                                <span className="hd-left-item-dot" />
                                <span>{item.title}</span>
                              </a>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </aside>

            <RightContent tree={visibleTree} expanded={expanded} onToggle={toggle} moduleInfo={moduleInfo} />
          </>
        )}
      </div>

      <footer className="hd-footer">
        <div className="hd-footer__divider1" />
        <div className="hd-footer__divider2" />
        <div className="hd-footer__body">{HOME_INDUSTRY_TITLE}</div>
      </footer>

      <button
        type="button"
        className="hd-back-to-top"
        onClick={scrollToTop}
        aria-label="回到顶部"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>
    </div>
  )
}
