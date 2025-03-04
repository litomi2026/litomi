export const CANONICAL_URL = 'https://litomi.vercel.app'

export const CDN = {
  HARPI: 'https://cdn.harpi.in',
  HASHA: 'https://cdn-nl-01.hasha.in',
}

type Params = {
  cdn?: string
  id: number
  name: string
}

export function getImageSrc({ cdn, id, name }: Params): string {
  switch (cdn) {
    case 'HARPI':
      return `${CDN.HARPI}/${name}`
    case 'HASHA':
    default:
      return `${CDN.HASHA}/${id}/${name}`
  }
}
