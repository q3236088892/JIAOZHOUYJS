import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHistoricHome } from '../../api/historic'
import '../../styles/historic.css'

const fallback = {
  page: null,
  navItems: [],
  industries: [],
  homeServices: []
}

const ICON_BASE = '/historic/icons'

const industryIconBySlug = (slug) => `${ICON_BASE}/${slug}.png`

function serviceIconByName(name = '') {
  if (name.includes('政策')) return `${ICON_BASE}/policy.png`
  if (name.includes('法律')) return `${ICON_BASE}/law.png`
  if (name.includes('人才')) return `${ICON_BASE}/talents.png`
  if (name.includes('金融')) return `${ICON_BASE}/financial.png`
  if (name.includes('帮办')) return `${ICON_BASE}/assistant.png`
  return null
}

function isExternalLink(item) {
  return item.link_type === 'external' || /^https?:\/\//i.test(item.link_target || '')
}

function NavItem({ item }) {
  const href = item.link_target || '/historicDistrict'
  if (isExternalLink(item)) {
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

function HeroTitle({ title }) {
  const fallbackText = '市南区历史城区文旅产业服务'
  const text = title || fallbackText
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

function IndustryCard({ item }) {
  const target = item.route_path || '/historicDistrict'
  return (
    <li className="hd-card-item">
      <Link to={target} target="_blank" rel="noopener noreferrer" className="hd-card-link">
        <img
          className="hd-card-link__icon"
          src={industryIconBySlug(item.slug)}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
        />
        <span>{item.name}</span>
      </Link>
    </li>
  )
}

function ServiceCard({ item }) {
  const iconSrc = serviceIconByName(item.name)
  const href = item.link_target || '/historicDistrict'
  const inner = (
    <>
      {iconSrc && (
        <img
          className="hd-services-link__icon"
          src={iconSrc}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
        />
      )}
      <span>{item.name}</span>
    </>
  )

  if (isExternalLink(item)) {
    return (
      <li className="hd-services-item">
        <a className="hd-services-link" href={href} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      </li>
    )
  }
  return (
    <li className="hd-services-item">
      <Link className="hd-services-link" to={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    </li>
  )
}

export default function HistoricHomePage() {
  const [data, setData] = useState(fallback)

  useEffect(() => {
    let mounted = true
    getHistoricHome()
      .then((res) => {
        if (!mounted) return
        if (res.data.code === 200) {
          setData({ ...fallback, ...res.data.data })
        }
      })
      .catch(() => {
        if (!mounted) return
        setData(fallback)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="hd-page">
      <header className="hd-top-nav">
        <ul>
          {(data.navItems || []).map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </ul>
      </header>

      <div className="hd-hero">
        <HeroTitle title={data.page?.hero_title} />
      </div>

      <div className="hd-container">
        <section className="hd-section">
          <h2 className="hd-section-title">
            <img src={`${ICON_BASE}/title_deco_left.png`} alt="" aria-hidden="true" />
            选择您想了解和从事的业态
            <img src={`${ICON_BASE}/title_deco_right.png`} alt="" aria-hidden="true" />
          </h2>
          <ul className="hd-card-grid">
            {(data.industries || []).map((item) => (
              <IndustryCard key={item.id} item={item} />
            ))}
          </ul>
        </section>

        <section className="hd-section">
          <h2 className="hd-section-title">
            <img src={`${ICON_BASE}/title_deco_left.png`} alt="" aria-hidden="true" />
            利企便民服务
            <img src={`${ICON_BASE}/title_deco_right.png`} alt="" aria-hidden="true" />
          </h2>
          <ul className="hd-services-grid">
            {(data.homeServices || []).map((item) => (
              <ServiceCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
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
