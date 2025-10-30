export enum View {
  IMAGE = 'img',
  CARD = 'card',
}

export function convertCamelCaseToKebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export function getUsernameFromParam(username: string) {
  return decodeURIComponent(username).slice(1)
}

export function whitelistSearchParams(params: URLSearchParams, whitelist: readonly string[]) {
  const allowed = new Set(whitelist)
  const filtered = Array.from(params).filter(([key]) => allowed.has(key))
  return new URLSearchParams(filtered)
}
