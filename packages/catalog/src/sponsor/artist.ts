import 'server-only'

import artistSponsorsJSON from './artist.json'

type Sponsor = {
  label: string
  value: string
}

const ARTIST_SPONSORS: Record<string, Sponsor[]> = artistSponsorsJSON

export function getArtistSponsors(artistValue: string): Sponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}
