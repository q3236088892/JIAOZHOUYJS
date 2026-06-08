import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: () => Promise.resolve({ data: { code: 200, data: {} } }),
  getCdModules: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getCdModuleTree: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          module: { id: 1, code: 'value_added', title: '增值服务' },
          tree: [
            {
              id: 1,
              title: '阶段',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '分类',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: '税务登记',
                      node_type: 'branch',
                      children: [
                        {
                          id: 4,
                          title: '税务登记',
                          node_type: 'leaf',
                          content_type: 'link',
                          link_url: 'https://etax.qingdao.chinatax.gov.cn:8443/',
                          link_label: '国家税务总局青岛市电子税务局',
                          children: []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          stats: {}
        }
      }
    })
}))

describe('ModuleDetailPage links', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders link leaf cards with node.title as the visible label, link_url as the href', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    // 展开 "税务登记" branch（自动展开的不一定是它，强制点击一下确保子节点渲染）
    const toggle = await screen.findByRole('button', { name: /税务登记/ })
    toggle.click()

    // Visible label is the leaf's own title (业务名称), not the link_label (平台名)
    const linkCard = container.querySelector('.hd-service-detail-card--link')
    expect(linkCard).not.toBeNull()
    const link = linkCard.querySelector('a')
    expect(link.getAttribute('href')).toBe('https://etax.qingdao.chinatax.gov.cn:8443/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.textContent).toContain('税务登记')
    // 平台名 link_label 不应该作为可见文字出现
    expect(screen.queryByText('国家税务总局青岛市电子税务局')).not.toBeInTheDocument()
  })
})
