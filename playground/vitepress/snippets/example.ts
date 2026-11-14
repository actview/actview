export interface SnippetOptions {
  name: string
  enabled?: boolean
}

export function createSnippet(options: SnippetOptions) {
  return {
    ...options,
    enabled: options.enabled ?? true,
  }
}
