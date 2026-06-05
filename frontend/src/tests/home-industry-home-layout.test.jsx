import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

beforeEach(() => {
  homeIndustryApiMock.getCdPublicSettings.mockResolvedValue({ data: { code: 200, data: { home_banner: '' } } })
  homeIndustryApiMock.getCdModules.mockResolvedValue({
    data: {
      code: 200,
      data: [
        { id: 1, code: 'industry_chain', title: '产业链服务' },
        { id: 2, code: 'enterprise_support', title: '利企配套服务' },
        { id: 3, code: 'value_added', title: '招商入驻' }
      ]
    }
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('HomeIndustryHomePage grouped layout', () => {
  it('renders service groups from the 2026.6.5 framework', async () => {
    const { container } = render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    const serviceBoard = within(container.querySelector('.hd-home-service-board'))

    expect(await serviceBoard.findByRole('heading', { name: '家居产业链服务' })).toBeInTheDocument()
    expect(serviceBoard.getByRole('heading', { name: '利企配套服务' })).toBeInTheDocument()

    expect(serviceBoard.getByRole('link', { name: /上游.*原辅料采购、仓储/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=upstream')
    expect(serviceBoard.getByRole('link', { name: /中游.*生产制造/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=midstream')
    expect(serviceBoard.getByRole('link', { name: /下游.*销售出海/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=downstream')
    expect(serviceBoard.getByRole('link', { name: /政策服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=policy')
    expect(serviceBoard.getByRole('link', { name: /法律服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=legal')
    expect(serviceBoard.getByRole('link', { name: /人才服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=talent')
    expect(serviceBoard.getByRole('link', { name: /金融服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=finance')
    expect(serviceBoard.getByRole('link', { name: /国际贸易服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=trade')
    expect(serviceBoard.getByRole('link', { name: /社会服务（企业）资源/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=social-resource')
    expect(serviceBoard.getByRole('link', { name: /帮办服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=assistance')
    expect(serviceBoard.getByRole('link', { name: /衍生服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=derivative')
  })

  it('renders the fixed top navigation from the 2026.6.5 framework', async () => {
    const { container } = render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    const topNav = within(container.querySelector('.hd-top-nav'))
    expect(await topNav.findByRole('link', { name: '首页' })).toHaveAttribute('href', '/homeIndustry')
    expect(topNav.getByRole('link', { name: '产业简介' })).toHaveAttribute('href', '/homeIndustry/value_added?section=industry-intro')
    expect(topNav.getByRole('link', { name: '招商宣传' })).toHaveAttribute('href', '/homeIndustry/value_added?section=investment-promo')
    expect(container.querySelectorAll('.hd-top-nav__icon')).toHaveLength(3)
  })

  it('hides top navigation entries disabled in backend settings', async () => {
    homeIndustryApiMock.getCdPublicSettings.mockResolvedValue({
      data: {
        code: 200,
        data: {
          home_banner: '',
          home_industry_nav_visibility: JSON.stringify({ 'investment-promo': false })
        }
      }
    })

    const { container } = render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    const topNav = within(container.querySelector('.hd-top-nav'))
    expect(await topNav.findByRole('link', { name: '产业简介' })).toBeInTheDocument()
    await waitFor(() => {
      expect(topNav.queryByRole('link', { name: '招商宣传' })).not.toBeInTheDocument()
    })
    expect(topNav.getByRole('link', { name: '首页' })).toBeInTheDocument()
  })
})
