import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

const duplicateBody = '胶州市家居产业历史悠久，形成了龙头引领、链群互动的发展生态。'

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
              title: '（一）招商入驻',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '产业简介',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: duplicateBody,
                      node_type: 'leaf',
                      content_type: 'info',
                      body: duplicateBody,
                      children: []
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

describe('ModuleDetailPage body fallback', () => {
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

  it('renders duplicate title/body leaf content as a body paragraph instead of a title bar', async () => {
    render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const matches = await screen.findAllByText(duplicateBody)
    expect(matches).toHaveLength(1)
    expect(matches[0].tagName.toLowerCase()).toBe('p')
  })
})
