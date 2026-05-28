import { describe, it, expect } from 'vitest'
import { getHistoricHomeData } from '../modules/historic/repository.js'

describe('historic schema + seed', () => {
  it('should contain openRestaurant industry after bootstrap', () => {
    const home = getHistoricHomeData()
    expect(home.industries.some((x) => x.slug === 'openRestaurant')).toBe(true)
  })
})
