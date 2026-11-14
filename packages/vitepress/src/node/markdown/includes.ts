import fs from 'node:fs'
import path from 'node:path'

const LANG_BY_EXT: Record<string, string> = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.vue': 'vue',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.md': 'md',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'bash',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
}

function readRelative(
  file: string,
  target: string,
): { content: string; path: string } | null {
  const normalized = target.trim().replace(/^@\//, '')
  const targetPath = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(path.dirname(file), normalized)
  try {
    return { content: fs.readFileSync(targetPath, 'utf8'), path: targetPath }
  } catch {
    return null
  }
}

function selectLines(source: string, spec: string): string {
  const match = /^(\d+)(?:-(\d+))?$/.exec(spec)
  if (!match) return source
  const start = Number(match[1])
  const end = Number(match[2] ?? match[1])
  return source
    .split(/\r?\n/)
    .slice(start - 1, end)
    .join('\n')
}

function fenceFor(code: string): string {
  return code.includes('```') ? '````' : '```'
}

export function processIncludes(
  source: string,
  file: string,
  depth = 0,
): string {
  if (depth > 10) return source

  source = source.replace(
    /^[ \t]*<!--\s*@include:\s*(.+?)\s*-->\s*$/gm,
    (line, target: string) => {
      const included = readRelative(file, target)
      if (included == null) return line
      return processIncludes(included.content, included.path, depth + 1)
    },
  )

  source = source.replace(
    /^[ \t]*<<<\s+(.+?)\s*$/gm,
    (line, rawTarget: string) => {
      const rangeMatch = /^(.*?)(?:\{([^}]+)\})?$/.exec(rawTarget)
      const target = (rangeMatch?.[1] ?? rawTarget).trim()
      const range = rangeMatch?.[2]?.trim()
      const content = readRelative(file, target)
      if (content == null) return line
      const selected = range ? selectLines(content.content, range) : content.content
      const ext = path.extname(target).toLowerCase()
      const lang = LANG_BY_EXT[ext] ?? 'text'
      const fence = fenceFor(selected)
      return `${fence}${lang}\n${selected.replace(/\r?\n$/, '')}\n${fence}`
    },
  )

  return source
}
