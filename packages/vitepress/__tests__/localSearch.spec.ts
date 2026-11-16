import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildLocalSearchIndex,
  splitPageIntoSections,
} from '../src/node/localSearchPlugin'

describe('local search index', () => {
  it('splits HTML into heading sections', () => {
    const records = splitPageIntoSections(
      [
        '<h2 id="guide">Guide<a class="header-anchor" href="#guide">#</a></h2>',
        '<p>Intro text</p>',
        '<h3 id="install">Install<a class="header-anchor" href="#install">#</a></h3>',
        '<p>Install text</p>',
      ].join(''),
      '/guide',
    )

    expect(records).toHaveLength(2)
    expect(records[0].id).toBe('/guide#guide')
    expect(records[1].id).toBe('/guide#install')
    expect(records[1].titles).toEqual(['Guide'])
    expect(records[1].text).toBe('Install text')
  })

  it('builds a MiniSearch JSON index from Markdown files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'actview-search-'))
    try {
      const file = path.join(root, 'index.md')
      fs.writeFileSync(
        file,
        '# Guide\n\nSome searchable text.\n\n## Install\n\nInstall the package.',
      )

      const json = await buildLocalSearchIndex({
        root,
        pages: [file],
      })
      const data = JSON.parse(json)
      expect(data.documentCount).toBeGreaterThan(0)
      expect(JSON.stringify(data)).toContain('searchable')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
})
