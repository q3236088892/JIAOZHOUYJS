import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

vi.mock('../api/homeIndustry', () => ({
  getCdModules: () => Promise.resolve({ data: { code: 200, data: [{ id: 1, code: 'enterprise_support', title: '利企配套服务' }] } }),
  getCdModuleTree: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          module: { id: 1, code: 'enterprise_support', title: '利企配套服务' },
          tree: [
            {
              id: 1,
              title: '政策服务',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '基本政务服务',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: '企业注册登记住所预指导服务',
                      node_type: 'leaf',
                      content_type: 'info',
                      summary: '在正式提交注册申请前，提供注册地址材料合规性预指导。',
                      department: '胶州市行政审批服务局',
                      fields: [
                        { field_label: '服务地点', field_value: '胶州市政务服务中心' },
                        { field_label: '办公时间', field_value: '工作日上午9:00-12:00，下午1:30-5:00' },
                        { field_label: '咨询电话', field_value: '82209035' }
                      ],
                      children: []
                    },
                    {
                      id: 4,
                      title: '我要申报',
                      node_type: 'leaf',
                      content_type: 'link',
                      link_url: 'https://example.com/apply',
                      link_label: '我要申报',
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

describe('ModuleDetailPage service cards', () => {
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

  it('renders info leaf content in a service-detail card and keeps link leaves clickable', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/enterprise_support']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('企业注册登记住所预指导服务')).toBeInTheDocument()
    expect(screen.getByText('在正式提交注册申请前，提供注册地址材料合规性预指导。')).toBeInTheDocument()
    expect(screen.getByText('胶州市政务服务中心')).toBeInTheDocument()
    expect(container.querySelector('.hd-service-detail-card')).not.toBeNull()

    const applyLink = screen.getByRole('link', { name: /我要申报/ })
    expect(applyLink).toHaveAttribute('href', 'https://example.com/apply')
  })
})
