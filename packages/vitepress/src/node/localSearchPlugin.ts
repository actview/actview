import fs from 'node:fs'
import MiniSearch from 'minisearch'
import type { Plugin } from 'vite'
import { markdownToActview, type MarkdownToActviewOptions } from './markdownToActview'
import { routeForFile } from './routeMap'

const VIRTUAL_INDEX = 'virtual:actview-search-index'
const VIRTUAL_INDEX_PREFIX = `${VIRTUAL_INDEX}:`

export interface LocalSearchRecord {
  id: string
  title: string
  titles: string[]
  text: string
  url: string
}

export interface LocalSearchPluginOptions {
  pages: string[]
  root: string
  enabled?: boolean
  rewrites?: Record<string, string>
  dynamicRoutes?: Array<{ path: string; file?: string }>
  ignoreDeadLinks?: MarkdownToActviewOptions['ignoreDeadLinks']
  transformPageData?: MarkdownToActviewOptions['transformPageData']
  markdownConfig?: MarkdownToActviewOptions['markdownConfig']
}

export function splitPageIntoSections(
  html: string,
  url = '',
): LocalSearchRecord[] {
  const headingRe = /<h([1-6])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi
  const matches = [...html.matchAll(headingRe)]
  if (!matches.length) {
    return [
      {
        id: url,
        title: '',
        titles: [],
        text: cleanHtml(html),
        url,
      },
    ]
  }

  const records: LocalSearchRecord[] = []
  const parentTitles: string[] = []
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const level = Number(match[1]) - 1
    const anchor = match[2]
    const title = cleanHeading(match[3])
    const start = (match.index ?? 0) + match[0].length
    const end =
      i + 1 < matches.length ? matches[i + 1].index ?? html.length : html.length
    const text = cleanHtml(html.slice(start, end))
    if (!title) continue
    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean)
    records.push({
      id: anchor ? `${url}#${anchor}` : url,
      title,
      titles: titles.slice(0, -1),
      text,
      url,
    })
    if (level === 0) parentTitles.length = 0
    parentTitles[level] = title
  }
  return records
}

function cleanHeading(html: string): string {
  return cleanHtml(
    html.replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/i, ''),
  ).trim()
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function buildLocalSearchIndex(
  options: LocalSearchPluginOptions,
): Promise<string> {
  const index = new MiniSearch<LocalSearchRecord>({
    fields: ['title', 'titles', 'text'],
    storeFields: ['title', 'titles', 'text', 'url'],
  })

  for (const file of options.pages) {
    if (!fs.existsSync(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    const result = await markdownToActview(source, file, {
      root: options.root,
      pages: options.pages,
      rewrites: options.rewrites,
      dynamicRoutes: options.dynamicRoutes,
      ignoreDeadLinks: options.ignoreDeadLinks,
      transformPageData: options.transformPageData,
      markdownConfig: options.markdownConfig,
    })
    if (result.pageData.frontmatter?.search === false) continue
    const route = routeForFile(options.root, file)
    const records = splitPageIntoSections(result.html, route)
    for (const record of records) {
      if (!record.id) record.id = route
      if (!record.title) record.title = result.pageData.title || route
      index.add(record)
    }
  }

  return JSON.stringify(index.toJSON())
}

export function localSearchPlugin(
  options: LocalSearchPluginOptions,
): Plugin {
  let indexJson: string | null = null
  let pending: Promise<void> | null = null

  const ensureIndex = async (): Promise<void> => {
    if (!options.enabled) {
      indexJson = '{}'
      return
    }
    if (!pending) {
      pending = buildLocalSearchIndex(options).then((json) => {
        indexJson = json
      })
    }
    await pending
  }

  return {
    name: 'actview:local-search',
    enforce: 'pre',
    async resolveId(id) {
      if (id === VIRTUAL_INDEX) return `\0${VIRTUAL_INDEX}`
      if (id.startsWith(VIRTUAL_INDEX_PREFIX)) return `\0${id}`
      return null
    },
    async load(id) {
      if (id === `\0${VIRTUAL_INDEX}`) {
        await ensureIndex()
        return `export default { root: () => import('${VIRTUAL_INDEX}:root') }`
      }
      if (id === `\0${VIRTUAL_INDEX}:root`) {
        await ensureIndex()
        return `export default ${JSON.stringify(indexJson ?? '{}')}`
      }
      return null
    },
    async configureServer(server) {
      await ensureIndex()
      server.watcher.on('change', (file) => {
        if (!file.endsWith('.md')) return
        pending = null
        indexJson = null
        void ensureIndex().then(() => {
          server.ws.send({ type: 'full-reload' })
        })
      })
    },
  }
}
