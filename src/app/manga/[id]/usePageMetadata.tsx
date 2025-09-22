import { useEffect } from 'react'

import { SHORT_NAME } from '@/constants'
import { MAX_MANGA_DESCRIPTION_LENGTH, MAX_MANGA_TITLE_LENGTH } from '@/constants/policy'

type Props = {
  title?: string
  description?: string
  image?: string
}

export default function usePageMetadata({ title, description, image }: Props) {
  useEffect(() => {
    if (title) {
      const fullTitle = `${title.slice(0, MAX_MANGA_TITLE_LENGTH)} - ${SHORT_NAME}`
      document.title = fullTitle
      updateMetaTag('property', 'og:title', fullTitle)
      updateMetaTag('name', 'twitter:title', fullTitle)
    }
  }, [title])

  useEffect(() => {
    if (description) {
      const slicedDescription = description.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)
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
