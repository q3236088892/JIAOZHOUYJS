import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HistoricHomePage from '../pages/historic/HistoricHomePage'

vi.mock('../api/historic', () => ({
  getHistoricHome: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          page: {},
          navItems: [],
          industries: [{ id: 1, name: '\u6211\u60f3\u5f00\u9910\u996e\u5e97', route_path: '/historicDistrict/openRestaurant' }],
          homeServices: []
        }
      }
    })
}))

describe('HistoricHomePage', () => {
  it('renders industry card', async () => {
    render(
      <MemoryRouter>
        <HistoricHomePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('\u6211\u60f3\u5f00\u9910\u996e\u5e97')).toBeInTheDocument()
  })
})
