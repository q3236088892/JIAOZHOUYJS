import { describe, it, expect } from 'vitest'
import { buildLeftMenuFromStages } from '../utils/historicTransform'

describe('buildLeftMenuFromStages', () => {
  it('should derive left menu from right stages', () => {
    const stages = [
      {
        stage_key: 'prepare',
        stage_title: '\u7b79\u5907\u5f00\u529e\u9636\u6bb5',
        categories: [
          {
            category_key: 'basic',
            category_title: '\u57fa\u672c\u653f\u52a1\u670d\u52a1',
            topics: [{ anchor_key: 'guide-basic-1', title: '\u4f01\u4e1a\u5f00\u529e' }]
          }
        ]
      }
    ]

    const leftMenu = buildLeftMenuFromStages(stages)
    expect(leftMenu[0].categories[0].items[0].anchorKey).toBe('guide-basic-1')
    expect(leftMenu[0].categories[0].items[0].title).toBe('\u4f01\u4e1a\u5f00\u529e')
  })
})
