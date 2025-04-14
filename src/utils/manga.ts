import { CDN } from '@/constants/url'

import { SourceParam } from './param'

type Params = {
  cdn?: string
  id?: number | string
  path: string
}

export function getImageSrc({ cdn, id, path }: Params) {
  switch (cdn) {
    case 'ehgt.org':
      return path
    case 'HARPI':
      return `${CDN.HARPI}/${path}`
    case 'k-hentai':
      return path
    case 'thumb.k-hentai':
      return `${CDN.K_HENTAI_THUMB}/${path}`
    case 'HASHA':
    default:
      return `${CDN.HASHA}/${id}/${path}`
  }
}

export function getViewerLink(id: number, source: SourceParam) {
  return `/manga/${id}/${source}`
}
