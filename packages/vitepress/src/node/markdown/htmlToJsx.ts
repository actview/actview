import { parseFragment, type DefaultTreeAdapterMap } from 'parse5'

type HtmlNode = DefaultTreeAdapterMap['node']
type HtmlElement = DefaultTreeAdapterMap['element']

const SKIP_TAGS = new Set(['script', 'style', 'template'])
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

export interface HtmlToJsxOptions {
  /** lowercase tag name -> component identifier */
  components?: Record<string, string>
}

function isElement(node: HtmlNode): node is HtmlElement {
  return (node as { tagName?: unknown }).tagName != null
}

function isText(node: HtmlNode): boolean {
  return (node as { nodeName?: unknown }).nodeName === '#text'
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function renderAttrs(element: HtmlElement): string {
  const parts: string[] = []
  for (const attr of element.attrs) {
    const name = attr.name === 'for' ? 'htmlFor' : attr.name
    if (attr.value === '') {
      parts.push(`${name}={true}`)
      continue
    }
    parts.push(`${name}="${escapeAttr(attr.value)}"`)
  }
  return parts.length ? ` ${parts.join(' ')}` : ''
}

function renderNode(node: HtmlNode, options: HtmlToJsxOptions): string {
  if (isText(node)) {
    return `{${JSON.stringify((node as { value: string }).value)}}`
  }
  if (!isElement(node)) return ''

  const tag = node.tagName.toLowerCase()
  if (SKIP_TAGS.has(tag)) return ''

  const component = options.components?.[tag]
  const name = component ?? tag
  const attrs = renderAttrs(node)
  const children = node.childNodes
    .map((child) => renderNode(child, options))
    .filter(Boolean)
    .join('')

  if (!children && (component || VOID_TAGS.has(tag))) {
    return `<${name}${attrs} />`
  }
  return `<${name}${attrs}>${children}</${name}>`
}

/**
 * 将纯静态 HTML 转成 JSX 片段（不带外层 Fragment）。
 */
export function htmlToJsx(html: string, options: HtmlToJsxOptions = {}): string {
  const fragment = parseFragment(html)
  return fragment.childNodes
    .map((node) => renderNode(node, options))
    .filter(Boolean)
    .join('')
}

/**
 * 把 `<Counter />` 归一化成 `<Counter></Counter>`，避免 parse5 把
 * 后续兄弟节点吞进自闭合组件。
 */
export function balanceComponentTags(
  html: string,
  components: Record<string, string>,
): string {
  const names = Array.from(
    new Set([
      ...Object.values(components),
      ...Object.keys(components),
    ]),
  ).filter(Boolean)
  if (!names.length) return html
  const pattern = new RegExp(
    `<(${names.map(escapeRegExp).join('|')})(\\s[^>]*?)?\\s*/>`,
    'gi',
  )
  return html.replace(pattern, '<$1$2></$1>')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
