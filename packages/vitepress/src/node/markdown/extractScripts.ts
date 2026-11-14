export interface ExtractedScript {
  content: string
  attrs: string
}

export interface ExtractScriptsResult {
  source: string
  scripts: ExtractedScript[]
}

/**
 * 提取 Markdown 顶层的 <script> / <script component>。
 * 会跳过 fenced code block 中的示例。
 */
export function extractScripts(input: string): ExtractScriptsResult {
  const lines = input.split(/\r?\n/)
  const out: string[] = []
  const scripts: ExtractedScript[] = []
  let fence: string | null = null
  let scriptOpen: { attrs: string; startLine: number } | null = null
  let scriptLines: string[] = []

  for (const line of lines) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line)
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0]
      else if (fence === fenceMatch[1][0]) fence = null
      if (scriptOpen) scriptLines.push(line)
      else out.push(line)
      continue
    }

    if (fence) {
      if (scriptOpen) scriptLines.push(line)
      else out.push(line)
      continue
    }

    if (!scriptOpen) {
      const open = /^[ \t]*<script\b([^>]*)>/i.exec(line)
      if (!open) {
        out.push(line)
        continue
      }
      const after = line.slice(open[0].length)
      const close = /<\/script\s*>/i.exec(after)
      if (close) {
        scripts.push({
          attrs: open[1].trim(),
          content: after.slice(0, close.index),
        })
        const rest = after.slice(close.index + close[0].length)
        if (rest) out.push(rest)
      } else {
        scriptOpen = { attrs: open[1].trim(), startLine: out.length }
        scriptLines = after ? [after] : []
      }
      continue
    }

    const close = /<\/script\s*>/i.exec(line)
    if (close) {
      const before = line.slice(0, close.index)
      if (before) scriptLines.push(before)
      scripts.push({ attrs: scriptOpen.attrs, content: scriptLines.join('\n') })
      const rest = line.slice(close.index + close[0].length)
      if (rest) out.push(rest)
      scriptOpen = null
      scriptLines = []
    } else {
      scriptLines.push(line)
    }
  }

  return { source: out.join('\n'), scripts }
}
