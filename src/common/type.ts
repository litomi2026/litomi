export type BasePageProps<T extends Record<string, unknown> = Record<string, string>> = {
  params: Promise<T>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
