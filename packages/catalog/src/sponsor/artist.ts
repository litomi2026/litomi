import 'server-only'

import artistSponsorsJSON from './artist.json'
import type { Sponsor, SponsorMap } from './common'

const ARTIST_SPONSORS = artistSponsorsJSON as SponsorMap

export function getArtistSponsors(artistValue: string): Sponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}
