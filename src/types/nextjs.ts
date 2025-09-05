import { type ReactNode } from 'react'

export type ErrorProps = Readonly<{
  error: Error & {
    digest?: string
  }
  reset: () => void
}>

export type LayoutProps<Param extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = Readonly<{
  children: Readonly<ReactNode>
  params: Readonly<Promise<Param>>
}>

export type RouteProps<T extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = Readonly<{
  params: Readonly<Promise<T>>
}>
