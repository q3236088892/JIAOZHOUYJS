import { describe, it, expect } from 'vitest'
import { buildLeftMenuFromStages } from '../utils/historicTransform'

describe('historic contract', () => {
  it('left and right anchor list should be equal', () => {
    const stages = [
      {
        stage_key: 's1',
        stage_title: '\u9636\u6bb51',
        categories: [
          {
            category_key: 'c1',
            category_title: '\u5206\u7c7b1',
            topics: [
              { anchor_key: 'a1', title: '\u4e3b\u98981' },
              { anchor_key: 'a2', title: '\u4e3b\u98982' }
            ]
          }
        ]
      }
    ]

    const left = buildLeftMenuFromStages(stages).flatMap((s) =>
      s.categories.flatMap((c) => c.items.map((i) => i.anchorKey))
    )
    const right = stages.flatMap((s) =>
      s.categories.flatMap((c) => c.topics.map((t) => t.anchor_key))
    )

    expect(left).toEqual(right)
  })
})
