import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build as viteBuild, type Plugin } from 'vite'
import jsxScoped from '@10coding/vite-plugin-jsx-scoped'
import { actviewMarkdown } from './actviewPlugin'
import { buildRouteMap, scanMarkdownFiles } from './routeMap'
import { getGitTimestamp } from './git'
import type { ActPressConfig, ActPressOptions } from './cli'

const VIRTUAL_SITE = 'virtual:actview-site'

function siteDataPlugin(config: ActPressConfig): Plugin {
  return {
    name: 'actview:site-data',
    enforce: 'pre',
    resolveId(id) {
      return id === VIRTUAL_SITE ? `\0${VIRTUAL_SITE}` : null
    },
    load(id) {
      return id === `\0${VIRTUAL_SITE}`
        ? `export const siteConfig = ${JSON.stringify(config)}`
        : null
    },
  }
}

function resolveEntry(): string {
  const packageRoot = path.resolve(
    fileURLToPath(new URL('../..', import.meta.url)),
  )
  const source = path.join(packageRoot, 'src/client/entry.ts')
  if (fs.existsSync(source)) return source
  const compiled = path.join(packageRoot, 'dist/client/entry.js')
  if (fs.existsSync(compiled)) return compiled
  throw new Error('[actview] 无法找到 client entry')
}

function outputHtml(
  title: string,
  script: string,
  css: string[],
): string {
  const links = css
    .map((file) => `<link rel="stylesheet" href="/${file}">`)
    .join('')
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
${links}
</head>
<body>
<div id="app"></div>
<script type="module" src="/${script}"></script>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function routeOutputFile(route: string): string {
  const clean = route.replace(/^\/+|\/+$/g, '')
  return clean ? `${clean}/index.html` : 'index.html'
}

export async function buildSite(options: ActPressOptions): Promise<void> {
  const docsRoot = path.resolve(options.docsRoot)
  const outDir = path.resolve(docsRoot, '.vitepress', 'dist')
  const packageRoot = path.resolve(
    fileURLToPath(new URL('../..', import.meta.url)),
  )
  const repoRoot = path.resolve(packageRoot, '../..')
  const pages = scanMarkdownFiles(docsRoot)
  const routes = buildRouteMap({
    root: docsRoot,
    rewrites: options.config.rewrites,
    dynamicRoutes: options.config.dynamicRoutes,
  })
  const siteConfig = { ...options.config, routes }
  const entryPath = resolveEntry()

  await viteBuild({
    root: docsRoot,
    configFile: false,
    define: { __DEV__: 'false' },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: '@actview/jsx',
    },
    resolve: {
      alias: {
        '@actview/vitepress': path.join(packageRoot, 'src/client/index.ts'),
        actview: path.join(repoRoot, 'packages/actview/src/index.ts'),
        '@actview/core': path.join(repoRoot, 'packages/core/src/index.ts'),
        '@actview/jsx/jsx-runtime': path.join(
          repoRoot,
          'packages/jsx/src/jsx-runtime.ts',
        ),
        '@actview/jsx/jsx-dev-runtime': path.join(
          repoRoot,
          'packages/jsx/src/jsx-dev-runtime.ts',
        ),
        '@actview/jsx': path.join(repoRoot, 'packages/jsx/src/index.ts'),
        '@actview/reactivity': path.join(
          repoRoot,
          'packages/reactivity/src/index.ts',
        ),
        '@actview/shared': path.join(repoRoot, 'packages/shared/src/index.ts'),
      },
    },
    plugins: [
      siteDataPlugin(siteConfig),
      jsxScoped(),
      actviewMarkdown({
        pages,
        root: docsRoot,
        rewrites: options.config.rewrites,
        dynamicRoutes: options.config.dynamicRoutes,
        ignoreDeadLinks: options.config.ignoreDeadLinks,
        transformPageData: options.config.transformPageData,
        markdownConfig: options.config.markdown,
        getLastUpdated:
          options.config.lastUpdated === false ? undefined : getGitTimestamp,
      }),
    ],
    build: {
      outDir,
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        input: entryPath,
        output: {
          entryFileNames: 'assets/app-[hash].js',
          chunkFileNames: 'assets/chunk-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  })

  const manifestPath = path.join(outDir, '.vite', 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<
    string,
    { file: string; css?: string[]; isEntry?: boolean }
  >
  const entry = Object.values(manifest).find((item) => item.isEntry)
  if (!entry) throw new Error('[actview] build manifest 中没有 entry')

  const html = outputHtml(
    options.config.title ?? 'ActView Docs',
    entry.file,
    entry.css ?? [],
  )

  fs.writeFileSync(path.join(outDir, 'index.html'), html)
  for (const route of Object.keys(routes)) {
    if (route === '/') continue
    const file = path.join(outDir, routeOutputFile(route))
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, html)
  }
  fs.writeFileSync(path.join(outDir, '404.html'), html)

  console.log(`[actview] build complete: ${outDir}`)
}
