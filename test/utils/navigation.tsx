import '@test/setup.dom'

import type {
  AppRouterInstance,
  NavigateOptions,
  PrefetchOptions,
} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

type NavigationWrapperOptions = {
  pathname?: string
  router?: AppRouterInstance
  searchParams?: URLSearchParams
}

export function createTestAppRouter(overrides: Partial<AppRouterInstance> = {}): AppRouterInstance {
  return {
    back: () => {},
    forward: () => {},
    prefetch: (_href: string, _options?: PrefetchOptions) => {},
    push: (_href: string, _options?: NavigateOptions) => {},
    refresh: () => {},
    replace: (_href: string, _options?: NavigateOptions) => {},
    ...overrides,
  }
}

export function createTestNavigationWrapper({
  pathname = window.location.pathname,
  searchParams = new URLSearchParams(window.location.search),
  router,
}: NavigationWrapperOptions = {}) {
  return function TestNavigationWrapper({ children }: { children: ReactNode }) {
    const [currentPathname, setCurrentPathname] = useState(pathname)
    const [currentSearchParams, setCurrentSearchParams] = useState(() => new URLSearchParams(searchParams))

    const routerValue = useMemo<AppRouterInstance>(() => {
      if (router) {
        return router
      }

      function navigate(href: string, mode: 'push' | 'replace') {
        const url = new URL(href, window.location.href)

        if (mode === 'push') {
          window.history.pushState({}, '', url)
        } else {
          window.history.replaceState({}, '', url)
        }

        setCurrentPathname(url.pathname)
        setCurrentSearchParams(new URLSearchParams(url.search))
      }

      return createTestAppRouter({
        push: (href) => navigate(href, 'push'),
        replace: (href) => navigate(href, 'replace'),
      })
    }, [router])

    return (
      <AppRouterContext.Provider value={routerValue}>
        <PathnameContext.Provider value={currentPathname}>
          <SearchParamsContext.Provider value={currentSearchParams}>{children}</SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    )
  }
}
