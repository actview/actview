import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { markdownToActview } from '../src/node/markdownToActview'
import { buildRouteMap } from '../src/node/routeMap'

describe('P2 markdown features', () => {
  it('math', async () => {
    const result = await markdownToActview(
      '# Math\n\n$E = mc^2$\n\n$$\na^2 + b^2 = c^2\n$$',
      'math.md',
    )
    expect(result.html).toContain('class="katex"')
  })

  it('CJK friendly emphasis', async () => {
    const result = await markdownToActview('中文**强调**文字', 'cjk.md')
    expect(result.html).toContain('中文<strong>强调</strong>文字')
  })

  it('detects dead links and accepts rewritten links', async () => {
    await expect(
      markdownToActview('[missing](./missing.md)', 'guide.md', {
        pages: [],
        root: process.cwd(),
      }),
    ).rejects.toThrow(/Dead link/)

    const root = process.cwd()
    await expect(
      markdownToActview('[guide](/guide.md)', path.join(root, 'index.md'), {
        pages: [path.join(root, 'guide.md')],
        root,
        rewrites: { '/guide': '/old-guide' },
      }),
    ).resolves.toBeTruthy()
  })

  it('applies transformPageData and lastUpdated', async () => {
    const result = await markdownToActview('# Original', 'transform.md', {
      transformPageData: (data) => ({ title: 'Transformed', frontmatter: { ...data.frontmatter, ok: true } }),
      getLastUpdated: () => 1700000000,
    })
    expect(result.pageData.title).toBe('Transformed')
    expect(result.pageData.frontmatter.ok).toBe(true)
    expect(result.pageData.lastUpdated).toBe(1700000000)
  })

  it('loads custom markdown-it plugins', async () => {
    const result = await markdownToActview('==highlight==', 'custom.md', {
      markdownConfig: {
        config(md) {
          md.inline.ruler.before('emphasis', 'p2-mark', (state: any, silent: boolean) => {
            const start = state.pos
            if (state.src.slice(start, start + 2) !== '==') return false
            const end = state.src.indexOf('==', start + 2)
            if (end < 0) return false
            if (!silent) {
              state.push('mark_open', 'mark', 1)
              const text = state.push('text', '', 0)
              text.content = state.src.slice(start + 2, end)
              state.push('mark_close', 'mark', -1)
            }
            state.pos = end + 2
            return true
          })
        },
      },
    })
    expect(result.html).toContain('<mark>highlight</mark>')
  })
})

describe('P2 route map', () => {
  it('supports rewrites and dynamic routes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'actview-p2-'))
    try {
      fs.writeFileSync(path.join(root, 'index.md'), '# Home')
      fs.writeFileSync(path.join(root, 'guide.md'), '# Guide')
      fs.writeFileSync(path.join(root, 'dynamic.md'), '# Dynamic')

      const routes = buildRouteMap({
        root,
        rewrites: { '/guide': '/old-guide' },
        dynamicRoutes: [{ path: '/dynamic/42', file: 'dynamic.md' }],
      })

      expect(routes['/']).toBe('/index.md')
      expect(routes['/guide']).toBe('/guide.md')
      expect(routes['/old-guide']).toBe('/guide.md')
      expect(routes['/dynamic/42']).toBe('/dynamic.md')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
