import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin } from 'antd'
import { getCdModuleTree, getCdModules } from '../../api/homeIndustry'
import '../../styles/historic.css'

const STAGE_VARIANTS = ['hd-stage-section--alt1', 'hd-stage-section--alt2', 'hd-stage-section--alt3', 'hd-stage-section--alt4']
const STAGE_EMOJIS = ['📝', '📋', '📂', '📑', '🗂️', '📄', '📌', '📎', '🗐', '📒']

/**
 * Build left menu structure from tree data.
 * Maps: Level1=stage, Level2=category, deeper=items (leaf anchors)
 */
function buildLeftMenu(tree) {
  if (!tree || tree.length === 0) return []
  return tree.filter(n => n.node_type === 'branch').map((level1) => ({
    stageKey: `stage-${level1.id}`,
    stageTitle: level1.title,
    categories: (level1.children || []).filter(n => n.node_type === 'branch').map((level2) => ({
      categoryKey: `cat-${level2.id}`,
      categoryTitle: level2.title,
      items: collectLeafAnchors(level2.children || [])
    }))
  }))
}

/**
 * Recursively collect leaf nodes as anchor targets.
 * If a branch has leaves directly, they become menu items.
 * If a branch only has sub-branches, drill deeper.
 */
function collectLeafAnchors(nodes) {
  const items = []
  for (const node of nodes) {
    if (node.node_type === 'leaf') {
      items.push({ anchorKey: `node-${node.id}`, title: node.title, nodeId: node.id })
    } else if (node.children && node.children.length > 0) {
      // Check if this branch has any leaf descendants
      const leaves = collectLeafAnchors(node.children)
      if (leaves.length > 0) {
        items.push(...leaves)
      } else {
        items.push({ anchorKey: `node-${node.id}`, title: node.title, nodeId: node.id })
      }
    }
  }
  return items
}

/**
 * Render leaf node content: link / info fields / richtext
 */
function LeafContent({ node }) {
  const content = node.content || {}

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
 * Render a branch node's children as topic cards.
 * Leaf children become expandable cards.
 * Branch children are recursively rendered.
 */
function TopicCard({ node, emoji, expanded, onToggle }) {
  const content = node.content || {}
  const isOpen = expanded.has(`node-${node.id}`)

  if (node.node_type === 'leaf') {
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
            <LeafContent node={node} />
          </div>
        )}
      </article>
    )
  }

  // Branch node: render its children
  return (
    <div>
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
  const observerRef = useRef(null)
  const programmaticScrollUntil = useRef(0)

  const leftMenu = useMemo(() => buildLeftMenu(tree), [tree])

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

  return (
    <div className="hd-detail-page">
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
            {leftMenu.map((stage) => (
              <div key={stage.stageKey} className="hd-left-stage">
                <div className="hd-left-stage-title">{stage.stageTitle}</div>
                {stage.categories.map((category) => (
                  <div key={category.categoryKey} className="hd-left-category">
                    <div className="hd-left-category-title">{category.categoryTitle}</div>
                    {category.items.map((item) => (
                      <a
                        key={item.anchorKey}
                        href={`#${item.anchorKey}`}
                        className={activeAnchor === item.anchorKey ? 'is-active' : ''}
                        onClick={(event) => onJumpAnchor(event, item.anchorKey)}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ))}
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
    </div>
  )
}
