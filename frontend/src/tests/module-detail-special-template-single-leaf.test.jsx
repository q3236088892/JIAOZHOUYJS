import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

const longPromoText = '\u80f6\u5dde\u5e02\u5bb6\u5c45\u4ea7\u4e1a\u62db\u5546\u5ba3\u4f20\u6750\u6599\u6b63\u6587\u3002'

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: () => Promise.resolve({ data: { code: 200, data: {} } }),
  getCdModuleTree: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          module: { id: 1, code: 'value_added', title: '\u589e\u503c\u670d\u52a1' },
          tree: [
            {
              id: 1,
              title: '\uff08\u4e00\uff09\u62db\u5546\u5165\u9a7b',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '\u62db\u5546\u5ba3\u4f20',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: longPromoText,
                      node_type: 'leaf',
                      content_type: 'richtext',
                      body: longPromoText,
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

describe('ModuleDetailPage static investment promo template', () => {
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

  it('renders the static investment promo template instead of imported long body text', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=investment-promo']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('\u4e13\u9898\u5c55\u793a')).toBeInTheDocument()
    const anchorMenu = container.querySelector('.hd-special-anchor-menu')
    expect(anchorMenu).not.toBeNull()
    expect(anchorMenu).toHaveTextContent('\u62db\u5546\u5ba3\u4f20')
    expect(anchorMenu).toHaveTextContent('\u5ba3\u4f20\u89c6\u9891')
    expect(anchorMenu).toHaveTextContent('\u5b8c\u5584\u4f9b\u5e94\u94fe')
    expect(anchorMenu).toHaveTextContent('\u505a\u5f3a\u4ea7\u4e1a\u94fe')
    expect(anchorMenu).not.toHaveTextContent(longPromoText)
    expect(container).not.toHaveTextContent(longPromoText)

    const videoSection = container.querySelector('.hd-special-video-section')
    expect(videoSection).not.toBeNull()
    expect(videoSection).toHaveClass('hd-special-content-section')
    expect(videoSection).toHaveClass('hd-special-poster-section')

    const videoWrap = container.querySelector('.hd-special-promo-video-wrap')
    expect(videoWrap).not.toBeNull()

    const promoVideo = container.querySelector('.hd-special-promo-video')
    expect(promoVideo).not.toBeNull()
    expect(promoVideo).toHaveAttribute('src', '/home-industry/investment-promo/promo-video.mp4')
    expect(videoWrap).toContainElement(promoVideo)
  })
})
