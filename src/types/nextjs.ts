import { type ReactNode } from 'react'

export type BaseLayoutProps<Param extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = {
  children: ReactNode
  params: Promise<Param>
}

export type BasePageProps<T extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = {
  params: Promise<T>
  searchParams: Promise<Record<string, string | undefined | string[]>>
}

export type ErrorProps = {
  error: Error & {
    digest?: string
  }
  reset: () => void
}

export type RouteProps = {
  params: Record<string, string>
}
