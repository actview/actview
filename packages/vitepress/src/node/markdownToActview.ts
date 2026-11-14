// ============================================================
// Markdown → ActView 页面模块
// ============================================================

import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import attrs from 'markdown-it-attrs'
import { full as emoji } from 'markdown-it-emoji'
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5'
import katex from '@traptitech/markdown-it-katex'
import cjkFriendly from 'markdown-it-cjk-friendly'
import path from 'node:path'
import { applyContainers, applyGithubAlerts, applyToc } from './markdown/plugins'
import { renderCodeBlock } from './markdown/highlight'
import { processIncludes } from './markdown/includes'
import { extractScripts } from './markdown/extractScripts'
import { collectComponents, hasNamedImport } from './markdown/componentScript'
import {
  balanceComponentTags,
  htmlToJsx,
} from './markdown/htmlToJsx'

export interface PageData {
  title: string
  relativePath: string
  frontmatter: Record<string, any>
  headers: Array<{ level: number; title: string; slug: string; link: string }>
  lastUpdated?: number
  params?: Record<string, any>
  description?: string
}

export interface MarkdownToActviewResult {
  code: string
  html: string
  pageData: PageData
}

export interface MarkdownToActviewOptions {
  html?: boolean
  lineNumbers?: boolean
  codeCopyButtonTitle?: string
  root?: string
  pages?: string[]
  rewrites?: Record<string, string>
  dynamicRoutes?: Array<{ path: string; file?: string }>
  ignoreDeadLinks?:
    | boolean
    | 'localhostLinks'
    | Array<string | RegExp | ((url: string, file: string) => boolean)>
  transformPageData?: (data: PageData, ctx: { file: string }) => any
  markdownConfig?: { config?: (md: any) => void | Promise<void> }
  getLastUpdated?: (file: string) => number | undefined | Promise<number | undefined>
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
})

md.use(anchor, {
  level: [1, 2, 3, 4, 5, 6],
  permalink: anchor.permalink.linkInsideHeader({
    symbol: '#',
    placement: 'after',
    ariaHidden: true,
  }),
})
md.use(attrs as any)
md.use(emoji as any)
md.use(katex as any, { throwOnError: false })
md.use(cjkFriendly as any)
applyContainers(md)
applyGithubAlerts(md)
applyToc(md)

const defaultFence = md.renderer.rules.fence!
const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens: any, idx: number, options: any, _env: any, self: any) =>
    self.renderToken(tokens, idx, options))
