import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCdModules } from '../../api/homeIndustry'
import '../../styles/historic.css'

const ICON_BASE = '/historic/icons'

// Default icon mapping for known module codes
const moduleIcons = {
  value_added: `${ICON_BASE}/policy.png`,
  industry_chain: `${ICON_BASE}/openRestaurant.png`,
  enterprise_support: `${ICON_BASE}/financial.png`
}

// Fallback icons cycle
const fallbackIcons = [
  `${ICON_BASE}/openRestaurant.png`,
  `${ICON_BASE}/hotel_accommodation.png`,
  `${ICON_BASE}/cultural_and_creative_industries.png`,
  `${ICON_BASE}/entertainment.png`,
  `${ICON_BASE}/travel_study.png`,
  `${ICON_BASE}/organize_performance.png`
]

function getModuleIcon(module, index) {
  if (module.icon_url) return module.icon_url
  if (moduleIcons[module.code]) return moduleIcons[module.code]
  return fallbackIcons[index % fallbackIcons.length]
}

function HeroTitle({ title }) {
  const text = title || '胶州市家居产业服务"一类事"'
  const oneTypeKey = '一类事'
  const idx = text.indexOf(oneTypeKey)
  if (idx === -1) return <h1>{text}</h1>
  return (
    <h1>
      {text.substring(0, idx)}
      <span className="hd-quote">"</span>
      {oneTypeKey}
      <span className="hd-quote">"</span>
      {text.substring(idx + oneTypeKey.length)}
    </h1>
  )
}

export default function HomeIndustryHomePage() {
  const [modules, setModules] = useState([])

  useEffect(() => {
    getCdModules()
      .then((res) => {
        if (res.data.code === 200) setModules(res.data.data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="hd-page cd-home-wrap">
      <header className="hd-top-nav">
        <ul>
          <li><Link to="/homeIndustry">历史首页</Link></li>
          {modules.map((m) => (
            <li key={m.id}>
              <Link to={`/homeIndustry/${m.code}`}>{m.title}</Link>
            </li>
          ))}
        </ul>
      </header>

      <div className="cd-home-body">
        <div className="hd-hero">
          <HeroTitle title={'胶州市家居产业服务"一类事"'} />
        </div>

        <div className="hd-container">
          <section className="hd-section">
            <h2 className="hd-section-title">
              <img src={`${ICON_BASE}/title_deco_left.png`} alt="" aria-hidden="true" />
              选择您想了解和从事的板块
              <img src={`${ICON_BASE}/title_deco_right.png`} alt="" aria-hidden="true" />
            </h2>
            <ul className="hd-card-grid">
              {modules.map((m, idx) => (
                <li key={m.id} className="hd-card-item">
                  <Link
                    to={`/homeIndustry/${m.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hd-card-link"
                  >
                    <img
                      className="hd-card-link__icon"
                      src={getModuleIcon(m, idx)}
                      alt=""
                      aria-hidden="true"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                    />
                    <span>{m.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
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
