import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('HomeIndustryHomePage grouped layout', () => {
  it('renders industry chain and enterprise support service groups', async () => {
    render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: '家居产业链服务' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '利企配套服务' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /上游.*原辅料采购、仓储/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /中游.*生产制造/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /下游.*销售出海/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /财税服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support')
  })
})
