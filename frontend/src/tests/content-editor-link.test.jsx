import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContentEditor from '../pages/admin/ContentEditor'

vi.mock('../api/homeIndustry', () => ({
  getAdminCdModules: vi.fn(),
  updateAdminCdNode: vi.fn(),
  updateAdminCdContent: vi.fn(),
  uploadCdImage: vi.fn()
}))

describe('ContentEditor links', () => {
  it('shows link fields from flattened tree node content', async () => {
    render(
      <ContentEditor
        node={{
          id: 820,
          title: '国家税务总局青岛市电子税务局',
          node_type: 'leaf',
          sort_order: 6,
          content_type: 'link',
          link_url: 'https://etax.qingdao.chinatax.gov.cn:8443/',
          link_label: '国家税务总局青岛市电子税务局',
          link_target: '_blank'
        }}
      />
    )

    expect(await screen.findByDisplayValue('https://etax.qingdao.chinatax.gov.cn:8443/')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('国家税务总局青岛市电子税务局').length).toBeGreaterThan(0)
  })
})
