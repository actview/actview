import { shallowRef } from '@actview/reactivity'
import { pageData } from './data'

export interface Route {
  path: string
  hash: string
  query: string
  data: any
  component: any | null
}

export const route = shallowRef<Route>({
  path: '/',
  hash: '',
  query: '',
  data: pageData.value,
  component: null,
})

export interface Router {
  route: typeof route
  go: (
    to: string,
    options?: { initialLoad?: boolean; replace?: boolean },
  ) => Promise<void>
  dispose: () => void
}

let activeRouter: Router | null = null

export function setActiveRouter(router: Router | null): void {
  activeRouter = router
}

export function useRoute(): typeof route {
  return route
}

export function useRouter(): Router {
  if (!activeRouter) {
    throw new Error('useRouter() called before createRouter()')
  }
  return activeRouter
}
