const SIGNATURE_QUERY_PARAM_NAMES = new Set([
  'auth',
  'auth_key',
  'exp',
  'expires',
  'expiry',
  'key-pair-id',
  'md5',
  'policy',
  'sig',
  'signature',
  'token',
  'x-amz-algorithm',
  'x-amz-content-sha256',
  'x-amz-credential',
  'x-amz-date',
  'x-amz-expires',
  'x-amz-security-token',
  'x-amz-signature',
  'x-amz-signedheaders',
  'x-goog-algorithm',
  'x-goog-credential',
  'x-goog-date',
  'x-goog-expires',
  'x-goog-signature',
  'x-goog-signedheaders',
])

const SIGNATURE_QUERY_PARAM_PREFIXES = ['x-amz-', 'x-goog-', 'x-oss-', 'x-cf-'] as const

const BLOCKED_HOSTNAMES = new Set(['100.100.100.200', '169.254.169.254', 'localhost', 'metadata.google.internal'])
const ORIGINAL_MANGA_IMAGE_SOURCE_HOST_SUFFIXES = ['hentkor.net', 'harpi.in', 'hiyobi.org', 'k-hentai.org', 'soujpa.in']

export type MangaImageProxyVariant = 'original' | 'thumbnail'

type MangaImageProxyParams = {
  mangaId: number
  page: number
  variant: MangaImageProxyVariant
}

export function createCoverThumbnailURL(mangaId: number): string {
  return `https://cdn.imagedeliveries.com/${mangaId}/thumbnails/cover.webp`
}

export function createEquivalentMangaImageSourceURLs({ mangaId, page, variant }: MangaImageProxyParams): string[] {
  if (variant === 'thumbnail') {
    return [page === 1 ? createCoverThumbnailURL(mangaId) : createImageDeliveriesThumbnailURL(mangaId, page)]
  }

  return [
    createSoujpaPageURL(mangaId, page, 'avif'),
    createSoujpaPageURL(mangaId, page, 'webp'),
    createHentkorPageURL(mangaId, page),
  ]
}

export function createFirstPageOriginalFallbackURLs(mangaId: number): string[] {
  return [
    createSoujpaPageURL(mangaId, 1, 'avif'),
    createSoujpaPageURL(mangaId, 1, 'webp'),
    createHentkorPageURL(mangaId, 1),
  ]
}

