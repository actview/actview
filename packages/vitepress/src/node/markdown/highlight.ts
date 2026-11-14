import { createHighlighter, type Highlighter } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const COMMON_LANGS = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'vue',
  'html',
  'css',
  'scss',
  'json',
  'bash',
  'shell',
  'markdown',
  'yaml',
  'diff',
  'python',
  'java',
  'go',
  'rust',
  'sql',
  'csharp',
  'cpp',
  'ruby',
  'php',
  'toml',
  'ini',
  'docker',
]

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: COMMON_LANGS,
    engine: createJavaScriptRegexEngine(),
  })
  return highlighterPromise
}

const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  md: 'markdown',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  dockerfile: 'docker',
  'c++': 'cpp',
  'c#': 'csharp',
}

export interface CodeInfo {
  lang: string
  label: string
  title: string
  lines: Set<number>
  lineNumbers: boolean
  noLineNumbers: boolean
  startLine: number
}

export function parseCodeInfo(info: string, globalLineNumbers = false): CodeInfo {
  const raw = info.trim()
  const title = raw.match(/\[([^\]]*)\]/)?.[1]?.trim() ?? ''
  const highlightMatch = raw.match(/\{([^}]*)\}/)?.[1] ?? ''
  const lines = new Set<number>()
  for (const part of highlightMatch.split(',')) {
    const value = part.trim()
    if (!value) continue
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(value)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      for (let i = start; i <= end; i++) lines.add(i)
    } else if (/^\d+$/.test(value)) {
      lines.add(Number(value))
    }
  }
  const noLineNumbers = /:no-line-numbers\b/.test(raw)
  const lineNumbers =
    !noLineNumbers && (globalLineNumbers || /:line-numbers\b/.test(raw))
  const startLine = Number(raw.match(/=(\d+)/)?.[1] ?? 1)
  const cleaned = raw
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/:(?:no-)?line-numbers\b/g, '')
    .replace(/=\d+/g, '')
    .trim()
  const lang = (cleaned.split(/\s+/)[0] || 'text').toLowerCase()
  const normalized = LANG_ALIASES[lang] ?? lang
  return {
    lang: normalized,
    label: normalized === 'text' ? 'txt' : normalized.replace(/_/g, ' '),
    title,
    lines,
    lineNumbers,
    noLineNumbers,
    startLine,
  }
}

export async function renderCodeBlock(
  code: string,
  info: string,
  options: {
    lineNumbers?: boolean
    active?: boolean
    copyButtonTitle?: string
  } = {},
): Promise<string> {
  const parsed = parseCodeInfo(info, options.lineNumbers)
  const highlighter = await getHighlighter()
  const source = code.replace(/\n$/, '')
  const loaded = highlighter.getLoadedLanguages()
  const shikiLang = loaded.includes(parsed.lang) ? parsed.lang : 'text'
  const transformers = parsed.lines.size
    ? [
        {
          line(node: any, line: number) {
            if (!parsed.lines.has(line)) return
            const classes = String(node.properties.class ?? '')
              .split(/\s+/)
              .filter(Boolean)
            if (!classes.includes('highlighted')) classes.push('highlighted')
            node.properties.class = classes.join(' ')
          },
        },
      ]
    : []
  const highlighted = highlighter.codeToHtml(source, {
    lang: shikiLang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
    transformers: transformers as any,
  })

  const lineCount = source.split('\n').length
  const className = [
    `language-${parsed.lang}`,
    parsed.lineNumbers ? 'line-numbers-mode' : '',
    options.active ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const label = parsed.title || parsed.label
  const numbers = parsed.lineNumbers
    ? `<div class="line-numbers-wrapper" aria-hidden="true">${Array.from(
        { length: lineCount },
        (_, i) =>
          `<span class="line-number">${i + parsed.startLine}</span><br>`,
      ).join('')}</div>`
    : ''

  return (
    `<div class="${className}">` +
    `<button title="${escapeAttr(options.copyButtonTitle || 'Copy Code')}" class="copy"></button>` +
    `<span class="lang">${escapeHtml(label)}</span>` +
    highlighted +
    numbers +
    `</div>`
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;')
}
