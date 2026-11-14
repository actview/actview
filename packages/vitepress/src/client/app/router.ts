import { setPageData } from '../theme-default/composables/data'
import { setHeaders } from '../theme-default/composables/layout'
import {
  route,
  setActiveRouter,
  type Router,
} from '../theme-default/composables/route'

export interface DocsPageModule {
  default: any
  __pageData?: any
}

export interface RouteOptions {
  initialLoad?: boolean
  replace?: boolean
}

export type LoadPageModule = (
  path: string,
) => Promise<DocsPageModule | null>

const notFoundData = {
  relativePath: '404.md',
  frontmatter: { layout: 'page', sidebar: false },
  headers: [],
  isNotFound: true,
}

const KNOWN_EXTENSIONS = new Set(
  (
    '3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,css,csv,dll,' +
    'doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,' +
    'man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,' +
    'opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,' +
    'tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,' +
    'yaml,yml,zip'
  ).split(','),
)

function treatAsHtml(pathname: string): boolean {
  const ext = pathname.split('.').pop()
  return ext == null || !KNOWN_EXTENSIONS.has(ext.toLowerCase())
}

function normalizePath(pathname: string): string {
  let path = pathname || '/'
  path = path.replace(/\.html$/, '')
  if (path.length > 1) path = path.replace(/\/+$/, '')
  return path || '/'
}

function normalizeHref(href: string): string {
  return href
}

function scrollTo(hash: string, scrollPosition = 0): void {
  if (typeof window === 'undefined') return
  if (!hash || scrollPosition) {
    window.scrollTo(0, scrollPosition)
    return
  }
  let target: HTMLElement | null = null
  try {
    target = document.getElementById(decodeURIComponent(hash).slice(1))
  } catch {
    return
  }
  target?.scrollIntoView({ block: 'start' })
}

export function createRouter(
  loadPageModule: LoadPageModule,
  fallbackComponent: any = null,
): Router {
  let latestPendingPath: string | null = null
  let disposed = false

  const router: Router = {
    route,
    async go(href, options = {}) {
      if (disposed || typeof window === 'undefined') return
      const url = new URL(normalizeHref(href), window.location.href)
      if (url.origin !== window.location.origin) {
        window.location.href = url.href
        return
      }

      const path = normalizePath(url.pathname)
      const current = new URL(window.location.href)
      const currentPath = normalizePath(current.pathname)
      const samePath = path === currentPath

      if (samePath && !options.initialLoad) {
        if (url.hash !== current.hash) {
          window.history.replaceState(
            { ...window.history.state, scrollPosition: window.scrollY },
            '',
            url.href,
          )
          route.value = {
            ...route.value,
            hash: decodeURIComponent(url.hash),
            query: url.search,
          }
          scrollTo(url.hash)
        }
        return
      }

      if (!options.initialLoad) {
        window.history.replaceState(
          { ...window.history.state, scrollPosition: window.scrollY },
          '',
        )
        if (options.replace) {
          window.history.replaceState({}, '', url.href)
        } else {
          window.history.pushState({}, '', url.href)
        }
      } else if (window.history.state === null) {
        window.history.replaceState({}, '', url.href)
      }

      await loadPage(url.href, {
        initialLoad: !!options.initialLoad,
        scrollPosition: 0,
      })
    },
    dispose() {
      disposed = true
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onHashChange)
      if (setActiveRouter) setActiveRouter(null)
    },
  }

  async function loadPage(
    href: string,
    {
      initialLoad = false,
      scrollPosition = 0,
    }: { initialLoad?: boolean; scrollPosition?: number } = {},
  ): Promise<void> {
    const url = new URL(href, window.location.href)
    const path = normalizePath(url.pathname)
    latestPendingPath = path

    let page: DocsPageModule | null = null
    try {
      page = await loadPageModule(path)
    } catch (err) {
      console.error(err)
    }

    if (latestPendingPath !== path) return
    latestPendingPath = null

    if (!page) {
      setPageData(notFoundData)
      setHeaders([])
      route.value = {
        path,
        hash: decodeURIComponent(url.hash),
        query: url.search,
        data: notFoundData,
        component: fallbackComponent,
      }
      if (!initialLoad) scrollTo(url.hash, scrollPosition)
      return
    }

    const data = page.__pageData ?? {
      relativePath: path.replace(/^\//, '') + '.md',
      frontmatter: {},
      headers: [],
    }
    setPageData(data)
    setHeaders(data.headers ?? [])

    route.value = {
      path,
      hash: decodeURIComponent(url.hash),
      query: url.search,
      data,
      component: page.default,
    }

    if (!initialLoad) scrollTo(url.hash, scrollPosition)
  }

  function onClick(e: MouseEvent): void {
    if (
      e.defaultPrevented ||
      !(e.target instanceof Element) ||
      e.target.closest('button') ||
      e.button !== 0 ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.metaKey
    ) {
      return
    }

    const link = e.target.closest<HTMLAnchorElement>('a')
    if (
      !link ||
      link.closest('.vp-raw') ||
      link.hasAttribute('download') ||
      link.hasAttribute('target')
    ) {
      return
    }

    const href = link.getAttribute('href')
    if (href == null) return

    const url = new URL(href, link.baseURI)
    if (url.origin !== window.location.origin) return
    if (!treatAsHtml(url.pathname)) return

    e.preventDefault()
    void router.go(url.href)
  }

  async function onPopState(e: PopStateEvent): Promise<void> {
    const href = window.location.href
    await loadPage(href, {
      scrollPosition: e.state?.scrollPosition ?? 0,
    })
    route.value = {
      ...route.value,
      hash: decodeURIComponent(window.location.hash),
      query: window.location.search,
    }
  }

  function onHashChange(): void {
    route.value = {
      ...route.value,
      hash: decodeURIComponent(window.location.hash),
      query: window.location.search,
    }
    scrollTo(window.location.hash)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onHashChange)
  }
  setActiveRouter(router)

  return router
}
