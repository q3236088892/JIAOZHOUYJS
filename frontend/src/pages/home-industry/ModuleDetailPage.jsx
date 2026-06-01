import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin } from 'antd'
import { getCdModuleTree, getCdModules } from '../../api/homeIndustry'
import '../../styles/historic.css'

const STAGE_VARIANTS = ['hd-stage-section--alt1', 'hd-stage-section--alt2', 'hd-stage-section--alt3', 'hd-stage-section--alt4']
const STAGE_EMOJIS = ['📝', '📋', '📂', '📑', '🗂️', '📄', '📌', '📎', '🗐', '📒']

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
      items: (level2.children || []).filter(n => n.node_type === 'branch').map((child) => ({
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
    fields: node.fields || []
  }

  return normalizeNodeContent(content)
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

      {content.content_type === 'info' && content.fields && content.fields.length > 0 && (
        <div className="hd-topic-info">
          {content.fields.map((f, i) => (
            <div key={i} className="hd-topic-info-field">
              <span className="label">{f.field_label}</span>
              <span className="value">{f.field_value}</span>
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
        <article id={`node-${node.id}`} className="hd-topic-card">
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
        <article id={`node-${node.id}`} className="hd-topic-card">
          <div className="hd-topic-body hd-topic-body--standalone">
            <LeafContent node={node} />
          </div>
        </article>
      )
    }

    return (
      <article id={`node-${node.id}`} className="hd-topic-card">
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
    <article id={`node-${node.id}`} className="hd-topic-card">
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
function RightContent({ tree, expanded, onToggle }) {
  return (
    <div className="hd-right-content">
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

              {(level2.children || []).map((child, idx) => (
                <TopicCard
                  key={child.id}
                  node={child}
                  emoji={STAGE_EMOJIS[idx % STAGE_EMOJIS.length]}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

export default function ModuleDetailPage() {
  const { moduleCode } = useParams()
  const [moduleInfo, setModuleInfo] = useState(null)
  const [allModules, setAllModules] = useState([])
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [activeAnchor, setActiveAnchor] = useState('')
  const [menuCollapsed, setMenuCollapsed] = useState(new Set())
  const observerRef = useRef(null)
  const programmaticScrollUntil = useRef(0)

  const leftMenu = useMemo(() => buildLeftMenu(tree), [tree])

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

    getCdModules()
      .then((res) => {
        if (res.data.code === 200) setAllModules(res.data.data)
      })
      .catch(() => {})
  }, [moduleCode])

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
      <div className="hd-detail-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
      <header className="hd-top-nav">
        <ul>
          <li><Link to="/homeIndustry">历史首页</Link></li>
          {allModules.map((m) => (
            <li key={m.id}>
              <Link to={`/homeIndustry/${m.code}`} style={m.code === moduleCode ? { fontWeight: 700, background: 'rgba(255,255,255,0.15)' } : undefined}>
                {m.title}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      <div className="hd-detail-hero">
        <h1>{moduleInfo?.title || '服务详情'}</h1>
      </div>

      <div className="hd-detail-content">
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
                    <span className="hd-left-arrow">{stageCollapsed ? '▸' : '▾'}</span>
                    <span>{stage.stageTitle}</span>
                  </a>
                  {!stageCollapsed && stage.categories.map((category) => {
                    const catCollapsed = menuCollapsed.has(category.categoryKey)
                    return (
                      <div key={category.categoryKey} className="hd-left-category">
                        <a
                          href={`#${category.categoryKey}`}
                          className={`hd-left-category-title${catCollapsed ? ' is-collapsed' : ''}`}
                          onClick={(e) => { e.preventDefault(); toggleMenu(category.categoryKey) }}
                        >
                          <span className="hd-left-arrow hd-left-arrow--sm">{catCollapsed ? '▸' : '▾'}</span>
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

        <RightContent tree={tree} expanded={expanded} onToggle={toggle} />
      </div>

      <footer className="hd-footer">
        <div className="hd-footer__divider1" />
        <div className="hd-footer__divider2" />
        <div className="hd-footer__body">
          胶州市家居产业服务"一类事"
        </div>
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
