import { useEffect, useMemo, useState } from 'react'
import { getHistoricIndustryDetail } from '../../api/historic'
import { buildLeftMenuFromStages } from '../../utils/historicTransform'
import '../../styles/historic.css'

export default function HistoricOpenRestaurantPage() {
  const [detail, setDetail] = useState({ industry: null, stages: [] })
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    let mounted = true
    getHistoricIndustryDetail('openRestaurant')
      .then((res) => {
        if (!mounted) return
        if (res.data.code === 200) {
          const payload = res.data.data || { industry: null, stages: [] }
          setDetail(payload)

          const defaultOpened = new Set()
          for (const stage of payload.stages || []) {
            for (const category of stage.categories || []) {
              for (const topic of category.topics || []) {
                if (Number(topic.default_expanded) === 1) {
                  defaultOpened.add(topic.anchor_key)
                }
              }
            }
          }
          setExpanded(defaultOpened)
        }
      })
      .catch(() => {
        if (!mounted) return
        setDetail({ industry: null, stages: [] })
      })

    return () => {
      mounted = false
    }
  }, [])

  const leftMenu = useMemo(() => buildLeftMenuFromStages(detail.stages), [detail.stages])

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
    const element = document.getElementById(anchorKey)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="hd-detail-page">
      <aside className="hd-left-menu">
        {leftMenu.map((stage) => (
          <div key={stage.stageKey} className="hd-left-stage">
            <div className="hd-left-stage-title">{stage.stageTitle}</div>
            {stage.categories.map((category) => (
              <div key={category.categoryKey} className="hd-left-category">
                <div className="hd-left-category-title">{category.categoryTitle}</div>
                {category.items.map((item) => (
                  <a key={item.anchorKey} href={`#${item.anchorKey}`} onClick={(event) => onJumpAnchor(event, item.anchorKey)}>
                    {item.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
        ))}
      </aside>

      <main className="hd-right-content">
        <h1 className="hd-detail-title">{detail.industry?.name || '\u6211\u60f3\u5f00\u9910\u996e\u5e97'}</h1>

        {detail.stages.map((stage) => (
          <section key={stage.stage_key} className="hd-stage-section">
            <div className="hd-stage-title">{stage.stage_title}</div>
            {(stage.categories || []).map((category) => (
              <div key={category.category_key} className="hd-category-block">
                <h3>{category.category_title}</h3>
                {(category.topics || []).map((topic) => (
                  <article key={topic.anchor_key} id={topic.anchor_key} className="hd-topic-card">
                    <button type="button" className="hd-topic-title" onClick={() => toggle(topic.anchor_key)}>
                      <span>{topic.title}</span>
                      <span>{expanded.has(topic.anchor_key) ? '\u25b2' : '\u25bc'}</span>
                    </button>

                    {expanded.has(topic.anchor_key) && (
                      <div className="hd-topic-body">
                        {topic.description ? <p>{topic.description}</p> : null}

                        {(topic.links || []).map((lnk) => (
                          <a
                            key={lnk.id}
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hd-service-link"
                          >
                            <span>{lnk.label}</span>
                            <span>{'\u2192'}</span>
                          </a>
                        ))}

                        {(topic.infoFields || []).map((field) => (
                          <div key={field.id} className="hd-topic-info-field">
                            <span className="label">{field.field_label}</span>
                            <span className="value">{field.field_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}
