import {
  ActViewComponent,
  Component,
  Mounted,
  Prop,
  Unmounted,
  createApp,
} from 'actview'
import { Layout } from '../theme-default/Layout'
import { setSidebar } from '../theme-default/composables/layout'
import { setPageData, setThemeData } from '../theme-default/composables/data'
import { createRouter, type DocsPageModule } from './router'
import type { Router } from '../theme-default/composables/route'

export type { DocsPageModule }

export interface DocsAppOptions {
  pages: Record<string, () => Promise<DocsPageModule>>
  themeConfig?: Record<string, any>
  siteData?: Record<string, any>
  container?: Element | string
}

function normalizeRoute(path: string): string {
  if (!path || path === '/') return '/'
  return path.replace(/\.html$/, '').replace(/\/+$/, '') || '/'
}

function resolvePageKey(
  pages: Record<string, () => Promise<DocsPageModule>>,
  path: string,
): string | null {
  const clean = normalizeRoute(path)
  const candidates =
    clean === '/'
      ? ['/index.md', 'index.md']
      : [`${clean}.md`, `${clean}/index.md`]
  for (const key of Object.keys(pages)) {
    if (candidates.some((candidate) => key.endsWith(candidate))) return key
  }
  return null
}

@Component({ name: 'DocsApp' })
export class DocsApp extends ActViewComponent<{ router: Router }> {
  @Prop
  router!: Router

  @Mounted
  mounted(): void {
    if (typeof window !== 'undefined') {
      void this.$props.router.go(window.location.href, { initialLoad: true })
    }
  }

  @Unmounted
  unmounted(): void {
    this.$props.router.dispose()
  }

  render() {
    return <Layout />
  }
}

export function createDocsApp(options: DocsAppOptions) {
  setThemeData({
    ...(options.siteData ?? {}),
    themeConfig: options.themeConfig ?? {},
  })
  setPageData({ relativePath: 'index.md', frontmatter: {}, headers: [] })
  setSidebar(
    Array.isArray(options.themeConfig?.sidebar)
      ? options.themeConfig.sidebar
      : [],
  )

  const router = createRouter(async (path) => {
    const key = resolvePageKey(options.pages, path)
    if (!key) return null
    return options.pages[key]()
  })

  const app = createApp(DocsApp as any, { router })
  app.mount(options.container ?? '#app')
  return app
}
