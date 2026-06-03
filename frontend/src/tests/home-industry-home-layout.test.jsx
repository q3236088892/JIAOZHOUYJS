import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeIndustryHomePage from '../pages/home-industry/HomeIndustryHomePage'

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: () => Promise.resolve({ data: { code: 200, data: { home_banner: '' } } }),
  getCdModules: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: [
          { id: 1, code: 'industry_chain', title: '产业链服务' },
          { id: 2, code: 'enterprise_support', title: '利企配套服务' },
          { id: 3, code: 'value_added', title: '招商入驻' }
        ]
      }
    })
}))

afterEach(() => {
  cleanup()
})

describe('HomeIndustryHomePage grouped layout', () => {
  it('renders industry chain and enterprise support service groups', async () => {
    render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: '家居产业链服务' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '利企配套服务' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /上游.*原辅料采购、仓储/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=upstream')
    expect(screen.getByRole('link', { name: /中游.*生产制造/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=midstream')
    expect(screen.getByRole('link', { name: /下游.*销售出海/ })).toHaveAttribute('href', '/homeIndustry/industry_chain?section=downstream')
    expect(screen.getByRole('link', { name: /财税服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=tax')
    expect(screen.getByRole('link', { name: /人力资源服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=human-resource')
    expect(screen.getByRole('link', { name: /项目施工服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=construction')
    expect(screen.getByRole('link', { name: /中介服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support?section=agency')
  })

  it('renders the fixed top navigation from the approved draft', async () => {
    const { container } = render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    const topNav = within(container.querySelector('.hd-top-nav'))
    expect(await topNav.findByRole('link', { name: '首页' })).toHaveAttribute('href', '/homeIndustry')
    expect(topNav.getByRole('link', { name: '招商入驻' })).toHaveAttribute('href', '/homeIndustry/value_added?section=investment')
    expect(topNav.getByRole('link', { name: '项目服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=project')
    expect(topNav.getByRole('link', { name: '政策服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=policy')
    expect(topNav.getByRole('link', { name: '法律服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=legal')
    expect(topNav.getByRole('link', { name: '人才服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=talent')
    expect(topNav.getByRole('link', { name: '金融服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=finance')
    expect(topNav.getByRole('link', { name: '帮办服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=assistance')
    expect(topNav.getByRole('link', { name: '国际贸易服务' })).toHaveAttribute('href', '/homeIndustry/value_added?section=trade')
    expect(topNav.getByRole('link', { name: '“一件事”延链拓面' })).toHaveAttribute('href', '/homeIndustry/value_added?section=chain-extension')
    expect(container.querySelectorAll('.hd-top-nav__icon')).toHaveLength(10)
  })
})