export async function createImageProxyCacheKey(sourceURL: string | URL): Promise<string> {
  const canonicalSource = createImageProxyCanonicalSource(sourceURL)
  const subtle = globalThis.crypto?.subtle

  if (!subtle) {
    throw new Error('Web Crypto API를 사용할 수 없어요')
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(canonicalSource))

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createImageProxyCanonicalSource(sourceURL: string | URL): string {
  const validatedSourceURL =
    typeof sourceURL === 'string' ? parseImageProxySourceURL(sourceURL) : validateImageSourceURL(new URL(sourceURL))

  const normalizedEntries = Array.from(validatedSourceURL.searchParams.entries())
    .filter(([paramName]) => !shouldStripSignatureParam(paramName))
    .sort(([leftName, leftValue], [rightName, rightValue]) => {
      if (leftName === rightName) {
        return leftValue.localeCompare(rightValue)
      }

      return leftName.localeCompare(rightName)
    })

  const normalizedParams = new URLSearchParams()

  for (const [paramName, paramValue] of normalizedEntries) {
    normalizedParams.append(paramName, paramValue)
  }

  const normalizedQuery = normalizedParams.toString()

  return `${validatedSourceURL.origin}${validatedSourceURL.pathname}${normalizedQuery ? `?${normalizedQuery}` : ''}`
}

export async function createImageProxyRequestURL({
  proxyOrigin,
  sourceURL,
}: {
  proxyOrigin: string
  sourceURL: string
}): Promise<string> {
  const validatedSourceURL = parseImageProxySourceURL(sourceURL)
  const cacheKey = await createImageProxyCacheKey(validatedSourceURL)
  const proxyURL = new URL(proxyOrigin)

  proxyURL.pathname = `/i/v1/${cacheKey}`
  proxyURL.search = ''
  proxyURL.searchParams.set('u', validatedSourceURL.toString())

  return proxyURL.toString()
}

export function createMangaImageProxyRequestURL({
  proxyOrigin,
  sourceURL,
  mangaId,
  page,
  variant,
}: {
  proxyOrigin: string
  sourceURL?: string
  mangaId: number
  page: number
  variant: MangaImageProxyVariant
}): string {
  const proxyURL = new URL(proxyOrigin)
  proxyURL.pathname = `/i/v2/manga/${mangaId}/${variant}/${page}`
  proxyURL.search = ''

  if (sourceURL) {
    const validatedSourceURL = parseImageProxySourceURL(sourceURL)
    proxyURL.searchParams.set('u', validatedSourceURL.toString())
  }

  return proxyURL.toString()
}

export function isAllowedMangaImageProxySource(
  sourceURL: URL,
  { mangaId, page, variant }: MangaImageProxyParams,
): boolean {
  if (variant === 'original' && hasAllowedOriginalMangaImageHost(sourceURL.hostname)) {
    return true
  }

  return createEquivalentMangaImageSourceURLs({ mangaId, page, variant }).some((allowedSourceURL) => {
    const allowedURL = new URL(allowedSourceURL)

    return sourceURL.hostname === allowedURL.hostname && sourceURL.pathname === allowedURL.pathname
  })
}

export function parseImageProxySourceURL(sourceURL: string): URL {
  let parsedURL: URL

  try {
    parsedURL = new URL(sourceURL)
  } catch {
    throw new Error('이미지 URL 형식이 올바르지 않아요')
  }

  return validateImageSourceURL(parsedURL)
}

function createHentkorPageURL(mangaId: number, page: number): string {
  return `https://cdn.hentkor.net/pages/${mangaId}/${page}.avif`
}

function createImageDeliveriesThumbnailURL(mangaId: number, page: number): string {
  return `https://cdn.imagedeliveries.com/${mangaId}/thumbnails/${page}.webp`
}

function createSoujpaPageURL(mangaId: number, page: number, ext: 'avif' | 'webp'): string {
  return `https://soujpa.in/start/${mangaId}/${mangaId}_${page - 1}.${ext}`
}

function hasAllowedOriginalMangaImageHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase()

  return ORIGINAL_MANGA_IMAGE_SOURCE_HOST_SUFFIXES.some(
    (hostSuffix) => normalizedHost === hostSuffix || normalizedHost.endsWith(`.${hostSuffix}`),
  )
}

function isPrivateIPv4Address(hostname: string): boolean {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return false
  }

  const octets = hostname.split('.').map(Number)

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false
  }

  const [first, second] = octets

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  )
}

function isPrivateIPv6Address(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase()

  if (!normalizedHost.includes(':')) {
    return false
  }

  if (normalizedHost === '::1') {
    return true
  }

  if (normalizedHost.startsWith('::ffff:')) {
    return isPrivateIPv4Address(normalizedHost.slice('::ffff:'.length))
  }

  if (normalizedHost.startsWith('fc') || normalizedHost.startsWith('fd')) {
    return true
  }

  return (
    normalizedHost.startsWith('fe8') ||
    normalizedHost.startsWith('fe9') ||
    normalizedHost.startsWith('fea') ||
    normalizedHost.startsWith('feb')
  )
}

function shouldStripSignatureParam(paramName: string): boolean {
  const lowerParamName = paramName.toLowerCase()

  if (SIGNATURE_QUERY_PARAM_NAMES.has(lowerParamName)) {
    return true
  }

  return SIGNATURE_QUERY_PARAM_PREFIXES.some((prefix) => lowerParamName.startsWith(prefix))
}

function validateImageSourceURL(sourceURL: URL): URL {
  const normalizedHost = sourceURL.hostname.toLowerCase()

  if (sourceURL.protocol !== 'https:') {
    throw new Error('이미지 URL은 https만 지원해요')
  }

  if (sourceURL.username || sourceURL.password) {
    throw new Error('이미지 URL에 인증 정보는 사용할 수 없어요')
  }

  if (sourceURL.port && sourceURL.port !== '443') {
    throw new Error('이미지 URL의 커스텀 포트는 허용되지 않아요')
  }

  if (
    BLOCKED_HOSTNAMES.has(normalizedHost) ||
    normalizedHost.endsWith('.localhost') ||
    normalizedHost.endsWith('.local') ||
    isPrivateIPv4Address(normalizedHost) ||
    isPrivateIPv6Address(normalizedHost)
  ) {
    throw new Error('내부 네트워크 주소는 사용할 수 없어요')
  }

  sourceURL.hostname = normalizedHost
  sourceURL.hash = ''

  return sourceURL
}
