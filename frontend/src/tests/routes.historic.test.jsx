import { describe, it, expect, vi, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../api/historic', () => ({
  getHistoricHome: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          page: {},
          navItems: [],
          industries: [],
          homeServices: []
        }
      }
    }),
  getHistoricIndustryDetail: vi.fn(),
  getAdminNavItems: vi.fn(),
  createAdminNavItem: vi.fn(),
  updateAdminNavItem: vi.fn(),
  deleteAdminNavItem: vi.fn(),
  getAdminIndustries: vi.fn(),
  getAdminHomeServices: vi.fn(),
  getAdminStages: vi.fn(),
  getAdminCategories: vi.fn(),
  getAdminTopics: vi.fn(),
  getAdminTopicLinks: vi.fn(),
  getAdminTopicInfoFields: vi.fn()
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('historic routes', () => {
  it('should render historic home route without issuing real network requests', async () => {
    const xhrOpen = vi.spyOn(window.XMLHttpRequest.prototype, 'open')

    render(
      <MemoryRouter initialEntries={['/historicDistrict']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/\u9009\u62e9\u60a8\u60f3\u4e86\u89e3\u548c\u4ece\u4e8b\u7684\u4e1a\u6001/i)).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(xhrOpen).not.toHaveBeenCalled()
  })
})