const defaultImage = md.renderer.rules.image!

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  return token.meta?.actviewCode ?? defaultFence(tokens, idx, options, env, self)
}

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href')
  if (href && !href.startsWith('#')) {
    const isExternal = /^(?:https?:)?\/\//i.test(href)
    if (isExternal) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noreferrer')
      token.attrJoin('class', 'vp-external-link-icon')
    } else if (/\.md(?:[?#]|$)/.test(href)) {
      let next = href.replace(/\.md(?=([?#]|$))/, '')
      next = next.replace(/(^|\/)index$/, '$1') || '/'
      token.attrSet('href', next)
    }
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrSet('decoding', 'async')
  return defaultImage(tokens, idx, options, env, self)
}

function inferTitle(
  frontmatter: Record<string, any>,
  html: string,
): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title) {
    return frontmatter.title
  }
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  if (!h1) return ''
  return h1[1]
    .replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/i, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function extractHeaders(html: string) {
  const headers: PageData['headers'] = []
  const re = /<h([1-6])\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const title = match[3]
      .replace(/<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/i, '')
      .replace(/<[^>]+>/g, '')
      .trim()
    headers.push({
      level: Number(match[1]),
      title,
      slug: match[2],
      link: `#${match[2]}`,
    })
  }
  return headers
}

function findInterpolation(
  node: DefaultTreeAdapterMap['node'],
  inCode = false,
): string | null {
  const element = node as DefaultTreeAdapterMap['element']
  const isElement = element.tagName != null
  const nextInCode =
    inCode ||
    (isElement &&
      (element.tagName.toLowerCase() === 'pre' ||
        element.tagName.toLowerCase() === 'code'))

  if (!isElement && (node as DefaultTreeAdapterMap['textNode']).value != null) {
    const text = (node as DefaultTreeAdapterMap['textNode']).value
    if (!inCode && /\{\{[\s\S]*?\}\}/.test(text)) return text
  }

  for (const child of (node as { childNodes?: DefaultTreeAdapterMap['node'][] })
    .childNodes ?? []) {
    const found = findInterpolation(child, nextInCode)
    if (found) return found
  }
  return null
}

function assertSupported(html: string, file: string): void {
  if (/<script\b[^>]*\bsetup\b/i.test(html)) {
    throw new Error(
      `[actview/vitepress] ${file}：暂不支持 <script setup>（Phase 1 只支持纯 Markdown/HTML 页面）`,
    )
  }
  const vueAttr = /<[^>]+\s(?:v-[\w-]+|:[\w-]+|@[\w-]+)=/i.exec(html)
  if (vueAttr) {
    throw new Error(
      `[actview/vitepress] ${file}：暂不支持 Vue 模板指令/绑定（发现 ${vueAttr[0].trim()}）`,
    )
  }
  const interpolation = findInterpolation(parseFragment(html))
  if (interpolation) {
    throw new Error(
      `[actview/vitepress] ${file}：暂不支持 {{ }} 插值（发现 "${interpolation.trim()}"）`,
    )
  }
}

const configuredMarkdown = new WeakSet<object>()

async function applyMarkdownConfig(
  config?: MarkdownToActviewOptions['markdownConfig'],
): Promise<void> {
  if (!config?.config || configuredMarkdown.has(config)) return
  configuredMarkdown.add(config)
  await config.config(md)
}

function normalizeFile(file: string): string {
  return path.resolve(file).replace(/\\/g, '/')
}

function normalizeRoutePath(pathname: string): string {
  let value = (pathname || '/').replace(/\.html$/, '')
  if (!value.startsWith('/')) value = `/${value}`
  if (value.length > 1) value = value.replace(/\/+$/, '')
  return value || '/'
}

function isIgnoredLink(
  url: string,
  file: string,
  ignore: MarkdownToActviewOptions['ignoreDeadLinks'],
): boolean {
  if (ignore === true) return true
  if (ignore === 'localhostLinks') {
    return url.replace(/^https?:/, '').startsWith('//localhost')
  }
  if (!Array.isArray(ignore)) return false
  return ignore.some((item) => {
    if (typeof item === 'string') return item === url
    if (item instanceof RegExp) return item.test(url)
    return item(url, file)
  })
}

function checkDeadLinks(
  tokens: Array<{ type: string; attrGet: (name: string) => string | null }>,
  file: string,
  options: MarkdownToActviewOptions,
): void {
  if (!options.pages || options.ignoreDeadLinks === true) return
  const pages = new Set(options.pages.map(normalizeFile))
  const root = path.resolve(options.root ?? path.dirname(file))

  for (const token of tokens) {
    const inspect = (current: any): void => {
      if (current.type === 'link_open') {
        const href = current.attrGet('href')
        if (!href || href.startsWith('#') || /^(?:mailto|tel|https?:)/i.test(href)) {
          return
        }
        if (isIgnoredLink(href, file, options.ignoreDeadLinks)) return

        const pathname = decodeURIComponent(href.split(/[?#]/)[0]).replace(/\.md$/, '')
        if (!pathname) return
        if (/\.(?:png|jpe?g|gif|svg|webp|avif|ico|pdf|zip|mp4|webm|css|js|json|txt)$/i.test(pathname)) {
          return
        }
        if (
          options.dynamicRoutes?.some(
            (route) => normalizeRoutePath(route.path) === normalizeRoutePath(pathname),
          )
        ) {
          return
        }

        const base = pathname.startsWith('/')
          ? path.join(root, pathname.slice(1))
          : path.resolve(path.dirname(file), pathname)
        const target = base.replace(/\/$/, '')
        const candidates = [
          `${target}.md`,
          path.join(target, 'index.md'),
        ].map(normalizeFile)

        if (candidates.some((candidate) => pages.has(candidate))) return
        if (options.rewrites) {
          const matched = Object.entries(options.rewrites).some(([source, dest]) => {
            const sourceFile = normalizeFile(
              path.join(
                root,
                source
                  .replace(/^\/+/, '')
                  .replace(/\.md$/, '') + '.md',
              ),
            )
            const destPath = dest.replace(/\.md$/, '').replace(/^\//, '')
            const linkPath = pathname.replace(/^\//, '')
            return pages.has(sourceFile) && destPath === linkPath
          })
          if (matched) return
        }

        throw new Error(`[actview/vitepress] Dead link in ${file}: ${href}`)
      }
      if (Array.isArray(current.children)) {
        for (const child of current.children) inspect(child)
      }
    }
    inspect(token)
  }
}

function buildPageData(
  parsed: matter.GrayMatterFile<string>,
  html: string,
  file: string,
): PageData {
  const relativePath = file.replace(/\\/g, '/').split('/').pop() ?? file
  return {
    title: inferTitle(parsed.data, html),
    relativePath,
    frontmatter: parsed.data as Record<string, any>,
    headers: extractHeaders(html),
  }
}

function buildPlainCode(html: string, pageData: PageData): string {
  const wrappedHtml = `<div class="vp-doc">${html}</div>`
  return `
import { ActViewComponent, Component } from 'actview'
import { htmlToVNode } from '@actview/vitepress'

export const __pageData = ${JSON.stringify(pageData)}

const PAGE_HTML = ${JSON.stringify(wrappedHtml)}

class Page extends ActViewComponent {
  render() {
    return htmlToVNode(PAGE_HTML)
  }
}

Component({ name: ${JSON.stringify(pageData.relativePath)} })(Page)
export default Page
`
}

function buildComponentCode(
  script: string,
  html: string,
  pageData: PageData,
): string {
  const { components } = collectComponents(script)
  const componentTags = new Set<string>()
  for (const match of html.matchAll(/<([A-Z][\w-]*)\b/g)) {
    componentTags.add(match[1].toLowerCase())
  }
  for (const tag of componentTags) {
    if (!components[tag]) {
      throw new Error(
        `[actview/vitepress] ${pageData.relativePath}：Unknown component <${tag}>`,
      )
    }
  }

  const balanced = balanceComponentTags(html, components)
  const jsx = htmlToJsx(balanced, { components })
  const imports: string[] = []
  if (!hasNamedImport(script, 'ActViewComponent')) {
    imports.push("import { ActViewComponent } from 'actview'")
  }
  if (!hasNamedImport(script, 'Component')) {
    imports.push("import { Component } from 'actview'")
  }

  return `
${imports.join('\n')}
${script}

export const __pageData = ${JSON.stringify(pageData)}

@Component({ name: ${JSON.stringify(pageData.relativePath)} })
export class Page extends ActViewComponent {
  render() {
    return (
      <>
        ${jsx}
      </>
    )
  }
}

export default Page
`
}

export async function markdownToActview(
  source: string,
  file: string,
  options: MarkdownToActviewOptions = {},
): Promise<MarkdownToActviewResult> {
  const parsed = matter(source)
  const included = processIncludes(parsed.content, file)
  const extracted = extractScripts(included)
  const content = extracted.source
  await applyMarkdownConfig(options.markdownConfig)
  const tokens = md.parse(content, {})
  const lineNumbers = options.lineNumbers ?? false
  const copyButtonTitle = options.codeCopyButtonTitle ?? 'Copy Code'

  checkDeadLinks(tokens as any, file, options)

  for (const token of tokens) {
    if (token.type !== 'fence') continue
    token.meta ??= {}
    token.meta.actviewCode = await renderCodeBlock(token.content, token.info, {
      lineNumbers,
      active: !!token.meta.active,
      copyButtonTitle,
    })
  }

  const html = md.renderer.render(tokens, md.options, {})
  assertSupported(html, file)
  const pageData = buildPageData(parsed, html, file)
  const transformed = await options.transformPageData?.(pageData, { file })
  const finalPageData = transformed
    ? { ...pageData, ...transformed }
    : pageData
  if (options.getLastUpdated) {
    const timestamp = await options.getLastUpdated(file)
    if (timestamp) finalPageData.lastUpdated = timestamp
  }
  const script = extracted.scripts.map((item) => item.content).join('\n')

  if (extracted.scripts.length) {
    return {
      code: buildComponentCode(script, html, finalPageData),
      html: `<div class="vp-doc">${html}</div>`,
      pageData: finalPageData,
    }
  }

  return {
    code: buildPlainCode(html, finalPageData),
    html: `<div class="vp-doc">${html}</div>`,
    pageData: finalPageData,
  }
}
