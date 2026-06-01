import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

vi.mock('../api/homeIndustry', () => ({
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
                          title: '国家税务总局青岛市电子税务局',
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

  it('renders flattened link leaf nodes as clickable anchors', async () => {
    render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const link = await screen.findByRole('link', {
      name: /国家税务总局青岛市电子税务局/
    })

    expect(link).toHaveAttribute('href', 'https://etax.qingdao.chinatax.gov.cn:8443/')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
