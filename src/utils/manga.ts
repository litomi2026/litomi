type Params = {
  cdn?: string
  id: number
  path: string
}

export function getImageSrc({ cdn, id, path }: Params) {
  switch (cdn) {
    case 'HARPI':
      return `/hrp/${path}`
    case 'HASHA':
    default:
      return `/hsh/${id}/${path}`
  }
}
