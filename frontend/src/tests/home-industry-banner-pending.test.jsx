import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeIndustryHomePage from '../pages/home-industry/HomeIndustryHomePage'

const homeIndustryApiMock = vi.hoisted(() => ({
  getCdPublicSettings: vi.fn(),
  getCdModules: vi.fn()
}))

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: homeIndustryApiMock.getCdPublicSettings,
  getCdModules: homeIndustryApiMock.getCdModules
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

describe('HomeIndustryHomePage banner loading', () => {
  it('suppresses the default home banner until the public banner setting resolves', async () => {
    const settingsRequest = deferred()
    homeIndustryApiMock.getCdPublicSettings.mockReturnValue(settingsRequest.promise)
    homeIndustryApiMock.getCdModules.mockResolvedValue({ data: { code: 200, data: [] } })

    const { container } = render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    const page = container.querySelector('.hd-page')
    expect(page).toHaveClass('hd-page--banner-pending')
    expect(page.style.backgroundImage).toBe('')

    settingsRequest.resolve({
      data: {
        code: 200,
        data: { home_banner: '/uploads/home-banner.png' }
      }
    })

    await waitFor(() => {
      expect(page).not.toHaveClass('hd-page--banner-pending')
    })
    expect(page.style.backgroundImage).toContain('/uploads/home-banner.png')
  })
})
