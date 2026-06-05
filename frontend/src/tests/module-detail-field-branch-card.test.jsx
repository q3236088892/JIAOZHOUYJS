import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
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
              title: '（六）金融服务',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '上市辅导、普惠金融政策咨询服务',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: '服务内容',
                      node_type: 'branch',
                      children: [
                        {
                          id: 4,
                          title: '上市辅导说明',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '为企业提供上市辅导和普惠金融政策咨询。'
                        }
                      ]
                    },
                    {
                      id: 5,
                      title: '服务地点/窗口',
                      node_type: 'branch',
                      children: [
                        {
                          id: 6,
                          title: '服务窗口',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '市民中心金融服务窗口'
                        }
                      ]
                    },
                    {
                      id: 7,
                      title: '提供部门',
                      node_type: 'branch',
                      children: [
                        {
                          id: 8,
                          title: '服务部门',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '胶州市地方金融监管局'
                        }
                      ]
                    },
                    {
                      id: 9,
                      title: '咨询电话',
                      node_type: 'branch',
                      children: [
                        {
                          id: 10,
                          title: '电话',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '12345678'
                        }
                      ]
                    },
                    {
                      id: 11,
                      title: '我要咨询',
                      node_type: 'branch',
                      children: [
                        {
                          id: 12,
                          title: '我要咨询',
                          node_type: 'leaf',
                          content_type: 'link',
                          link_url: 'https://example.com/finance',
                          link_label: '我要咨询'
                        }
                      ]
                    }
                  ]
                },
                {
                  id: 13,
                  title: '非白名单字段拆分测试服务',
                  node_type: 'branch',
                  children: [
                    {
                      id: 14,
                      title: '服务内容',
                      node_type: 'branch',
                      children: [
                        {
                          id: 15,
                          title: '测试服务内容',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '这是结构相同但不在 17 个分类名单内的内容。'
                        }
                      ]
                    },
                    {
                      id: 16,
                      title: '服务地点/窗口',
                      node_type: 'branch',
                      children: [
                        {
                          id: 17,
                          title: '测试服务窗口',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '测试窗口'
                        }
                      ]
                    },
                    {
                      id: 18,
                      title: '提供部门',
                      node_type: 'branch',
                      children: [
                        {
                          id: 19,
                          title: '测试服务部门',
                          node_type: 'leaf',
                          content_type: 'richtext',
                          body: '测试部门'
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

describe('ModuleDetailPage field-branch service cards', () => {
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
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders field-like branch children as one flat service info card instead of accordion rows', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=finance']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const serviceHeading = await screen.findByRole('heading', { level: 3, name: '上市辅导、普惠金融政策咨询服务' })
    expect(serviceHeading).toBeInTheDocument()
    const serviceBlock = serviceHeading.closest('.hd-category-block')
    expect(screen.getByText('为企业提供上市辅导和普惠金融政策咨询。')).toBeInTheDocument()
    expect(screen.getByText('市民中心金融服务窗口')).toBeInTheDocument()
    expect(screen.queryByText('胶州市地方金融监管局')).not.toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()

    expect(within(serviceBlock).queryByRole('button', { name: /服务内容/ })).not.toBeInTheDocument()
    expect(within(serviceBlock).queryByRole('button', { name: /服务地点\/窗口/ })).not.toBeInTheDocument()
    expect(within(serviceBlock).queryByRole('button', { name: /提供部门/ })).not.toBeInTheDocument()
    expect(within(serviceBlock).queryByRole('button', { name: /咨询电话/ })).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: /我要咨询/ })).toHaveAttribute('href', 'https://example.com/finance')
    expect(container.querySelector('.hd-field-service-card')).not.toBeNull()
  })

  it('only converts the exact 17 field-split service categories to flat cards', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=finance']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const testHeading = await screen.findByRole('heading', { level: 3, name: '非白名单字段拆分测试服务' })
    const testBlock = testHeading.closest('.hd-category-block')

    expect(within(testBlock).getByRole('button', { name: /服务内容/ })).toBeInTheDocument()
    expect(within(testBlock).getByRole('button', { name: /服务地点\/窗口/ })).toBeInTheDocument()
    expect(within(testBlock).getByRole('button', { name: /提供部门/ })).toBeInTheDocument()
    expect(container.querySelectorAll('.hd-field-service-card')).toHaveLength(1)
  })
})
