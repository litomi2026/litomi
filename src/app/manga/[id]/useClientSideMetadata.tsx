import { useEffect } from 'react'

import { SHORT_NAME } from '@/constants'

type Props = {
  title?: string
  description?: string
  images?: string[]
}

export default function useClientSideMetadata({ title, description, images }: Props) {
  useEffect(() => {
    if (title) {
      const fullTitle = `${title.slice(0, 50)} - ${SHORT_NAME}`
      document.title = fullTitle
      updateMetaTag('property', 'og:title', fullTitle)
      updateMetaTag('name', 'twitter:title', fullTitle)
    }
  }, [title])

  useEffect(() => {
    if (description) {
      const slicedDescription = description.slice(0, 160)
      updateMetaTag('name', 'description', slicedDescription)
      updateMetaTag('property', 'og:description', slicedDescription)
      updateMetaTag('name', 'twitter:description', slicedDescription)
    }
  }, [description])

  useEffect(() => {
    const firstImage = images?.[0]

    if (firstImage) {
      updateMetaTag('property', 'og:image', firstImage)
      updateMetaTag('name', 'twitter:image', firstImage)
    }
  }, [images])

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
