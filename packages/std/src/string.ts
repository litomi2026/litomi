export function normalizeString(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? ''

  return normalized.length > 0 ? normalized : null
}
