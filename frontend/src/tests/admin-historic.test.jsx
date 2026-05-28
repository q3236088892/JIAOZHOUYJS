import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminHistoricPage from '../pages/admin/AdminHistoricPage'

vi.mock('../api/historic', () => ({
  getAdminNavItems: () => Promise.resolve({ data: { code: 200, data: [{ id: 1, title: '\u9996\u9875', link_target: '/historicDistrict', link_type: 'internal', open_mode: '_self' }] } }),
  createAdminNavItem: vi.fn(),
  updateAdminNavItem: vi.fn(),
  deleteAdminNavItem: vi.fn(),
  getAdminIndustries: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminHomeServices: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminStages: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminCategories: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminTopics: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminTopicLinks: () => Promise.resolve({ data: { code: 200, data: [] } }),
  getAdminTopicInfoFields: () => Promise.resolve({ data: { code: 200, data: [] } })
}))

describe('AdminHistoricPage', () => {
  it('renders nav item from api', async () => {
    render(<AdminHistoricPage />)
    expect(await screen.findAllByText('\u9996\u9875')).not.toHaveLength(0)
  })
})
