import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCdModules, getCdPublicSettings } from '../../api/homeIndustry'
import HomeIndustryTopNav from '../../components/home-industry/HomeIndustryTopNav'
import { HOME_INDUSTRY_TITLE } from '../../constants/homeIndustry'
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

const HOME_TITLE = HOME_INDUSTRY_TITLE

const serviceGroups = [
  {
    key: 'industry-chain',
    title: '家居产业链服务',
    className: 'hd-home-service-group--chain',
    entries: [
      { key: 'upstream', label: '上游', description: '原辅料采购、仓储', icon: `${ICON_BASE}/upstream_home_percent.svg`, moduleCodes: ['industry_chain'], section: 'upstream', titleKeywords: ['产业链', '上游', '原辅料', '仓储'] },
      { key: 'midstream', label: '中游', description: '生产制造', icon: `${ICON_BASE}/organize_performance.png`, moduleCodes: ['industry_chain'], section: 'midstream', titleKeywords: ['产业链', '中游', '生产制造'] },
      { key: 'downstream', label: '下游', description: '销售出海', icon: `${ICON_BASE}/travel_study.png`, moduleCodes: ['industry_chain'], section: 'downstream', titleKeywords: ['产业链', '下游', '销售出海'] }
    ]
  },
  {
    key: 'enterprise-support',
    title: '利企配套服务',
    className: 'hd-home-service-group--support',
    entries: [
      { key: 'policy', label: '政策服务', icon: `${ICON_BASE}/policy.png`, moduleCodes: ['enterprise_support'], section: 'policy', titleKeywords: ['利企配套', '政策服务'] },
      { key: 'legal', label: '法律服务', icon: `${ICON_BASE}/law.png`, moduleCodes: ['enterprise_support'], section: 'legal', titleKeywords: ['利企配套', '法律服务'] },
      { key: 'talent', label: '人才服务', icon: `${ICON_BASE}/talents.png`, moduleCodes: ['enterprise_support'], section: 'talent', titleKeywords: ['利企配套', '人才服务'] },
      { key: 'finance', label: '金融服务', icon: `${ICON_BASE}/financial.png`, moduleCodes: ['enterprise_support'], section: 'finance', titleKeywords: ['利企配套', '金融服务'] },
      { key: 'trade', label: '国际贸易服务', icon: `${ICON_BASE}/hotel_accommodation.png`, moduleCodes: ['enterprise_support'], section: 'trade', titleKeywords: ['利企配套', '国际贸易服务'] },
      { key: 'social-resource', label: '社会服务（企业）资源', icon: `${ICON_BASE}/cultural_and_creative_industries.png`, moduleCodes: ['enterprise_support'], section: 'social-resource', titleKeywords: ['利企配套', '社会服务', '企业资源'] },
      { key: 'assistance', label: '帮办服务', icon: `${ICON_BASE}/assistant.png`, moduleCodes: ['enterprise_support'], section: 'assistance', titleKeywords: ['利企配套', '帮办服务'] },
      { key: 'derivative', label: '衍生服务', icon: `${ICON_BASE}/entertainment.png`, moduleCodes: ['enterprise_support'], section: 'derivative', titleKeywords: ['利企配套', '衍生服务'] }
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

function getEntryIcon(entry, module, index) {
  if (entry.icon) return entry.icon
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
        src={module ? getEntryIcon(entry, module, index) : (entry.icon || fallbackIcons[index % fallbackIcons.length])}
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
  const [homeBannerResolved, setHomeBannerResolved] = useState(false)

  useEffect(() => {
    let cancelled = false

    getCdModules()
      .then((res) => {
        if (!cancelled && res.data.code === 200) setModules(res.data.data)
      })
      .catch(() => {})
    getCdPublicSettings()
      .then((res) => {
        if (!cancelled && res.data.code === 200) setHomeBanner(res.data.data.home_banner || '')
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHomeBannerResolved(true)
      })

    return () => { cancelled = true }
  }, [])

  const homeBannerUrl = homeBanner
  const pageStyle = homeBannerResolved && homeBannerUrl
    ? { backgroundImage: `url(${homeBannerUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top center', backgroundSize: '100% 48vh', backgroundColor: '#f7fbff' }
    : undefined
  const pageClassName = `hd-page cd-home-wrap${homeBannerResolved ? '' : ' hd-page--banner-pending'}`

  return (
    <div className={pageClassName} style={pageStyle}>
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
