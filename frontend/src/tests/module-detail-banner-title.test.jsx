import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

const homeIndustryApiMock = vi.hoisted(() => ({
  getCdPublicSettings: vi.fn(),
  getCdModules: vi.fn(),
  getCdModuleTree: vi.fn()
}))

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: homeIndustryApiMock.getCdPublicSettings,
  getCdModules: homeIndustryApiMock.getCdModules,
  getCdModuleTree: homeIndustryApiMock.getCdModuleTree
}))

function deferred() {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ModuleDetailPage banner and title', () => {
  it('suppresses the default detail banner while loading and uses the unified home title', async () => {
    const treeRequest = deferred()
    homeIndustryApiMock.getCdPublicSettings.mockResolvedValue({ data: { code: 200, data: {} } })
    homeIndustryApiMock.getCdModules.mockResolvedValue({ data: { code: 200, data: [] } })
    homeIndustryApiMock.getCdModuleTree.mockReturnValue(treeRequest.promise)

    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const loadingPage = container.querySelector('.hd-detail-page')
    expect(loadingPage).toHaveClass('hd-detail-page--banner-pending')
    expect(loadingPage.style.backgroundImage).toBe('')

    treeRequest.resolve({
      data: {
        code: 200,
        data: {
          module: {
            id: 1,
            code: 'value_added',
            title: '增值服务',
            detail_banner_url: '/uploads/detail-banner.png'
          },
          tree: [],
          stats: {}
        }
      }
    })

    expect(await screen.findByRole('heading', { level: 1, name: '胶州市家居产业服务“一类事”' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: '增值服务' })).not.toBeInTheDocument()

    const page = container.querySelector('.hd-detail-page')
    await waitFor(() => {
      expect(page).not.toHaveClass('hd-detail-page--banner-pending')
    })
    expect(page.style.backgroundImage).toContain('/uploads/detail-banner.png')
  })
})
