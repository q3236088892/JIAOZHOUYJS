import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

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
                  title: '\u4ea7\u4e1a\u7b80\u4ecb',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: '\u4ea7\u4e1a\u6982\u51b5',
                      node_type: 'leaf',
                      content_type: 'blocks',
                      body: JSON.stringify([{ id: 't1', type: 'text', content: '\u80f6\u5dde\u5bb6\u5c45\u4ea7\u4e1a\u57fa\u7840\u624e\u5b9e\u3002' }]),
                      children: []
                    },
                    {
                      id: 4,
                      title: '\u533a\u4f4d\u4f18\u52bf',
                      node_type: 'leaf',
                      content_type: 'richtext',
                      body: '\u533a\u4f4d\u4f18\u8d8a\uff0c\u4ea4\u901a\u4fbf\u5229\u3002',
                      children: []
                    }
                  ]
                },
                {
                  id: 5,
                  title: '\u62db\u5546\u5ba3\u4f20',
                  node_type: 'branch',
                  children: [
                    { id: 6, title: '\u5ba3\u4f20\u8d44\u6599', node_type: 'leaf', content_type: 'richtext', body: '\u62db\u5546\u5ba3\u4f20\u5185\u5bb9', children: [] }
                  ]
                }
              ]
            },
            {
              id: 7,
              title: '\uff08\u4e8c\uff09\u9879\u76ee\u670d\u52a1',
              node_type: 'branch',
              children: [
                { id: 8, title: '\u9879\u76ee\u7acb\u9879', node_type: 'branch', children: [] }
              ]
            }
          ],
          stats: {}
        }
      }
    })
}))

describe('ModuleDetailPage special section template', () => {
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

  it('renders industry intro as a target-style poster page with three anchors', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=industry-intro']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect((await screen.findAllByRole('heading', { name: '\u4ea7\u4e1a\u7b80\u4ecb' })).length).toBeGreaterThan(0)
    expect(container.querySelector('.hd-special-section-layout')).not.toBeNull()
    expect(container.querySelector('.hd-left-menu')).toBeNull()

    const anchorMenu = container.querySelector('.hd-special-anchor-menu')
    expect(anchorMenu).not.toBeNull()
    expect(anchorMenu).toHaveTextContent('\u4ea7\u4e1a\u7b80\u4ecb')
    expect(anchorMenu).toHaveTextContent('\u4e0a\u5408\u667a\u80fd\u5bb6\u5c45\u4ea7\u4e1a')
    expect(anchorMenu).toHaveTextContent('\u6e90\u6c0f\u6728\u8bed\u5bb6\u5177\u4ea7\u4e1a')

    const posterImages = container.querySelectorAll('.hd-special-poster-image')
    expect(posterImages).toHaveLength(4)
    expect(posterImages[0]).toHaveAttribute('src', '/home-industry/industry-intro/industry-intro-01.webp')
    expect(posterImages[1]).toHaveAttribute('src', '/home-industry/industry-intro/industry-intro-02.webp')
    expect(posterImages[2]).toHaveAttribute('src', '/home-industry/industry-intro/shanghe-smart-home.webp')
    expect(posterImages[3]).toHaveAttribute('src', '/home-industry/industry-intro/yuanshi-muyu-home.webp')
    expect(container.querySelector('.hd-special-section-layout')).not.toHaveTextContent('\u62db\u5546\u5ba3\u4f20\u5185\u5bb9')
  })

  it('renders investment promo as a video-first poster page', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=investment-promo']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect((await screen.findAllByRole('heading', { name: '\u62db\u5546\u5ba3\u4f20' })).length).toBeGreaterThan(0)
    expect(container.querySelector('.hd-special-section-layout')).not.toBeNull()
    expect(container.querySelector('.hd-left-menu')).toBeNull()

    const anchorMenu = container.querySelector('.hd-special-anchor-menu')
    expect(anchorMenu).not.toBeNull()
    expect(anchorMenu).toHaveTextContent('\u5ba3\u4f20\u89c6\u9891')
    expect(anchorMenu).toHaveTextContent('\u5b8c\u5584\u4f9b\u5e94\u94fe')
    expect(anchorMenu).toHaveTextContent('\u505a\u5f3a\u4ea7\u4e1a\u94fe')

    const promoVideo = container.querySelector('.hd-special-promo-video')
    expect(promoVideo).not.toBeNull()
    expect(promoVideo).toHaveAttribute('src', '/home-industry/investment-promo/promo-video.mp4')
    expect(promoVideo).toHaveAttribute('controls')
    expect(promoVideo.autoplay).toBe(true)
    expect(promoVideo.muted).toBe(true)
    expect(promoVideo.playsInline).toBe(true)

    const posterImages = container.querySelectorAll('.hd-special-poster-image')
    expect(posterImages).toHaveLength(2)
    expect(posterImages[0]).toHaveAttribute('src', '/home-industry/investment-promo/supply-chain.webp')
    expect(posterImages[1]).toHaveAttribute('src', '/home-industry/investment-promo/strong-chain.webp')
    expect(container.querySelector('.hd-special-section-layout')).not.toHaveTextContent('\u62db\u5546\u5ba3\u4f20\u5185\u5bb9')
  })
})

