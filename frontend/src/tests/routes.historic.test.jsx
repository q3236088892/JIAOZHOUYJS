import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('historic routes', () => {
  it('should render historic home route', () => {
    render(
      <MemoryRouter initialEntries={['/historicDistrict']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/\u9009\u62e9\u60a8\u60f3\u4e86\u89e3\u548c\u4ece\u4e8b\u7684\u4e1a\u6001/i)).toBeInTheDocument()
  })
})
