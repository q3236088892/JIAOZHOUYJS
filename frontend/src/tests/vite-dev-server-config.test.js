import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

describe('vite dev server config', () => {
  it('should lock port and proxy api/uploads to backend ipv4 loopback', () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const configPath = path.resolve(__dirname, '../../vite.config.js')
    const source = fs.readFileSync(configPath, 'utf8')

    expect(source).toContain('port: 3000')
    expect(source).toContain('strictPort: true')
    expect(source).toContain("target: 'http://127.0.0.1:3001'")
  })
})
