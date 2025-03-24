import { CDN } from '@/constants/url'

type Params = {
  cdn?: string
  id: number
  path: string
}

export function getImageSrc({ cdn, id, path }: Params) {
  switch (cdn) {
    case 'HARPI':
      return `${CDN.HARPI}/${path}`
    case 'HASHA':
    default:
      return `${CDN.HASHA}/${id}/${path}`
  }
}
