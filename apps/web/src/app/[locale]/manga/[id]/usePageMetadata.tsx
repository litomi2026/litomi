import { APP_METADATA } from '@litomi/domain/app/metadata'
import type { PublicLocale } from '@litomi/domain/locale'
import { MANGA_DESCRIPTION_MAX_LENGTH, MANGA_TITLE_MAX_LENGTH } from '@litomi/domain/manga/policy'
import { truncateAtWordBoundary } from '@litomi/std'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

type Props = {
  title?: string
  description?: string
  image?: string
}

export default function usePageMetadata({ title, description, image }: Props) {
  const locale = useLocale() as PublicLocale
  const shortName = APP_METADATA[locale].shortName

  useEffect(() => {
    if (title) {
      const fullTitle = `${truncateAtWordBoundary(title, MANGA_TITLE_MAX_LENGTH)} - ${shortName}`
      document.title = fullTitle
      updateMetaTag('property', 'og:title', fullTitle)
      updateMetaTag('name', 'twitter:title', fullTitle)
    }
  }, [shortName, title])

  useEffect(() => {
    if (description) {
      const slicedDescription = description.slice(0, MANGA_DESCRIPTION_MAX_LENGTH)
      updateMetaTag('name', 'description', slicedDescription)
      updateMetaTag('property', 'og:description', slicedDescription)
      updateMetaTag('name', 'twitter:description', slicedDescription)
    }
  }, [description])

  useEffect(() => {
    if (image) {
      updateMetaTag('property', 'og:image', image)
      updateMetaTag('name', 'twitter:image', image)
    }
  }, [image])

  return null
}

function updateMetaTag(key: string, keyName: string, content: string) {
  let metaTag = document.querySelector(`meta[${key}="${keyName}"]`)

  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute(key, keyName)
    document.head.appendChild(metaTag)
  }

  metaTag.setAttribute('content', content)
}
