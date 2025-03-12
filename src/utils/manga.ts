import { CDN } from '@/constants/url'

type Params = {
  cdn?: string
  id: number
  name: string
}

export function getImageSrc({ cdn, id, name }: Params) {
  switch (cdn) {
    case 'HARPI':
      return `${CDN.HARPI}/${name}`
    case 'HASHA':
    default:
      return `${CDN.HASHA}/${id}/${name}`
  }
}
