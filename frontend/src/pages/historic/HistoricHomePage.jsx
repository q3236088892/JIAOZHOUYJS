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

  const safeLink = (item) => {
    if (item.link_target) return item.link_target
    return '/historicDistrict'
  }

  return (
    <div className="hd-page">
      <header className="hd-top-nav">
        {(data.navItems || []).map((item) => {
          const isExternal = item.link_type === 'external' || /^https?:\/\//i.test(item.link_target || '')
          if (isExternal) {
            return (
              <a key={item.id} href={safeLink(item)} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            )
          }
          return (
            <Link key={item.id} to={safeLink(item)}>
              {item.title}
            </Link>
          )
        })}
      </header>

      <div className="hd-hero">
        <h1>{data.page?.hero_title || '\u5e02\u5357\u533a\u5386\u53f2\u57ce\u533a\u6587\u65c5\u4ea7\u4e1a\u670d\u52a1\u201c\u4e00\u7c7b\u4e8b\u201d'}</h1>
      </div>

      <section className="hd-section">
        <h2>{'\u9009\u62e9\u60a8\u60f3\u4e86\u89e3\u548c\u4ece\u4e8b\u7684\u4e1a\u6001'}</h2>
        <div className="hd-card-grid">
          {(data.industries || []).map((item) => (
            <Link
              key={item.id}
              to={item.route_path || '/historicDistrict'}
              target="_blank"
              rel="noopener noreferrer"
              className="hd-card-link"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="hd-section">
        <h2>{'\u5229\u4f01\u4fbf\u6c11\u670d\u52a1'}</h2>
        <div className="hd-card-grid hd-card-grid--services">
          {(data.homeServices || []).map((item) => {
            const isExternal = item.link_type === 'external' || /^https?:\/\//i.test(item.link_target || '')
            if (isExternal) {
              return (
                <a
                  key={item.id}
                  href={safeLink(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hd-card-link"
                >
                  {item.name}
                </a>
              )
            }
            return (
              <Link
                key={item.id}
                to={safeLink(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="hd-card-link"
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
