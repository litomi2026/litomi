import { type ReactNode } from 'react'

export type BaseLayoutProps<Param extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = {
  children: Readonly<ReactNode>
  params: Readonly<Promise<Param>>
}

export type BasePageProps<T extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = {
  params: Readonly<Promise<T>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export type ErrorProps = {
  error: Error & {
    digest?: string
  }
  reset: () => void
}

export type RouteProps = {
  params: Promise<Record<string, string>>
}
