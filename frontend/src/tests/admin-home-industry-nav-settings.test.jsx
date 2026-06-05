import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminHomeIndustryPage from '../pages/admin/AdminHomeIndustryPage'

const apiMock = vi.hoisted(() => ({
  getAdminCdModules: vi.fn(),
  createAdminCdModule: vi.fn(),
  updateAdminCdModule: vi.fn(),
  uploadCdImage: vi.fn(),
  getAdminCdTree: vi.fn(),
  createAdminCdNode: vi.fn(),
  updateAdminCdNode: vi.fn(),
  deleteAdminCdNode: vi.fn(),
  getAdminCdSettings: vi.fn(),
  updateAdminCdSetting: vi.fn()
}))

vi.mock('../api/homeIndustry', () => apiMock)

describe('AdminHomeIndustryPage navigation settings', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('updates navigation visibility when a menu switch is toggled', async () => {
    apiMock.getAdminCdModules.mockResolvedValue({
      data: {
        code: 200,
        data: [{ id: 1, code: 'value_added', title: '招商入驻' }]
      }
    })
    apiMock.getAdminCdTree.mockResolvedValue({
      data: { code: 200, data: { tree: [], stats: { nodeCount: 0, leafCount: 0 } } }
    })
    apiMock.getAdminCdSettings.mockResolvedValue({
      data: {
        code: 200,
        data: {
          home_banner: '',
          home_industry_nav_visibility: JSON.stringify({ 'investment-promo': false })
        }
      }
    })
    apiMock.updateAdminCdSetting.mockResolvedValue({ data: { code: 200, data: {} } })

    render(
      <MemoryRouter>
        <AdminHomeIndustryPage />
      </MemoryRouter>
    )

    fireEvent.click(await screen.findByRole('button', { name: /导航菜单设置/ }))
    expect(screen.getAllByRole('switch', { name: /^显示/ })).toHaveLength(3)
    expect(screen.getByRole('switch', { name: '显示首页' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '显示产业简介' })).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: '显示企业办证' })).not.toBeInTheDocument()

    const promoSwitch = await screen.findByRole('switch', { name: '显示招商宣传' })
    expect(promoSwitch).not.toBeChecked()

    fireEvent.click(promoSwitch)

    await waitFor(() => {
      expect(apiMock.updateAdminCdSetting).toHaveBeenCalled()
    })
    const [key, value] = apiMock.updateAdminCdSetting.mock.calls.at(-1)
    expect(key).toBe('home_industry_nav_visibility')
    expect(JSON.parse(value)['investment-promo']).toBe(true)
  })
})
