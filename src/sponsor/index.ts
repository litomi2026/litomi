import 'server-only'

import artistSponsorsJSON from './artist.json'
import characterSponsorsJSON from './character.json'

type Sponsor = {
  label: string
  value: string
}

const ARTIST_SPONSORS: Record<string, Sponsor[]> = artistSponsorsJSON
const CHARACTER_SPONSORS: Record<string, Sponsor[]> = characterSponsorsJSON

export function getArtistSponsors(artistValue: string): Sponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}

export function getCharacterSponsors(characterValue: string): Sponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}
