export interface ComponentInfo {
  /** lowercase tag name -> local identifier */
  components: Record<string, string>
  /** declarations that can be used as JSX components */
  names: Set<string>
}

/**
 * 只做轻量声明收集；script 内容不会被改写，仍整体提升到模块顶部。
 */
export function collectComponents(script: string): ComponentInfo {
  const names = new Set<string>()
  const components: Record<string, string> = {}

  for (const match of script.matchAll(
    /(?:^|\n)\s*import\s+([A-Z]\w*)\s*(?:,|from)/g,
  )) {
    names.add(match[1])
  }

  for (const match of script.matchAll(
    /(?:^|\n)\s*import\s+(?!type\b)\{([^}]+)\}\s*from/g,
  )) {
    for (const part of match[1].split(',')) {
      const value = part.trim()
      if (!value) continue
      const alias = /\bas\s+([A-Z]\w*)$/.exec(value)
      const name = alias?.[1] ?? /^([A-Z]\w*)$/.exec(value)?.[1]
      if (name) names.add(name)
    }
  }

  for (const match of script.matchAll(/\bclass\s+([A-Z]\w*)\b/g)) {
    names.add(match[1])
  }
  for (const match of script.matchAll(/\b(?:function|const|let|var)\s+([A-Z]\w*)\b/g)) {
    names.add(match[1])
  }

  for (const name of names) components[name.toLowerCase()] = name
  return { components, names }
}

export function hasNamedImport(script: string, name: string): boolean {
  for (const match of script.matchAll(
    /(?:^|\n)\s*import\s+\{([^}]+)\}\s*from\s*['"]actview['"]/g,
  )) {
    for (const part of match[1].split(',')) {
      const imported = part.trim().split(/\s+as\s+/)[0]
      if (imported === name) return true
    }
  }
  return false
}
