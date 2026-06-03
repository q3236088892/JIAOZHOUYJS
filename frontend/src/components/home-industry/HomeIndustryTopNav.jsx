import {
  ApartmentOutlined,
  BankOutlined,
  CustomerServiceOutlined,
  DollarCircleOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  NotificationOutlined,
  ProjectOutlined,
  ReadOutlined,
  SolutionOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCdPublicSettings } from '../../api/homeIndustry'
import {
  getVisibleHomeIndustryTopNav,
  HOME_INDUSTRY_NAV_VISIBILITY_SETTING_KEY
} from '../../utils/homeIndustryNavigation'

const navIconMap = {
  home: HomeOutlined,
  investment: BankOutlined,
  project: ProjectOutlined,
  policy: FileProtectOutlined,
  legal: ReadOutlined,
  talent: TeamOutlined,
  finance: DollarCircleOutlined,
  assistance: CustomerServiceOutlined,
  trade: GlobalOutlined,
  chain: ApartmentOutlined,
  info: InfoCircleOutlined,
  promo: NotificationOutlined,
  cert: SolutionOutlined
}

export default function HomeIndustryTopNav({ activeKey, moduleCode, sectionKey }) {
  const [navVisibility, setNavVisibility] = useState({})

  useEffect(() => {
    let cancelled = false
    getCdPublicSettings()
      .then((res) => {
        if (!cancelled && res.data.code === 200) {
          setNavVisibility(res.data.data?.[HOME_INDUSTRY_NAV_VISIBILITY_SETTING_KEY] || {})
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const navItems = getVisibleHomeIndustryTopNav(navVisibility)

  return (
    <header className="hd-top-nav">
      <ul>
        {navItems.map((item) => {
          const Icon = navIconMap[item.icon] || HomeOutlined
          const active = activeKey
            ? item.key === activeKey
            : item.moduleCode === moduleCode && (!item.section || item.section === sectionKey)
          return (
            <li key={item.key}>
              <Link to={item.to} className={active ? 'is-active' : undefined}>
                <Icon className="hd-top-nav__icon" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </header>
  )
}
