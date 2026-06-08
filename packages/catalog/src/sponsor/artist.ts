import 'server-only'

import type { Sponsor, SponsorMap } from './common'

import artistSponsorsJSON from './artist.json'

const ARTIST_SPONSORS = artistSponsorsJSON as SponsorMap

export function getArtistSponsors(artistValue: string): Sponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}
