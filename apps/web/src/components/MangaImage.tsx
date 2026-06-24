'use client'

import {
  createLitomiProxyMangaImageURL,
  createThirdPartyMangaImageURLs,
  isLitomiImageProxyURL,
} from '@litomi/http/image-proxy'
import type { ComponentPropsWithRef, SyntheticEvent } from 'react'
import { useEffect, useState } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5
const FALLBACK_IMAGE_URL = '/image/fallback.svg'
const LITOMI_PROXY_FIRST_HOST_SUFFIXES = ['gold-usergeneratedcontent.net'] as const

export type MangaImagePictures = {
  media?: string
  sizes?: string
  src?: string
  type?: string
  variant: 'original' | 'thumbnail'
}

interface Props extends ComponentPropsWithRef<'img'> {
  imageIndex?: number
  /**
   * @note 외부 이미지(mangaId 없음)는 내부 fallback 체인을 돌리지 않아요.
   */
  mangaId?: number
  pictures?: MangaImagePictures[]
  src?: string
  variant?: 'original' | 'thumbnail'
}

export default function MangaImage({
  imageIndex = 0,
  mangaId,
  pictures = [],
  src = '',
  variant = 'original',
  onError,
  ...props
}: Props) {
  const [pictureURLIndices, setPictureURLIndices] = useState(() => Array(pictures.length).fill(0))
  const [imageURLIndex, setImageURLIndex] = useState(0)
  const pictureURLs = pictures.map(({ src, variant }) => resolveImageURLs({ imageIndex, variant, mangaId, src }))

  const displayedPictures = pictures.map(({ type, sizes, media }, index) => ({
    type,
    sizes,
    media,
    index,
    srcSet: pictureURLs[index][pictureURLIndices[index]],
  }))

  const imageURLs = resolveImageURLs({ imageIndex, variant, mangaId, src })
  const displayedURL = imageURLs[imageURLIndex]
  const activePicture = displayedPictures.find(({ media }) => !media || window.matchMedia(media).matches)
  const activeURL = activePicture ? activePicture.srcSet : displayedURL
  const crossOrigin = isLitomiImageProxyURL(activeURL) ? 'use-credentials' : undefined

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>) {
    onError?.(event)

    if (!mangaId) {
      return
    }

    if (activePicture) {
      const activeURL = normalizeSourceURL(activePicture.srcSet)
      const failedURL = normalizeSourceURL(event.currentTarget.currentSrc || activeURL)

      if (activeURL === failedURL) {
        setPictureURLIndices((prev) => {
          const next = [...prev]
          const currentIndex = next[activePicture.index]
          const lastIndex = pictureURLs[activePicture.index].length - 1

          next[activePicture.index] = Math.min(currentIndex + 1, lastIndex)
          return next
        })
        return
      }
    }

    setImageURLIndex((prev) => Math.min(prev + 1, imageURLs.length - 1))
  }

  // NOTE: 이미지가 바뀌면(작품/페이지/원본 URL 변경) fallback 상태를 초기화해야 정상적으로 교체돼요
  useEffect(() => {
    setImageURLIndex(0)
    setPictureURLIndices(Array(pictures.length).fill(0))
  }, [imageIndex, variant, mangaId, src, pictures.length])

  const imageElement = (
    <img
      alt={`manga-image-${imageIndex + 1}`}
      crossOrigin={crossOrigin}
      draggable={false}
      fetchPriority={imageIndex < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
      onError={handleError}
      src={displayedURL}
      {...props}
    />
  )

  if (displayedPictures.length === 0) {
    return imageElement
  }

  return (
    <picture>
      {displayedPictures.map(({ srcSet, ...pictureSource }, index) => (
        <source key={`${pictureSource.media ?? 'default'}-${index}-${srcSet}`} srcSet={srcSet} {...pictureSource} />
      ))}
      {imageElement}
    </picture>
  )
}

function normalizeSourceURL(sourceURL: string): string {
  if (!sourceURL) {
    return ''
  }

  try {
    const baseURL = typeof window === 'undefined' ? 'https://example.com' : window.location.href
    return new URL(sourceURL, baseURL).toString()
  } catch {
    return sourceURL
  }
}

function resolveImageURLs({
  imageIndex,
  variant,
  mangaId,
  src,
}: {
  imageIndex: number
  variant: NonNullable<Props['variant']>
  mangaId?: number
  src?: string
}): string[] {
  const page = imageIndex + 1
  const resolvedSources: string[] = []
  const shouldProxySourceURL = Boolean(mangaId && src && shouldUseLitomiProxyFirst(src))

  if (src && !shouldProxySourceURL) {
    resolvedSources.push(src)
  }

  if (!mangaId) {
    resolvedSources.push(FALLBACK_IMAGE_URL)
    return resolvedSources
  }

  const litomiProxyURL = src
    ? createLitomiProxyMangaImageURL({
        mangaId,
        page,
        variant,
        sourceURL: src,
      })
    : undefined

  const thirdPartyURLs = createThirdPartyMangaImageURLs({ mangaId, page, variant })
  const litomiURL = createLitomiProxyMangaImageURL({ mangaId, page, variant })

  if (litomiProxyURL && shouldProxySourceURL) {
    resolvedSources.push(litomiProxyURL)
  }

  resolvedSources.push(...thirdPartyURLs, litomiURL)

  if (litomiProxyURL && !shouldProxySourceURL) {
    resolvedSources.push(litomiProxyURL)
  }

  if (variant === 'thumbnail') {
    const originalFallbackSourceURLs = createThirdPartyMangaImageURLs({
      mangaId,
      page,
      variant: 'original',
    })

    resolvedSources.push(...originalFallbackSourceURLs)
  }

  resolvedSources.push(FALLBACK_IMAGE_URL)

  return Array.from(new Set(resolvedSources.filter(Boolean)))
}

function shouldUseLitomiProxyFirst(sourceURL: string): boolean {
  try {
    const hostname = new URL(sourceURL).hostname.toLowerCase()

    return LITOMI_PROXY_FIRST_HOST_SUFFIXES.some(
      (hostSuffix) => hostname === hostSuffix || hostname.endsWith(`.${hostSuffix}`),
    )
  } catch {
    return false
  }
}
