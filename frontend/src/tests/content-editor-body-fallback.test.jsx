import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContentEditor from '../pages/admin/ContentEditor'

vi.mock('../api/homeIndustry', () => ({
  getAdminCdModules: vi.fn(),
  updateAdminCdNode: vi.fn(),
  updateAdminCdContent: vi.fn()
}))

describe('ContentEditor body fallback', () => {
  it('shows a textarea for flattened leaf content that has body but was saved as info', async () => {
    render(
      <ContentEditor
        node={{
          id: 811,
          title: '产业简介',
          node_type: 'leaf',
          sort_order: 2,
          content_type: 'info',
          body: '这是一段需要在正文里编辑的产业介绍。',
          fields: []
        }}
      />
    )

    const bodyEditor = await screen.findByDisplayValue('这是一段需要在正文里编辑的产业介绍。')
    expect(bodyEditor.tagName.toLowerCase()).toBe('textarea')
  })
})
