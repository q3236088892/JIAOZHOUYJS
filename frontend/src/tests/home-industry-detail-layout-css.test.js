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
})
