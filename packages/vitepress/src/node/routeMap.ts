import fs from 'node:fs'
import path from 'node:path'

export interface DynamicRouteConfig {
  path: string
  file: string
}

export interface RouteMapOptions {
  root: string
  rewrites?: Record<string, string>
  dynamicRoutes?: DynamicRouteConfig[]
}

export function normalizeRoute(pathname: string): string {
  let value = pathname || '/'
  value = value.replace(/\\/g, '/').replace(/\.html$/, '')
  if (!value.startsWith('/')) value = `/${value}`
  if (value.length > 1) value = value.replace(/\/+$/, '')
  return value || '/'
}

export function scanMarkdownFiles(root: string): string[] {
  const result: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.vitepress' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.')
      ) {
        continue
      }
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.md')) result.push(full)
    }
  }
  if (fs.existsSync(root)) walk(root)
  return result.sort()
}

export function pageKeyForFile(root: string, file: string): string {
  const relative = path.relative(root, file).replace(/\\/g, '/')
  return `/${relative}`
}

export function routeForFile(root: string, file: string): string {
  const relative = path
    .relative(root, file)
    .replace(/\\/g, '/')
    .replace(/\.md$/, '')
  if (relative === 'index') return '/'
  if (relative.endsWith('/index')) return `/${relative.slice(0, -6)}`
  return `/${relative}`
}

export function buildRouteMap(options: RouteMapOptions): Record<string, string> {
  const root = path.resolve(options.root)
  const files = scanMarkdownFiles(root)
  const routes: Record<string, string> = {}

  const add = (route: string, file: string): void => {
    routes[normalizeRoute(route)] = pageKeyForFile(root, file)
  }

  for (const file of files) {
    const route = routeForFile(root, file)
    add(route, file)
  }

  for (const [source, dest] of Object.entries(options.rewrites ?? {})) {
    const sourceFile = source.endsWith('.md')
      ? path.resolve(root, source)
      : files.find((file) => routeForFile(root, file) === normalizeRoute(source))
    if (sourceFile) add(dest, sourceFile)
  }

  for (const route of options.dynamicRoutes ?? []) {
    const file = path.isAbsolute(route.file)
      ? route.file
      : path.resolve(root, route.file)
    if (fs.existsSync(file)) add(route.path, file)
  }

  return routes
}
