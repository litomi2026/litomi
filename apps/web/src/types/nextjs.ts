export type ErrorProps = Readonly<{
  error: Error & {
    digest?: string
  }
  reset: () => void
}>

export type RouteProps<T extends Readonly<Record<string, unknown>> = Readonly<Record<string, string>>> = Readonly<{
  params: Readonly<Promise<T>>
}>
