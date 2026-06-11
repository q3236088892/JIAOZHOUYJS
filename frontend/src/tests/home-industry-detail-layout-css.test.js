import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const css = readFileSync(path.resolve(__dirname, '../styles/historic.css'), 'utf8')

function getCssRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]+)\\}`))
  return match?.groups?.body || ''
}

describe('home industry detail layout CSS', () => {
  it('uses a wider detail content container for readable right-side content', () => {
    const rule = getCssRule('.hd-detail-content')

    expect(rule).toContain('width: min(88vw, 1560px);')
    expect(rule).toContain('max-width: calc(100% - 48px);')
  })

  it('lets special poster media use the full right-side content width', () => {
    expect(getCssRule('.hd-special-poster-section')).toContain('width: 100%;')
    expect(getCssRule('.hd-special-poster-image')).toContain('width: 100%;')
    expect(getCssRule('.hd-special-promo-video-wrap')).toContain('width: 100%;')
  })

  it('adds subtle hierarchy cues to the left tree menu without changing its blue theme', () => {
    expect(getCssRule('.hd-left-category')).toContain('position: relative;')
    expect(getCssRule('.hd-left-category')).toContain('background: linear-gradient(90deg, rgba(21, 132, 218, 0.06) 0%, rgba(255, 255, 255, 0) 100%);')
    expect(getCssRule('.hd-left-category::before')).toContain('width: 1px;')
    expect(getCssRule('.hd-left-category::before')).toContain('background: rgba(21, 132, 218, 0.16);')
    expect(getCssRule('.hd-left-category .hd-left-category-title')).toContain('border-left: 3px solid rgba(21, 132, 218, 0.45);')
    expect(getCssRule('.hd-left-category .hd-left-item')).toContain('margin-left: 18px;')
  })
})
