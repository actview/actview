import containerImport from 'markdown-it-container'

const container: any = containerImport
import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

type Md = MarkdownIt

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function titleHtml(md: Md, info: string, fallback: string): string {
  const raw = info.trim()
  return raw ? md.renderInline(raw) : escapeHtml(fallback)
}

function createContainer(md: Md, klass: string, defaultTitle: string) {
  return [
    container,
    klass,
    {
      render(tokens: Token[], idx: number) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          const info = token.info.trim().slice(klass.length).trim()
          const title = titleHtml(md, info, defaultTitle)
          if (klass === 'details') {
            return `<details class="${klass} custom-block"><summary>${title}</summary>\n`
          }
          const titleClass = `custom-block-title${info ? '' : ' custom-block-title-default'}`
          return `<div class="${klass} custom-block"><p class="${titleClass}">${title}</p>\n`
        }
        return klass === 'details' ? '</details>\n' : '</div>\n'
      },
    },
  ] as const
}

export function applyContainers(md: Md): void {
  md.use.apply(md, createContainer(md, 'tip', 'TIP') as any)
  md.use.apply(md, createContainer(md, 'info', 'INFO') as any)
  md.use.apply(md, createContainer(md, 'warning', 'WARNING') as any)
  md.use.apply(md, createContainer(md, 'danger', 'DANGER') as any)
  md.use.apply(md, createContainer(md, 'details', 'Details') as any)
  md.use(container as any, 'v-pre', {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<div v-pre>\n' : '</div>\n'
    },
  })
  md.use(container as any, 'raw', {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<div class="vp-raw">\n' : '</div>\n'
    },
  })
  applyCodeGroup(md)
}

function applyCodeGroup(md: Md): void {
  md.core.ruler.after('block', 'actview-code-group-active', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'container_code-group_open') continue
      let end = i + 1
      while (
        end < tokens.length &&
        !(
          tokens[end].nesting === -1 &&
          tokens[end].type === 'container_code-group_close'
        )
      ) {
        end++
      }
      let first = true
      for (let j = i + 1; j < end; j++) {
        if (tokens[j].type !== 'fence') continue
        if (first) {
          ;(tokens[j].meta ??= {}).active = true
          first = false
        }
      }
    }
  })
  md.use(container as any, 'code-group', {
    render(tokens: Token[], idx: number) {
      if (tokens[idx].nesting === -1) return '</div></div>\n'
      let tabs = ''
      let checked = true
      const start = idx + 1
      let end = start
      while (
        end < tokens.length &&
        !(
          tokens[end].nesting === -1 &&
          tokens[end].type === 'container_code-group_close'
        )
      ) {
        end++
      }
      let tabIndex = 0
      for (let i = start; i < end; i++) {
        const token = tokens[i]
        if (token.type !== 'fence') continue
        const title =
          token.info.match(/\[([^\]]*)\]/)?.[1]?.trim() ||
          token.info.match(/^[a-zA-Z0-9-_]+/)?.[0] ||
          'txt'
        const id = `tab-${idx}-${tabIndex++}`
        tabs += `<input type="radio" name="group-${idx}" id="${id}"${
          checked ? ' checked' : ''
        }><label data-title="${escapeHtml(title)}" for="${id}">${escapeHtml(title)}</label>`
        checked = false
      }
      return `<div class="vp-code-group"><div class="tabs">${tabs}</div><div class="blocks">\n`
    },
  })
}

const alertRE = /^\[!(TIP|NOTE|INFO|IMPORTANT|WARNING|CAUTION|DANGER)\]([^\n\r]*)/i

export function applyGithubAlerts(md: Md): void {
  md.core.ruler.after('block', 'github-alerts', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue
      const open = tokens[i]
      let end = i + 1
      while (
        end < tokens.length &&
        (tokens[end].type !== 'blockquote_close' ||
          tokens[end].level !== open.level)
      ) {
        end++
      }
      if (end >= tokens.length) continue
      const close = tokens[end]
      const firstContent = tokens
        .slice(i, end + 1)
        .find((token) => token.type === 'inline')
      if (!firstContent || !firstContent.content) continue
      const match = firstContent.content.match(alertRE)
      if (!match) continue
      const type = match[1].toLowerCase()
      const title = match[2].trim() || type.toUpperCase()
      firstContent.content = firstContent.content
        .slice(match[0].length)
        .trimStart()
      open.type = 'github_alert_open'
      open.tag = 'div'
      open.meta = { title, type }
      close.type = 'github_alert_close'
      close.tag = 'div'
    }
  })
  md.renderer.rules.github_alert_open = (tokens, idx) => {
    const { title, type } = tokens[idx].meta
    return `<div class="${type} custom-block github-alert"><p class="custom-block-title">${escapeHtml(title)}</p>\n`
  }
  md.renderer.rules.github_alert_close = () => '</div>\n'
}

export function applyToc(md: Md): void {
  md.core.ruler.push('actview-toc', (state) => {
    const tocIndex = state.tokens.findIndex(
      (t) => t.type === 'inline' && t.content.trim() === '[[toc]]',
    )
    if (tocIndex < 0) return

    const headings: Array<{ level: number; id: string | null; text: string }> = []
    for (let i = 0; i < state.tokens.length; i++) {
      const open = state.tokens[i]
      if (open.type !== 'heading_open' || !open.tag.match(/^h[1-6]$/)) continue
      const inline = state.tokens[i + 1]
      headings.push({
        level: Number(open.tag.slice(1)),
        id: open.attrGet('id'),
        text: inline?.content ?? '',
      })
    }
    const items = headings
      .filter((h) => h.level > 1 && h.id)
      .map(
        (h) =>
          `<li class="toc-level-${h.level}"><a href="#${h.id}">${h.text}</a></li>`,
      )
      .join('')
    const html = `<div class="toc"><ul class="toc-list">${items}</ul></div>`

    const start =
      state.tokens[tocIndex - 1]?.type === 'paragraph_open' ? tocIndex - 1 : tocIndex
    const end =
      state.tokens[tocIndex + 1]?.type === 'paragraph_close' ? tocIndex + 1 : tocIndex
    const token = new state.Token('html_block', '', 0)
    token.content = html
    state.tokens.splice(start, end - start + 1, token)
  })
}
