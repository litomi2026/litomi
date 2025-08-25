import { useEffect } from 'react'

import { SHORT_NAME } from '@/constants'

type Props = {
  title?: string
  description?: string
  images?: string | string[]
}

export default function useClientSideMetadata({ title, description, images }: Readonly<Props>) {
  useEffect(() => {
    if (title) {
      const fullTitle = `${title.slice(0, 50)} - ${SHORT_NAME}`
      document.title = fullTitle
      updateMetaTag('og:title', fullTitle)
      updateMetaTag('twitter:title', fullTitle)
    }
  }, [title])

  useEffect(() => {
    if (description) {
      const slicedDescription = description.slice(0, 160)
      document.querySelector('meta[name="description"]')?.setAttribute('content', slicedDescription)
      updateMetaTag('og:description', slicedDescription)
      updateMetaTag('twitter:description', slicedDescription)
    }
  }, [description])

  useEffect(() => {
    if (images) {
      for (const image of images) {
        updateMetaTag('og:image', image)
        updateMetaTag('twitter:image', image)
      }
    }
  }, [images])

  return null
}

function updateMetaTag(property: string, content: string) {
  let metaTag = document.querySelector(`meta[property="${property}"]`)

  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute('property', property)
    document.head.appendChild(metaTag)
  }

  metaTag.setAttribute('content', content)
}
