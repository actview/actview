import { execFileSync } from 'node:child_process'

export function getGitTimestamp(file: string): number | undefined {
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%at', '--', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim()
    if (!output) return undefined
    const value = Number(output)
    return Number.isFinite(value) ? value : undefined
  } catch {
    return undefined
  }
}
