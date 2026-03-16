const IMAGE_PROXY_SOURCE_HOST_SUFFIXES = [
  'hentkor.net',
  'k-hentai.org',
  'soujpa.in',
  'cdn.imagedeliveries.com',
] as const

export type MangaImageProxyParams = {
  mangaId: number
  page: number
  variant: MangaImageProxyVariant
}

export type MangaImageProxyVariant = 'original' | 'thumbnail'

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

export function isImageProxySourceURLCompatibleWithRouteParams(
  sourceURL: URL,
  { mangaId, page }: MangaImageProxyParams,
): boolean {
  const normalizedHost = sourceURL.hostname.toLowerCase()

  if (normalizedHost === 'hentkor.net') {
    const match = /^\/pages\/(?<mangaId>\d+)\/(?<page>\d+)\.avif$/u.exec(sourceURL.pathname)
    if (!match?.groups) {
      return false
    }

    return match.groups.mangaId === mangaId.toString() && match.groups.page === page.toString()
  }

  if (normalizedHost === 'soujpa.in') {
    const match = /^\/start\/(?<dirMangaId>\d+)\/(?<fileMangaId>\d+)_(?<zeroBasedPage>\d+)\.(avif|webp)$/u.exec(
      sourceURL.pathname,
    )

    if (!match?.groups) {
      return false
    }

    return (
      match.groups.dirMangaId === mangaId.toString() &&
      match.groups.fileMangaId === mangaId.toString() &&
      match.groups.zeroBasedPage === (page - 1).toString()
    )
  }

  if (normalizedHost === 'cdn.imagedeliveries.com') {
    const match = /^\/(?<mangaId>\d+)\/thumbnails\/(?<page>cover|\d+)\.webp$/u.exec(sourceURL.pathname)
    if (!match?.groups) {
      return false
    }

    if (match.groups.mangaId !== mangaId.toString()) {
      return false
    }

    return match.groups.page === 'cover' ? page === 1 : match.groups.page === page.toString()
  }

  return true
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

function hasAllowedHostSuffix(hostname: string, hostSuffixes: readonly string[]): boolean {
  return hostSuffixes.some((hostSuffix) => hostname === hostSuffix || hostname.endsWith(`.${hostSuffix}`))
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

  if (!hasAllowedHostSuffix(normalizedHost, IMAGE_PROXY_SOURCE_HOST_SUFFIXES)) {
    throw new Error('허용되지 않은 이미지 호스트예요')
  }

  sourceURL.hostname = normalizedHost
  sourceURL.hash = ''

  return sourceURL
}
