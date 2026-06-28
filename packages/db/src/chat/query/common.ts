export const DEFAULT_PAGE_SIZE = 30
export const MAX_PAGE_SIZE = 100

export function clampPageSize(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_PAGE_SIZE
  }
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE_SIZE)
}
