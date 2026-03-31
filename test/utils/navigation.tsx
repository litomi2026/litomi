import '@test/setup.dom'

import type {
  AppRouterInstance,
  NavigateOptions,
  PrefetchOptions,
} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { ReactNode } from 'react'

import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'

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
  router = createTestAppRouter(),
  searchParams = new URLSearchParams(window.location.search),
}: NavigationWrapperOptions = {}) {
  return function TestNavigationWrapper({ children }: { children: ReactNode }) {
    return (
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={pathname}>
          <SearchParamsContext.Provider value={searchParams}>{children}</SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    )
  }
}
