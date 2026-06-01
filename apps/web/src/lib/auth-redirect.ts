import { SearchParamKey } from '@/storage'

type AuthPathname = '/auth/login' | '/auth/signup'

type SearchParamsLike = {
  toString(): string
}

export function getAuthRedirectHref(pathname: AuthPathname, redirect: string | null | undefined) {
  if (!redirect) {
    return pathname
  }

  const searchParams = new URLSearchParams({ [SearchParamKey.REDIRECT]: redirect })

  return `${pathname}?${searchParams}`
}

export function getAuthSuccessRedirect(redirect: string | null | undefined, name: string) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }

  return redirect.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)
}

export function getCurrentAuthRedirect() {
  return new URLSearchParams(window.location.search).get(SearchParamKey.REDIRECT)
}

export function getPathWithSearch(pathname: string, searchParams: string | SearchParamsLike) {
  const search = searchParams.toString().replace(/^\?/, '')

  return search ? `${pathname}?${search}` : pathname
}
