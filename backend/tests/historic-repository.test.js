import { describe, it, expect } from 'vitest'
import { getOpenRestaurantDetail } from '../modules/historic/repository.js'

describe('historic repository', () => {
  it('left menu should mirror topic order from right content', () => {
    const detail = getOpenRestaurantDetail('openRestaurant')
    const leftAnchors = detail.leftMenu.flatMap((s) => s.categories.flatMap((c) => c.items.map((i) => i.anchorKey)))
    const rightAnchors = detail.stages.flatMap((s) => s.categories.flatMap((c) => c.topics.map((t) => t.anchor_key)))
    expect(leftAnchors).toEqual(rightAnchors)
  })
})
