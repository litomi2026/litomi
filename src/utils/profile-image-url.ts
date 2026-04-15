const ALLOWED_PROFILE_IMAGE_PROTOCOLS = new Set(['http:', 'https:'])

export function getSafeProfileImageURL(value: string | null | undefined): string | undefined {
  if (!value) {
    return
  }

  const trimmedValue = value.trim()

  if (!trimmedValue || !isSafeProfileImageURL(trimmedValue)) {
    return
  }

  return trimmedValue
}

export function isSafeProfileImageURL(value: string): boolean {
  if (!URL.canParse(value)) {
    return false
  }

  return ALLOWED_PROFILE_IMAGE_PROTOCOLS.has(new URL(value).protocol)
}
