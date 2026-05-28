import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistoricIndustryDetail, getHistoricHome } from '../../api/historic'
import { buildLeftMenuFromStages } from '../../utils/historicTransform'
import '../../styles/historic.css'

const STAGE_VARIANTS = ['hd-stage-section--alt1', 'hd-stage-section--alt2', 'hd-stage-section--alt3', 'hd-stage-section--alt4']
const STAGE_EMOJIS = ['📝', '📋', '📂', '📑', '🗂️', '📄']

function NavItem({ item }) {
  const href = item.link_target || '/historicDistrict'
  const isExternal = item.link_type === 'external' || /^https?:\/\//i.test(href)
  if (isExternal) {
    return (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer">{item.title}</a>
      </li>
    )
  }
  return (
    <li>
      <Link to={href}>{item.title}</Link>
    </li>
  )
}

export default function HistoricOpenRestaurantPage() {
  const [detail, setDetail] = useState({ industry: null, stages: [] })
  const [navItems, setNavItems] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [activeAnchor, setActiveAnchor] = useState('')
  const observerRef = useRef(null)
  const programmaticScrollUntil = useRef(0)

  useEffect(() => {
    let mounted = true
    getHistoricIndustryDetail('openRestaurant')
      .then((res) => {
        if (!mounted) return
        if (res.data.code === 200) {
          const payload = res.data.data || { industry: null, stages: [] }
          setDetail(payload)

          const defaultOpened = new Set()
          let firstAnchor = ''
          for (const stage of payload.stages || []) {
            for (const category of stage.categories || []) {
              for (const topic of category.topics || []) {
                if (!firstAnchor) firstAnchor = topic.anchor_key
                if (Number(topic.default_expanded) === 1) {
                  defaultOpened.add(topic.anchor_key)
                }
              }
            }
          }
          setExpanded(defaultOpened)
          if (firstAnchor) setActiveAnchor(firstAnchor)
        }
      })
      .catch(() => {
        if (!mounted) return
        setDetail({ industry: null, stages: [] })
      })

    getHistoricHome()
      .then((res) => {
        if (!mounted) return
        if (res.data.code === 200) {
          setNavItems(res.data.data?.navItems || [])
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const leftMenu = useMemo(() => buildLeftMenuFromStages(detail.stages), [detail.stages])

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

  return (
    <div className="hd-detail-page">
      <header className="hd-top-nav">
        <ul>
          {navItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </ul>
      </header>

      <div className="hd-detail-hero">
        <h1>{detail.industry?.name || '我想开餐饮店'}</h1>
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

        <main className="hd-right-content">
          {detail.stages.map((stage, stageIdx) => (
            <section
              key={stage.stage_key}
              className={`hd-stage-section ${STAGE_VARIANTS[stageIdx % STAGE_VARIANTS.length]}`}
            >
              <div className="hd-stage-title">{stage.stage_title}</div>
              {(stage.categories || []).map((category) => (
                <div key={category.category_key} className="hd-category-block">
                  <h3 id={`cat-${category.category_key}`}>{category.category_title}</h3>
                  {(category.topics || []).map((topic, topicIdx) => {
                    const isOpen = expanded.has(topic.anchor_key)
                    const emoji = STAGE_EMOJIS[topicIdx % STAGE_EMOJIS.length]
                    return (
                      <article
                        key={topic.anchor_key}
                        id={topic.anchor_key}
                        className="hd-topic-card"
                      >
                        <button
                          type="button"
                          className="hd-topic-title"
                          onClick={() => toggle(topic.anchor_key)}
                        >
                          <span className="hd-topic-title__text">
                            <span className="hd-topic-title__icon" aria-hidden="true">{emoji}</span>
                            <span className="hd-topic-title__name">{topic.title}</span>
                          </span>
                          <span className={`hd-topic-title__arrow${isOpen ? ' is-open' : ''}`}>▼</span>
                        </button>

                        {isOpen && (
                          <div className="hd-topic-body">
                            {topic.description ? (
                              <div className="hd-topic-description">
                                <p>{topic.description}</p>
                              </div>
                            ) : null}

                            {(topic.links || []).map((lnk) => (
                              <a
                                key={lnk.id}
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hd-service-link"
                              >
                                <span className="hd-service-link__text">{lnk.label}</span>
                                <span className="hd-service-link__arrow">→</span>
                              </a>
                            ))}

                            {(topic.infoFields || []).length > 0 && (
                              <div className="hd-topic-info">
                                {topic.infoFields.map((field) => (
                                  <div key={field.id} className="hd-topic-info-field">
                                    <span className="label">{field.field_label}</span>
                                    <span className="value">{field.field_value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              ))}
            </section>
          ))}
        </main>
      </div>

      <footer className="hd-footer">
        <div className="hd-footer__divider1" />
        <div className="hd-footer__divider2" />
        <div className="hd-footer__body">
          青岛市市南区人民政府 主办 · 历史城区文旅产业服务“一类事”
        </div>
      </footer>
    </div>
  )
}
