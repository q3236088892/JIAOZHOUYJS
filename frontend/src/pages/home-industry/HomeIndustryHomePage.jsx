import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCdModules, getCdPublicSettings } from '../../api/homeIndustry'
import HomeIndustryTopNav from '../../components/home-industry/HomeIndustryTopNav'
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

const HOME_TITLE = '胶州市家居产业服务“一类事”'

const serviceGroups = [
  {
    key: 'industry-chain',
    title: '家居产业链服务',
    className: 'hd-home-service-group--chain',
    entries: [
      { key: 'upstream', label: '上游', description: '原辅料采购、仓储', moduleCodes: ['industry_chain'], section: 'upstream', titleKeywords: ['产业链', '上游', '原辅料', '仓储'] },
      { key: 'midstream', label: '中游', description: '生产制造', moduleCodes: ['industry_chain'], section: 'midstream', titleKeywords: ['产业链', '中游', '生产制造'] },
      { key: 'downstream', label: '下游', description: '销售出海', moduleCodes: ['industry_chain'], section: 'downstream', titleKeywords: ['产业链', '下游', '销售出海'] }
    ]
  },
  {
    key: 'enterprise-support',
    title: '利企配套服务',
    className: 'hd-home-service-group--support',
    entries: [
      { key: 'tax', label: '财税服务', moduleCodes: ['enterprise_support', 'tax_service'], section: 'tax', titleKeywords: ['利企配套', '财税'] },
      { key: 'human-resource', label: '人力资源服务', moduleCodes: ['enterprise_support', 'hr_service', 'human_resource'], section: 'human-resource', titleKeywords: ['利企配套', '人力', '人力资源'] },
      { key: 'construction', label: '项目施工服务', moduleCodes: ['enterprise_support', 'project_service', 'construction_service'], section: 'construction', titleKeywords: ['利企配套', '项目施工', '施工'] },
      { key: 'agency', label: '中介服务', moduleCodes: ['enterprise_support', 'agency_service'], section: 'agency', titleKeywords: ['利企配套', '中介'] }
    ]
  }
]

function textIncludesAny(value, keywords = []) {
  const text = String(value || '')
  return keywords.some((keyword) => text.includes(keyword))
}

function findEntryModule(entry, modules) {
  const byCode = modules.find((module) => entry.moduleCodes?.includes(module.code))
  if (byCode) return byCode
  return modules.find((module) => textIncludesAny(module.title, entry.titleKeywords))
}

function getModuleIcon(module, index) {
  if (module.icon_url) return module.icon_url
  if (moduleIcons[module.code]) return moduleIcons[module.code]
  return fallbackIcons[index % fallbackIcons.length]
}

function HeroTitle({ title }) {
  const text = title || HOME_TITLE
  const oneTypeKey = '一类事'
  const idx = text.indexOf(oneTypeKey)
  if (idx === -1) return <h1>{text}</h1>
  return (
    <h1>
      {text.substring(0, idx)}
      <span className="hd-quote">“</span>
      {oneTypeKey}
      <span className="hd-quote">”</span>
      {text.substring(idx + oneTypeKey.length)}
    </h1>
  )
}

function HomeServiceEntry({ entry, module, index }) {
  const content = (
    <>
      <img
        className="hd-home-service-card__icon"
        src={module ? getModuleIcon(module, index) : fallbackIcons[index % fallbackIcons.length]}
        alt=""
        aria-hidden="true"
        onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}
      />
      <span className="hd-home-service-card__text">
        <strong>{entry.label}</strong>
        {entry.description && <small>{entry.description}</small>}
      </span>
    </>
  )

  if (!module) {
    return (
      <li className="hd-home-service-item">
        <span className="hd-home-service-card hd-home-service-card--disabled" aria-disabled="true">
          {content}
        </span>
      </li>
    )
  }

  return (
    <li className="hd-home-service-item">
      <Link to={`/homeIndustry/${module.code}${entry.section ? `?section=${entry.section}` : ''}`} className="hd-home-service-card">
        {content}
      </Link>
    </li>
  )
}

function HomeServiceGroup({ group, modules }) {
  return (
    <section className={`hd-home-service-group ${group.className}`}>
      <h2 className="hd-home-service-title">{group.title}</h2>
      <ul className="hd-home-service-grid">
        {group.entries.map((entry, index) => (
          <HomeServiceEntry
            key={entry.key}
            entry={entry}
            module={findEntryModule(entry, modules)}
            index={index}
          />
        ))}
      </ul>
    </section>
  )
}

export default function HomeIndustryHomePage() {
  const [modules, setModules] = useState([])
  const [homeBanner, setHomeBanner] = useState('')

  useEffect(() => {
    getCdModules()
      .then((res) => {
        if (res.data.code === 200) setModules(res.data.data)
      })
      .catch(() => {})
    getCdPublicSettings()
      .then((res) => { if (res.data.code === 200) setHomeBanner(res.data.data.home_banner || '') })
      .catch(() => {})
  }, [])

  const homeBannerUrl = homeBanner
  const pageStyle = homeBannerUrl
    ? { backgroundImage: `url(${homeBannerUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top center', backgroundSize: '100% 48vh', backgroundColor: '#f7fbff' }
    : undefined

  return (
    <div className="hd-page cd-home-wrap" style={pageStyle}>
      <HomeIndustryTopNav activeKey="home" />

      <div className="cd-home-body">
        <div className="hd-hero">
          <HeroTitle title={HOME_TITLE} />
        </div>

        <div className="hd-container">
          <section className="hd-section hd-home-overview">
            <h2 className="hd-section-title">
              <img src={`${ICON_BASE}/title_deco_left.png`} alt="" aria-hidden="true" />
              选择您想了解和办理的服务
              <img src={`${ICON_BASE}/title_deco_right.png`} alt="" aria-hidden="true" />
            </h2>

            <div className="hd-home-service-board">
              {serviceGroups.map((group) => (
                <HomeServiceGroup key={group.key} group={group} modules={modules} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="hd-footer">
        <div className="hd-footer__divider1" />
        <div className="hd-footer__divider2" />
        <div className="hd-footer__body">{HOME_TITLE}</div>
      </footer>
    </div>
  )
}
