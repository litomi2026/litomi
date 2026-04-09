type HeaderSource = Pick<Headers, 'get'>

export function getRequestIP(headers: HeaderSource): string {
  return (
    getHeaderValue(headers, 'CF-Connecting-IP') ||
    getHeaderValue(headers, 'x-real-ip') ||
    getForwardedIP(headers.get('x-forwarded-for')) ||
    'unknown'
  )
}

export function getRequestUserAgent(headers: HeaderSource): string {
  return getHeaderValue(headers, 'user-agent') || getHeaderValue(headers, 'sec-ch-ua') || 'unknown'
}

function getForwardedIP(value: string | null) {
  return value
    ?.split(',')
    .map((part) => part.trim())
    .find(Boolean)
}

function getHeaderValue(headers: HeaderSource, name: string) {
  const value = headers.get(name)?.trim()
  return value ? value : undefined
}
