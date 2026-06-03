import {
  ApartmentOutlined,
  BankOutlined,
  CustomerServiceOutlined,
  DollarCircleOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  HomeOutlined,
  ProjectOutlined,
  ReadOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { HOME_INDUSTRY_TOP_NAV } from '../../utils/homeIndustryNavigation'

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
  chain: ApartmentOutlined
}

export default function HomeIndustryTopNav({ activeKey, moduleCode, sectionKey }) {
  return (
    <header className="hd-top-nav">
      <ul>
        {HOME_INDUSTRY_TOP_NAV.map((item) => {
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
